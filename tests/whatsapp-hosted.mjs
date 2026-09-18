import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { hostedTransaction } from './hosted-transaction.mjs';

const phone='+12025550123',otherPhone='+12025550124'; // Reserved fictional NANP test numbers; never sent.
const results=await hostedTransaction(async ({db,asRole,denied,check,user})=>{
 const owner=await user(),customer=await user(),stranger=await user();
 const auth=(id,fn)=>asRole('authenticated',id,fn);
 const one=async(sql,args=[]) => (await db.query(sql,args)).rows[0].value;
 const service=(action,data={})=>asRole('service_role',null,()=>one('select public.whatsapp_service($1,$2::jsonb) as value',[action,JSON.stringify(data)]));
 const inbound=(target,text,id=randomUUID())=>service('inbound',{phone:target,text,message_id:id,timestamp:String(Math.floor(Date.now()/1000))});
 const cart=await auth(owner,()=>one("select public.save_cart('QA WHATSAPP TEST — NOT REAL','Rollback-only automated fixture','Halal','QA coordinates') as value"));
 const item=await auth(owner,()=>one("select public.save_menu_item($1,'QA test item','Not for sale',1099,'Platters',true,0,null) as value",[cart.id]));
 await auth(owner,()=>one('select public.set_cart_presence($1,true,40.758,-73.9855) as value',[cart.id]));
 const items=JSON.stringify([{menu_item_id:item.id,quantity:1}]);
 const makeOrder=(id=customer,key=randomUUID(),target=phone,version='2026-09-18')=>auth(id,()=>one("select public.place_order_with_whatsapp($1,$2::jsonb,'QA pickup','Rollback-only fixture',$3,$4,$5) as value",[cart.id,items,key,target,version]));
 let order,code,claim,reconsented;
 const stopMessageId=randomUUID();
 const retryKey=randomUUID();
 await check('plain pickup order does not create notification consent or outbox',async()=>{
  const plain=await auth(customer,()=>one("select public.place_order($1,$2::jsonb,'QA pickup','No WhatsApp',$3) as value",[cart.id,items,randomUUID()]));
  assert.equal(await one('select count(*)::int as value from private.whatsapp_consent where order_id=$1',[plain.id]),0);
  assert.equal(await one('select count(*)::int as value from private.whatsapp_outbox where order_id=$1',[plain.id]),0);
 });
 await check('disabled WhatsApp rejects opt-in order without creating it',async()=>{
  await db.query('update private.whatsapp_config set enabled=false');
  const before=await one('select count(*)::int as value from public.orders');
  await denied(()=>makeOrder());assert.equal(await one('select count(*)::int as value from public.orders'),before);
 });
 await db.query("update private.whatsapp_config set enabled=true,business_number='12025550199'");
 await check('invalid phone and missing or stale consent are rejected',async()=>{
  for(const value of ['',null,'2025550123','+02025550123','+1202notaphone'])await denied(()=>makeOrder(customer,randomUUID(),value));
  for(const version of [null,'','outdated'])await denied(()=>makeOrder(customer,randomUUID(),phone,version));
 });
 await check('opt-in stores phone privately and returns an activation challenge',async()=>{
  order=await makeOrder(customer,retryKey);code=order.whatsapp.activation_code;
  assert.ok(/^[0-9a-f]{32}$/.test(code),'Challenge format');
  const row=(await db.query('select phone,token_hash,verified_at from private.whatsapp_consent where order_id=$1',[order.id])).rows[0];
  assert.equal(row.phone,phone);assert.ok(row.token_hash!==code);assert.equal(row.verified_at,null);
  const publicRow=await auth(owner,()=>one('select row_to_json(o) as value from public.orders o where id=$1',[order.id]));
  assert.ok(!JSON.stringify(publicRow).includes(phone),'No phone in owner order data');assert.ok(!JSON.stringify(publicRow).includes(code),'No challenge in owner order data');
 });
 await check('committed notification retry succeeds while feature off without minting a challenge',async()=>{
  const before=await one('select count(*)::int as value from public.orders');
  const tokenHash=await one('select token_hash as value from private.whatsapp_consent where order_id=$1',[order.id]);
  await db.query('update private.whatsapp_config set enabled=false');const retry=await makeOrder(customer,retryKey);assert.equal(retry.id,order.id);assert.ok(!retry.whatsapp?.activation_code,'Disabled feature does not mint challenge');assert.equal(await one('select count(*)::int as value from public.orders'),before);assert.equal(await one('select token_hash as value from private.whatsapp_consent where order_id=$1',[order.id]),tokenHash);await db.query('update private.whatsapp_config set enabled=true');
 });
 await check('private consent and outbox denied to guests, owner, customer and stranger',async()=>{
  for(const role of [['anon',null],['authenticated',owner],['authenticated',customer],['authenticated',stranger]])for(const table of ['whatsapp_consent','whatsapp_outbox','whatsapp_suppression'])await denied(()=>asRole(role[0],role[1],()=>db.query(`select * from private.${table}`)),['42501']);
  assert.equal(await auth(stranger,()=>one('select count(*)::int as value from public.orders where id=$1',[order.id])),0);
  await denied(()=>asRole('anon',null,()=>db.query('select * from public.orders where id=$1',[order.id])),['42501']);
 });
 await check('service mutation API denied to anon and authenticated identities',async()=>{
  for(const [role,id] of [['anon',null],['authenticated',owner],['authenticated',customer]])await denied(()=>asRole(role,id,()=>db.query("select public.whatsapp_service('claim','{}')")),['42501']);
 });
 await check('notification retry is unique and different phone rejected',async()=>{
  const retry=await makeOrder(customer,retryKey);assert.equal(retry.id,order.id);assert.ok(retry.whatsapp.activation_code!==code,'Old challenge invalidated');
  await inbound(phone,`VERIFY ${code}`);assert.equal(await one('select verified_at is null as value from private.whatsapp_consent where order_id=$1',[order.id]),true);
  code=retry.whatsapp.activation_code;await denied(()=>makeOrder(customer,retryKey,otherPhone));
  assert.equal(await one('select count(*)::int as value from private.whatsapp_outbox where order_id=$1 and event=\'created\'',[order.id]),1);
 });
 await check('unverified consent cannot be claimed or authorized for sending',async()=>{assert.equal(await service('claim'),null);});
 await check('verification renewal is customer-only and invalidates prior challenge',async()=>{
  for(const id of [owner,stranger])await denied(()=>auth(id,()=>one('select public.renew_whatsapp_verification($1) as value',[order.id])));
  const renewal=await auth(customer,()=>one('select public.renew_whatsapp_verification($1) as value',[order.id]));assert.ok(renewal.activation_code!==code);
  await inbound(phone,`VERIFY ${code}`);assert.equal(await one('select verified_at is null as value from private.whatsapp_consent where order_id=$1',[order.id]),true);code=renewal.activation_code;
 });
 await check('wrong sender cannot activate another phone challenge',async()=>{await inbound(otherPhone,`VERIFY ${code}`);assert.equal(await one('select verified_at is null as value from private.whatsapp_consent where order_id=$1',[order.id]),true);});
 await check('expired activation challenge rejected',async()=>{
  await db.query("update private.whatsapp_consent set token_expires_at=now()-interval '1 minute' where order_id=$1",[order.id]);
  await inbound(phone,`VERIFY ${code}`);assert.equal(await one('select verified_at is null as value from private.whatsapp_consent where order_id=$1',[order.id]),true);
  await db.query("update private.whatsapp_consent set token_expires_at=now()+interval '30 minutes' where order_id=$1",[order.id]);
 });
 await check('exact sender activates consent once and invalidates the challenge',async()=>{
  await inbound(phone,`VERIFY ${code}`);const before=await one('select verified_at::text as value from private.whatsapp_consent where order_id=$1',[order.id]);assert.ok(before);
  await inbound(phone,`VERIFY ${code}`);assert.equal(await one('select verified_at::text as value from private.whatsapp_consent where order_id=$1',[order.id]),before);
  assert.equal(await one('select token_hash is null as value from private.whatsapp_consent where order_id=$1',[order.id]),true);
 });
 await check('worker claim is exclusive and reveals phone only at authorized send',async()=>{
  claim=await service('claim');assert.equal(claim.order_id,order.id);assert.ok(!('phone' in claim));assert.equal(await service('claim'),null);assert.equal((await service('authorize',{id:claim.id})).phone,phone);
 });
 await check('ambiguous send outcome cannot be blindly reclaimed',async()=>{
  await service('finish',{id:claim.id,result:'unknown'});assert.equal(await service('claim'),null);
  assert.equal(await one('select state as value from private.whatsapp_outbox where id=$1',[claim.id]),'unknown');
 });
 await check('status callback resolves uncertain send and is monotonic/idempotent',async()=>{
  const messageId=`qa-${randomUUID()}`,timestamp=String(Math.floor(Date.now()/1000));
  await service('status',{opaque_id:claim.id,message_id:messageId,status:'delivered',timestamp});
  await service('status',{opaque_id:claim.id,message_id:messageId,status:'delivered',timestamp});
  await service('status',{message_id:messageId,status:'sent',timestamp});
  assert.equal(await one('select state as value from private.whatsapp_outbox where id=$1',[claim.id]),'delivered');
  await service('status',{message_id:messageId,status:'read',timestamp});assert.equal(await one('select state as value from private.whatsapp_outbox where id=$1',[claim.id]),'read');
 });
 await check('ready event enqueued once through valid owner transitions',async()=>{
  for(const status of ['accepted','preparing','ready','ready'])await auth(owner,()=>one('select public.transition_order($1,$2) as value',[order.id,status]));
  assert.equal(await one("select count(*)::int as value from private.whatsapp_outbox where order_id=$1 and event='ready'",[order.id]),1);
 });
 await check('definitive retry backoff is bounded to four attempts',async()=>{
  let queued;
  for(let n=1;n<=4;n++){
   queued=await service('claim');assert.ok(queued,'Eligible ready notification');await service('finish',{id:queued.id,result:'retry'});
   const state=await one('select state as value from private.whatsapp_outbox where id=$1',[queued.id]);assert.equal(state,n<4?'queued':'failed');
   assert.equal(await service('claim'),null);
   await db.query("update private.whatsapp_outbox set next_attempt_at=now()-interval '1 second' where id=$1",[queued.id]);
  }
  assert.equal(await service('claim'),null);
 });
 await check('authorize suppresses claimed event after order state changes',async()=>{
  const fresh=await makeOrder();await inbound(phone,`VERIFY ${fresh.whatsapp.activation_code}`);const job=await service('claim');assert.equal(job.order_id,fresh.id);
  await auth(customer,()=>one('select public.transition_order($1,$2) as value',[fresh.id,'cancelled']));
  assert.equal(await service('authorize',{id:job.id}),null);
  assert.equal(await one("select state as value from private.whatsapp_outbox where id=$1",[job.id]),'suppressed');
  assert.equal(await one("select count(*)::int as value from private.whatsapp_outbox where order_id=$1 and event='cancelled'",[fresh.id]),1);
  const cancel=await service('claim');assert.equal(cancel.event,'cancelled');await service('finish',{id:cancel.id,result:'accepted',message_id:`qa-${randomUUID()}`});
 });
 await check('authorize suppresses in-flight notification after consent withdrawal',async()=>{
  const fresh=await makeOrder();await inbound(phone,`VERIFY ${fresh.whatsapp.activation_code}`);const job=await service('claim');assert.equal(job.order_id,fresh.id);
  await auth(customer,()=>db.query('select public.withdraw_whatsapp($1)',[fresh.id]));assert.equal(await service('authorize',{id:job.id}),null);
 });
 await check('STOP withdraws consent and suppresses other pending order notifications',async()=>{
  const another=await makeOrder();await inbound(phone,`VERIFY ${another.whatsapp.activation_code}`);
  await inbound(phone,'STOP',stopMessageId);assert.equal(await one('select count(*)::int as value from private.whatsapp_consent where phone=$1 and withdrawn_at is null',[phone]),0);
  assert.equal(await service('claim'),null);assert.equal(await one("select count(*)::int as value from private.whatsapp_outbox q join private.whatsapp_consent c on c.order_id=q.order_id where c.phone=$1 and q.state='queued'",[phone]),0);
 });
 await check('late activation replay cannot undo STOP',async()=>{await inbound(phone,`VERIFY ${code}`);assert.equal(await one('select count(*)::int as value from private.whatsapp_suppression where phone=$1',[phone]),1);assert.equal(await service('claim'),null);});
 await check('duplicate old STOP cannot revoke a subsequently verified opt-in',async()=>{
  // Production requests have separate transactions; model their ordering in this rollback-only transaction.
  await db.query("update private.whatsapp_suppression set stopped_at=now()-interval '1 second' where phone=$1",[phone]);
  reconsented=await makeOrder();await inbound(phone,`VERIFY ${reconsented.whatsapp.activation_code}`);await inbound(phone,'STOP',stopMessageId);
  assert.equal(await one('select withdrawn_at is null and verified_at is not null as value from private.whatsapp_consent where order_id=$1',[reconsented.id]),true);
 });
 await check('only the customer may inspect or withdraw their notification consent',async()=>{
  assert.equal(await auth(customer,()=>one('select public.whatsapp_order_state($1) as value',[reconsented.id])),'active');
  assert.equal((await auth(customer,()=>one('select public.whatsapp_order_states($1::uuid[]) as value',[[reconsented.id,randomUUID()]])))[reconsented.id],'active');
  for(const id of [owner,stranger]){assert.equal(await auth(id,()=>one('select public.whatsapp_order_state($1) as value',[reconsented.id])),null);await denied(()=>auth(id,()=>db.query('select public.withdraw_whatsapp($1)',[reconsented.id])),['42501']);}
  for(const id of [owner,stranger])assert.deepEqual(await auth(id,()=>one('select public.whatsapp_order_states($1::uuid[]) as value',[[reconsented.id]])),{});
  await auth(customer,()=>db.query('select public.withdraw_whatsapp($1)',[reconsented.id]));assert.equal(await auth(customer,()=>one('select public.whatsapp_order_state($1) as value',[reconsented.id])),'stopped');assert.equal(await service('claim'),null);
  await denied(()=>auth(customer,()=>one('select public.renew_whatsapp_verification($1) as value',[reconsented.id])));
 });
 await check('stale sending lease becomes unknown, not queued',async()=>{
  await db.query("update private.whatsapp_outbox set state='sending',claimed_at=now()-interval '6 minutes' where id=$1",[claim.id]);await service('cleanup');assert.equal(await one('select state as value from private.whatsapp_outbox where id=$1',[claim.id]),'unknown');
 });
});
await writeFile(new URL('./whatsapp-hosted-results.json',import.meta.url),JSON.stringify({at:new Date().toISOString(),project:'wbbnwbkpzoggffmvnqkh',mode:'Hosted transaction with database roles and synthetic claims; all fixtures rolled back; no real Auth login or message send',results},null,2));
console.log(`${results.filter(r=>r.pass).length}/${results.length} hosted WhatsApp checks passed`);
if(results.some(r=>!r.pass))process.exitCode=1;
