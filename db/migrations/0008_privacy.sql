-- Privacy (GDPR): per-member opt-out of automatic reminders, and anonymising former
-- members on request while keeping the accounting. Exports are built by the app from
-- what the caller can already read.

begin;

alter table club.members
  add column no_auto_reminders boolean not null default false,
  add column anonymised_at timestamptz;

grant insert (no_auto_reminders), update (no_auto_reminders) on club.members to authenticated;

-- An anonymised member stays a former member.
create function club.keep_anonymised_left() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.anonymised_at is not null and new.left_on is null then
    raise exception 'Un miembro anonimizado no se puede reactivar' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
create trigger keep_anonymised_left before update on club.members
  for each row execute function club.keep_anonymised_left();

-- Erases the personal data of a former member. Charges, payments, ledger amounts and
-- league numbers stay (the club must keep its accounts), under a neutral name.
-- Refused while the member still owes money. Not reversible.
create function club.anonymise_member(p_member uuid) returns void
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

  update club.members
  set first_name = alias, last_name = '', email = null, phone = null, birth_date = null,
      emergency_name = null, emergency_phone = null, data_consent_on = null,
      image_consent = false, notes = null, no_auto_reminders = true, anonymised_at = now()
  where id = p_member;
  delete from club.member_private where member_id = p_member;
  update club.federation_licences set licence_number = null, notes = null where member_id = p_member;
  update club.member_requirements set notes = null where member_id = p_member;
  update club.payments set notes = null
  where charge_id in (select id from club.charges where member_id = p_member);
  update club.transactions set counterparty = alias
  where payment_id in (select p.id from club.payments p join club.charges c on c.id = p.charge_id where c.member_id = p_member);

  -- Sending log: keep that a message went out, drop who it went to.
  update club.email_messages e
  set recipients = (
    select jsonb_agg(case when r ->> 'member_id' = p_member::text
                          then jsonb_build_object('member_id', r ->> 'member_id', 'email', null, 'name', alias)
                          else r end)
    from jsonb_array_elements(e.recipients) r
  )
  where e.recipients @> jsonb_build_array(jsonb_build_object('member_id', p_member::text));

  -- Audit trail: keep who changed what and when, drop the personal values (including
  -- the ones the statements above just logged).
  update club.audit_log
  set old_data = case when old_data is null then null else jsonb_build_object('id', p_member, 'anonymised', true) end,
      new_data = case when new_data is null then null else jsonb_build_object('id', p_member, 'anonymised', true) end
  where table_name in ('members', 'member_private') and row_pk = p_member::text;

  update club.audit_log
  set old_data = old_data - array['notes', 'licence_number', 'counterparty'],
      new_data = new_data - array['notes', 'licence_number', 'counterparty']
  where table_name in ('federation_licences', 'member_requirements', 'member_fees', 'charges', 'league_entries')
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

revoke all on function club.keep_anonymised_left() from public, anon, authenticated;
revoke all on function club.anonymise_member(uuid) from public, anon;
grant execute on function club.anonymise_member(uuid) to authenticated;

commit;
