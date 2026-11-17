import {describe,expect,it} from 'vitest';
import {AikoRuntime} from './runtime.js';

describe('AikoRuntime',()=>{
 it('creates one agent per capability and preserves tool plus intelligence spec',async()=>{
  const runtime=new AikoRuntime({
   capabilities:[{id:'api-1',name:'Example',sourceKind:'endpoint',sourceId:'api-1',execute:async(input)=>input}],
   resolver:{resolve:()=>({spec:{reasoning:9},specId:'preset-agent'})},
   keys:{listKeys:async()=>[],getActiveKey:async()=>null,rotateKey:async()=>null,syncFromAikoEngine:async()=>({synced:0})}
  });
  const agents=await runtime.listAgents();
  expect(agents).toHaveLength(1);
  expect(agents[0].tool.id).toBe('api-1');
  expect(agents[0].intelligenceSpec.reasoning).toBe(9);
 });
});

it('creates a custom agent with an explicit capability allow-list',async()=>{
 const runtime=new AikoRuntime({
  capabilities:[
   {id:'a',name:'A',sourceKind:'endpoint',sourceId:'a',execute:async(input)=>input},
   {id:'b',name:'B',sourceKind:'endpoint',sourceId:'b',execute:async(input)=>input}
  ],
  resolver:{resolve:()=>({spec:{reasoning:8}})},
  keys:{listKeys:async()=>[],getActiveKey:async()=>null,rotateKey:async()=>null,syncFromAikoEngine:async()=>({synced:0})}
 });
 const agent=await runtime.createCustomAgent('Custom',['a']);
 expect(agent.allowedToolIds).toEqual(['a']);
 await expect(runtime.executeAgent(agent.id,{toolId:'b',input:{}})).rejects.toThrow('not permitted');
});

it('resolves natural-language input before executing the agent tool',async()=>{
 let received:any=null;
 const runtime=new AikoRuntime({
  capabilities:[{id:'api',name:'API',sourceKind:'endpoint',sourceId:'api',execute:async(input)=>{received=input;return input}}],
  resolver:{resolve:()=>({spec:{reasoning:9}})},
  resolveNaturalLanguage:async()=>({value:42}),
  keys:{listKeys:async()=>[],getActiveKey:async()=>null,rotateKey:async()=>null,syncFromAikoEngine:async()=>({synced:0})}
 });
 await runtime.executeAgent('aiko-endpoint-api','do it');
 expect(received).toEqual({value:42});
});
