import {describe,expect,it} from 'vitest';
import {scanBackendFacadeToNodes} from './endpointNodeProvider.js';
import {executeFodFlow} from './executor.js';

describe('embedded FOD',()=>{
  it('derives host-app nodes from typed backend operation schemas',()=>{
    const facade={services:{
      math:{
        id:'app.math',name:'Math',runtime:'server',deployment:'local',
        definition:{operations:{add:{id:'Math.add',name:'add',inputSchema:{type:'object',properties:{a:{type:'number'},b:{type:'number'}},required:['a','b']},outputSchema:{type:'object',properties:{result:{type:'number'}}}},}},
        execute:async(_op:string,input:any)=>({result:Number(input.a)+Number(input.b)})
      }
    }};
    const {endpoints,nodes}=scanBackendFacadeToNodes(facade);
    expect(endpoints).toHaveLength(1);
    expect(nodes[0].type).toBe('host/Math.add');
    expect(nodes[0].inputs.map(p=>p.id)).toEqual(['a','b']);
    expect(nodes[0].outputs.map(p=>p.id)).toEqual(['result']);
  });

  it('executes a persisted graph deterministically through endpoint nodes',async()=>{
    const endpoint={id:'Math.add',serviceId:'app.math',serviceName:'Math',operationId:'Math.add',operationName:'add',invoke:async(input:any)=>({result:Number(input.a)+Number(input.b)})};
    const flow:any={id:'sum',name:'Sum',version:1,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
      nodes:[
        {id:'a',type:'host/Math.add',position:{x:0,y:0},data:{endpointId:'Math.add',inputs:{a:2,b:3}}}
      ],edges:[]};
    const result=await executeFodFlow(flow,new Map([[endpoint.id,endpoint as any]]));
    expect(result.success).toBe(true);
    expect((result.output as any).result).toBe(5);
  });
});
