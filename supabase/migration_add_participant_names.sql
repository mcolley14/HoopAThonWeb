-- Run once in Supabase SQL Editor if team_signups already exists without participant_names.

alter table team_signups
  add column if not exists participant_names text;

-- Optional: backfill existing rows before enforcing NOT NULL in app (leave null or set placeholder).
-- update team_signups set participant_names = '(not provided)' where participant_names is null;
