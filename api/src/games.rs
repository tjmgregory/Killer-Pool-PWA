use std::collections::HashMap;

use names::{Generator, Name};
use rand::{seq::SliceRandom, thread_rng};
use rocket::{
    delete, get, post,
    response::{
        status::NoContent,
        stream::{Event, EventStream},
    },
    serde::json::Json,
    tokio::select,
    tokio::sync::broadcast::{error::RecvError, Sender},
    Shutdown, State,
};
use rocket_db_pools::Connection;
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgRow, types::Uuid, Row};
use web_push::{
    ContentEncoding, SubscriptionInfo, VapidSignatureBuilder, WebPushClient, WebPushMessageBuilder,
    URL_SAFE_NO_PAD,
};

use crate::{Data, PushConfig};

type Result<T, E = rocket::response::Debug<sqlx::Error>> = std::result::Result<T, E>;

#[get("/games?<user_id>")]
pub async fn fetch_participating_games(
    mut db: Connection<Data>,
    user_id: Uuid,
) -> Result<Json<Vec<Game>>> {
    let participations = sqlx::query(
        "select p.*, g.*, p2.name player_name
        from participations p
                 inner join games g on g.id = p.game_id
                 inner join players p2 on p.player_id = p2.id",
    )
    .bind(user_id)
    .map(|r: PgRow| DbParticipation {
        game_id: r.get("game_id"),
        player_id: r.get("player_id"),
        is_host: r.get("is_host"),
        play_order: r.get("play_order"),
        lives: r.get("lives"),
        player: Some(DbPlayer {
            name: r.get("player_name"),
            push_auth: None,
            push_endpoint: None,
            push_p256dh: None,
        }),
        game: Some(DbGame {
            name: r.get("name"),
            started: r.get("started"),
            next_player: r.get("next_player"),
        }),
    })
    .fetch_all(&mut *db)
    .await?;

    let mut map = HashMap::new();
    for p in participations {
        map.entry(p.game_id.clone())
            .or_insert(Game {
                id: p.game_id.clone(),
                name: p.game.as_ref().unwrap().name.clone(),
                started: p.game.as_ref().unwrap().started,
                next_player: p.game.as_ref().unwrap().next_player.clone(),
                players: vec![],
            })
            .players
            .push(Player {
                id: p.player_id,
                name: p.player.unwrap().name,
                lives: p.lives,
                is_host: p.is_host,
                order: p.play_order,
            });
    }

    Ok(Json(
        map.values()
            .into_iter()
            .filter(|g| g.players.iter().find(|p| p.id == user_id).is_some())
            .cloned()
            .collect(),
    ))
}

#[get("/games/updates")]
pub async fn get_game_updates(queue: &State<Sender<String>>, mut end: Shutdown) -> EventStream![] {
    let mut rx = queue.subscribe();
    EventStream! {
        loop {
            let msg = select! {
                msg = rx.recv() => match msg {
                    Ok(msg) => msg,
                    Err(RecvError::Closed) => break,
                    Err(RecvError::Lagged(_)) => continue,
                },
                _ = &mut end => break,
            };

            yield Event::json(&msg);
        }
    }
}

#[get("/games/<id>")]
pub async fn fetch_game(mut db: Connection<Data>, id: &str) -> Result<Json<Game>> {
    let participations = sqlx::query(
        "select p.*, g.*, p2.name player_name
        from participations p
                 inner join games g on g.id = p.game_id
                 inner join players p2 on p.player_id = p2.id
        where g.id = $1",
    )
    .bind(id)
    .map(|r: PgRow| DbParticipation {
        game_id: r.get("game_id"),
        player_id: r.get("player_id"),
        is_host: r.get("is_host"),
        play_order: r.get("play_order"),
        lives: r.get("lives"),
        player: Some(DbPlayer {
            name: r.get("player_name"),
            push_auth: None,
            push_endpoint: None,
            push_p256dh: None,
        }),
        game: Some(DbGame {
            name: r.get("name"),
            started: r.get("started"),
            next_player: r.get("next_player"),
        }),
    })
    .fetch_all(&mut *db)
    .await?;

    let mut map = HashMap::new();
    for p in participations {
        map.entry(p.game_id.clone())
            .or_insert(Game {
                id: p.game_id.clone(),
                name: p.game.as_ref().unwrap().name.clone(),
                started: p.game.as_ref().unwrap().started,
                next_player: p.game.as_ref().unwrap().next_player.clone(),
                players: vec![],
            })
            .players
            .push(Player {
                id: p.player_id,
                name: p.player.unwrap().name,
                lives: p.lives,
                is_host: p.is_host,
                order: p.play_order,
            });
    }

    Ok(Json(map.get(id).unwrap().clone()))
}

