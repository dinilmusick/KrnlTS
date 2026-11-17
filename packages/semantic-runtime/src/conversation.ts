import type {AgentContext,Requirement,Task} from './types.js';
import {SemanticOrchestrator,type OrchestrationResult} from './orchestrator.js';
import {TaskRuntime} from './tasks.js';

export interface ConversationMessage {
  id:string;
  role:'user'|'agent'|'system';
  content:string;
  taskId?:string;
  createdAt:string;
}

export interface Conversation {
  id:string;
  messages:ConversationMessage[];
  taskIds:string[];
}

export interface ConversationStore {
  get(id:string):Conversation|undefined;
  set(conversation:Conversation):void;
}

export interface ConversationInputResolver {
  resolve(input:string,requirement:Requirement,context:AgentContext):Promise<unknown>;
}

class MemoryConversationStore implements ConversationStore {
  private readonly items=new Map<string,Conversation>();
  get(id:string):Conversation|undefined{return this.items.get(id);}
  set(conversation:Conversation):void{this.items.set(conversation.id,conversation);}
}

export interface ConversationRuntimeOptions {
  tasks:TaskRuntime;
  orchestrator:SemanticOrchestrator;
  buildContext:(taskId:string,conversationId:string)=>Promise<AgentContext>;
  inputResolver:ConversationInputResolver;
  store?:ConversationStore;
}

export class ConversationRuntime {
  private readonly store:ConversationStore;

  constructor(private readonly options:ConversationRuntimeOptions){
    this.store=options.store??new MemoryConversationStore();
  }

  async send(input:string,conversationId?:string,taskId?:string):Promise<OrchestrationResult>{
    const conversation=this.getOrCreate(conversationId);
    let task=taskId?this.options.tasks.get(taskId):undefined;
    if(!task && conversation.taskIds.length>0){
      const lastTaskId=conversation.taskIds[conversation.taskIds.length-1];
      const candidate=this.options.tasks.get(lastTaskId);
      if(candidate && candidate.status==='input-required') task=candidate;
    }
    const activeTask=task??this.options.tasks.create(input,undefined,conversation.id);
    if(!task) conversation.taskIds.push(activeTask.id);
    conversation.messages.push({
      id:crypto.randomUUID(),role:'user',content:input,taskId:activeTask.id,createdAt:new Date().toISOString()
    });
    this.store.set(conversation);

    const context=await this.options.buildContext(activeTask.id,conversation.id);
    if(task && activeTask.status==='input-required'){
      const requirement=activeTask.context.requirements.find(r=>r.required&&r.value===undefined);
      if(requirement){
        requirement.value=await this.options.inputResolver.resolve(input,requirement,context);
        activeTask.status='submitted';
      }
    }

    const result=await this.options.orchestrator.run(activeTask,context);
    conversation.messages.push({
      id:crypto.randomUUID(),role:'agent',
      content:this.describe(result),taskId:activeTask.id,createdAt:new Date().toISOString()
    });
    this.store.set(conversation);
    return result;
  }

  get(id:string):Conversation|undefined{return this.store.get(id);}

  private getOrCreate(id?:string):Conversation{
    if(id){
      const existing=this.store.get(id);
      if(existing) return existing;
    }
    const conversation={id:id??crypto.randomUUID(),messages:[],taskIds:[]};
    this.store.set(conversation);
    return conversation;
  }

  private describe(result:OrchestrationResult):string{
    if(result.status==='completed') return 'Task completed.';
    if(result.status==='input-required')
      return result.requirements.map(r=>r.description).join(' ');
    return `Task failed: ${result.error}`;
  }
}
