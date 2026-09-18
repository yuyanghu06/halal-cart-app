create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.carts (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null unique references auth.users(id),
 name text not null check (length(btrim(name)) between 2 and 100),
 description text not null default '' check(length(description)<=1000),
 cuisine text not null default 'Halal' check(length(cuisine) between 1 and 60),
 address text not null default '' check(length(address)<=250),
 latitude double precision check(latitude between 40.45 and 40.95),
 longitude double precision check(longitude between -74.3 and -73.65),
 is_online boolean not null default false,
 location_updated_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check ((latitude is null) = (longitude is null)),
 check (not is_online or (latitude is not null and location_updated_at is not null))
);
create table public.menu_items (
 id uuid primary key default gen_random_uuid(), cart_id uuid not null references public.carts(id),
 name text not null check(length(btrim(name)) between 1 and 100),
 description text not null default '' check(length(description)<=500),
 price_cents integer not null check(price_cents between 1 and 100000),
 category text not null default 'Plates' check(length(category) between 1 and 60),
 is_available boolean not null default true, sort_order integer not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index menu_items_cart_idx on public.menu_items(cart_id);
create table public.sightings (
 id uuid primary key default gen_random_uuid(), submitted_by uuid not null references auth.users(id),
 name text not null check(length(btrim(name)) between 2 and 100),
 address text not null check(length(btrim(address)) between 2 and 250),
 latitude double precision not null check(latitude between 40.45 and 40.95),
 longitude double precision not null check(longitude between -74.3 and -73.65),
 notes text not null default '' check(length(notes)<=500), created_at timestamptz not null default now()
);
create index sightings_user_time_idx on public.sightings(submitted_by,created_at desc);
create index sightings_time_idx on public.sightings(created_at desc);
create table public.orders (
 id uuid primary key default gen_random_uuid(), cart_id uuid not null references public.carts(id),
 customer_id uuid not null references auth.users(id),
 status text not null default 'pending' check(status in ('pending','accepted','preparing','ready','completed','rejected','cancelled')),
 total_cents integer not null check(total_cents between 1 and 40000000),
 payment_status text not null default 'unpaid' check(payment_status='unpaid'),
 pickup_name text not null check(length(btrim(pickup_name)) between 1 and 80),
 notes text not null default '' check(length(notes)<=500),
 idempotency_key uuid not null,
 request_payload jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(customer_id,idempotency_key)
);
create index orders_cart_time_idx on public.orders(cart_id,created_at desc);
create index orders_customer_time_idx on public.orders(customer_id,created_at desc);
create table public.order_items (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
 menu_item_id uuid not null references public.menu_items(id),
 name text not null, unit_price_cents integer not null check(unit_price_cents>0),
 quantity integer not null check(quantity between 1 and 20), unique(order_id,menu_item_id)
);
create index order_items_menu_idx on public.order_items(menu_item_id);

alter table public.carts enable row level security;
alter table public.menu_items enable row level security;
alter table public.sightings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
revoke all on public.carts,public.menu_items,public.sightings,public.orders,public.order_items from anon,authenticated;
grant select on public.carts,public.menu_items,public.sightings to anon,authenticated;
grant select on public.orders,public.order_items to authenticated;
create policy carts_public_read on public.carts for select to anon,authenticated using(true);
create policy menu_public_read on public.menu_items for select to anon,authenticated using(true);
create policy sightings_public_read on public.sightings for select to anon,authenticated using(true);
create policy orders_participant_read on public.orders for select to authenticated using(customer_id=(select auth.uid()) or cart_id in (select id from public.carts where owner_id=(select auth.uid())));
create policy items_participant_read on public.order_items for select to authenticated using(order_id in (select id from public.orders));

create function private.require_user() returns uuid language plpgsql security definer set search_path='' as $$
declare v_uid uuid := auth.uid();
begin
 if v_uid is null or not exists(select 1 from auth.users where id=v_uid and is_anonymous=false) then raise exception 'Sign in with a permanent account to continue' using errcode='42501'; end if;
 return v_uid;
end $$;

create function private.save_cart(p_name text,p_description text,p_cuisine text,p_address text) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=private.require_user(); v_row public.carts;
begin
 insert into public.carts(owner_id,name,description,cuisine,address) values(v_uid,btrim(p_name),p_description,p_cuisine,btrim(p_address))
 on conflict(owner_id) do update set name=excluded.name,description=excluded.description,cuisine=excluded.cuisine,address=excluded.address,updated_at=now() returning * into v_row;
 return to_jsonb(v_row);
end $$;

create function private.set_cart_presence(p_cart_id uuid,p_is_online boolean,p_latitude double precision default null,p_longitude double precision default null,p_address text default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=private.require_user(); v_row public.carts;
begin
 if p_is_online and (p_latitude is null or p_longitude is null) then raise exception 'Current location is required to go online'; end if;
 update public.carts set is_online=p_is_online,latitude=case when p_is_online then p_latitude else latitude end,longitude=case when p_is_online then p_longitude else longitude end,location_updated_at=case when p_is_online then now() else location_updated_at end,address=coalesce(p_address,address),updated_at=now() where id=p_cart_id and owner_id=v_uid returning * into v_row;
 if not found then raise exception 'Cart not found or not owned by you' using errcode='42501'; end if;
 return to_jsonb(v_row);
end $$;

create function private.save_menu_item(p_cart_id uuid,p_name text,p_description text,p_price_cents integer,p_category text,p_is_available boolean,p_sort_order integer default 0,p_item_id uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=private.require_user(); v_row public.menu_items;
begin
 perform 1 from public.carts where id=p_cart_id and owner_id=v_uid for update;
 if not found then raise exception 'Cart not found or not owned by you' using errcode='42501'; end if;
 if p_item_id is null then
  if (select count(*) from public.menu_items where cart_id=p_cart_id)>=100 then raise exception 'Maximum 100 menu items per cart'; end if;
  insert into public.menu_items(cart_id,name,description,price_cents,category,is_available,sort_order) values(p_cart_id,btrim(p_name),p_description,p_price_cents,p_category,p_is_available,p_sort_order) returning * into v_row;
 else
  update public.menu_items set name=btrim(p_name),description=p_description,price_cents=p_price_cents,category=p_category,is_available=p_is_available,sort_order=p_sort_order,updated_at=now() where id=p_item_id and cart_id=p_cart_id returning * into v_row;
  if not found then raise exception 'Menu item not found' using errcode='42501'; end if;
 end if;
 return to_jsonb(v_row);
end $$;

create function private.submit_sighting(p_name text,p_address text,p_latitude double precision,p_longitude double precision,p_notes text default '') returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=private.require_user(); v_row public.sightings;
begin
 perform pg_advisory_xact_lock(hashtextextended(v_uid::text,1));
 if (select count(*) from public.sightings where submitted_by=v_uid and created_at>now()-interval '1 hour')>=10 then raise exception 'Sighting limit reached. Try again in an hour'; end if;
 insert into public.sightings(submitted_by,name,address,latitude,longitude,notes) values(v_uid,btrim(p_name),btrim(p_address),p_latitude,p_longitude,p_notes) returning * into v_row;
 return to_jsonb(v_row);
end $$;

create function private.place_order(p_cart_id uuid,p_items jsonb,p_pickup_name text,p_notes text,p_idempotency_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=private.require_user(); v_cart public.carts; v_order public.orders; v_item public.menu_items; v_line jsonb; v_qty integer; v_total integer:=0; v_snapshot jsonb:='[]'::jsonb; v_payload jsonb;
begin
 if p_idempotency_key is null then raise exception 'Order retry key is required'; end if;
 v_payload:=jsonb_build_object('cart_id',p_cart_id,'items',p_items,'pickup_name',p_pickup_name,'notes',p_notes);
 perform pg_advisory_xact_lock(hashtextextended(v_uid::text,2));
 select * into v_order from public.orders where customer_id=v_uid and idempotency_key=p_idempotency_key;
 if found then
  if v_order.request_payload<>v_payload then raise exception 'Retry key already used for a different order'; end if;
  return to_jsonb(v_order)-'request_payload';
 end if;
 if jsonb_typeof(p_items) is distinct from 'array' then raise exception 'Order items must be an array'; end if;
 if jsonb_array_length(p_items) not between 1 and 20 then raise exception 'Choose 1 to 20 items'; end if;
 if (select count(distinct value->>'menu_item_id') from jsonb_array_elements(p_items))<>jsonb_array_length(p_items) then raise exception 'Each menu item must appear only once'; end if;
 if (select count(*) from public.orders where customer_id=v_uid and created_at>now()-interval '1 hour')>=10 then raise exception 'Order limit reached. Try again in an hour'; end if;
 select * into v_cart from public.carts where id=p_cart_id for update;
 if not found or not v_cart.is_online or v_cart.location_updated_at<=now()-interval '15 minutes' then raise exception 'Cart is offline. Please choose an online cart'; end if;
 for v_line in select value from jsonb_array_elements(p_items) order by value->>'menu_item_id' loop
  if jsonb_typeof(v_line->'quantity') is distinct from 'number' or (v_line->>'quantity') !~ '^[0-9]+$' then raise exception 'Quantity must be a whole number'; end if;
  v_qty:=(v_line->>'quantity')::integer;
  if v_qty not between 1 and 20 then raise exception 'Quantity must be between 1 and 20'; end if;
  select * into v_item from public.menu_items where id=(v_line->>'menu_item_id')::uuid and cart_id=p_cart_id and is_available for share;
  if not found then raise exception 'An item is no longer available. Refresh the menu'; end if;
  v_total:=v_total+v_item.price_cents*v_qty;
  v_snapshot:=v_snapshot||jsonb_build_array(jsonb_build_object('menu_item_id',v_item.id,'name',v_item.name,'unit_price_cents',v_item.price_cents,'quantity',v_qty));
 end loop;
 insert into public.orders(cart_id,customer_id,total_cents,pickup_name,notes,idempotency_key,request_payload) values(p_cart_id,v_uid,v_total,btrim(p_pickup_name),p_notes,p_idempotency_key,v_payload) returning * into v_order;
 insert into public.order_items(order_id,menu_item_id,name,unit_price_cents,quantity) select v_order.id,x.menu_item_id,x.name,x.unit_price_cents,x.quantity from jsonb_to_recordset(v_snapshot) as x(menu_item_id uuid,name text,unit_price_cents integer,quantity integer);
 return to_jsonb(v_order)-'request_payload';
end $$;

create function private.transition_order(p_order_id uuid,p_status text) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=private.require_user(); v_order public.orders; v_owner uuid;
begin
 select * into v_order from public.orders where id=p_order_id for update;
 if not found then raise exception 'Order not found' using errcode='42501'; end if;
 select owner_id into v_owner from public.carts where id=v_order.cart_id;
 if v_uid<>v_owner and v_uid<>v_order.customer_id then raise exception 'Order not found' using errcode='42501'; end if;
 if v_order.status=p_status then return to_jsonb(v_order)-'request_payload'; end if;
 if not ((v_uid=v_owner and ((v_order.status='pending' and p_status in ('accepted','rejected')) or (v_order.status='accepted' and p_status in ('preparing','cancelled')) or (v_order.status='preparing' and p_status in ('ready','cancelled')) or (v_order.status='ready' and p_status='completed'))) or (v_uid=v_order.customer_id and v_order.status='pending' and p_status='cancelled')) then raise exception 'This order status change is not allowed'; end if;
 update public.orders set status=p_status,updated_at=now() where id=p_order_id returning * into v_order;
 return to_jsonb(v_order)-'request_payload';
end $$;

create function public.save_cart(p_name text,p_description text,p_cuisine text,p_address text) returns jsonb language sql security invoker set search_path='' as $$ select private.save_cart(p_name,p_description,p_cuisine,p_address); $$;
revoke all on function private.save_cart(text,text,text,text) from public,anon,authenticated;
grant execute on function private.save_cart(text,text,text,text) to authenticated;
revoke all on function public.save_cart(text,text,text,text) from public,anon,authenticated;
grant execute on function public.save_cart(text,text,text,text) to authenticated;

create function public.set_cart_presence(p_cart_id uuid,p_is_online boolean,p_latitude double precision default null,p_longitude double precision default null,p_address text default null) returns jsonb language sql security invoker set search_path='' as $$ select private.set_cart_presence(p_cart_id,p_is_online,p_latitude,p_longitude,p_address); $$;
revoke all on function private.set_cart_presence(uuid,boolean,double precision,double precision,text) from public,anon,authenticated;
grant execute on function private.set_cart_presence(uuid,boolean,double precision,double precision,text) to authenticated;
revoke all on function public.set_cart_presence(uuid,boolean,double precision,double precision,text) from public,anon,authenticated;
grant execute on function public.set_cart_presence(uuid,boolean,double precision,double precision,text) to authenticated;

create function public.save_menu_item(p_cart_id uuid,p_name text,p_description text,p_price_cents integer,p_category text,p_is_available boolean,p_sort_order integer default 0,p_item_id uuid default null) returns jsonb language sql security invoker set search_path='' as $$ select private.save_menu_item(p_cart_id,p_name,p_description,p_price_cents,p_category,p_is_available,p_sort_order,p_item_id); $$;
revoke all on function private.save_menu_item(uuid,text,text,integer,text,boolean,integer,uuid) from public,anon,authenticated;
grant execute on function private.save_menu_item(uuid,text,text,integer,text,boolean,integer,uuid) to authenticated;
revoke all on function public.save_menu_item(uuid,text,text,integer,text,boolean,integer,uuid) from public,anon,authenticated;
grant execute on function public.save_menu_item(uuid,text,text,integer,text,boolean,integer,uuid) to authenticated;

create function public.submit_sighting(p_name text,p_address text,p_latitude double precision,p_longitude double precision,p_notes text default '') returns jsonb language sql security invoker set search_path='' as $$ select private.submit_sighting(p_name,p_address,p_latitude,p_longitude,p_notes); $$;
revoke all on function private.submit_sighting(text,text,double precision,double precision,text) from public,anon,authenticated;
grant execute on function private.submit_sighting(text,text,double precision,double precision,text) to authenticated;
revoke all on function public.submit_sighting(text,text,double precision,double precision,text) from public,anon,authenticated;
grant execute on function public.submit_sighting(text,text,double precision,double precision,text) to authenticated;

create function public.place_order(p_cart_id uuid,p_items jsonb,p_pickup_name text,p_notes text,p_idempotency_key uuid) returns jsonb language sql security invoker set search_path='' as $$ select private.place_order(p_cart_id,p_items,p_pickup_name,p_notes,p_idempotency_key); $$;
revoke all on function private.place_order(uuid,jsonb,text,text,uuid) from public,anon,authenticated;
grant execute on function private.place_order(uuid,jsonb,text,text,uuid) to authenticated;
revoke all on function public.place_order(uuid,jsonb,text,text,uuid) from public,anon,authenticated;
grant execute on function public.place_order(uuid,jsonb,text,text,uuid) to authenticated;

create function public.transition_order(p_order_id uuid,p_status text) returns jsonb language sql security invoker set search_path='' as $$ select private.transition_order(p_order_id,p_status); $$;
revoke all on function private.transition_order(uuid,text) from public,anon,authenticated;
grant execute on function private.transition_order(uuid,text) to authenticated;
revoke all on function public.transition_order(uuid,text) from public,anon,authenticated;
grant execute on function public.transition_order(uuid,text) to authenticated;

revoke all on function private.require_user() from public,anon,authenticated;
