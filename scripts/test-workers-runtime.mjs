import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const entry=path.join(root,"tests/fixtures/gutts-worker.mjs");
const port=8787+Math.floor(Math.random()*1000);
const detached=process.platform!=="win32";
const child=spawn("npx",["--yes","wrangler@4","dev",entry,"--local","--ip","127.0.0.1","--port",String(port),"--compatibility-date=2026-11-12","--log-level=error"],{cwd:root,stdio:["ignore","pipe","pipe"],detached});
let logs="";
child.stdout.on("data",chunk=>logs+=chunk.toString());
child.stderr.on("data",chunk=>logs+=chunk.toString());
child.on("error",error=>logs+=String(error));
const stop=()=>{
  if(child.exitCode!==null||child.signalCode!==null)return;
  try{if(detached&&child.pid)process.kill(-child.pid,"SIGTERM");else child.kill("SIGTERM")}catch{child.kill("SIGTERM")}
};
try{
  let response;
  for(let attempt=0;attempt<90;attempt++){
    if(child.exitCode!==null||child.signalCode!==null)throw new Error(`Wrangler exited (${child.exitCode??child.signalCode}): ${logs}`);
    try{
      response=await fetch(`http://127.0.0.1:${port}/`,{signal:AbortSignal.timeout(2500)});
      if(response.ok)break;
    }catch{}
    await new Promise(resolve=>setTimeout(resolve,1000));
  }
  assert.ok(response?.ok,`Workers runtime did not become ready: ${logs}`);
  const result=await response.json();
  assert.deepEqual(result,{ok:true,groups:2});
  console.log("Cloudflare-compatible Workers runtime smoke test passed",result);
}finally{
  stop();
  await Promise.race([new Promise(resolve=>child.once("exit",resolve)),new Promise(resolve=>setTimeout(resolve,5000))]);
}
