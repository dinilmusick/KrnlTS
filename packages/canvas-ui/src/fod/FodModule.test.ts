import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

describe('embedded FOD UI',()=>{
  it('uses the canonical graph surface with magnetic and predictive persistence hooks',()=>{
    const source=readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)),'FodModule.tsx'),'utf8');
    expect(source).toContain('FrnlEditableNodeGraph');
    expect(source).toContain('onMagneticTraceSolidify');
    expect(source).toContain('onPredictiveSolidify');
    expect(source).toContain('onPredictiveSolidifyAll');
  });
});
