import type {Artifact,Task,TaskContext,TaskStatus} from './types.js';
export type { Task } from './types.js';

export interface TaskStore { get(id:string):Task|undefined; set(task:Task):void; list():Task[]; }
export interface TaskEventSink { emit(event:{type:string;task:Task}):void; }

class MemoryTaskStore implements TaskStore {
  private readonly items=new Map<string,Task>();
  get(id:string):Task|undefined{return this.items.get(id);}
  set(task:Task):void{this.items.set(task.id,task);}
  list():Task[]{return [...this.items.values()];}
}

export class TaskRuntime {
  private readonly store:TaskStore;
  constructor(store:TaskStore=new MemoryTaskStore(),private readonly events?:TaskEventSink){this.store=store;}
  create(request:string,parentTaskId?:string,contextId?:string):Task {
    const id=crypto.randomUUID();
    const context:TaskContext={taskId:id,parentTaskId,request,requirements:[],artifacts:[],contextId:contextId??crypto.randomUUID()};
    const task:Task={id,status:'submitted',request,context};
    this.store.set(task); this.events?.emit({type:'task.created',task}); return task;
  }
  get(id:string):Task|undefined{return this.store.get(id);}
  list():Task[]{return this.store.list();}
  transition(id:string,status:TaskStatus):Task {
    const task=this.mustGet(id); task.status=status; this.store.set(task); this.events?.emit({type:'task.status',task}); return task;
  }
  addRequirement(id:string,requirement:TaskContext['requirements'][number]):Task {
    const task=this.mustGet(id); const existing=task.context.requirements.find(r=>r.id===requirement.id);
    if(existing) Object.assign(existing,requirement); else task.context.requirements.push(requirement);
    task.status='input-required'; this.store.set(task); this.events?.emit({type:'task.requirement',task}); return task;
  }
  addArtifact(id:string,artifact:Artifact):Task {
    const task=this.mustGet(id); task.context.artifacts.push(artifact); this.store.set(task); this.events?.emit({type:'task.artifact',task}); return task;
  }
  private mustGet(id:string):Task{const task=this.store.get(id);if(!task)throw new Error(`Unknown task: ${id}`);return task;}
}
