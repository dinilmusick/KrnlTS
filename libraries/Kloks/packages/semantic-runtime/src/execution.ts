import type {AgentContext,Artifact,CapabilityDescriptor} from './types.js';

export interface AuthorizationDecision {allowed:boolean; reason?:string;}
export interface AuthorizationPolicy {authorize(capability:CapabilityDescriptor,context:AgentContext):Promise<AuthorizationDecision>;}
export interface CapabilityExecutor {execute(capability:CapabilityDescriptor,input:unknown,context:AgentContext):Promise<unknown>;}
export interface ExecutionResult {artifact:Artifact;}

export class CapabilityExecutionRuntime {
  constructor(private readonly policy?:AuthorizationPolicy){}
  async execute(capability:CapabilityDescriptor,input:unknown,context:AgentContext,executor:CapabilityExecutor):Promise<ExecutionResult>{
    if(this.policy){
      const decision=await this.policy.authorize(capability,context);
      if(!decision.allowed) throw new Error(decision.reason??'CAPABILITY_NOT_AUTHORIZED');
    }
    const value=await executor.execute(capability,input,context);
    return {artifact:{id:crypto.randomUUID(),type:capability.outputSchema?.type??'application/json',value,producer:capability.id,taskId:context.task.taskId,provenance:{capabilityId:capability.id}}};
  }
}
