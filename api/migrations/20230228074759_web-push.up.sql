-- Add up migration script here
alter table players
add column push_endpoint text null,
add column push_auth text null,
add column push_p256dh text null;
