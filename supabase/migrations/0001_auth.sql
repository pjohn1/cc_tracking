-- Foundation: single-user passkey auth, sessions, audit log, rate limits.
-- The app connects as the database owner from the server only. Row-level
-- security is enabled with no policies so Supabase's public API roles
-- (anon/authenticated) can never read these tables, even if a key leaks.

create table app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table credentials (
  id text primary key,                 -- base64url credential ID
  public_key bytea not null,
  counter bigint not null default 0,
  transports text[] not null default '{}',
  device_name text not null,
  backed_up boolean not null default false,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create table sessions (
  token_hash text primary key,         -- sha256 of the cookie value; raw token never stored
  credential_id text references credentials(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,
  user_agent text
);

create table auth_challenges (
  id text primary key,
  challenge text not null,
  kind text not null check (kind in ('register', 'login')),
  expires_at timestamptz not null
);

create table audit_log (
  id bigserial primary key,
  at timestamptz not null default now(),
  event text not null,
  detail jsonb not null default '{}',
  ip text,
  user_agent text
);
create index audit_log_at_idx on audit_log (at desc);

create table rate_limits (
  key text primary key,
  window_start timestamptz not null,
  count integer not null
);

alter table app_settings enable row level security;
alter table credentials enable row level security;
alter table sessions enable row level security;
alter table auth_challenges enable row level security;
alter table audit_log enable row level security;
alter table rate_limits enable row level security;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on all tables in schema public from anon, authenticated;
    revoke all on all sequences in schema public from anon, authenticated;
    alter default privileges in schema public revoke all on tables from anon, authenticated;
    alter default privileges in schema public revoke all on sequences from anon, authenticated;
  end if;
end $$;
