-- Opt-in contact data is deliberately outside public order rows and their retry payloads.
create table private.whatsapp_config (
 singleton boolean primary key default true check(singleton), enabled boolean not null default false,
 business_number text check(business_number ~ '^[1-9][0-9]{7,14}$')
);
insert into private.whatsapp_config(singleton) values(true);
create table private.whatsapp_consent (
 order_id uuid primary key references public.orders(id) on delete cascade,
 customer_id uuid not null references auth.users(id), phone text not null check(phone ~ '^\+[1-9][0-9]{7,14}$'),
 version text not null check(version='2026-09-18'), consent_at timestamptz not null default now(),
 verified_at timestamptz, withdrawn_at timestamptz, token_hash text, token_expires_at timestamptz
);
create index whatsapp_consent_phone_idx on private.whatsapp_consent(phone);
create index whatsapp_consent_customer_idx on private.whatsapp_consent(customer_id);
create table private.whatsapp_suppression(phone text primary key, stopped_at timestamptz not null default now());
create table private.whatsapp_outbox (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
 event text not null check(event in ('created','ready','cancelled')),
 state text not null default 'queued' check(state in ('queued','sending','accepted','sent','delivered','read','failed','unknown','suppressed')),
 attempts integer not null default 0, next_attempt_at timestamptz not null default now(),
 claimed_at timestamptz, message_id text unique, status_at timestamptz,
 created_at timestamptz not null default now(), unique(order_id,event)
);
create index whatsapp_queue_idx on private.whatsapp_outbox(next_attempt_at) where state='queued';
alter table private.whatsapp_config enable row level security;
alter table private.whatsapp_consent enable row level security;
alter table private.whatsapp_suppression enable row level security;
alter table private.whatsapp_outbox enable row level security;
revoke all on private.whatsapp_config, private.whatsapp_consent, private.whatsapp_suppression, private.whatsapp_outbox from public, anon, authenticated;

create function private.whatsapp_availability() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('enabled',enabled and business_number is not null,'business_number',case when enabled then business_number end) from private.whatsapp_config where singleton
$$;
create function public.whatsapp_availability() returns jsonb language sql stable security invoker set search_path='' as $$select private.whatsapp_availability()$$;
grant usage on schema private to anon;
revoke all on function private.whatsapp_availability(),public.whatsapp_availability() from public;
grant execute on function private.whatsapp_availability(),public.whatsapp_availability() to anon,authenticated;

create function private.place_order_with_whatsapp(p_cart_id uuid,p_items jsonb,p_pickup_name text,p_notes text,p_idempotency_key uuid,p_phone text,p_consent_version text) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=private.require_user(); v_order jsonb; v_id uuid; v_consent private.whatsapp_consent; v_code text; v_business text;
begin
 if p_phone is null or p_phone !~ '^\+[1-9][0-9]{7,14}$' or p_consent_version is distinct from '2026-09-18' then raise exception 'Valid WhatsApp number and explicit consent required'; end if;
 select business_number into v_business from private.whatsapp_config where enabled and business_number is not null;
 if not found and not exists(select 1 from public.orders where customer_id=v_uid and idempotency_key=p_idempotency_key) then raise exception 'WhatsApp notifications are unavailable'; end if;
 v_order:=private.place_order(p_cart_id,p_items,p_pickup_name,p_notes,p_idempotency_key);
 v_id:=(v_order->>'id')::uuid;
 select * into v_consent from private.whatsapp_consent where order_id=v_id for update;
 if found then
  if v_consent.phone<>p_phone or v_consent.version<>p_consent_version then raise exception 'Retry key already used with different notification details'; end if;
  if v_consent.withdrawn_at is not null or v_business is null then return v_order; end if;
 else
  if v_business is null then return v_order; end if;
  insert into private.whatsapp_consent(order_id,customer_id,phone,version) values(v_id,v_uid,p_phone,p_consent_version) returning * into v_consent;
  insert into private.whatsapp_outbox(order_id,event) values(v_id,'created') on conflict do nothing;
 end if;
 if v_consent.verified_at is not null then return v_order; end if;
 -- A retry mints a fresh challenge, invalidating the old one. Only its hash is retained.
 v_code:=replace(gen_random_uuid()::text,'-','');
 update private.whatsapp_consent set token_hash=encode(extensions.digest(v_code,'sha256'),'hex'),token_expires_at=now()+interval '30 minutes' where order_id=v_id;
 return v_order||jsonb_build_object('whatsapp',jsonb_build_object('activation_code',v_code,'business_number',v_business));
