import type {AikoAgentDefinition,AikoCapability,AikoRuntimeOptions} from './types.js';

export class AikoRuntime {
  private readonly options:AikoRuntimeOptions;
  private readonly agents=new Map<string,AikoAgentDefinition>();

  constructor(options:AikoRuntimeOptions){this.options=options;for(const agent of options.customAgents??[])this.agents.set(agent.id,agent);}

  async listCapabilities():Promise<AikoCapability[]>{
    const caps=this.options.capabilities;
    return typeof caps==='function'?await caps():caps;
  }

  async refreshAgents():Promise<AikoAgentDefinition[]>{
    const capabilities=await this.listCapabilities();
    const next=new Map<string,AikoAgentDefinition>();
    for(const agent of this.agents.values()){
      if(agent.custom||agent.sourceKind==='custom')next.set(agent.id,agent);
    }
    for(const capability of capabilities){
      const tool={id:capability.id,name:capability.name,description:capability.description,inputSchema:capability.inputSchema,execute:capability.execute,sourceKind:capability.sourceKind,sourceId:capability.sourceId};
      const resolved=await this.options.resolver.resolve(undefined,{tool});
      const agent:AikoAgentDefinition={
        schemaVersion:'1.0.0',
        id:'aiko-'+capability.sourceKind+'-'+capability.sourceId,
        name:capability.name+' Agent',
        description:capability.description??('Aiko agent for '+capability.name),
        agentType:capability.sourceKind==='endpoint'?'ENDPOINT':'TOOL',
        tool,
        intelligenceSpec:resolved.spec,
        intelligenceSpecId:resolved.specId,
        sourceKind:capability.sourceKind,
        sourceId:capability.sourceId
      };
      next.set(agent.id,agent);
    }
    this.agents.clear();
    for(const agent of next.values())this.agents.set(agent.id,agent);
    return [...this.agents.values()];
  }

  async listAgents():Promise<AikoAgentDefinition[]>{return this.agents.size?[...this.agents.values()]:this.refreshAgents();}

  async executeAgent(agentId:string,input:unknown):Promise<unknown>{
    const agent=this.agents.get(agentId)??(await this.refreshAgents()).find(item=>item.id===agentId);
    if(!agent)throw new Error('Aiko agent not found: '+agentId);
    const resolvedInput=typeof input==='string'&&this.options.resolveNaturalLanguage?await this.options.resolveNaturalLanguage(agent,input):input;
    return agent.tool.execute(resolvedInput);
  }

  async createCustomAgent(name:string,capabilityIds:string[],specId?:string):Promise<AikoAgentDefinition>{
    const capabilities=await this.listCapabilities();
    const allowed=capabilities.filter(item=>capabilityIds.includes(item.id));
    if(allowed.length===0)throw new Error('A custom Aiko agent requires at least one permitted capability.');
    const resolved=await this.options.resolver.resolve(specId,{});
    const tool={id:'custom-'+name,name,description:'Custom Aiko capability set',execute:async(input:unknown)=>{
      const request=input as {toolId?:string;input?:unknown};
      if(!request?.toolId||!capabilityIds.includes(request.toolId))throw new Error('Capability is not permitted for this custom agent.');
      const capability=allowed.find(item=>item.id===request.toolId);
      if(!capability)throw new Error('Capability not found.');
      return capability.execute(request.input);
    },sourceKind:'custom' as const,sourceId:name};
    const agent:AikoAgentDefinition={schemaVersion:'1.0.0',id:'aiko-custom-'+name.toLowerCase().replace(/\s+/g,'-'),name,description:'Custom Aiko agent',agentType:'AIKO',tool,intelligenceSpec:resolved.spec,intelligenceSpecId:resolved.specId,sourceKind:'custom',sourceId:name,allowedToolIds:capabilityIds,custom:true};
    this.agents.set(agent.id,agent);return agent;
  }

  listKeys(){return this.options.keys.listKeys();}
  getActiveKey(providerId:string){return this.options.keys.getActiveKey(providerId);}
  rotateKey(providerId:string){return this.options.keys.rotateKey(providerId);}
  syncFromAikoEngine(){return this.options.keys.syncFromAikoEngine();}
  addKey(input:{providerId:string;label:string;key:string;emailGroup?:string}){if(!this.options.keys.addKey)throw new Error('Local Aiko key storage is unavailable.');return this.options.keys.addKey(input);}
}
