import { createAikoRuntime } from '../AppBackend.js';

export async function handleAikoRoutes(request:Request):Promise<Response|null>{
  const url=new URL(request.url);
  if(url.pathname!=='/api/aiko')return null;
  if(request.method!=='POST')return new Response(JSON.stringify({error:'Method not allowed'}),{status:405,headers:{'Content-Type':'application/json'}});
  try{
    const body=await request.json() as any;
    const runtime=createAikoRuntime(String(body.workspaceId||'default'));
    let result:unknown;
    switch(String(body.action)){
      case 'listAgents': result=await runtime.listAgents(); break;
      case 'executeAgent': result=await runtime.executeAgent(String(body.agentId),body.query); break;
      case 'listKeys': result=await runtime.listKeys(); break;
      case 'getActiveKey': result=await runtime.getActiveKey(String(body.providerId)); break;
      case 'rotateKey': result=await runtime.rotateKey(String(body.providerId)); break;
      case 'addKey': result=await runtime.addKey(body.input); break;
      case 'syncFromAikoEngine': result=await runtime.syncFromAikoEngine(); break;
      case 'listCapabilities': result=await runtime.listCapabilities(); break;
      case 'reportBug': result=await runtime.reportBug?.(body.report,{authToken:body.authToken}); break;
      case 'createCustomAgent': result=await runtime.createCustomAgent(String(body.name),body.capabilityIds||[],body.specId); break;
      default:return new Response(JSON.stringify({error:'Unsupported Aiko action'}),{status:400,headers:{'Content-Type':'application/json'}});
    }
    return new Response(JSON.stringify(result),{status:200,headers:{'Content-Type':'application/json'}});
  }catch(error){
    return new Response(JSON.stringify({error:error instanceof Error?error.message:String(error)}),{status:500,headers:{'Content-Type':'application/json'}});
  }
}
