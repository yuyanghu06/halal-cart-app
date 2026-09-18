import assert from 'node:assert/strict';
import { loadEnvFile } from 'node:process';
import { writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
loadEnvFile(new URL('../.env',import.meta.url));
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
assert.equal(new URL(url).hostname,'wbbnwbkpzoggffmvnqkh.supabase.co');
const headers={apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json'};
const settingsResponse=await fetch(`${url}/auth/v1/settings`,{headers});
assert.ok(settingsResponse.ok,'Hosted public Auth settings available');
const settings=await settingsResponse.json();
const results=[];
const record=(name,pass)=>{results.push({name,pass});console.log(`${pass?'PASS':'FAIL'} ${name}`);};
record('Email sign-in disabled',settings.external?.email===false);
const enabled=Object.entries(settings.external||{}).filter(([,value])=>value===true).map(([name])=>name);
record('Only Google or Apple providers enabled',enabled.every(name=>['google','apple'].includes(name)));
if(process.argv.includes('--require-google'))record('Google sign-in enabled',settings.external?.google===true);
if(settings.external?.email===false) {
 const response=await fetch(`${url}/auth/v1/token?grant_type=password`,{method:'POST',headers,body:JSON.stringify({email:'oauth-only-negative-test@example.com',password:randomBytes(20).toString('base64url')})});
 const body=await response.json();record('Hosted password endpoint rejects Email provider',!response.ok&&/email.*disabled|disabled.*email|email_provider_disabled/i.test(`${body.error_code||''} ${body.msg||''} ${body.error_description||''}`));
}
for(const table of ['carts','menu_items','sightings']) {const response=await fetch(`${url}/rest/v1/${table}?select=id&limit=1`,{headers});record(`Account-free ${table} read`,response.ok);}
const report={at:new Date().toISOString(),project:'wbbnwbkpzoggffmvnqkh',providers:{email:settings.external?.email===true,google:settings.external?.google===true,apple:settings.external?.apple===true},results,limitations:'Provider settings and API denial checks do not prove a completed OAuth round trip.'};
await writeFile(new URL('./oauth-hosted-results.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify({providers:report.providers,passed:results.filter(r=>r.pass).length,total:results.length}));
if(results.some(r=>!r.pass))process.exitCode=1;
