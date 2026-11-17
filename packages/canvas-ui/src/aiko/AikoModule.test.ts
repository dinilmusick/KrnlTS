import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

describe('embedded Aiko UI',()=>{
 it('contains agent execution, custom agent authoring, and Aiko Engine key synchronization surfaces',()=>{
  const source=readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)),'AikoModule.tsx'),'utf8');
  expect(source).toContain('AikoRuntimeLike');
  expect(source).toContain('executeAgent');
  expect(source).toContain('syncFromAikoEngine');
  expect(source).toContain('Fetch from Aiko Engine');
  expect(source).toContain('emailGroup');
  expect(source).toContain('Rotate');
  expect(source).toContain('createCustomAgent');
  expect(source).toContain('listCapabilities');
  expect(source).toContain('Create Custom Agent');
 });
});
