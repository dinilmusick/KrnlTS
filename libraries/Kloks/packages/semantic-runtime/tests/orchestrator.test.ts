import {describe,expect,it} from 'vitest';
import {CapabilityRegistry} from '../src/registry.js';
import {RequirementResolver,CapabilityRequirementSource} from '../src/resolution.js';
import {TaskRuntime} from '../src/tasks.js';
import {SemanticOrchestrator} from '../src/orchestrator.js';
import type {AgentContext,CapabilityDescriptor,RuntimeContext} from '../src/types.js';

const runtime:RuntimeContext={applicationId:'test',sessionId:'s1'};

const context=(task:any):AgentContext=>({runtime,task,capabilities:[]});

describe('semantic orchestrator',()=>{
  it('executes a planned capability graph',async()=>{
    const registry=new CapabilityRegistry();
    const capability:CapabilityDescriptor={
      id:'math.add',name:'Add',description:'Adds two numbers',kind:'endpoint',
      inputSchema:{type:'object',properties:{a:{type:'number'},b:{type:'number'}},required:['a','b']},
      outputSchema:{type:'number'},provides:[{semanticType:'sum'}],
    };
    registry.register(capability);
    const tasks=new TaskRuntime();
    const resolver=new RequirementResolver(registry);
    const orchestrator=new SemanticOrchestrator(
      registry,tasks,resolver,
      {async plan(){return {intent:'add',nodes:[{id:'n1',capabilityId:'math.add',dependsOn:[],input:{a:2,b:3}}]};}},
      {async execute(_c,input){const v=input as {a:number;b:number};return v.a+v.b;}},
    );
    const task=tasks.create('add 2 and 3');
    const result=await orchestrator.run(task,context(task));
    expect(result.status).toBe('completed');
    expect(task.result).toEqual(5);
  });

  it('resolves a missing requirement through a provider capability',async()=>{
    const registry=new CapabilityRegistry();
    const provider:CapabilityDescriptor={
      id:'customer.lookup',name:'Lookup customer',description:'Finds a customer id',kind:'endpoint',
      inputSchema:{type:'object',properties:{email:{type:'string'}},required:['email']},
      outputSchema:{type:'string'},provides:[{semanticType:'customerId'}],
      requirements:[{id:'email',semanticType:'email',description:'Email',required:true,sourceField:'email'}],
    };
    registry.register(provider);
    const tasks=new TaskRuntime();
    const source=new CapabilityRequirementSource(registry,{async execute(c,input){expect(c.id).toBe('customer.lookup');expect(input).toEqual({email:'a@b.com'});return 'cust-1';}});
    const resolver=new RequirementResolver(registry,[source]);
    const task=tasks.create('lookup customer');
    task.context.requirements.push({id:'email',semanticType:'email',description:'Email',required:true,sourceCapability:'customer.lookup',sourceField:'email',value:'a@b.com'});
    const req={id:'customer',semanticType:'customerId',description:'Customer id',required:true,sourceCapability:'order.create'};
    task.context.requirements.push({...req});
    const result=await resolver.resolve(req,{runtime,task:task.context,capabilities:registry.list()});
    expect(result).toMatchObject({resolved:true,value:'cust-1',source:'capability-execution'});
  });

  it('resolves chained provider dependencies before execution',async()=>{
    const registry=new CapabilityRegistry();
    registry.register({
      id:'account.lookup',name:'Lookup account',description:'Finds account',kind:'endpoint',
      provides:[{semanticType:'accountId'}],
      requirements:[{id:'email',semanticType:'email',description:'Email',required:true,sourceField:'email'}]
    });
    registry.register({
      id:'account.balance',name:'Get balance',description:'Gets account balance',kind:'endpoint',
      provides:[{semanticType:'balance'}],
      requirements:[{id:'account',semanticType:'accountId',description:'Account',required:true,sourceField:'accountId'}]
    });
    const tasks=new TaskRuntime();
    const task=tasks.create('get my balance');
    task.context.requirements.push({
      id:'email',semanticType:'email',description:'Email',required:true,
      sourceCapability:'account.balance',value:'a@b.com'
    });
    const calls:string[]=[];
    const source=new CapabilityRequirementSource(registry,{async execute(cap,input){
      calls.push(cap.id+JSON.stringify(input));
      return cap.id==='account.lookup'?'acct-1':42;
    }});
    const result=await new RequirementResolver(registry,[source]).resolve(
      {id:'balance',semanticType:'balance',description:'Balance',required:true,sourceCapability:'account.balance'},
      {runtime,task:task.context,capabilities:registry.list()}
    );
    expect(result).toMatchObject({resolved:true,value:42});
    expect(calls).toEqual(['account.lookup{"email":"a@b.com"}','account.balance{"accountId":"acct-1"}']);
  });
});
