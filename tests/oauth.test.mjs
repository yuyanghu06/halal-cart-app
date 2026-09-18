import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source=readFileSync(new URL('../lib/oauth.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function setup({href='https://halal-cart-app.vercel.app/',stored,providers={google:true,apple:false},exchangeError=false,storageDenied=false,authUrl='https://wbbnwbkpzoggffmvnqkh.supabase.co/auth/v1/authorize?provider=google'}={}) {
 const memory=new Map(stored?Object.entries(stored):[]);
 const calls={exchanges:[],starts:[],assignments:[],replacements:[],events:[]};
 const storage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>{if(storageDenied)throw Error('storage blocked');memory.set(key,value);},removeItem:key=>memory.delete(key)};
 const location={href,origin:new URL(href).origin,search:new URL(href).search,assign:url=>calls.assignments.push(url)};
 const auth={exchangeCodeForSession:async code=>{calls.exchanges.push(code);return exchangeError?{data:{session:null},error:Error('invalid exchange')}:{data:{session:{user:{id:'test'}}},error:null};},signInWithOAuth:async options=>{calls.starts.push(options);return {data:{url:authUrl},error:null};}};
 const exports={};
 const context={exports,require:name=>{assert.equal(name,'./supabase');return {db:()=>({auth})};},URL,URLSearchParams,Date,Set,Error,Promise,AbortController,process:{env:{NEXT_PUBLIC_SUPABASE_URL:'https://wbbnwbkpzoggffmvnqkh.supabase.co',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'test-public-key'}},sessionStorage:storage,localStorage:storage,fetch:async()=>({ok:true,json:async()=>({external:providers})}),window:{location,history:{replaceState:(_state,_title,url)=>{calls.replacements.push(url);location.href=new URL(url,href).href;}},dispatchEvent:event=>calls.events.push(event.type)},PopStateEvent:class {constructor(type){this.type=type;}}};
 vm.runInNewContext(compiled,context,{filename:'lib/oauth.ts'});
 return {oauth:exports,calls,memory,context};
}
const returnKey='halal-cart-oauth-return';
const cart='a1111111-2222-3333-4444-555555555555';
test('return intent accepts only known app fields, never arbitrary URLs',()=>{
 const {oauth}=setup();
 assert.equal(oauth.safeReturnPath({view:'owner'}),'/?view=owner');
 assert.equal(oauth.safeReturnPath({view:'discover',cart}),`/?cart=${cart}`);
 assert.equal(oauth.safeReturnPath({view:'orders',cart}),'/?view=orders');
 for(const value of [null,'https://evil.example',{}, {view:'//evil.example',cart:'../secret'}, {next:'https://evil.example'}, {view:'javascript:alert(1)'}])assert.equal(oauth.safeReturnPath(value),'/');
});
test('PKCE callback exchanges one time, strips code, consumes safe return',async()=>{
 const {oauth,calls,memory}=setup({href:'https://halal-cart-app.vercel.app/auth/callback?code=qa-code',stored:{[returnKey]:JSON.stringify({view:'owner',at:Date.now()})}});
 const a=oauth.completeOAuthCallback(),b=oauth.completeOAuthCallback();
 assert.equal(a,b);assert.equal(await a,null);assert.equal(calls.exchanges.length,1);assert.equal(calls.replacements[0],'/?view=owner');assert.equal(memory.has(returnKey),false);
});
test('provider cancellation is scrubbed and never exchanges a code',async()=>{
 for(const suffix of ['?error=access_denied&error_description=private-provider-text','#error=access_denied&error_description=private-provider-text']) {
  const {oauth,calls}=setup({href:`https://halal-cart-app.vercel.app/auth/callback${suffix}`});
  const error=await oauth.completeOAuthCallback();assert.match(error,/cancelled/);assert.ok(!error.includes('private-provider-text'));assert.equal(calls.exchanges.length,0);assert.equal(calls.replacements[0],'/');
 }
});
test('missing, invalid and stale callback context fails safely',async()=>{
 const missing=setup({href:'https://halal-cart-app.vercel.app/auth/callback'});assert.match(await missing.oauth.completeOAuthCallback(),/incomplete or expired/);
 const invalid=setup({href:'https://halal-cart-app.vercel.app/auth/callback?code=bad',exchangeError:true});assert.match(await invalid.oauth.completeOAuthCallback(),/same browser and tab/);
 for(const at of [Date.now()-3600001,Date.now()+120000,'yesterday']) {
  const s=setup({href:'https://halal-cart-app.vercel.app/auth/callback?code=qa',stored:{[returnKey]:JSON.stringify({view:'owner',at})}});await s.oauth.completeOAuthCallback();assert.equal(s.calls.replacements[0],'/');
 }
});
test('normal browsing never consumes an auth intent or exchanges',async()=>{
 const {oauth,calls,memory}=setup({stored:{[returnKey]:'preserve'}});assert.equal(await oauth.completeOAuthCallback(),null);assert.equal(calls.exchanges.length,0);assert.equal(memory.get(returnKey),'preserve');
});
test('disabled provider and unavailable storage prevent redirect',async()=>{
 const disabled=setup();await assert.rejects(disabled.oauth.startOAuth('apple'),/not available yet/);assert.equal(disabled.calls.starts.length,0);
 const blocked=setup({storageDenied:true});await assert.rejects(blocked.oauth.startOAuth('google'),/Enable browser storage/);assert.equal(blocked.calls.starts.length,0);
});
test('Google start stores app intent and asks only identity scopes',async()=>{
 const {oauth,calls,memory}=setup({href:`https://halal-cart-app.vercel.app/?cart=${cart}`});await oauth.startOAuth('google');assert.equal(calls.starts.length,1);assert.equal(calls.starts[0].options.redirectTo,'https://halal-cart-app.vercel.app/auth/callback');assert.equal(calls.starts[0].options.scopes,'openid email profile');assert.equal(calls.starts[0].options.skipBrowserRedirect,true);assert.equal(JSON.parse(memory.get(returnKey)).cart,cart);assert.equal(calls.assignments.length,1);
});
test('untrusted OAuth authorize destination is rejected before navigation',async()=>{
 for(const authUrl of ['https://evil.example/auth/v1/authorize','https://wbbnwbkpzoggffmvnqkh.supabase.co/not-authorize']) {const {oauth,calls}=setup({authUrl});await assert.rejects(oauth.startOAuth('google'),/destination could not be verified/);assert.equal(calls.assignments.length,0);}
});
