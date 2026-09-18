import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(relative,{imports={},env={},fetchImpl=async()=>{throw Error('Unexpected network access in test');}}={}){
 const compiled=ts.transpileModule(readFileSync(new URL(`../supabase/functions/${relative}`,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 let handler;const exports={};vm.runInNewContext(compiled,{exports,require:key=>{assert.ok(key in imports,`Unexpected module ${key}`);return imports[key];},crypto:webcrypto,TextEncoder,Uint8Array,AbortSignal,Response,Request,URL,fetch:fetchImpl,Deno:{env:{get:name=>env[name]},serve:fn=>{handler=fn;}},console},{filename:relative});return {exports,get handler(){return handler;}};
}
const shared=load('_shared/whatsapp.ts').exports;
const config={token:'not-a-real-token',phoneId:'123',wabaId:'456',version:'v23.0',language:'en_US',templates:{created:'qa_created',ready:'qa_ready',cancelled:'qa_cancelled'}};
const appSecret='unit-test-signing-key-not-real';
const sign=body=>`sha256=${createHmac('sha256',appSecret).update(body).digest('hex')}`;
const fixture={object:'whatsapp_business_account',entry:[{id:'456',changes:[{field:'messages',value:{metadata:{phone_number_id:'123'},messages:[{id:'qa-inbound-1',from:'12025550123',text:{body:'VERIFY 0123456789abcdef0123456789abcdef'}}],statuses:[{id:'qa-message-1',status:'delivered',timestamp:'1789750000',biz_opaque_callback_data:'qa-outbox-id'}]}}]}]};
test('raw-body HMAC accepts authentic bytes and rejects altered/missing/malformed signatures',async()=>{
 const raw=JSON.stringify(fixture);assert.equal(await shared.signatureValid(raw,sign(raw),appSecret),true);
 for(const signature of [null,'',sign(raw)+'x','sha256=bad',sign(raw).toUpperCase()])assert.equal(await shared.signatureValid(raw,signature,appSecret),false);
 assert.equal(await shared.signatureValid(raw+' ',sign(raw),appSecret),false);assert.equal(await shared.signatureValid(raw,sign(raw),'different-secret'),false);assert.equal(await shared.signatureValid(raw,sign(raw),''),false);
});
test('webhook binds events to configured WABA and phone-number IDs',async()=>{
 const calls=[];const service=async(...args)=>calls.push(args);
 await shared.processWebhook(fixture,{phoneId:'999',wabaId:'456'},service);await shared.processWebhook(fixture,{phoneId:'123',wabaId:'999'},service);await shared.processWebhook({...fixture,object:'other'},config,service);assert.equal(calls.length,0);
 await shared.processWebhook(fixture,config,service);assert.equal(calls.length,2);assert.equal(calls[0][0],'inbound');assert.equal(calls[0][1].phone,'+12025550123');assert.equal(calls[0][1].message_id,'qa-inbound-1');assert.equal(calls[1][0],'status');
});
test('malformed sender, oversized command and invalid delivery status are ignored',async()=>{
 const payload=structuredClone(fixture);const value=payload.entry[0].changes[0].value;value.messages=[{id:'1',from:'not-phone',text:{body:'STOP'}},{id:'2',from:'12025550123',text:{body:'x'.repeat(101)}}];value.statuses=[{id:'1',status:'hacked',timestamp:'1'},{id:'2',status:'delivered',timestamp:'not-time'}];let count=0;await shared.processWebhook(payload,config,async()=>count++);assert.equal(count,0);
});
async function runDispatch(response,authorize=true,jobs=1){
 const calls=[],requests=[];let claimed=0;
 const service=async(action,data)=>{calls.push({action,data});if(action==='claim')return claimed++<jobs?{id:`job-${claimed}`,order_id:'abcdef12-3456-7890-abcd-123456789012',event:'ready'}:null;if(action==='authorize')return authorize?{phone:'+12025550123'}:null;return {};};
 const result=await shared.dispatch(service,config,async(url,options)=>{requests.push({url,options});if(response instanceof Error)throw response;return response();});return {calls,requests,result};
}
test('unverified or revoked recipient is never sent a message',async()=>{const r=await runDispatch(()=>{throw Error('must not send');},false);assert.equal(r.requests.length,0);assert.equal(r.result.processed,0);});
test('dispatch sends minimal approved template and records accepted, not delivered',async()=>{
 const r=await runDispatch(()=>Response.json({messages:[{id:'qa-provider-id'}]}));assert.equal(r.requests.length,1);assert.equal(r.requests[0].url,'https://graph.facebook.com/v23.0/123/messages');const body=JSON.parse(r.requests[0].options.body);assert.equal(body.to,'12025550123');assert.equal(body.template.name,'qa_ready');assert.equal(body.biz_opaque_callback_data,'job-1');assert.equal(body.template.components[0].parameters[0].text,'abcdef12');assert.equal(r.calls.at(-2).action,'finish');assert.equal(r.calls.at(-2).data.result,'accepted');assert.equal(r.calls.at(-2).data.message_id,'qa-provider-id');
});
test('only definitive throttling retries; 4xx fails and ambiguous responses stay unknown',async()=>{
 const cases=[[()=>Response.json({error:{code:4}},{status:429}),'retry'],[()=>Response.json({error:{code:100}},{status:400}),'failed'],[()=>Response.json({error:{}},{status:500}),'unknown'],[()=>Response.json({unexpected:true}),'unknown'],[()=>new Response('malformed'),'unknown'],[new Error('timeout'),'unknown'],[()=>Response.json({error:{},messages:[{}]},{status:429}),'unknown']];
 for(const [response,expected] of cases){const r=await runDispatch(response);assert.equal(r.calls.find(c=>c.action==='finish').data.result,expected);assert.equal(r.requests.length,1);}
});
test('worker batches at most three sends',async()=>{const r=await runDispatch(()=>Response.json({messages:[{id:'qa-id'}]}),true,20);assert.equal(r.requests.length,3);assert.equal(r.result.processed,3);});
function endpoint(name,extraEnv={},fetchImpl){
 const env={WHATSAPP_APP_SECRET:appSecret,WHATSAPP_VERIFY_TOKEN:'unit-verify-token',WHATSAPP_WORKER_SECRET:'unit-worker-secret',WHATSAPP_ACCESS_TOKEN:'not-real',WHATSAPP_PHONE_NUMBER_ID:'123',WHATSAPP_WABA_ID:'456',WHATSAPP_GRAPH_VERSION:'v23.0',WHATSAPP_TEMPLATE_LANGUAGE:'en_US',WHATSAPP_TEMPLATE_CREATED:'qa_created',WHATSAPP_TEMPLATE_READY:'qa_ready',WHATSAPP_TEMPLATE_CANCELLED:'qa_cancelled',SUPABASE_URL:'https://test.invalid',SUPABASE_SERVICE_ROLE_KEY:'not-real',...extraEnv};
 const runtime=load('_shared/runtime.ts',{env,fetchImpl}).exports;
 return load(`${name}/index.ts`,{env,fetchImpl,imports:{'../_shared/whatsapp.ts':shared,'../_shared/runtime.ts':runtime}}).handler;
}
test('webhook verification challenge requires exact token and numeric challenge',async()=>{
 const handler=endpoint('whatsapp-webhook');const base='https://example.invalid/?hub.mode=subscribe&hub.challenge=123';
 assert.equal((await handler(new Request(base+'&hub.verify_token=wrong'))).status,403);
 const good=await handler(new Request(base+'&hub.verify_token=unit-verify-token'));assert.equal(good.status,200);assert.equal(await good.text(),'123');
 assert.equal((await handler(new Request('https://example.invalid/?hub.mode=subscribe&hub.challenge=%3Cscript%3E&hub.verify_token=unit-verify-token'))).status,400);
});
test('webhook rejects unsigned, oversized and unsupported requests before service access',async()=>{
 const handler=endpoint('whatsapp-webhook');assert.equal((await handler(new Request('https://example.invalid',{method:'POST',body:'{}'}))).status,401);assert.equal((await handler(new Request('https://example.invalid',{method:'POST',headers:{'content-length':'262145'},body:'{}'}))).status,413);assert.equal((await handler(new Request('https://example.invalid',{method:'PUT'}))).status,405);
});
test('signed configured webhook routes events and tolerates duplicate deliveries at service boundary',async()=>{
 const requests=[];const handler=endpoint('whatsapp-webhook',{},async(url,options)=>{requests.push(JSON.parse(options.body));return Response.json({});});const raw=JSON.stringify(fixture);
 for(let n=0;n<2;n++)assert.equal((await handler(new Request('https://example.invalid',{method:'POST',headers:{'x-hub-signature-256':sign(raw)},body:raw}))).status,200);
 assert.equal(requests.length,4);assert.equal(requests[0].p_data.message_id,requests[2].p_data.message_id);
});
test('worker requires custom secret and full configuration',async()=>{
 const handler=endpoint('whatsapp-worker');assert.equal((await handler(new Request('https://example.invalid',{method:'POST'}))).status,401);assert.equal((await handler(new Request('https://example.invalid'))).status,405);
 const missing=endpoint('whatsapp-worker',{WHATSAPP_ACCESS_TOKEN:''});assert.equal((await missing(new Request('https://example.invalid',{method:'POST',headers:{'x-worker-secret':'unit-worker-secret'}}))).status,503);
});
