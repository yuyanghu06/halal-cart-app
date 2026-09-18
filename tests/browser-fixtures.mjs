import { randomUUID, randomBytes } from 'node:crypto';
import { loadEnvFile } from 'node:process';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import assert from 'node:assert/strict';
import pg from 'pg';
loadEnvFile(new URL('../.env',import.meta.url));
assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,'wbbnwbkpzoggffmvnqkh.supabase.co');
const file=new URL(process.argv.includes('--cleanup-human')?'./.env.human-testing':'./.env.browser-qa',import.meta.url);
const db=new pg.Client({host:'aws-0-us-west-2.pooler.supabase.com',port:5432,user:'postgres.wbbnwbkpzoggffmvnqkh',database:'postgres',password:process.env.SUPABASE_PASSWORD,ssl:{rejectUnauthorized:true,ca:await readFile(new URL('./supabase-root-ca.crt',import.meta.url),'utf8')}});
await db.connect();
try {
 if(process.argv.includes('--cleanup')||process.argv.includes('--cleanup-human')||process.argv.includes('--handoff')) {
  const users=JSON.parse(await readFile(file,'utf8')); const ids=users.map(u=>u.id);
  await db.query('delete from public.order_items where order_id in (select id from public.orders where customer_id=any($1::uuid[]))',[ids]);
  await db.query('delete from public.orders where customer_id=any($1::uuid[])',[ids]);
  await db.query('delete from public.sightings where submitted_by=any($1::uuid[])',[ids]);
  await db.query('delete from public.menu_items where cart_id in (select id from public.carts where owner_id=any($1::uuid[]))',[ids]);
  await db.query('delete from public.carts where owner_id=any($1::uuid[])',[ids]);
  await db.query('delete from auth.sessions where user_id=any($1::uuid[])',[ids]);
  if(process.argv.includes('--handoff')) {
   await writeFile(new URL('./.env.human-testing',import.meta.url),JSON.stringify(users,null,2),{mode:0o600});
   await unlink(file);console.log('Public fixture data and sessions removed; two disposable human-testing accounts retained in ignored restricted file');
  } else {
   await db.query('delete from auth.users where id=any($1::uuid[])',[ids]);
   await unlink(file); console.log('Browser fixtures removed by exact IDs');
  }
 } else {
  try {await readFile(file); throw new Error('Existing browser fixtures must be cleaned before another run');}catch(e){if(e.code!=='ENOENT')throw e;}
  const run=`qa-browser-${Date.now()}`;
  const users=['owner','customer'].map(role=>({role,id:randomUUID(),email:`${run}-${role}@example.com`,password:randomBytes(24).toString('base64url')}));
  await writeFile(file,JSON.stringify(users),{mode:0o600});
  for(const u of users) {
   await db.query(`insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change,email_change_token_current,phone_change,phone_change_token,reauthentication_token,is_sso_user,is_anonymous) values ('00000000-0000-0000-0000-000000000000',$1,'authenticated','authenticated',$2,extensions.crypt($3,extensions.gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,now(),now(),'','','','','','','','',false,false)`,[u.id,u.email,u.password]);
   await db.query(`insert into auth.identities (id,provider_id,user_id,identity_data,provider,created_at,updated_at) values ($1,$2,$1,jsonb_build_object('sub',$2::text,'email',$3::text,'email_verified',true,'phone_verified',false),'email',now(),now())`,[u.id,u.id,u.email]);
  }
  console.log('Two disposable browser Auth fixtures created; credentials stored only in ignored restricted file');
 }
} finally {await db.end();}
