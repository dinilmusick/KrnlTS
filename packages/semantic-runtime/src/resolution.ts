import type {AgentContext,CapabilityDescriptor,Requirement} from './types.js';
import {CapabilityRegistry} from './registry.js';

export interface ResolutionResult {
  resolved:boolean;
  value?:unknown;
  source?:string;
  reason?:string;
  capabilityId?:string;
}

export interface RequirementSource {
  canResolve(requirement:Requirement,context:AgentContext):Promise<boolean>;
  resolve(requirement:Requirement,context:AgentContext):Promise<unknown>;
  name:string;
}

export interface RequirementCapabilityExecutor {
  execute(capability:CapabilityDescriptor,input:unknown,context:AgentContext):Promise<unknown>;
}

export class CapabilityRequirementSource implements RequirementSource {
  readonly name='capability-execution';

  constructor(
    private readonly registry:CapabilityRegistry,
    private readonly executor:RequirementCapabilityExecutor,
  ) {}

  async canResolve(requirement:Requirement):Promise<boolean> {
    return this.registry.findProviders(requirement.semanticType).length>0;
  }

  async resolve(requirement:Requirement,context:AgentContext):Promise<unknown> {
    const candidates=this.registry.findProviders(requirement.semanticType);
    if(candidates.length===0) throw new Error(`No capability provides ${requirement.semanticType}`);
    return this.executeProvider(candidates[0],context,new Set([candidates[0].id]));
  }

  private async executeProvider(
    capability:CapabilityDescriptor,
    context:AgentContext,
    visiting:Set<string>,
  ):Promise<unknown>{
    const input:Record<string,unknown>={};
    for(const template of capability.requirements??[]){
      if(!template.required) continue;
      const existing=context.task.requirements.find(r=>r.semanticType===template.semanticType&&r.value!==undefined);
      if(existing){
        input[template.sourceField??template.id]=existing.value;
        continue;
      }
      const providers=this.registry.findProviders(template.semanticType).filter(candidate=>!visiting.has(candidate.id));
      if(!providers.length)
        throw new Error(`CAPABILITY_REQUIRES_EXECUTION:${capability.id}:${template.semanticType}`);
      const provider=providers[0];
      visiting.add(provider.id);
      const value=await this.executeProvider(provider,context,visiting);
      input[template.sourceField??template.id]=value;
      visiting.delete(provider.id);
    }
    return this.executor.execute(capability,input,context);
  }
}

export class RequirementResolver {
  constructor(
    private readonly registry:CapabilityRegistry,
    private readonly sources:RequirementSource[]=[]
  ){}

  async resolve(requirement:Requirement,context:AgentContext):Promise<ResolutionResult>{
    if(requirement.value!==undefined)
      return {resolved:true,value:requirement.value,source:'task-context'};
    for(const source of this.sources){
      if(await source.canResolve(requirement,context))
        return {resolved:true,value:await source.resolve(requirement,context),source:source.name};
    }
    const providers=this.registry.findProviders(requirement.semanticType);
    if(providers.length) return {resolved:false,reason:'CAPABILITY_REQUIRES_EXECUTION',source:providers[0].id,capabilityId:providers[0].id};
    const candidates=this.registry.list().filter(capability=>capability.inputSchema?.properties?.[requirement.sourceField??'']!==undefined);
    if(candidates.length) return {resolved:false,reason:'CAPABILITY_REQUIRES_EXECUTION',source:candidates[0].id,capabilityId:candidates[0].id};
    return {resolved:false,reason:'NO_INTERNAL_RESOLUTION'};
  }
}
