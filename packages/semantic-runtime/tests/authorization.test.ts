import {describe,expect,it} from 'vitest';
import {SemanticOrchestrator} from '../src/orchestrator.js';
import {CapabilityRegistry} from '../src/registry.js';
import {RequirementResolver} from '../src/resolution.js';
import {TaskRuntime} from '../src/tasks.js';

describe('semantic orchestration authorization',()=>{
  it('rejects unauthorized capability execution before executor runs',async()=>{
    const capabilities=new CapabilityRegistry();
    capabilities.register({id:'danger.write',name:'Dangerous write',description:'write',kind:'endpoint',sideEffects:'irreversible'});
    const tasks=new TaskRuntime();
    let executed=false;
    const orchestrator=new SemanticOrchestrator(
      capabilities,tasks,new RequirementResolver(capabilities),
      {plan:async()=>({nodes:[{id:'n1',capabilityId:'danger.write',dependsOn:[],input:{}}]})},
      {execute:async()=>{executed=true;return 'bad';}},
      {authorize:async capability=>({allowed:capability.sideEffects!=='irreversible',reason:'IRREVERSIBLE_CAPABILITY_DENIED'})}
    );
    const task=tasks.create('do it');
    const result=await orchestrator.run(task,{runtime:{applicationId:'app',sessionId:'s'},task:task.context,capabilities:capabilities.list()});
    expect(result.status).toBe('failed');
    expect(result.error).toBe('IRREVERSIBLE_CAPABILITY_DENIED');
    expect(executed).toBe(false);
  });
});
