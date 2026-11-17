import {describe,expect,it} from "vitest";
import fs from "node:fs";
import path from "node:path";
const root=path.resolve(".");
const forbidden=[/@aws-sdk\//,/googleapis/,/onnxruntime-node/,/cactus-needle/,/@huggingface\/transformers/,/node:(fs|path|crypto|child_process|net|http|https|os|stream)/];
function reachable(entry:string){const seen=new Set<string>(),q=[entry];while(q.length){const f=q.pop()!;if(seen.has(f)||!fs.existsSync(f))continue;seen.add(f);const s=fs.readFileSync(f,"utf8");for(const m of s.matchAll(/(?:import|export)\s+(?:[^'"]+from\s+)?['"]([^'"]+)['"]/g)){const spec=m[1];if(!spec.startsWith("."))continue;let r=path.resolve(path.dirname(f),spec);if(!path.extname(r))r+=".js";q.push(r);}}return seen;}
describe("GutTS browser dependency closure",()=>{
  it("browser surface excludes runtime-specific exports",()=>{const s=fs.readFileSync(path.join(root,"src/browser.ts"),"utf8");for(const x of ["./models/","./semantic-input/","./api/","./storage/","./server/"])expect(s).not.toContain(x);});
  it("model runtimes are optional peers",()=>{const p=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));for(const n of ["@huggingface/transformers","cactus-needle"]){expect(p.dependencies?.[n]).toBeUndefined();expect(p.peerDependencies?.[n]).toBeDefined();expect(p.peerDependenciesMeta?.[n]?.optional).toBe(true);}});
  it("built browser closure has no server-only references",()=>{for(const f of reachable(path.join(root,"dist/browser.js"))){const s=fs.readFileSync(f,"utf8");for(const re of forbidden)expect(s).not.toMatch(re);}});
});