fn rand_name() -> String {
    Generator::with_naming(Name::Numbered).next().unwrap()
}

#[post("/games", data = "<data>")]
pub async fn create_new_game(
    mut db: Connection<Data>,
    data: Json<CreateNewGame>,
) -> Result<String> {
    sqlx::query(
        "insert into players (id, name)
        values ($1, $2)
        on conflict (id) do update
        set name = excluded.name;",
    )
    .bind(data.host_id)
    .bind(data.host_name.clone())
    .execute(&mut *db)
    .await?;

    let mut new_id = rand_name();

    loop {
        let result = sqlx::query("insert into games (id, name) values ($1, $2)")
            .bind(new_id.clone())
            .bind(data.name.clone())
            .execute(&mut *db)
            .await;

        if let Ok(_) = result {
            break;
        } else {
            new_id = rand_name();
        }
    }

    sqlx::query("insert into participations (game_id, player_id, is_host) values ($1, $2, true)")
        .bind(new_id.clone())
        .bind(data.host_id)
        .execute(&mut *db)
        .await?;

    Ok(new_id)
}

#[post("/games/start", data = "<data>")]
pub async fn start_game(
    queue: &State<Sender<String>>,
    push_config: &State<PushConfig>,
    mut db: Connection<Data>,
    data: Json<StartGame>,
) -> Result<Option<NoContent>> {
    let row = sqlx::query(
        "select 1 from participations p
        inner join games g on g.id = p.game_id
        where p.game_id = $1 and p.player_id = $2
        and p.is_host = true",
    )
    .bind(data.game_id.clone())
    .bind(data.host_id)
    .fetch_optional(&mut *db)
    .await?;

    if row.is_none() {
        return Ok(None);
    }

    // fetch the players for the game, and assign them a random order
    // then set the next player in the game.

    let mut participants = sqlx::query(
        "select * from participations p 
        where p.game_id = $1",
    )
    .bind(data.game_id.clone())
    .map(|r: PgRow| DbParticipation {
        game_id: r.get("game_id"),
        player_id: r.get("player_id"),
        is_host: r.get("is_host"),
        play_order: r.get("play_order"),
        lives: r.get("lives"),
        player: None,
        game: None,
    })
    .fetch_all(&mut *db)
    .await?;

    participants.shuffle(&mut thread_rng());
    let first_id = participants[0].player_id.clone();
    for (i, p) in participants.into_iter().enumerate() {
        sqlx::query(
            "update participations set play_order = $1 where game_id = $2 and player_id = $3",
        )
        .bind(i as i32)
        .bind(data.game_id.clone())
        .bind(p.player_id.clone())
        .execute(&mut *db)
        .await?;
    }

    sqlx::query("update games set started = true, next_player = $2 where id = $1")
        .bind(data.game_id.clone())
        .bind(first_id)
        .execute(&mut *db)
        .await?;

    let _ = queue.send(data.game_id.clone());

    // notify all participants that the game has started
    let notifications = sqlx::query(
        "select * from participations p
        inner join players pl on pl.id = p.player_id
        where p.game_id = $1 and pl.push_endpoint is not null
        and pl.push_p256dh is not null and pl.push_auth is not null",
    )
    .bind(data.game_id.clone())
    .map(|r: PgRow| DbPlayer {
        name: r.get("name"),
        push_auth: r.get("push_auth"),
        push_endpoint: r.get("push_endpoint"),
        push_p256dh: r.get("push_p256dh"),
    })
    .fetch_all(&mut *db)
    .await?;

    let game = sqlx::query(
        "select g.id gameid, g.name gamename, p2.name host from games g
        inner join participations p on g.id = p.game_id
        inner join players p2 on p.player_id = p2.id
        where g.id = $1 and p.is_host = true",
    )
    .bind(data.game_id.clone())
    .map(|r: PgRow| GameInfo {
        id: r.get("gameid"),
        name: r.get("gamename"),
        host_name: r.get("host"),
    })
    .fetch_one(&mut *db)
    .await?;

    let client = WebPushClient::new().unwrap();
    for n in notifications {
        let info = SubscriptionInfo::new(
            n.push_endpoint.unwrap(),
            n.push_p256dh.unwrap(),
            n.push_auth.unwrap(),
        );

        let mut builder = WebPushMessageBuilder::new(&info).unwrap();
        let sig_builder =
            VapidSignatureBuilder::from_base64(&push_config.private_key, URL_SAFE_NO_PAD, &info)
                .unwrap();

        let signature = sig_builder.build().unwrap();
        builder.set_vapid_signature(signature);
        let payload = format!("start|{}|{}|{}", game.id, game.name, game.host_name);
        builder.set_payload(ContentEncoding::Aes128Gcm, payload.as_bytes());
        let _ = client.send(builder.build().unwrap()).await;
    }

    Ok(Some(NoContent))
}

