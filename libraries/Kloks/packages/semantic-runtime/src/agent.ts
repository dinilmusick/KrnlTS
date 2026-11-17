import type {CapabilityDescriptor} from './types.js';

export interface AgentCard {
  id:string; name:string; description:string;
  role:'application'|'endpoint'|'capability';
  capabilities:string[];
  inputModes?:string[]; outputModes?:string[];
  metadata?:Record<string,unknown>;
}

export class AgentRegistry {
  private readonly agents=new Map<string,AgentCard>();
  register(agent:AgentCard):void{if(this.agents.has(agent.id))throw new Error(`Agent already registered: ${agent.id}`);this.agents.set(agent.id,agent);}
  upsert(agent:AgentCard):void{this.agents.set(agent.id,agent);}
  get(id:string):AgentCard|undefined{return this.agents.get(id);}
  list():AgentCard[]{return [...this.agents.values()];}
  forCapability(capability:CapabilityDescriptor):AgentCard[]{return this.list().filter(a=>a.capabilities.includes(capability.id));}
}