end $$;
create function public.place_order_with_whatsapp(p_cart_id uuid,p_items jsonb,p_pickup_name text,p_notes text,p_idempotency_key uuid,p_phone text,p_consent_version text) returns jsonb language sql security invoker set search_path='' as $$select private.place_order_with_whatsapp(p_cart_id,p_items,p_pickup_name,p_notes,p_idempotency_key,p_phone,p_consent_version)$$;
revoke all on function private.place_order_with_whatsapp(uuid,jsonb,text,text,uuid,text,text),public.place_order_with_whatsapp(uuid,jsonb,text,text,uuid,text,text) from public,anon;
grant execute on function private.place_order_with_whatsapp(uuid,jsonb,text,text,uuid,text,text),public.place_order_with_whatsapp(uuid,jsonb,text,text,uuid,text,text) to authenticated;

create function private.whatsapp_order_event() returns trigger language plpgsql security definer set search_path='' as $$
declare v_event text;
begin
 v_event:=case when new.status='ready' then 'ready' when new.status in ('cancelled','rejected') then 'cancelled' end;
 if new.status is distinct from old.status and v_event is not null and exists(select 1 from private.whatsapp_consent where order_id=new.id and withdrawn_at is null) then
 insert into private.whatsapp_outbox(order_id,event) values(new.id,v_event) on conflict do nothing;
 end if;
 return new;
end $$;
revoke all on function private.whatsapp_order_event() from public,anon,authenticated;
create trigger whatsapp_order_event after update of status on public.orders for each row execute function private.whatsapp_order_event();

