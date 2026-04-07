-- Run once in Supabase SQL Editor to switch the public counter to total participants
-- (individual rows + sum of team_size on each corporate signup).

create or replace function get_signup_counts()
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'participants',
    coalesce((select count(*)::int from individual_signups), 0)
      + coalesce((select sum(team_size)::int from team_signups), 0)
  );
$$;

grant execute on function get_signup_counts() to anon;
