import type {AgentContext,CapabilityDescriptor,Requirement,SemanticPlan,Task} from './types.js';
import {CapabilityRegistry} from './registry.js';
import {RequirementResolver} from './resolution.js';
import {TaskGraphRuntime} from './graph.js';
import {TaskRuntime} from './tasks.js';
import {CapabilityExecutionRuntime,type AuthorizationPolicy} from './execution.js';

export interface SemanticPlanner {
  plan(request:string,context:AgentContext):Promise<SemanticPlan>;
}

export interface SemanticExecutionAdapter {
  execute(capability:CapabilityDescriptor,input:unknown,context:AgentContext):Promise<unknown>;
}

export type OrchestrationResult =
  | {status:'completed'; task:Task; output:unknown[]}
  | {status:'input-required'; task:Task; requirements:Requirement[]}
  | {status:'failed'; task:Task; error:string};

export class SemanticOrchestrator {
  readonly graphs=new TaskGraphRuntime();

  constructor(
    private readonly capabilities:CapabilityRegistry,
    private readonly tasks:TaskRuntime,
    private readonly requirements:RequirementResolver,
    private readonly planner:SemanticPlanner,
    private readonly executor:SemanticExecutionAdapter,
    private readonly authorization?:AuthorizationPolicy,
  ) {}

  async run(task:Task,context:AgentContext):Promise<OrchestrationResult>{
    this.tasks.transition(task.id,'working');
    try {
      const plan=await this.planner.plan(task.request,context);
      task.context.intent=plan.intent;
      if(plan.requirements?.length) for(const requirement of plan.requirements){
        const existing=task.context.requirements.find(r=>r.id===requirement.id);
        if(existing) Object.assign(existing,{...requirement,value:existing.value}); else task.context.requirements.push(requirement);
      }

      for(const requirement of task.context.requirements){
        if(!requirement.required || requirement.value!==undefined) continue;
        const resolved=await this.requirements.resolve(requirement,context);
        if(resolved.resolved){ requirement.value=resolved.value; continue; }
        this.tasks.addRequirement(task.id,requirement);
        return {status:'input-required',task:this.tasks.get(task.id)!,requirements:[requirement]};
      }

      const graph=this.graphs.create(task.id,plan.nodes);
      const outputs:unknown[]=[];
      while(true){
        const ready=this.graphs.ready(graph.id);
        if(ready.length===0) break;
        await Promise.all(ready.map(async node=>{
          const capability=this.capabilities.get(node.capabilityId);
          if(!capability) throw new Error(`Unknown capability: ${node.capabilityId}`);
          const input=this.resolveInput(node.input,task.context.requirements);
          const executionResult=this.authorization
            ? await new CapabilityExecutionRuntime(this.authorization).execute(capability,input,context,this.executor)
            : await new CapabilityExecutionRuntime().execute(capability,input,context,this.executor);
          this.tasks.addArtifact(task.id,executionResult.artifact);
          outputs.push(executionResult.artifact.value);
          this.graphs.transition(graph.id,node.id,'completed');
        }));
      }

      const unfinished=graph.nodes.some(n=>n.status!=='completed');
      if(unfinished) throw new Error('TASK_GRAPH_STALLED');
      task.result=outputs.length===1?outputs[0]:outputs;
      this.tasks.transition(task.id,'completed');
      return {status:'completed',task:this.tasks.get(task.id)!,output:outputs};
    } catch(error) {
      const message=error instanceof Error?error.message:String(error);
      task.error=message;
      this.tasks.transition(task.id,'failed');
      return {status:'failed',task:this.tasks.get(task.id)!,error:message};
    }
  }

  private resolveInput(input:unknown,requirements:Requirement[]):unknown {
    if(!input || typeof input!=='object') return input;
    const values=new Map(requirements.map(r=>[r.id,r.value]));
    const visit=(value:unknown):unknown=>{
      if(typeof value==='string' && value.startsWith('$requirement:'))
        return values.get(value.slice('$requirement:'.length));
      if(Array.isArray(value)) return value.map(visit);
      if(value && typeof value==='object')
        return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,visit(v)]));
      return value;
    };
    return visit(input);
  }
}
