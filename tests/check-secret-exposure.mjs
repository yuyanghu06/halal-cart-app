import { readFile, readdir } from 'node:fs/promises';
import { loadEnvFile } from 'node:process';
import path from 'node:path';
import assert from 'node:assert/strict';
loadEnvFile(new URL('../.env',import.meta.url));
const root=path.resolve(new URL('..',import.meta.url).pathname);
const credentials=Object.entries(process.env).filter(([name,value])=>name==='SUPABASE_PASSWORD'&&value).map(([name,value])=>({name,value}));
for(const file of ['.env.browser-qa','.env.human-testing'])try { for(const user of JSON.parse(await readFile(path.join(root,'tests',file),'utf8'))) credentials.push({name:`fixture ${user.role} password`,value:user.password}); } catch(e) { if(e.code!=='ENOENT')throw e; }
const forbiddenNames=['SUPABASE_SERVICE_ROLE_KEY','SUPABASE_SECRET_KEY','SUPABASE_ACCESS_TOKEN'];
for(const name of forbiddenNames)if(process.env[name])credentials.push({name,value:process.env[name]});
assert.ok(credentials.length,'At least one non-public credential loaded for comparison');
const skip=new Set(['node_modules','.git','.agents','.codex','.vercel']);
let scanned=0, bundles=0;
const failures=[];
async function walk(dir) {
 for(const entry of await readdir(dir,{withFileTypes:true})) {
  if(skip.has(entry.name)||entry.name==='.env'||entry.name.startsWith('.env.')&&entry.name!=='.env.example')continue;
  const full=path.join(dir,entry.name),relative=path.relative(root,full);
  if(entry.isDirectory()) {
   if(entry.name==='.next'){try{await walk(path.join(full,'static'));}catch(e){if(e.code!=='ENOENT')throw e;}}else await walk(full);
  } else {
   const bytes=await readFile(full);scanned++;if(relative.startsWith('.next/static/'))bundles++;
   for(const {name,value} of credentials)for(const variant of new Set([value,encodeURIComponent(value),Buffer.from(value).toString('base64')]))if(bytes.includes(Buffer.from(variant)))failures.push({file:relative,credential:name});
  }
 }
}
await walk(root);
console.log(JSON.stringify({scannedFiles:scanned,productionStaticFiles:bundles,credentialComparisons:credentials.length,leaks:failures},null,2));
if(failures.length)process.exitCode=1;
if(process.argv.includes('--require-bundle')&&!bundles){console.error('No production static bundle found');process.exitCode=1;}
