-- RLS and automation tests for 0002_members.sql. Always rolls back.

begin;

insert into auth.users (id, email, email_confirmed_at, aud, role) values
  ('00000000-0000-4000-8000-0000000000a1', 'test-secretary@club.test', now(), 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000b2', 'test-league@club.test', now(), 'authenticated', 'authenticated');
insert into club.admin_users (id, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'test-secretary@club.test'),
  ('00000000-0000-4000-8000-0000000000b2', 'test-league@club.test');
insert into club.admin_user_roles values
  ('00000000-0000-4000-8000-0000000000a1', 'owner'),
  ('00000000-0000-4000-8000-0000000000a1', 'secretary'),
  ('00000000-0000-4000-8000-0000000000b2', 'league');

set local role authenticated;

-- 1. Secretary adds a member: checklist created for the joining season.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
insert into club.members (first_name, last_name, joined_on)
values ('Prueba', 'Socia', '2026-03-01');
select set_config('test.member', (select id::text from club.members where first_name = 'Prueba'), true);
insert into club.member_private (member_id, national_id, health_notes)
values (current_setting('test.member')::uuid, '00000000T', 'alergia de prueba');
do $$ begin
  if (select count(*) from club.member_requirements where member_id = current_setting('test.member')::uuid) <> 3 then
    raise exception 'checklist not generated';
  end if;
  if (select count(*) from club.member_requirements where season = 2026) <> 2 then
    raise exception 'yearly items should belong to 2026';
  end if;
end $$;

-- 2. Recording a licence ticks the licence item.
insert into club.federation_licences (member_id, season, licence_number)
values (current_setting('test.member')::uuid, 2026, 'TEST-1');
do $$ begin
  if (select r.status from club.member_requirements r join club.requirement_templates t on t.id = r.template_id
      where t.key = 'licence' and r.season = 2026) <> 'done' then
    raise exception 'licence item not ticked';
  end if;
end $$;

-- 3. Opening 2027 adds the two yearly items for the active member.
do $$ begin
  if club.open_season(2027) <> 2 then raise exception 'open_season count'; end if;
  if club.open_season(2027) <> 0 then raise exception 'open_season not idempotent'; end if;
end $$;

-- 4. Audit log never stores sensitive values.
do $$ begin
  if exists (select 1 from club.audit_log where table_name = 'member_private'
             and (new_data ? 'national_id' or new_data ? 'health_notes')) then
    raise exception 'audit leaked sensitive data';
  end if;
end $$;

-- 5. League role: reads members, not private data; cannot write.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);
do $$ begin
  if (select count(*) from club.members) <> 1 then raise exception 'league cannot read members'; end if;
  if exists (select 1 from club.member_private) then raise exception 'league reads private data'; end if;
end $$;
do $$ begin
  insert into club.members (first_name) values ('Intruso');
  raise exception 'league added a member';
exception when insufficient_privilege then null;
end $$;
update club.members set notes = 'hack';
do $$ begin
  if exists (select 1 from club.members where notes = 'hack') then raise exception 'league edited a member'; end if;
end $$;
do $$ begin
  perform club.open_season(2028);
  raise exception 'league opened a season';
exception when insufficient_privilege then null;
end $$;

-- 6. Leaving: inactive members are skipped when a season opens.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
update club.members set left_on = '2026-09-30' where id = current_setting('test.member')::uuid;
do $$ begin
  if (select active from club.members) then raise exception 'member still active'; end if;
  if club.open_season(2028) <> 0 then raise exception 'inactive member got a new season'; end if;
end $$;

select 'all members tests passed' as result;
rollback;
