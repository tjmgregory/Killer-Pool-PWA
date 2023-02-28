use std::env;

use rocket::{
    error,
    fairing::{self, AdHoc, Fairing, Info, Kind},
    http::{ContentType, Header, Status},
    launch, options,
    response::Responder,
    routes,
    tokio::sync::broadcast::channel,
    Build, Request, Response, Rocket,
};
use rocket_db_pools::{sqlx, Database};

mod games;
mod players;

#[derive(Database)]
#[database("data")]
pub struct Data(sqlx::PgPool);

pub struct CORS;

#[rocket::async_trait]
impl Fairing for CORS {
    fn info(&self) -> Info {
        Info {
            name: "Add CORS headers to responses",
            kind: Kind::Response,
        }
    }

    async fn on_response<'r>(&self, _request: &'r Request<'_>, response: &mut Response<'r>) {
        response.set_header(Header::new("Access-Control-Allow-Origin", "*"));
        response.set_header(Header::new("Access-Control-Allow-Methods", "*"));
        response.set_header(Header::new("Access-Control-Allow-Headers", "*"));
    }
}

pub struct Cors;
impl<'r> Responder<'r, 'static> for Cors {
    fn respond_to(self, _: &'r rocket::Request<'_>) -> rocket::response::Result<'static> {
        Ok(Response::build()
            .status(Status::new(200))
            .header(ContentType::Plain)
            .raw_header("Access-Control-Allow-Methods", "*")
            .raw_header("Access-Control-Allow-Origin", "*")
            .raw_header("Access-Control-Allow-Headers", "*")
            .finalize())
    }
}

#[options("/<_..>")]
fn cors<'a>() -> Cors {
    Cors
}

async fn run_migrations(rocket: Rocket<Build>) -> fairing::Result {
    if let Some(db) = Data::fetch(&rocket) {
        match sqlx::migrate!("./migrations").run(&db.0).await {
            Ok(_) => Ok(rocket),
            Err(e) => {
                error!("Failed to migrate database: {}", e);
                Err(rocket)
            }
        }
    } else {
        Err(rocket)
    }
}

pub struct PushConfig {
    pub subject: String,
    pub public_key: String,
    pub private_key: String,
}

#[launch]
async fn rocket() -> _ {
    rocket::build()
        .attach(Data::init())
        .attach(AdHoc::try_on_ignite("DB Migrations", run_migrations))
        .attach(CORS)
        .manage(channel::<String>(1024).0)
        .manage(PushConfig {
            subject: env::var("PUSH_SUBJECT").unwrap_or("mailto: <test@foobar.dev>".to_string()),
            public_key: env::var("PUSH_PUBLIC_KEY").unwrap_or("BPKd9vIYt8TCUDoTTwI2NHFekwZp0hKwiukHTwKlwW04FE3GqQOySJpUStMmIlY69u-RBvBZnqpitCfu-Ik0mis".to_string()),
            private_key: env::var("PUSH_PRIVATE_KEY").unwrap_or("VKbSP1-ShQbzlvbcHpcski32dzsJ_KlhORl5ZAR96TI".to_string()),
        })
        .mount(
            "/",
            routes![
                cors,
                games::fetch_participating_games,
                games::get_game_updates,
                games::fetch_game,
                games::create_new_game,
                games::start_game,
                games::join_game,
                games::leave_game,
                games::advance_game,
                players::create_notification_subscription,
            ],
        )
}
