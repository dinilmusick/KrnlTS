import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const allowed = new Set(['SYSTEM_DATABASE_URL','SYSTEM_DATABASE_URL_2','SYSTEM_DATABASE_URL_3','APP_URL']);
const forbidden = ['FOD_BASE_URL','AIKO_API_URL','AIKO_MODULE_TOKEN'];
const files = ['server.ts'];
async function collect(directory) {
  for (const entry of await readdir(directory,{withFileTypes:true})) {
    const path=join(directory,entry.name);
    if(entry.isDirectory()) await collect(path);
    else if(/\.(ts|tsx|js|mjs|cjs)$/.test(entry.name)) files.push(path);
  }
}
await collect('src/backend');
for(const path of new Set(files)){
  const source=await readFile(path,'utf8');
  for(const name of forbidden) assert.ok(!source.includes(name), path+' retains removed configuration: '+name);
  for(const match of source.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)) assert.ok(allowed.has(match[1]), path+' reads forbidden environment variable: '+match[1]);
  assert.doesNotMatch(source,/process\.env\s*\[/,path+' uses dynamic environment access.');
}
const envExample=await readFile('.env.example','utf8');
const declared=envExample.split(/\r?\n/).map(line=>line.match(/^([A-Z][A-Z0-9_]*)=/)?.[1]).filter(Boolean);
assert.deepEqual(new Set(declared),allowed);
for(const path of ['.env.example','wrangler.toml','package.json','scripts/skipo-build.cjs']){
  const source=await readFile(path,'utf8');
  for(const name of forbidden) assert.ok(!source.includes(name),path+' retains removed configuration: '+name);
}
const config=await readFile('wrangler.toml','utf8');
assert.match(config,/^main = "api\/index\.js"$/m);
assert.match(config,/^command = "npm run build"$/m);
const varsSection = config.match(/\[vars\]([\s\S]*?)(?:^\[|\Z)/m)?.[1] || '';
for (const match of varsSection.matchAll(/^\s*([A-Z][A-Z0-9_]*)\s*=/gm)) {
  assert.ok(allowed.has(match[1]), 'wrangler.toml defines forbidden variable in [vars]: ' + match[1]);
}
assert.match(config, /^APP_URL\s*=/m, 'wrangler.toml must declare canonical APP_URL in [vars]');
console.log('System database environment contract passed ('+files.length+' backend/server source files scanned).');
