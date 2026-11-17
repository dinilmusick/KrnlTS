import {describe,expect,it} from 'vitest';
import {WorkspaceConversationStore,WorkspaceTaskStore} from '../src/workspaceStore.js';

class MemoryWorkspace {
  readonly files=new Map<string,string>();
  async readFile(_:string,path:string){const value=this.files.get(path);if(value===undefined)throw new Error('missing');return value;}
  async writeFile(_:string,path:string,content:string){this.files.set(path,content);}
  async deleteFile(_:string,path:string){this.files.delete(path);return {success:true};}
  async listFiles(_:string,path:string){return [...this.files.keys()].filter(k=>k.startsWith(path+'/')).map(k=>({name:k.split('/').pop()!,path:k}));}
}

describe('workspace semantic persistence',()=>{
  it('persists and hydrates tasks',async()=>{
    const workspace=new MemoryWorkspace();
    const store=new WorkspaceTaskStore(workspace as any,'ws');
    const task:any={id:'task-1',status:'submitted',request:'hello',context:{taskId:'task-1',request:'hello',requirements:[],artifacts:[]}};
    store.set(task);
    const restored=new WorkspaceTaskStore(workspace as any,'ws');
    await restored.hydrate();
    expect(restored.get('task-1')).toEqual(task);
  });
  it('persists and hydrates conversations',async()=>{
    const workspace=new MemoryWorkspace();
    const store=new WorkspaceConversationStore(workspace as any,'ws');
    const conversation={id:'conversation-1',messages:[],taskIds:[]};
    store.set(conversation);
    const restored=new WorkspaceConversationStore(workspace as any,'ws');
    await restored.hydrate();
    expect(restored.get(conversation.id)).toEqual(conversation);
  });
});
