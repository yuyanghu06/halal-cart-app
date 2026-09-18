import assert from 'node:assert/strict';
import {loadEnvFile} from 'node:process';
loadEnvFile(new URL('../.env',import.meta.url));
const base=process.env.NEXT_PUBLIC_SUPABASE_URL;
assert.equal(new URL(base).hostname,'wbbnwbkpzoggffmvnqkh.supabase.co');
let passed=0;
for(const [path,options,status] of [
 ['whatsapp-worker',{method:'POST'},401],
 ['whatsapp-worker',{method:'POST',headers:{'x-worker-secret':'invalid-test-secret'}},401],
 ['whatsapp-worker',{method:'GET'},405],
 ['whatsapp-webhook',{method:'POST',body:'{}'},401],
 ['whatsapp-webhook',{method:'PUT'},405],
 ['whatsapp-webhook?hub.mode=subscribe&hub.verify_token=invalid-test-token&hub.challenge=123',{},403],
]){const r=await fetch(`${base}/functions/v1/${path}`,options);assert.equal(r.status,status,path);passed++;}
const available=await fetch(`${base}/rest/v1/rpc/whatsapp_availability`,{method:'POST',headers:{apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,'content-type':'application/json'},body:'{}'});assert.equal(available.status,200);assert.deepEqual(await available.json(),{enabled:false,business_number:null});passed++;
console.log(`${passed}/7 hosted endpoint/config checks passed; no outbound transport or valid signature used`);
