import type {Conversation,ConversationStore} from './conversation.js';
import type {Task} from './types.js';
import type {TaskStore} from './tasks.js';

export interface WorkspaceFileAdapter {
  readFile(workspaceId:string,path:string):Promise<string|Uint8Array>;
  writeFile(workspaceId:string,path:string,content:string):Promise<unknown>;
  deleteFile(workspaceId:string,path:string):Promise<unknown>;
  listFiles(workspaceId:string,path:string):Promise<readonly {name:string;path:string;isFolder?:boolean}[]>;
}

function text(value:string|Uint8Array):string{return typeof value==='string'?value:Buffer.from(value).toString('utf8');}
function safe(id:string):string{return id.replace(/[^a-zA-Z0-9._-]/g,'_');}

export class WorkspaceTaskStore implements TaskStore {
  private readonly items=new Map<string,Task>();
  constructor(private readonly workspace:WorkspaceFileAdapter,private readonly workspaceId:string,private readonly root='SEMANTIC/tasks'){}
  async hydrate():Promise<Task[]> {
    const entries=await this.workspace.listFiles(this.workspaceId,this.root);
    for(const entry of entries){if(entry.isFolder||!entry.name.endsWith('.json'))continue;try{const task=JSON.parse(text(await this.workspace.readFile(this.workspaceId,entry.path))) as Task;this.items.set(task.id,task);}catch{}}
    return this.list();
  }
  get(id:string):Task|undefined{return this.items.get(id);}
  set(task:Task):void{this.items.set(task.id,task);void this.workspace.writeFile(this.workspaceId,`${this.root}/${safe(task.id)}.json`,JSON.stringify(task,null,2));}
  list():Task[]{return [...this.items.values()];}
  async delete(id:string):Promise<void>{this.items.delete(id);await this.workspace.deleteFile(this.workspaceId,`${this.root}/${safe(id)}.json`);}
}

export class WorkspaceConversationStore implements ConversationStore {
  private readonly items=new Map<string,Conversation>();
  constructor(private readonly workspace:WorkspaceFileAdapter,private readonly workspaceId:string,private readonly root='SEMANTIC/conversations'){}
  async hydrate():Promise<Conversation[]> {
    const entries=await this.workspace.listFiles(this.workspaceId,this.root);
    for(const entry of entries){if(entry.isFolder||!entry.name.endsWith('.json'))continue;try{const conversation=JSON.parse(text(await this.workspace.readFile(this.workspaceId,entry.path))) as Conversation;this.items.set(conversation.id,conversation);}catch{}}
    return this.list();
  }
  get(id:string):Conversation|undefined{return this.items.get(id);}
  set(conversation:Conversation):void{this.items.set(conversation.id,conversation);void this.workspace.writeFile(this.workspaceId,`${this.root}/${safe(conversation.id)}.json`,JSON.stringify(conversation,null,2));}
  list():Conversation[]{return [...this.items.values()];}
  async delete(id:string):Promise<void>{this.items.delete(id);await this.workspace.deleteFile(this.workspaceId,`${this.root}/${safe(id)}.json`);}
}