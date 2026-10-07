-- Member portal: members sign in with an email link (no registration, no password)
-- and see their own charges, league months and upcoming activities, and can sign up
-- for activities. Members get no table access: everything goes through these
-- security-definer functions, scoped to the members whose email matches the caller's
-- verified, link-proven address. Members sharing an email (a family) see each other.

begin;

-- Members linked to the signed-in user. Same proof as admin invitations (0007):
-- a session from an email link/OTP or OAuth, on a confirmed account with no password.
create function club.portal_member_ids() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select m.id
  from club.members m
  join auth.users u on u.id = (select auth.uid())
  where m.active
    and m.email is not null
    and lower(m.email) = lower(u.email)
    and u.email_confirmed_at is not null
    and coalesce(u.encrypted_password, '') = ''
    and exists (
      select 1 from jsonb_array_elements(coalesce((select auth.jwt()) -> 'amr', '[]'::jsonb)) e
      where e ->> 'method' in ('otp', 'magiclink', 'oauth')
    );
$$;

create function club.portal_me()
returns table (id uuid, first_name text, last_name text, joined_on date)
language sql stable security definer set search_path = '' as $$
  select m.id, m.first_name, m.last_name, m.joined_on
  from club.members m
  where m.id in (select club.portal_member_ids())
  order by m.first_name, m.last_name;
$$;

create function club.portal_charges()
returns table (id uuid, member_id uuid, concept text, amount_cents bigint, paid_cents bigint,
               outstanding_cents bigint, due_on date, status text)
language sql stable security definer set search_path = '' as $$
  select c.id, c.member_id, c.concept, c.amount_cents, c.paid_cents, c.outstanding_cents, c.due_on, c.status
  from club.charge_status c
  where c.member_id in (select club.portal_member_ids())
  order by c.due_on desc;
$$;

create function club.portal_league()
returns table (member_id uuid, month date, distance_m int, elevation_gain_m int)
language sql stable security definer set search_path = '' as $$
  select l.member_id, l.month, l.distance_m, l.elevation_gain_m
  from club.league_entries l
  where l.member_id in (select club.portal_member_ids())
  order by l.month;
$$;

-- Upcoming, non-cancelled activities with free places and who of "mine" is in.
create function club.portal_events()
returns table (id uuid, title text, kind text, starts_on date, start_time time, ends_on date,
               location text, description text, capacity int, signup_deadline date,
               signups bigint, my_members uuid[])
language sql stable security definer set search_path = '' as $$
  select e.id, e.title, e.kind, e.starts_on, e.start_time, e.ends_on, e.location, e.description,
         e.capacity, e.signup_deadline,
         (select count(*) from club.event_signups s where s.event_id = e.id),
         coalesce((select array_agg(s.member_id) from club.event_signups s
                   where s.event_id = e.id and s.member_id in (select club.portal_member_ids())), '{}')
  from club.events e
  where not e.cancelled and e.starts_on >= (now() at time zone 'Europe/Madrid')::date
  order by e.starts_on, e.start_time;
$$;

-- Sign one of "my" members up for an activity (p_join) or take them off the list.
-- Capacity and cancellation are enforced by the sign-up trigger (0009).
create function club.portal_signup(p_event uuid, p_member uuid, p_join boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  e club.events;
begin
  if p_member is null or p_member not in (select club.portal_member_ids()) then
    raise exception 'permission denied' using errcode = 'insufficient_privilege';
  end if;
  select * into e from club.events where id = p_event;
  if not found or e.cancelled or e.starts_on < (now() at time zone 'Europe/Madrid')::date then
    raise exception 'Actividad no disponible' using errcode = 'no_data_found';
  end if;
  if e.signup_deadline is not null and e.signup_deadline < (now() at time zone 'Europe/Madrid')::date then
    raise exception 'Inscripción cerrada' using errcode = 'check_violation';
  end if;
  if p_join then
    insert into club.event_signups (event_id, member_id, notes)
    values (p_event, p_member, 'Desde el portal')
    on conflict (event_id, member_id) do nothing;
  else
    delete from club.event_signups where event_id = p_event and member_id = p_member;
  end if;
end;
$$;

revoke all on function club.portal_member_ids() from public, anon, authenticated;
revoke all on function club.portal_me(), club.portal_charges(), club.portal_league(), club.portal_events(),
  club.portal_signup(uuid, uuid, boolean) from public, anon;
grant execute on function club.portal_me(), club.portal_charges(), club.portal_league(), club.portal_events(),
  club.portal_signup(uuid, uuid, boolean) to authenticated;

commit;
