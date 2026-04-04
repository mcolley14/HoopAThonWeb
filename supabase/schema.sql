-- HoopAThon signup tables for Supabase
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- Individual participant signups
create table if not exists individual_signups (
  id uuid primary key default gen_random_uuid(),
  participant_name text not null,
  participant_email text not null,
  participant_phone text,
  participant_goal integer not null default 500,
  submitted_at timestamptz default now()
);

-- Corporate team signups
create table if not exists team_signups (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  team_contact text not null,
  team_email text not null,
  team_size integer not null,
  participant_names text not null,
  submitted_at timestamptz default now()
);

-- Enable Row Level Security
alter table individual_signups enable row level security;
alter table team_signups enable row level security;

-- Allow anonymous inserts (anyone can sign up)
create policy "Allow anonymous insert on individual_signups"
  on individual_signups for insert
  to anon
  with check (true);

create policy "Allow anonymous insert on team_signups"
  on team_signups for insert
  to anon
  with check (true);

-- Function to get signup counts (anon can call without seeing row data)
create or replace function get_signup_counts()
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'individuals', (select count(*)::int from individual_signups),
    'teams', (select count(*)::int from team_signups)
  );
$$;

-- Grant anon permission to call the function
grant execute on function get_signup_counts() to anon;
