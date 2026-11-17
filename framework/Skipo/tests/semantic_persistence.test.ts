import {describe,expect,it} from 'vitest';
import {WorkspaceSemanticConversationStore,WorkspaceSemanticTaskStore} from '../src/backend/semantic/SkipoSemanticPersistence.js';

class MemoryWorkspace{files=new Map<string,string>();async listFiles(_:string,path:string){return [...this.files.keys()].filter(k=>k.startsWith(path+'/')).map(k=>({name:k.split('/').pop()!,path:k}));}async readFile(_:string,path:string){const value=this.files.get(path);if(value===undefined)throw new Error('missing');return value;}async writeFile(_:string,path:string,content:string){this.files.set(path,content);}async deleteFile(_:string,path:string){this.files.delete(path);return {success:true};}}

describe('Skipo semantic persistence',()=>{
  it('hydrates persisted tasks and conversations',async()=>{
    const workspace=new MemoryWorkspace();
    const tasks=new WorkspaceSemanticTaskStore('ws',workspace);
    const task:any={id:'t1',status:'submitted',request:'hello',context:{taskId:'t1',request:'hello',requirements:[],artifacts:[]}};
    tasks.set(task);
    const restoredTasks=new WorkspaceSemanticTaskStore('ws',workspace);await restoredTasks.hydrate();expect(restoredTasks.get('t1')).toEqual(task);
    const conversations=new WorkspaceSemanticConversationStore('ws',workspace);
    await conversations.append('s1',{id:'m1',role:'user',content:'hello',createdAt:new Date().toISOString()});
    const restoredConversations=new WorkspaceSemanticConversationStore('ws',workspace);expect((await restoredConversations.list('s1')).map(m=>m.content)).toEqual(['hello']);
  });
});
