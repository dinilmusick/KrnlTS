import {describe,expect,it} from 'vitest';
import {CapabilityRegistry} from '../src/registry.js';
import {RequirementResolver} from '../src/resolution.js';
import {TaskRuntime} from '../src/tasks.js';
import {SemanticOrchestrator} from '../src/orchestrator.js';
import {ConversationRuntime} from '../src/conversation.js';

describe('conversation runtime',()=>{
  it('pauses for input and resumes the same task and context',async()=>{
    const registry=new CapabilityRegistry();
    registry.register({
      id:'profile.update',name:'Update profile',description:'Updates profile',kind:'endpoint',
      inputSchema:{type:'object',properties:{displayName:{type:'string'}},required:['displayName']}
    });
    const tasks=new TaskRuntime();
    const orchestrator=new SemanticOrchestrator(
      registry,tasks,new RequirementResolver(registry),
      {async plan(){return {
        intent:'profile.update',
        nodes:[{id:'n1',capabilityId:'profile.update',dependsOn:[],input:{displayName:'$requirement:name'}}],
        requirements:[{id:'name',semanticType:'displayName',description:'Display name',required:true,sourceCapability:'profile.update',sourceField:'displayName'}]
      };}},
      {async execute(_c,input){return input;}}
    );
    const conversation=new ConversationRuntime({
      tasks,orchestrator,
      async buildContext(taskId,conversationId){
        const task=tasks.get(taskId)!;
        return {runtime:{applicationId:'app',sessionId:conversationId},task:task.context,capabilities:registry.list()};
      },
      inputResolver:{async resolve(){return 'Monke';}}
    });
    const first=await conversation.send('update my profile');
    expect(first.status).toBe('input-required');
    const taskId=first.task.id;
    const contextId=first.task.context.contextId!;
    const second=await conversation.send('Monke',contextId,taskId);
    expect(second.status).toBe('completed');
    expect(second.task.context.contextId).toBe(contextId);
    expect(second.task.result).toEqual({displayName:'Monke'});
  });
});