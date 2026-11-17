import type {FodFlow} from './types.js';

const ROOT='FOD';

function pathFor(flowId:string):string {
  const safe=flowId.replace(/[^a-zA-Z0-9._-]/g,'_');
  return `${ROOT}/${safe}.json`;
}

export class FodFlowStore {
  constructor(private readonly workspaceService:any) {}

  async list(workspaceId:string):Promise<FodFlow[]> {
    const entries=await this.workspaceService.listFiles(workspaceId,ROOT);
    const flows:FodFlow[]=[];
    for (const entry of entries) {
      if (entry.isFolder || !entry.name.endsWith('.json')) continue;
      try {
        const raw=await this.workspaceService.readFile(workspaceId,entry.path);
        flows.push(JSON.parse(typeof raw === 'string' ? raw : Buffer.from(raw).toString('utf8')));
      } catch {}
    }
    return flows.sort((a,b)=>a.name.localeCompare(b.name));
  }

  async get(workspaceId:string,flowId:string):Promise<FodFlow|null> {
    try {
      const raw=await this.workspaceService.readFile(workspaceId,pathFor(flowId));
      return JSON.parse(typeof raw === 'string' ? raw : Buffer.from(raw).toString('utf8')) as FodFlow;
    } catch { return null; }
  }

  async save(workspaceId:string,flow:FodFlow):Promise<FodFlow> {
    const now=new Date().toISOString();
    const next={...flow,updatedAt:now,version:Math.max(1,flow.version ?? 1)};
    await this.workspaceService.writeFile(workspaceId,pathFor(flow.id),JSON.stringify(next,null,2));
    return next;
  }

  async delete(workspaceId:string,flowId:string):Promise<boolean> {
    const result=await this.workspaceService.deleteFile(workspaceId,pathFor(flowId));
    return Boolean(result?.success);
  }
}
