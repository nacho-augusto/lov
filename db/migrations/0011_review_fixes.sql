-- Fixes from the review of 0008–0010:
-- * anonymising also clears phase-6 notes (sign-ups, gear loans) and personalised
--   one-recipient email subjects, and anonymised records are frozen in the database;
-- * portal_events is visible only to linked members, and multi-day activities stay
--   listed until they end;
-- * member emails are stored lowercased (the portal sign-in looks them up exactly).

begin;

-- ---------------------------------------------------------------------------
-- Lowercase member emails
-- ---------------------------------------------------------------------------

update club.members set email = lower(email) where email <> lower(email);
alter table club.members add constraint members_email_lowercase check (email = lower(email));

-- ---------------------------------------------------------------------------
-- Anonymised records are frozen
-- ---------------------------------------------------------------------------

create or replace function club.keep_anonymised_left() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.anonymised_at is not null
     and (to_jsonb(new) - 'updated_at') is distinct from (to_jsonb(old) - 'updated_at') then
    raise exception 'Un miembro anonimizado no se puede modificar' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

-- No new personal data hangs off an anonymised member either.
create function club.reject_anonymised_member() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from club.members where id = new.member_id and anonymised_at is not null) then
    raise exception 'Un miembro anonimizado no se puede modificar' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
revoke all on function club.reject_anonymised_member() from public, anon, authenticated;

create trigger frozen_member before insert or update on club.member_private
  for each row execute function club.reject_anonymised_member();
create trigger frozen_member before insert or update on club.federation_licences
  for each row execute function club.reject_anonymised_member();
create trigger frozen_member before insert or update on club.member_requirements
  for each row execute function club.reject_anonymised_member();
create trigger frozen_member before insert or update on club.event_signups
  for each row execute function club.reject_anonymised_member();
create trigger frozen_member before insert or update on club.gear_loans
  for each row execute function club.reject_anonymised_member();

-- Same as 0008, plus phase-6 notes and email subjects; child rows are scrubbed before
-- the member row is marked anonymised (the triggers above freeze them afterwards).
create or replace function club.anonymise_member(p_member uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m club.members;
  alias text;
  ids text[];
begin
  if not club.has_permission('members.sensitive') then
    raise exception 'permission denied' using errcode = 'insufficient_privilege';
  end if;
  select * into m from club.members where id = p_member for update;
  if not found then
    raise exception 'Miembro no encontrado' using errcode = 'no_data_found';
  end if;
  if m.left_on is null then
    raise exception 'Solo se anonimiza a quien está de baja' using errcode = 'check_violation';
  end if;
  if m.anonymised_at is not null then
    return;
  end if;
  if exists (
    select 1 from club.charge_status
    where member_id = p_member and status in ('pending', 'partial', 'overdue')
  ) then
    raise exception 'Tiene cargos pendientes' using errcode = 'check_violation';
  end if;

  alias := 'Antiguo miembro ' || upper(left(replace(p_member::text, '-', ''), 4));

  delete from club.member_private where member_id = p_member;
  update club.federation_licences set licence_number = null, notes = null where member_id = p_member;
  update club.member_requirements set notes = null where member_id = p_member;
  update club.event_signups set notes = null where member_id = p_member and notes is not null;
  update club.gear_loans set notes = null where member_id = p_member and notes is not null;
  update club.payments set notes = null
  where charge_id in (select id from club.charges where member_id = p_member);
  update club.transactions set counterparty = alias
  where payment_id in (select p.id from club.payments p join club.charges c on c.id = p.charge_id where c.member_id = p_member);

  update club.members
  set first_name = alias, last_name = '', email = null, phone = null, birth_date = null,
      emergency_name = null, emergency_phone = null, data_consent_on = null,
      image_consent = false, notes = null, no_auto_reminders = true, anonymised_at = now()
  where id = p_member;

  -- Sending log: keep that a message went out, drop who it went to. A message sent
  -- to this member alone may carry their name in the subject.
  update club.email_messages e
  set subject = case when e.recipient_count = 1 then 'Mensaje a ' || alias else e.subject end,
      recipients = (
        select jsonb_agg(case when r ->> 'member_id' = p_member::text
                              then jsonb_build_object('member_id', r ->> 'member_id', 'email', null, 'name', alias)
                              else r end)
        from jsonb_array_elements(e.recipients) r
      )
  where e.recipients @> jsonb_build_array(jsonb_build_object('member_id', p_member::text));

  -- Audit trail: keep who changed what and when, drop the personal values.
  update club.audit_log
  set old_data = case when old_data is null then null else jsonb_build_object('id', p_member, 'anonymised', true) end,
      new_data = case when new_data is null then null else jsonb_build_object('id', p_member, 'anonymised', true) end
  where table_name in ('members', 'member_private') and row_pk = p_member::text;

  update club.audit_log
  set old_data = old_data - array['notes', 'licence_number', 'counterparty'],
      new_data = new_data - array['notes', 'licence_number', 'counterparty']
  where table_name in ('federation_licences', 'member_requirements', 'member_fees', 'charges', 'league_entries',
                       'event_signups', 'gear_loans')
    and coalesce(new_data, old_data) ->> 'member_id' = p_member::text;

  select array_agg(p.id::text) into ids
  from club.payments p join club.charges c on c.id = p.charge_id where c.member_id = p_member;
  update club.audit_log
  set old_data = old_data - array['notes', 'counterparty'],
      new_data = new_data - array['notes', 'counterparty']
  where (table_name = 'payments' and row_pk = any (ids))
     or (table_name = 'transactions' and coalesce(new_data, old_data) ->> 'payment_id' = any (ids));
end;
$$;

-- ---------------------------------------------------------------------------
-- Portal: activities only for linked members; running activities stay listed
-- ---------------------------------------------------------------------------

create or replace function club.portal_events()
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
  where exists (select 1 from club.portal_member_ids())
    and not e.cancelled
    and coalesce(e.ends_on, e.starts_on) >= (now() at time zone 'Europe/Madrid')::date
  order by e.starts_on, e.start_time;
$$;

create or replace function club.portal_signup(p_event uuid, p_member uuid, p_join boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  e club.events;
  today date := (now() at time zone 'Europe/Madrid')::date;
begin
  if p_member is null or p_member not in (select club.portal_member_ids()) then
    raise exception 'permission denied' using errcode = 'insufficient_privilege';
  end if;
  select * into e from club.events where id = p_event;
  if not found or e.cancelled or coalesce(e.ends_on, e.starts_on) < today then
    raise exception 'Actividad no disponible' using errcode = 'no_data_found';
  end if;
  if e.signup_deadline is not null and e.signup_deadline < today then
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

revoke all on function club.portal_events(), club.portal_signup(uuid, uuid, boolean) from public, anon;
grant execute on function club.portal_events(), club.portal_signup(uuid, uuid, boolean) to authenticated;

commit;
