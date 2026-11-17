import type {Task,TaskStore} from '@ultrst-armada/kloks/semantic-runtime';
import {workingWorkspaceService} from '@ultrst-armada/kloks/backend/node';

export interface SemanticConversationMessage{id:string;role:'user'|'agent'|'system';content:string;taskId?:string;createdAt:string;}
export interface SemanticConversationStore{append(sessionId:string,message:SemanticConversationMessage):Promise<void>|void;list(sessionId:string):Promise<SemanticConversationMessage[]>|SemanticConversationMessage[];}

function safe(value:string){return value.replace(/[^a-zA-Z0-9._-]/g,'_');}
function decode(value:string|Uint8Array){return typeof value==='string'?value:Buffer.from(value).toString('utf8');}

export class WorkspaceSemanticTaskStore implements TaskStore{
  private static readonly pendingWrites=new Map<string,Promise<void>>();
  private readonly items=new Map<string,Task>();
  constructor(private readonly workspaceId:string,private readonly workspace:any=workingWorkspaceService,private readonly root='SEMANTIC/tasks'){}
  async hydrate(){
    try{
      const prefix=`${this.workspaceId}:`;
      const pending:Promise<void>[]=[];
      for(const [k,p] of WorkspaceSemanticTaskStore.pendingWrites){if(k.startsWith(prefix))pending.push(p);}
      if(pending.length>0)await Promise.allSettled(pending);
      for(const entry of await this.workspace.listFiles(this.workspaceId,this.root)){
        if(entry.isFolder||!entry.name.endsWith('.json'))continue;
        try{const task=JSON.parse(decode(await this.workspace.readFile(this.workspaceId,entry.path))) as Task;this.items.set(task.id,task);}catch{}
      }
    }catch{};
    return this.list();
  }
  get(id:string){return this.items.get(id);}
  set(task:Task){
    this.items.set(task.id,task);
    const key=`${this.workspaceId}:${task.id}`;
    const previous=WorkspaceSemanticTaskStore.pendingWrites.get(key)??Promise.resolve();
    const next=previous.then(()=>this.workspace.writeFile(this.workspaceId,`${this.root}/${safe(task.id)}.json`,JSON.stringify(task,null,2)));
    const tracked=next.finally(()=>{if(WorkspaceSemanticTaskStore.pendingWrites.get(key)===tracked)WorkspaceSemanticTaskStore.pendingWrites.delete(key);});
    WorkspaceSemanticTaskStore.pendingWrites.set(key,tracked);
  }
  list(){return [...this.items.values()];}
}

export class WorkspaceSemanticConversationStore implements SemanticConversationStore{
  private static readonly pendingWrites=new Map<string,Promise<void>>();
  constructor(private readonly workspaceId:string,private readonly workspace:any=workingWorkspaceService,private readonly root='SEMANTIC/conversations'){}
  private async readDisk(sessionId:string):Promise<SemanticConversationMessage[]>{
    try{const parsed=JSON.parse(decode(await this.workspace.readFile(this.workspaceId,`${this.root}/${safe(sessionId)}.json`)));return Array.isArray(parsed)?parsed:[];}catch{return [];}
  }
  async append(sessionId:string,message:SemanticConversationMessage){
    const key=`${this.workspaceId}:${sessionId}`;
    const previous=WorkspaceSemanticConversationStore.pendingWrites.get(key)??Promise.resolve();
    const next=previous.then(async()=>{const current=await this.readDisk(sessionId);const list=Array.isArray(current)?current:[];list.push(message);await this.workspace.writeFile(this.workspaceId,`${this.root}/${safe(sessionId)}.json`,JSON.stringify(list,null,2));});
    const tracked=next.finally(()=>{if(WorkspaceSemanticConversationStore.pendingWrites.get(key)===tracked)WorkspaceSemanticConversationStore.pendingWrites.delete(key);});
    WorkspaceSemanticConversationStore.pendingWrites.set(key,tracked);
    await next;
  }
  async list(sessionId:string):Promise<SemanticConversationMessage[]>{
    const key=`${this.workspaceId}:${sessionId}`;
    const pending=WorkspaceSemanticConversationStore.pendingWrites.get(key);
    if(pending)try{await pending;}catch{}
    return this.readDisk(sessionId);
  }
}