#[post("/games/<game_id>/participants", data = "<data>")]
pub async fn join_game(
    queue: &State<Sender<String>>,
    mut db: Connection<Data>,
    game_id: &str,
    data: Json<PlayerData>,
) -> Result<NoContent> {
    sqlx::query(
        "insert into players (id, name)
        values ($1, $2)
        on conflict (id) do update
        set name = excluded.name;",
    )
    .bind(data.id)
    .bind(data.name.clone())
    .execute(&mut *db)
    .await?;

    sqlx::query(
        "insert into participations (game_id, player_id) values ($1, $2) on conflict do nothing",
    )
    .bind(game_id)
    .bind(data.id)
    .execute(&mut *db)
    .await?;

    let _ = queue.send(game_id.to_string());

    Ok(NoContent)
}

#[delete("/games/<game_id>/participants/<player_id>")]
pub async fn leave_game(
    queue: &State<Sender<String>>,
    mut db: Connection<Data>,
    game_id: &str,
    player_id: Uuid,
) -> Result<NoContent> {
    sqlx::query("delete from participations where game_id = $1 and player_id = $2")
        .bind(game_id)
        .bind(player_id)
        .execute(&mut *db)
        .await?;

    let _ = queue.send(game_id.to_string());

    Ok(NoContent)
}