create table private.whatsapp_inbound(id text primary key, received_at timestamptz not null default now());
alter table private.whatsapp_inbound enable row level security;
revoke all on private.whatsapp_inbound from public,anon,authenticated;
-- Service-only operation surface; private tables stay unexposed to PostgREST.
create function private.whatsapp_service(p_action text,p_data jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_row private.whatsapp_outbox; v_phone text; v_token text; v_id uuid; v_result jsonb; v_at timestamptz; v_inserted integer;
begin
 if p_action='cleanup' then
  delete from private.whatsapp_inbound where received_at<now()-interval '30 days';
  update private.whatsapp_outbox set state='unknown' where state='sending' and claimed_at<now()-interval '5 minutes';
  delete from private.whatsapp_consent c using public.orders o where c.order_id=o.id and ((c.verified_at is null and c.consent_at<now()-interval '24 hours') or (o.status in ('completed','cancelled','rejected') and o.updated_at<now()-interval '30 days'));
  update private.whatsapp_outbox q set state='suppressed' where q.state='queued' and (q.created_at<now()-interval '24 hours' or not exists(select 1 from private.whatsapp_consent c where c.order_id=q.order_id));
  return '{}'::jsonb;
 elsif p_action='claim' then
  if not exists(select 1 from private.whatsapp_config where enabled) then return 'null'::jsonb; end if;
  select q.* into v_row from private.whatsapp_outbox q join private.whatsapp_consent c on c.order_id=q.order_id join public.orders o on o.id=q.order_id
  where q.state='queued' and q.next_attempt_at<=now() and q.attempts<4 and q.created_at>now()-interval '24 hours' and c.verified_at is not null and c.withdrawn_at is null
  and not exists(select 1 from private.whatsapp_suppression s where s.phone=c.phone)
  and ((q.event='created' and o.status in ('pending','accepted','preparing')) or (q.event='ready' and o.status='ready') or (q.event='cancelled' and o.status in ('cancelled','rejected')))
  order by q.created_at for update of q skip locked limit 1;
  if not found then return 'null'::jsonb; end if;
  update private.whatsapp_outbox set state='sending',attempts=attempts+1,claimed_at=now() where id=v_row.id;
  return jsonb_build_object('id',v_row.id,'order_id',v_row.order_id,'event',v_row.event);
 elsif p_action='authorize' then
  select c.phone into v_phone from private.whatsapp_outbox q join private.whatsapp_consent c on c.order_id=q.order_id
  join public.orders o on o.id=q.order_id
  where q.id=(p_data->>'id')::uuid and q.state='sending' and c.verified_at is not null and c.withdrawn_at is null
  and q.created_at>now()-interval '24 hours' and ((q.event='created' and o.status in ('pending','accepted','preparing')) or (q.event='ready' and o.status='ready') or (q.event='cancelled' and o.status in ('cancelled','rejected')))
  and exists(select 1 from private.whatsapp_config where enabled)
  and not exists(select 1 from private.whatsapp_suppression s where s.phone=c.phone);
  if not found then update private.whatsapp_outbox set state='suppressed' where id=(p_data->>'id')::uuid and state='sending'; return 'null'::jsonb; end if;
  return jsonb_build_object('phone',v_phone);
 elsif p_action='finish' then
  update private.whatsapp_outbox set state=case when p_data->>'result'='retry' and attempts<4 then 'queued' when p_data->>'result'='retry' then 'failed' else p_data->>'result' end,
  message_id=coalesce(p_data->>'message_id',message_id),next_attempt_at=now()+make_interval(secs=>60*(2^attempts)::int)
  where id=(p_data->>'id')::uuid and state='sending' and p_data->>'result' in ('accepted','failed','unknown','retry');
  return '{}'::jsonb;
 elsif p_action='inbound' then
  v_phone:=p_data->>'phone'; v_token:=lower(btrim(p_data->>'text'));
  if v_phone is null or v_phone !~ '^\+[1-9][0-9]{7,14}$' then return '{}'::jsonb; end if;
  if p_data->>'message_id' is null or length(p_data->>'message_id')>250 then return '{}'::jsonb; end if;
  insert into private.whatsapp_inbound(id) values(p_data->>'message_id') on conflict do nothing;
  get diagnostics v_inserted=row_count;
  if v_inserted=0 then return '{}'::jsonb; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_phone,91));
  if v_token in ('stop','unsubscribe','cancel','end','quit','stopall') then
   insert into private.whatsapp_suppression(phone) values(v_phone) on conflict(phone) do update set stopped_at=now();
   update private.whatsapp_consent set withdrawn_at=now(),token_hash=null,token_expires_at=null where phone=v_phone;
   update private.whatsapp_outbox q set state='suppressed' from private.whatsapp_consent c where c.order_id=q.order_id and c.phone=v_phone and q.state='queued';
  elsif v_token ~ '^verify [0-9a-f]{32}$' then
   update private.whatsapp_consent set verified_at=now(),token_hash=null,token_expires_at=null
   where phone=v_phone and token_hash=encode(extensions.digest(substring(v_token from 8),'sha256'),'hex') and token_expires_at>now() and withdrawn_at is null
   and consent_at>coalesce((select stopped_at from private.whatsapp_suppression where phone=v_phone),'-infinity'::timestamptz) returning order_id into v_id;
   if v_id is not null then delete from private.whatsapp_suppression where phone=v_phone; end if;
  end if;
  return '{}'::jsonb;
 elsif p_action='status' then
  if p_data->>'message_id' is null or coalesce(p_data->>'timestamp','') !~ '^[0-9]{1,12}$' or p_data->>'status' is null or p_data->>'status' not in ('sent','delivered','read','failed') then return '{}'::jsonb; end if;
  v_at:=to_timestamp((p_data->>'timestamp')::double precision);
  select * into v_row from private.whatsapp_outbox where (message_id=p_data->>'message_id' and (p_data->>'opaque_id' is null or id::text=p_data->>'opaque_id')) or (id::text=p_data->>'opaque_id' and message_id is null and state in ('sending','unknown')) for update;
  if not found or (v_row.status_at is not null and v_at<v_row.status_at) then return '{}'::jsonb; end if;
  if v_row.state='read' or (v_row.state='delivered' and p_data->>'status'<>'read') then return '{}'::jsonb; end if;
  update private.whatsapp_outbox set state=p_data->>'status',message_id=p_data->>'message_id',status_at=v_at where id=v_row.id;
  return '{}'::jsonb;
 end if;
 raise exception 'Unknown operation';
end $$;
create function public.whatsapp_service(p_action text,p_data jsonb default '{}'::jsonb) returns jsonb language sql security invoker set search_path='' as $$select private.whatsapp_service(p_action,p_data)$$;
grant usage on schema private to service_role;
revoke all on function private.whatsapp_service(text,jsonb),public.whatsapp_service(text,jsonb) from public,anon,authenticated;
grant execute on function private.whatsapp_service(text,jsonb),public.whatsapp_service(text,jsonb) to service_role;

