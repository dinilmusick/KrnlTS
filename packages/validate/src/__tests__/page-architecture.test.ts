import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { checkFrnlPageArchitecture } from '../workspaceRules.js';

function fixture(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'frnl-page-validation-'));
}

describe('Frnl page architecture validation', () => {
  it('accepts facade-backed pages and Frnl orchestrations', () => {
    const root = fixture();
    fs.mkdirSync(path.join(root, 'src/frontend/pages/home/orchestrations'), { recursive: true });
    fs.mkdirSync(path.join(root, 'src/frontend/components'), { recursive: true });
    fs.writeFileSync(path.join(root, 'src/frontend/components/components.ts'), 'export {};');
    fs.writeFileSync(path.join(root, 'src/frontend/pages/home/page.tsx'), "import { FrnlPage } from '../../components/components.js';");
    fs.writeFileSync(
      path.join(root, 'src/frontend/pages/home/orchestrations/Save.ts'),
      "import { defineFrnlOrchestration } from '@ultrst-armada/frnlts';\nexport const Save = defineFrnlOrchestration({ id: 'home.Save', name: 'Save', setup: () => undefined });",
    );
    expect(checkFrnlPageArchitecture(root)).toEqual([]);
  });

  it('rejects extra frontend roots, direct page UI imports, and invalid orchestration files', () => {
    const root = fixture();
    fs.mkdirSync(path.join(root, 'src/frontend/frontend-state'), { recursive: true });
    fs.mkdirSync(path.join(root, 'src/frontend/pages/home/orchestrations'), { recursive: true });
    fs.mkdirSync(path.join(root, 'src/frontend/components'), { recursive: true });
    fs.writeFileSync(path.join(root, 'src/frontend/pages/home/page.tsx'), "import { ButtonParent } from '@ultrst-armada/floks/ui';");
    fs.writeFileSync(path.join(root, 'src/frontend/pages/home/orchestrations/Bad.ts'), 'export const Bad = 1;');
    const ids = checkFrnlPageArchitecture(root).map((d) => d.ruleId);
    expect(ids).toContain('frnl/frontend-boundary');
    expect(ids).toContain('frnl/page-component-facade');
    expect(ids).toContain('frnl/orchestration-definition-required');
  });
});
