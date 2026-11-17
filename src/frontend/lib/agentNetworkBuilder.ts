type KeyLike = { id: string; label?: string; providerId?: string; status?: string };
type ModelLike = { id: string; name: string; providerId?: string; intelligenceSpec?: unknown };
type Entity = { id:string; kind:'agent'|'subagent'|'model'|'key'; name:string; label:string; description?:string; iconName?:string; color:string; radius:number; orbitRadius:number; orbitAngle:number; orbitSpeed:number; modelId?:string; providerId?:string; keyId?:string; status?:string; children?:Entity[] };
export function buildAgentSolarSystem(input: { keys?: KeyLike[]; catalog?: ModelLike[]; rootName?: string; rootIcon?: string; rootDescription?: string }) {
  const keys=input.keys||[], catalog=input.catalog||[];
  const models: Entity[]=catalog.map((model,i)=>({id:'model-'+model.id,kind:'model',name:model.name,label:model.name,description:model.providerId,color:'#60a5fa',radius:10,orbitRadius:70,orbitAngle:i,orbitSpeed:0.15,modelId:model.id,providerId:String(model.providerId||'')}));
  const keyNodes: Entity[]=keys.map((key,i)=>({id:'key-'+key.id,kind:'key',name:key.label||key.id,label:key.label||key.id,description:String(key.providerId||''),color:'#f59e0b',radius:8,orbitRadius:105,orbitAngle:i,orbitSpeed:0.1,keyId:key.id,providerId:String(key.providerId||''),status:key.status}));
  const root: Entity={id:'aiko-agent',kind:'agent',name:input.rootName||'Aiko Agent',label:input.rootName||'Aiko Agent',description:input.rootDescription,iconName:input.rootIcon||'Brain',color:'#a78bfa',radius:18,orbitRadius:0,orbitAngle:0,orbitSpeed:0,children:[...models,...keyNodes]};
  return {root,totalSubAgents:0,totalModels:models.length,totalKeys:keyNodes.length};
}
