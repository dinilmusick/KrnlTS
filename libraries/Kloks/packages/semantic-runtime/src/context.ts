import type {AgentContext,KnowledgeContext,RuntimeContext,TaskContext} from './types.js';
import {CapabilityRegistry} from './registry.js';

export interface KnowledgeResolver { resolve(query:string,context:TaskContext):Promise<KnowledgeContext>; }

export class ContextResolver {
  constructor(private readonly capabilities:CapabilityRegistry,private readonly knowledge?:KnowledgeResolver){}
  async resolve(runtime:RuntimeContext,task:TaskContext):Promise<AgentContext>{
    const knowledge=this.knowledge?await this.knowledge.resolve(task.request,task):undefined;
    return {runtime,task,capabilities:this.capabilities.list(),knowledge};
  }
}