#[post("/games/<game_id>/advance", data = "<data>")]
pub async fn advance_game(
    queue: &State<Sender<String>>,
    // push_config: &State<PushConfig>,
    mut db: Connection<Data>,
    game_id: &str,
    data: Json<AdvanceGameData>,
) -> Result<NoContent> {
    // Get the current state of the game and the next player.
    // If the next player != data.player_id then exit gracefully.
    // Calculate the next state of the game, the player_id's new lives, and the next next player.
    // Transactionally update the games.next_player and the player_id.lives
    // Publish an update to the queue
    sqlx::query(
        "update participations
        set lives = lives + ($1)
        where game_id = $2 and player_id = $3",
    )
    .bind(data.result)
    .bind(game_id)
    .bind(data.player_id)
    .execute(&mut *db)
    .await?;

    let participations = sqlx::query(
        "select
            p.*,
            g.*,
            p2.name player_name,
            p2.push_endpoint,
            p2.push_p256dh,
            p2.push_auth
        from participations p
                 inner join games g on g.id = p.game_id
                 inner join players p2 on p.player_id = p2.id
        where p.game_id = $1
        order by p.play_order;",
    )
    .bind(game_id)
    .map(|r: PgRow| DbParticipation {
        game_id: r.get("game_id"),
        player_id: r.get("player_id"),
        is_host: r.get("is_host"),
        play_order: r.get("play_order"),
        lives: r.get("lives"),
        player: Some(DbPlayer {
            name: r.get("player_name"),
            push_auth: r.get("push_auth"),
            push_endpoint: r.get("push_endpoint"),
            push_p256dh: r.get("push_p256dh"),
        }),
        game: Some(DbGame {
            name: r.get("name"),
            started: r.get("started"),
            next_player: r.get("next_player"),
        }),
    })
    .fetch_all(&mut *db)
    .await?;

    if participations.iter().filter(|p| p.lives > 0).count() <= 1 {
        // game is over.
        let _ = queue.send(game_id.to_string());
        return Ok(NoContent);
    }

    let current = participations
        .iter()
        .find(|p| p.player_id == data.player_id)
        .unwrap();
    let mut next = current;

    loop {
        next = participations
            .get(((next.play_order as usize) + 1) % participations.len())
            .unwrap();

        if next.lives > 0 {
            break;
        }
    }

    sqlx::query(
        "update games g
        set next_player = $2
        where g.id = $1;",
    )
    .bind(game_id)
    .bind(next.player_id)
    .execute(&mut *db)
    .await?;

    let _ = queue.send(game_id.to_string());

    // TODO
    // if next.player.unwrap().push_auth.is_some()
    //     && next.player.unwrap().push_endpoint.is_some()
    //     && next.player.unwrap().push_p256dh.is_some()
    // {
    //     let client = WebPushClient::new().unwrap();
    //     let info = SubscriptionInfo::new(
    //         next.player.unwrap().push_endpoint.as_ref().unwrap(),
    //         next.player.unwrap().push_p256dh.as_ref().unwrap(),
    //         next.player.unwrap().push_auth.as_ref().unwrap(),
    //     );

    //     let mut builder = WebPushMessageBuilder::new(&info).unwrap();
    //     let sig_builder =
    //         VapidSignatureBuilder::from_base64(&push_config.private_key, URL_SAFE_NO_PAD, &info)
    //             .unwrap();

    //     let signature = sig_builder.build().unwrap();
    //     builder.set_vapid_signature(signature);
    //     builder.set_payload(ContentEncoding::Aes128Gcm, "next".as_bytes());
    //     let _ = client.send(builder.build().unwrap()).await;
    // }

    Ok(NoContent)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Game {
    pub id: String,
    pub name: String,
    pub started: bool,
    pub next_player: Option<Uuid>,
    pub players: Vec<Player>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Player {
    pub id: Uuid,
    pub name: String,
    pub lives: i16,
    pub is_host: bool,
    pub order: i16,
}

#[derive(Debug, Clone)]
struct DbGame {
    pub name: String,
    pub started: bool,
    pub next_player: Option<Uuid>,
}

#[derive(Debug, Clone)]
struct DbPlayer {
    pub name: String,
    pub push_endpoint: Option<String>,
    pub push_auth: Option<String>,
    pub push_p256dh: Option<String>,
}

#[derive(Debug, Clone)]
struct DbParticipation {
    pub player_id: Uuid,
    pub game_id: String,
    pub is_host: bool,
    pub play_order: i16,
    pub lives: i16,
    pub player: Option<DbPlayer>,
    pub game: Option<DbGame>,
}

#[derive(Debug, Clone)]
struct GameInfo {
    pub id: String,
    pub name: String,
    pub host_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateNewGame {
    pub name: String,
    pub host_id: Uuid,
    pub host_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StartGame {
    pub game_id: String,
    pub host_id: Uuid,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerData {
    pub id: Uuid,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdvanceGameData {
    pub player_id: Uuid,
    pub result: i16,
}
