-- Add up migration script here

create table games
(
    id text not null primary key,
    name text not null,
    started boolean not null default false,
    next_player uuid null,
    created timestamp with time zone not null default now()
);

create table players
(
    id uuid not null primary key,
    name text not null
);

create table participations
(
    game_id text not null,
    player_id uuid not null,
    is_host boolean not null default false,
    play_order smallint not null default 0,
    lives smallint not null default 3 check (lives >= 0),
    primary key (game_id, player_id)
);
