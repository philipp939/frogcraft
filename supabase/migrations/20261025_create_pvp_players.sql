-- Bereits im Supabase-Projekt desbpglrfhjibglgeydx angewendet (Migration "create_pvp_players").
create table if not exists public.pvp_players (
  uuid uuid primary key,
  username text not null,
  joined_at timestamptz not null default now(),
  last_seen timestamptz,
  playtime_minutes bigint not null default 0 check (playtime_minutes >= 0),
  pvp_enabled boolean not null default false,
  verified boolean not null default false,
  deaths integer not null default 0 check (deaths >= 0),
  kills integer not null default 0 check (kills >= 0),
  bounty numeric(18,2) not null default 0 check (bounty >= 0),
  balance numeric(18,2) not null default 0,
  pvp_previous boolean,
  pvp_change_timestamp timestamptz,
  rank_group text
);
create index if not exists pvp_players_username_lower_idx on public.pvp_players (lower(username));
create index if not exists pvp_players_kills_idx on public.pvp_players (kills desc);
create index if not exists pvp_players_deaths_idx on public.pvp_players (deaths desc);
create index if not exists pvp_players_playtime_idx on public.pvp_players (playtime_minutes desc);
create index if not exists pvp_players_bounty_idx on public.pvp_players (bounty desc);
create index if not exists pvp_players_balance_idx on public.pvp_players (balance desc);
alter table public.pvp_players enable row level security;
revoke all on public.pvp_players from anon, authenticated;
grant select (uuid, username, joined_at, last_seen, playtime_minutes, pvp_enabled, deaths, kills, bounty, balance, rank_group)
  on public.pvp_players to anon, authenticated;
drop policy if exists "public read player stats" on public.pvp_players;
create policy "public read player stats" on public.pvp_players for select to anon, authenticated using (true);
create or replace function public.player_login(p_uuid uuid, p_username text)
returns void language sql security invoker set search_path = public as $$
  insert into public.pvp_players (uuid, username, last_seen) values (p_uuid, p_username, now())
  on conflict (uuid) do update set username = excluded.username, last_seen = now();
$$;
create or replace function public.player_add_stats(p_uuid uuid, p_username text,
  p_kills integer default 0, p_deaths integer default 0, p_playtime_minutes bigint default 0)
returns void language sql security invoker set search_path = public as $$
  insert into public.pvp_players (uuid, username, kills, deaths, playtime_minutes, last_seen)
  values (p_uuid, p_username, greatest(p_kills,0), greatest(p_deaths,0), greatest(p_playtime_minutes,0), now())
  on conflict (uuid) do update set
    kills = public.pvp_players.kills + greatest(p_kills,0),
    deaths = public.pvp_players.deaths + greatest(p_deaths,0),
    playtime_minutes = public.pvp_players.playtime_minutes + greatest(p_playtime_minutes,0),
    username = excluded.username, last_seen = now();
$$;
revoke execute on function public.player_login(uuid, text) from public, anon, authenticated;
revoke execute on function public.player_add_stats(uuid, text, integer, integer, bigint) from public, anon, authenticated;
grant execute on function public.player_login(uuid, text) to service_role;
grant execute on function public.player_add_stats(uuid, text, integer, integer, bigint) to service_role;
grant all on public.pvp_players to service_role;
