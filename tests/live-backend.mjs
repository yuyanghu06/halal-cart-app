import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { loadEnvFile } from 'node:process';
import { readFile, writeFile } from 'node:fs/promises';
import pg from 'pg';

loadEnvFile(new URL('../.env', import.meta.url));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
assert.equal(new URL(url).hostname, 'wbbnwbkpzoggffmvnqkh.supabase.co', 'Dedicated project guard');
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const run = `qa-${Date.now()}`;
const users = ['owner-a', 'owner-b', 'customer-a', 'customer-b'].map(role => ({ role, id: randomUUID(), email: `${run}-${role}@example.com`, password: randomBytes(24).toString('base64url') }));
const db = new pg.Client({ host: process.env.TEST_DB_HOST || 'db.wbbnwbkpzoggffmvnqkh.supabase.co', port: Number(process.env.TEST_DB_PORT || 5432), user: process.env.TEST_DB_USER || 'postgres', database: 'postgres', password: process.env.SUPABASE_PASSWORD, ssl: { rejectUnauthorized: true, ca: await readFile(new URL('./supabase-root-ca.crt',import.meta.url),'utf8') }, connectionTimeoutMillis: 10000 });
const results = [];
async function api(user, path, body, method = body ? 'POST' : 'GET') {
  const response = await fetch(`${url}${path}`, { method, headers: { apikey: key, ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}), 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await response.json().catch(() => null);
  return { status: response.status, ok: response.ok, data };
}
const rpc = (u, name, body) => api(u, `/rest/v1/rpc/${name}`, body);
const pass = async (label, fn) => { try { await fn(); results.push({ label, pass: true }); console.log(`PASS ${label}`); } catch (e) { results.push({ label, pass: false, reason: e.message }); console.log(`FAIL ${label}: ${e.message}`); } };
function accepted(r) { assert.ok(r.ok, `Expected success, got HTTP ${r.status}: ${r.data?.message || r.data?.msg || 'unknown'}`); return r.data; }
function denied(r) { assert.ok(!r.ok, `Expected denial, got HTTP ${r.status}`); }
const [owner, other, customer, stranger] = users;
let cart, item, secondCart, secondItem, order;
const cartInput = { p_name: `${run} test cart`, p_description: 'Disposable automated QA fixture; not a real cart', p_cuisine: 'Halal', p_address: 'Test coordinates near Times Square' };
const menuInput = { p_name: 'QA chicken over rice', p_description: 'Test item', p_price_cents: 1099, p_category: 'Platters', p_is_available: true, p_sort_order: 0 };
let orderInput;
try {
  await db.connect();
  for (const u of users) {
    await db.query(`insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change,email_change_token_current,phone_change,phone_change_token,reauthentication_token,is_sso_user,is_anonymous) values ('00000000-0000-0000-0000-000000000000',$1,'authenticated','authenticated',$2,extensions.crypt($3,extensions.gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,now(),now(),'','','','','','','','',false,false)`, [u.id,u.email,u.password]);
    await db.query(`insert into auth.identities (id,provider_id,user_id,identity_data,provider,created_at,updated_at) values ($1,$2,$1,jsonb_build_object('sub',$2::text,'email',$3::text,'email_verified',true,'phone_verified',false),'email',now(),now())`,[u.id,u.id,u.email]);
    const auth = accepted(await api(null, '/auth/v1/token?grant_type=password', { email: u.email, password: u.password }));
    assert.ok(auth.access_token, 'Real GoTrue password authentication'); u.token = auth.access_token;
  }
  console.log('Authenticated four disposable fixture users through hosted GoTrue');
  await pass('owner creates own cart and menu', async () => { cart = accepted(await rpc(owner,'save_cart',cartInput)); item = accepted(await rpc(owner,'save_menu_item',{...menuInput,p_cart_id:cart.id})); });
  await pass('second owner creates independent cart and menu', async () => { secondCart=accepted(await rpc(other,'save_cart',{...cartInput,p_name:`${run} second cart`})); secondItem=accepted(await rpc(other,'save_menu_item',{...menuInput,p_cart_id:secondCart.id})); });
  await pass('guest reads public carts and menu', async () => { for(const [table,id] of [['carts',cart.id],['menu_items',item.id]]) assert.equal(accepted(await api(null,`/rest/v1/${table}?id=eq.${id}`)).length,1); });
  await pass('guest mutations denied', async () => denied(await rpc(null,'save_cart',cartInput)));
  await pass('cross-owner menu creation/edit and presence denied', async () => { denied(await rpc(other,'save_menu_item',{...menuInput,p_cart_id:cart.id})); denied(await rpc(other,'save_menu_item',{...menuInput,p_cart_id:cart.id,p_item_id:item.id})); denied(await rpc(other,'set_cart_presence',{p_cart_id:cart.id,p_is_online:true,p_latitude:40.758,p_longitude:-73.9855})); });
  await pass('direct table insert/update/delete denied', async () => { for(const table of ['carts','menu_items','orders','order_items','sightings']) { denied(await api(owner,`/rest/v1/${table}`,{id:randomUUID()},'POST')); denied(await api(owner,`/rest/v1/${table}?id=eq.${randomUUID()}`,{id:randomUUID()},'PATCH')); denied(await api(owner,`/rest/v1/${table}?id=eq.${randomUUID()}`,null,'DELETE')); } });
  orderInput={p_cart_id:cart.id,p_items:[{menu_item_id:item.id,quantity:2}],p_pickup_name:'QA Customer',p_notes:'Disposable live integration test',p_idempotency_key:randomUUID()};
  await pass('offline cart rejects order', async () => denied(await rpc(customer,'place_order',orderInput)));
  await pass('invalid coordinates rejected', async () => denied(await rpc(owner,'set_cart_presence',{p_cart_id:cart.id,p_is_online:true,p_latitude:0,p_longitude:0})));
  await pass('owner explicitly publishes NYC presence', async () => { const row=accepted(await rpc(owner,'set_cart_presence',{p_cart_id:cart.id,p_is_online:true,p_latitude:40.758,p_longitude:-73.9855})); assert.equal(row.is_online,true); });
  await pass('invalid quantities and mixed-cart items rejected', async () => { for(const quantity of [0,-1,21,1.5]) denied(await rpc(customer,'place_order',{...orderInput,p_idempotency_key:randomUUID(),p_items:[{menu_item_id:item.id,quantity}]})); denied(await rpc(customer,'place_order',{...orderInput,p_idempotency_key:randomUUID(),p_items:[{menu_item_id:secondItem.id,quantity:1}]})); });
  await pass('server trusted price and unpaid status', async () => { order=accepted(await rpc(customer,'place_order',{...orderInput,p_items:[{menu_item_id:item.id,quantity:2,unit_price_cents:1}]})); assert.equal(order.total_cents,2198); assert.equal(order.payment_status,'unpaid'); });
  await pass('retry idempotency and concurrent duplicate submission', async () => { const payload={...orderInput,p_items:[{menu_item_id:item.id,quantity:2,unit_price_cents:1}]}; const repeats=await Promise.all([rpc(customer,'place_order',payload),rpc(customer,'place_order',payload)]); repeats.forEach(r=>assert.equal(accepted(r).id,order.id)); });
  await pass('concurrent first submissions create one order', async () => { const payload={...orderInput,p_idempotency_key:randomUUID()}; const repeats=await Promise.all([rpc(customer,'place_order',payload),rpc(customer,'place_order',payload)]); assert.equal(accepted(repeats[0]).id,accepted(repeats[1]).id); const rows=accepted(await api(customer,`/rest/v1/orders?idempotency_key=eq.${payload.p_idempotency_key}`)); assert.equal(rows.length,1); });
  await pass('idempotency key rejects changed payload', async () => denied(await rpc(customer,'place_order',{...orderInput,p_items:[{menu_item_id:item.id,quantity:3}]})));
  await pass('orders and items isolated to customer and relevant owner', async () => { for(const u of [owner,customer]) assert.equal(accepted(await api(u,`/rest/v1/orders?id=eq.${order.id}&select=*,order_items(*)`)).length,1); for(const u of [null,other,stranger]) { const r=await api(u,`/rest/v1/orders?id=eq.${order.id}`); assert.ok(!r.ok || r.data.length===0); const lines=await api(u,`/rest/v1/order_items?order_id=eq.${order.id}`); assert.ok(!lines.ok || lines.data.length===0); } });
  await pass('unauthorized transitions and state skips rejected', async () => { denied(await rpc(other,'transition_order',{p_order_id:order.id,p_status:'accepted'})); denied(await rpc(customer,'transition_order',{p_order_id:order.id,p_status:'accepted'})); denied(await rpc(owner,'transition_order',{p_order_id:order.id,p_status:'completed'})); });
  await pass('owner fulfills order through valid lifecycle', async () => { for(const status of ['accepted','preparing','ready','completed']) assert.equal(accepted(await rpc(owner,'transition_order',{p_order_id:order.id,p_status:status})).status,status); denied(await rpc(owner,'transition_order',{p_order_id:order.id,p_status:'accepted'})); });
  await pass('customer can cancel own pending order only', async () => { const row=accepted(await rpc(customer,'place_order',{...orderInput,p_idempotency_key:randomUUID()})); assert.equal(accepted(await rpc(customer,'transition_order',{p_order_id:row.id,p_status:'cancelled'})).status,'cancelled'); });
  await pass('unavailable items rejected', async () => { accepted(await rpc(owner,'save_menu_item',{...menuInput,p_cart_id:cart.id,p_item_id:item.id,p_is_available:false})); denied(await rpc(customer,'place_order',{...orderInput,p_idempotency_key:randomUUID()})); accepted(await rpc(owner,'save_menu_item',{...menuInput,p_cart_id:cart.id,p_item_id:item.id})); });
  await pass('stale online cart rejects order', async () => { await db.query("update public.carts set location_updated_at=now()-interval '16 minutes' where id=$1",[cart.id]); denied(await rpc(customer,'place_order',{...orderInput,p_idempotency_key:randomUUID()})); });
  await pass('signed-in community sighting remains separate from cart presence', async () => { const row=accepted(await rpc(customer,'submit_sighting',{p_name:`${run} reported cart`,p_address:'QA location',p_latitude:40.75,p_longitude:-73.99,p_notes:'Unverified disposable QA sighting'})); assert.equal(row.submitted_by,customer.id); assert.equal(accepted(await api(null,`/rest/v1/sightings?id=eq.${row.id}`)).length,1); const current=accepted(await api(null,`/rest/v1/carts?id=eq.${cart.id}`))[0]; assert.equal(current.latitude,40.758); });
  await pass('anonymous and invalid sightings denied', async () => { const payload={p_name:'QA',p_address:'QA',p_latitude:0,p_longitude:0,p_notes:''}; denied(await rpc(customer,'submit_sighting',payload)); denied(await rpc(null,'submit_sighting',{...payload,p_latitude:40.75,p_longitude:-73.99})); });
  await pass('sighting write rate limit enforced', async () => { const payload={p_name:`${run} rate test`,p_address:'QA test location',p_latitude:40.75,p_longitude:-73.99,p_notes:'Disposable QA fixture'}; for(let n=0;n<9;n++) accepted(await rpc(customer,'submit_sighting',payload)); denied(await rpc(customer,'submit_sighting',payload)); });
  await pass('order write rate limit enforced', async () => { accepted(await rpc(owner,'set_cart_presence',{p_cart_id:cart.id,p_is_online:true,p_latitude:40.758,p_longitude:-73.9855})); const {rows}=await db.query('select count(*)::int as count from public.orders where customer_id=$1',[customer.id]); for(let n=rows[0].count;n<10;n++) accepted(await rpc(customer,'place_order',{...orderInput,p_idempotency_key:randomUUID()})); denied(await rpc(customer,'place_order',{...orderInput,p_idempotency_key:randomUUID()})); });
  await pass('malformed access token cannot mutate', async () => denied(await rpc({token:'invalid-token'},'save_cart',cartInput)));
} catch (e) { results.push({label:'suite setup/execution',pass:false,reason:e.message}); console.error(`Suite error: ${e.message}`); }
finally {
  try {
    for(const u of users) if(u.token) await api(u,'/auth/v1/logout?scope=global',{},'POST');
    await db.query('delete from public.order_items where order_id in (select id from public.orders where customer_id=any($1::uuid[]))',[users.map(u=>u.id)]);
    await db.query('delete from public.orders where customer_id=any($1::uuid[])',[users.map(u=>u.id)]);
    await db.query('delete from public.sightings where submitted_by=any($1::uuid[])',[users.map(u=>u.id)]);
    await db.query('delete from public.menu_items where cart_id in (select id from public.carts where owner_id=any($1::uuid[]))',[users.map(u=>u.id)]);
    await db.query('delete from public.carts where owner_id=any($1::uuid[])',[users.map(u=>u.id)]);
    await db.query('delete from auth.users where id=any($1::uuid[])',[users.map(u=>u.id)]);
    console.log('Scoped fixture cleanup completed');
  } catch(e) {results.push({label:'fixture cleanup',pass:false,reason:e.message});console.error(`Cleanup failure: ${e.message}`);}
  await db.end();
  await writeFile(new URL('./live-backend-results.json',import.meta.url),JSON.stringify({run,at:new Date().toISOString(),project:'wbbnwbkpzoggffmvnqkh',results},null,2));
  console.log(`${results.filter(r=>r.pass).length}/${results.length} checks passed`);
  if(results.some(r=>!r.pass))process.exitCode=1;
}
