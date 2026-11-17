import type {TaskGraph,TaskNode} from './types.js';

export class TaskGraphRuntime {
  private readonly graphs=new Map<string,TaskGraph>();

  create(requestId:string,nodes:Omit<TaskNode,'status'>[]):TaskGraph{
    const graph:TaskGraph={id:crypto.randomUUID(),requestId,nodes:nodes.map(n=>({...n,status:'submitted'}))};
    this.validate(graph);
    this.graphs.set(graph.id,graph);
    return graph;
  }

  get(id:string):TaskGraph|undefined{return this.graphs.get(id);}

  ready(id:string):TaskNode[]{
    const graph=this.mustGet(id);
    return graph.nodes.filter(n=>n.status==='submitted' && n.dependsOn.every(dep=>{
      const node=graph.nodes.find(x=>x.id===dep);
      return node?.status==='completed';
    }));
  }

  transition(graphId:string,nodeId:string,status:TaskNode['status']):TaskGraph{
    const graph=this.mustGet(graphId);
    const node=graph.nodes.find(n=>n.id===nodeId);
    if(!node) throw new Error(`Unknown task graph node: ${nodeId}`);
    node.status=status;
    return graph;
  }

  private validate(graph:TaskGraph):void{
    const ids=new Set(graph.nodes.map(n=>n.id));
    for(const node of graph.nodes){
      for(const dep of node.dependsOn) if(!ids.has(dep)) throw new Error(`Unknown dependency: ${dep}`);
    }
  }

  private mustGet(id:string):TaskGraph{const graph=this.graphs.get(id);if(!graph)throw new Error(`Unknown task graph: ${id}`);return graph;}
}