create function private.withdraw_whatsapp(p_order_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=private.require_user();
begin
 if not exists(select 1 from public.orders where id=p_order_id and customer_id=v_uid) then raise exception 'Order not found' using errcode='42501'; end if;
 update private.whatsapp_consent set withdrawn_at=now(),token_hash=null,token_expires_at=null where order_id=p_order_id;
 update private.whatsapp_outbox set state='suppressed' where order_id=p_order_id and state='queued';
end $$;
create function public.withdraw_whatsapp(p_order_id uuid) returns void language sql security invoker set search_path='' as $$select private.withdraw_whatsapp(p_order_id)$$;
revoke all on function private.withdraw_whatsapp(uuid),public.withdraw_whatsapp(uuid) from public,anon;
grant execute on function private.withdraw_whatsapp(uuid),public.withdraw_whatsapp(uuid) to authenticated;
create function private.whatsapp_order_state(p_order_id uuid) returns text language sql stable security definer set search_path='' as $$
 select case when withdrawn_at is not null then 'stopped' when not exists(select 1 from private.whatsapp_config where enabled) then 'paused' when verified_at is not null then 'active' else 'unverified' end from private.whatsapp_consent where order_id=p_order_id and customer_id=(select auth.uid())
$$;
create function public.whatsapp_order_state(p_order_id uuid) returns text language sql stable security invoker set search_path='' as $$select private.whatsapp_order_state(p_order_id)$$;
revoke all on function private.whatsapp_order_state(uuid),public.whatsapp_order_state(uuid) from public,anon;
grant execute on function private.whatsapp_order_state(uuid),public.whatsapp_order_state(uuid) to authenticated;

-- Maintenance runs even while delivery is disabled. No outbound request without both
-- the enable flag and a separately provisioned Vault/Edge secret pair.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
create function private.whatsapp_tick() returns void language plpgsql security definer set search_path='' as $$
declare v_secret text;
begin
 perform private.whatsapp_service('cleanup','{}');
 if not exists(select 1 from private.whatsapp_config where enabled) then return; end if;
 select decrypted_secret into v_secret from vault.decrypted_secrets where name='whatsapp_worker_secret' limit 1;
 if v_secret is null or length(v_secret)<32 then return; end if;
 perform net.http_post(url:='https://wbbnwbkpzoggffmvnqkh.supabase.co/functions/v1/whatsapp-worker',headers:=jsonb_build_object('Content-Type','application/json','x-worker-secret',v_secret),body:='{}'::jsonb,timeout_milliseconds:=10000);
end $$;
revoke all on function private.whatsapp_tick() from public,anon,authenticated,service_role;
select cron.schedule('halal-cart-whatsapp','* * * * *','select private.whatsapp_tick()');

create function private.whatsapp_order_states(p_order_ids uuid[]) returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_object_agg(order_id,case when withdrawn_at is not null then 'stopped' when not exists(select 1 from private.whatsapp_config where enabled) then 'paused' when verified_at is not null then 'active' else 'unverified' end),'{}'::jsonb)
 from private.whatsapp_consent where customer_id=(select auth.uid()) and order_id=any(p_order_ids[1:100])
$$;
create function public.whatsapp_order_states(p_order_ids uuid[]) returns jsonb language sql stable security invoker set search_path='' as $$select private.whatsapp_order_states(p_order_ids)$$;
create function private.renew_whatsapp_verification(p_order_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=private.require_user(); v_code text; v_number text;
begin
 select business_number into v_number from private.whatsapp_config where enabled;
 if v_number is null then raise exception 'WhatsApp notifications are unavailable'; end if;
 perform 1 from private.whatsapp_consent where order_id=p_order_id and customer_id=v_uid and withdrawn_at is null and verified_at is null and consent_at>now()-interval '24 hours' for update;
 if not found then raise exception 'Verification is no longer available for this order'; end if;
 v_code:=replace(gen_random_uuid()::text,'-','');
 update private.whatsapp_consent set token_hash=encode(extensions.digest(v_code,'sha256'),'hex'),token_expires_at=now()+interval '30 minutes' where order_id=p_order_id;
 return jsonb_build_object('activation_code',v_code,'business_number',v_number);
end $$;
create function public.renew_whatsapp_verification(p_order_id uuid) returns jsonb language sql security invoker set search_path='' as $$select private.renew_whatsapp_verification(p_order_id)$$;
revoke all on function private.whatsapp_order_states(uuid[]),public.whatsapp_order_states(uuid[]),private.renew_whatsapp_verification(uuid),public.renew_whatsapp_verification(uuid) from public,anon;
grant execute on function private.whatsapp_order_states(uuid[]),public.whatsapp_order_states(uuid[]),private.renew_whatsapp_verification(uuid),public.renew_whatsapp_verification(uuid) to authenticated;
