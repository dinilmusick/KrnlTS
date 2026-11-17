import {describe,expect,it} from 'vitest';
import {FodFlowStore} from './flowStore.js';

describe('FodFlowStore',()=>{
  it('persists flows under the workspace FOD directory',async()=>{
    const files=new Map<string,string>();
    const workspace={
      listFiles:async(_id:string,folder:string)=>[...files.keys()].filter(key=>key.startsWith(folder+'/')).map(path=>({path,name:path.split('/').at(-1),isFolder:false})),
      readFile:async(_id:string,path:string)=>files.get(path)??'',
      writeFile:async(_id:string,path:string,content:string)=>{files.set(path,content);return {success:true,path}},
      deleteFile:async(_id:string,path:string)=>({success:files.delete(path)})
    };
    const store=new FodFlowStore(workspace);
    const flow:any={id:'hello',name:'Hello',version:1,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),nodes:[],edges:[]};
    await store.save('ws-1',flow);
    expect(files.has('FOD/hello.json')).toBe(true);
    expect((await store.get('ws-1','hello'))?.name).toBe('Hello');
    expect((await store.list('ws-1')).map(item=>item.id)).toEqual(['hello']);
  });
});
