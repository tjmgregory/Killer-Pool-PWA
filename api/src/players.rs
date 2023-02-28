use rocket::{get, post, response::status::NoContent, serde::json::Json, Config};
use rocket_db_pools::Connection;
use serde::{Deserialize, Serialize};
use sqlx::types::Uuid;

use crate::Data;

type Result<T, E = rocket::response::Debug<sqlx::Error>> = std::result::Result<T, E>;

#[post("/players/subscribe", data = "<data>")]
pub async fn create_notification_subscription(
    mut db: Connection<Data>,
    data: Json<Subscription>,
) -> Result<NoContent> {
    sqlx::query(
        "update players
        set push_endpoint = $1,
            push_auth = $2,
            push_p256dh = $3
        where id = $4;",
    )
    .bind(data.endpoint.clone())
    .bind(data.auth.clone())
    .bind(data.p256dh.clone())
    .bind(data.player_id)
    .execute(&mut *db)
    .await?;

    Ok(NoContent)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Subscription {
    pub player_id: Uuid,
    pub endpoint: String,
    pub auth: String,
    pub p256dh: String,
}
