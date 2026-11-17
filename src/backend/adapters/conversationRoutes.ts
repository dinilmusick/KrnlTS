import {createAikoRuntime} from '../AppBackend.js';

export async function handleConversationRoutes(request:Request):Promise<Response|null>{
  const url=new URL(request.url);
  if(url.pathname!=='/api/converse')return null;
  if(request.method!=='POST')return new Response(JSON.stringify({error:'Method not allowed'}),{status:405,headers:{'Content-Type':'application/json'}});
  let body:any;
  try{
    body=await request.json();
  }catch{
    return new Response(JSON.stringify({error:'Invalid JSON body'}),{status:400,headers:{'Content-Type':'application/json'}});
  }
  const text=typeof body?.message==='string'?body.message:typeof body?.input==='string'?body.input:'';
  if(!text.trim())return new Response(JSON.stringify({error:'Message or input is required'}),{status:400,headers:{'Content-Type':'application/json'}});
  try{
    const runtime=createAikoRuntime(String(body.workspaceId||'default'));
    const result=await runtime.executeAgent('skipo-application-agent',text.trim());
    const payload = typeof result === 'object' && result !== null && 'status' in result ? result : { status: 'completed', result };
    return new Response(JSON.stringify(payload),{status:200,headers:{'Content-Type':'application/json'}});
  }catch(error){return new Response(JSON.stringify({error:error instanceof Error?error.message:String(error)}),{status:500,headers:{'Content-Type':'application/json'}});}
}
