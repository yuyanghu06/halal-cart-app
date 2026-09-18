import assert from 'node:assert/strict';
import { loadEnvFile } from 'node:process';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

export async function hostedTransaction(run) {
  loadEnvFile(new URL('../.env',import.meta.url));
  assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,'wbbnwbkpzoggffmvnqkh.supabase.co');
  const db=new pg.Client({host:'aws-0-us-west-2.pooler.supabase.com',port:5432,user:'postgres.wbbnwbkpzoggffmvnqkh',database:'postgres',password:process.env.SUPABASE_PASSWORD,ssl:{rejectUnauthorized:true,ca:await readFile(new URL('./supabase-root-ca.crt',import.meta.url),'utf8')}});
  const results=[];
  let savepoint=0;
  async function asRole(role,uid,fn) {
    assert.ok(['authenticated','anon','service_role'].includes(role));
    await db.query(`set local role ${role}`);
    await db.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({role,...(uid?{sub:uid}:{})})]);
    let failure; try{return await fn();}catch(e){failure=e;throw e;}finally{try{await db.query('reset role');await db.query("select set_config('request.jwt.claims','{}',true)");}catch(e){if(!failure)throw e;}}
  }
  async function denied(fn,allowedCodes=['42501','P0001','23514','22023']) {
    const name=`denial_${++savepoint}`;
    await db.query(`savepoint ${name}`);
    let error;
    try {await fn();}catch(e) {error=e;}
    await db.query(`rollback to savepoint ${name}`);await db.query(`release savepoint ${name}`);
    assert.ok(error,'Expected operation to be rejected');
    assert.ok(allowedCodes.includes(error.code),`Unexpected rejection code ${error.code}`);
  }
  async function check(name,fn) {
    const point=`check_${++savepoint}`;await db.query(`savepoint ${point}`);
    try{await fn();await db.query(`release savepoint ${point}`);results.push({name,pass:true});console.log(`PASS ${name}`);}
    catch(e){await db.query(`rollback to savepoint ${point}`);await db.query(`release savepoint ${point}`);results.push({name,pass:false,reason:e.message});console.log(`FAIL ${name}: ${e.message}`);}
  }
  async function user() {
    const id=randomUUID();
    await db.query(`insert into auth.users(id,aud,role,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,is_anonymous,created_at,updated_at) values($1,'authenticated','authenticated',$2,now(),'{"provider":"google","providers":["google"]}','{}',false,now(),now())`,[id,`qa-transaction-${id}@example.invalid`]);
    return id;
  }
  await db.connect();
  try{await db.query('begin');await run({db,asRole,denied,check,user,results});}
  finally{await db.query('rollback');await db.end();console.log('All test fixtures and changes rolled back; no provider login or message send performed');}
  return results;
}
