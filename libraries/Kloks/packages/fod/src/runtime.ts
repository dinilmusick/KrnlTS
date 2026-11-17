import type {FodEndpointDescriptor,FodExecutionResult,FodFlow,FodNodeDefinition} from './types.js';
import {FodFlowStore} from './flowStore.js';
import {executeFodFlow} from './executor.js';

export class FodRuntime {
  readonly flowStore:FodFlowStore;
  private endpoints=new Map<string,FodEndpointDescriptor>();
  private nodes:FodNodeDefinition[]=[];

  constructor(private readonly options:{workspaceId:string;workspaceService:any;onEvent?:(event:any)=>void}) {
    this.flowStore=new FodFlowStore(options.workspaceService);
  }

  setEndpoints(endpoints:FodEndpointDescriptor[],nodes:FodNodeDefinition[]=[]):void {
    this.endpoints=new Map(endpoints.map(endpoint=>[endpoint.id,endpoint]));
    this.nodes=nodes;
  }

  getNodeDefinitions():FodNodeDefinition[]{return [...this.nodes];}
  getEndpoints():FodEndpointDescriptor[]{return [...this.endpoints.values()];}

  async listFlows():Promise<FodFlow[]> { return this.flowStore.list(this.options.workspaceId); }
  async getFlow(flowId:string):Promise<FodFlow|null> { return this.flowStore.get(this.options.workspaceId,flowId); }
  async saveFlow(flow:FodFlow):Promise<FodFlow> { return this.flowStore.save(this.options.workspaceId,flow); }
  async deleteFlow(flowId:string):Promise<boolean> { return this.flowStore.delete(this.options.workspaceId,flowId); }
  async executeFlow(flowId:string,input?:unknown):Promise<FodExecutionResult> {
    const flow=await this.getFlow(flowId);
    if(!flow) throw new Error(`FOD flow '${flowId}' not found.`);
    return executeFodFlow(flow,this.endpoints,this.options.onEvent,input);
  }
}
