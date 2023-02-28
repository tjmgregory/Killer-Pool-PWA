-- Add down migration script here
alter table players
remove column push_endpoint,
remove column push_auth,
remove column push_p256dh;