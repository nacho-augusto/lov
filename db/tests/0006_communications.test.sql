-- Tests for 0006_communications.sql. Always rolls back.

begin;

insert into auth.users (id, email, email_confirmed_at, aud, role) values
  ('00000000-0000-4000-8000-0000000000a1', 'test-secretary@club.test', now(), 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000b2', 'test-viewer@club.test', now(), 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000c3', 'test-league@club.test', now(), 'authenticated', 'authenticated');
insert into club.admin_users (id, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'test-secretary@club.test'),
  ('00000000-0000-4000-8000-0000000000b2', 'test-viewer@club.test'),
  ('00000000-0000-4000-8000-0000000000c3', 'test-league@club.test');
insert into club.admin_user_roles values
  ('00000000-0000-4000-8000-0000000000a1', 'secretary'),
  ('00000000-0000-4000-8000-0000000000a1', 'owner'),
  ('00000000-0000-4000-8000-0000000000b2', 'viewer'),
  ('00000000-0000-4000-8000-0000000000c3', 'league');

set local role authenticated;

-- 1. Secretary edits a template and logs a send as themself; can't forge the sender.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
update club.email_templates set subject = 'Asunto test' where key = 'general';
do $$ begin
  if (select subject from club.email_templates where key = 'general') <> 'Asunto test' then
    raise exception 'secretary could not edit a template';
  end if;
end $$;
insert into club.email_messages (template_id, subject, recipients)
select id, 'Asunto test', '[{"member_id":null,"email":"a@club.test","name":"A"},{"member_id":null,"email":"b@club.test","name":"B"}]'
from club.email_templates where key = 'general';
do $$ begin
  if (select recipient_count from club.email_messages where subject = 'Asunto test') <> 2 then
    raise exception 'recipient count';
  end if;
  if (select sent_by from club.email_messages where subject = 'Asunto test') <> '00000000-0000-4000-8000-0000000000a1' then
    raise exception 'sent_by not defaulted to the caller';
  end if;
end $$;
do $$ begin
  insert into club.email_messages (subject, recipients, sent_by)
  values ('forjado', '[]', '00000000-0000-4000-8000-0000000000b2');
  raise exception 'secretary forged sent_by';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  update club.email_messages set subject = 'cambiado';
  raise exception 'log is editable';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  insert into club.email_templates (name, subject, body, audience) values ('Mala', 's', 'b', 'everyone');
  raise exception 'unknown audience accepted';
exception when check_violation then null;
end $$;

-- 2. Viewer reads templates and log, changes nothing.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);
do $$ begin
  if (select count(*) from club.email_templates) < 3 then raise exception 'viewer cannot read templates'; end if;
  if (select count(*) from club.email_messages) <> 1 then raise exception 'viewer cannot read the log'; end if;
end $$;
update club.email_templates set subject = 'hack' where key = 'general';
do $$ begin
  insert into club.email_messages (subject, recipients) values ('hack', '[]');
  raise exception 'viewer logged a send';
exception when insufficient_privilege then null;
end $$;

-- 3. League role sees nothing.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c3","role":"authenticated"}', true);
do $$ begin
  if exists (select 1 from club.email_templates) then raise exception 'league reads templates'; end if;
  if exists (select 1 from club.email_messages) then raise exception 'league reads the log'; end if;
end $$;

reset role;
do $$ begin
  if (select subject from club.email_templates where key = 'general') <> 'Asunto test' then
    raise exception 'viewer edited a template';
  end if;
end $$;

select 'all communications tests passed' as result;
rollback;
