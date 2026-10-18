import * as fs from 'fs';
import * as path from 'path';
import { getPlaneRoots } from './common.js';

export function generateOrchestration(name: string, projectRoot: string): void {
  const { backend } = getPlaneRoots(projectRoot);

  // Backend Orchestration
  const orchDir = path.join(backend, 'orchestrations', name);
  fs.mkdirSync(path.join(orchDir, 'tests'), { recursive: true });

  fs.writeFileSync(
    path.join(orchDir, `${name}Orchestration.ts`),
    `import { Orchestration } from '@ultrst-armada/krnl-core';

/**
 * @role orchestration
 * Declaratively composes functionalities into named flows.
 */
export class ${name}Orchestration extends Orchestration {
  constructor() {
    super({
      id: '${name}Orchestration',
      name: '${name}',
      version: '1.0.0',
      description: '${name} declarative orchestration flow',
    });

    this.flow('default')
      .thenFunctionality('Execute${name}')
      .register({ visibility: 'public' });
  }
}

export default ${name}Orchestration;
`
  );

  fs.writeFileSync(
    path.join(orchDir, 'tests', `${name}Orchestration.test.ts`),
    `import { describe, it, expect } from 'vitest';
import { ${name}Orchestration } from '../${name}Orchestration.js';

describe('${name}Orchestration', () => {
  it('instantiates and configures declarative flow correctly', () => {
    const orchestration = new ${name}Orchestration();
    expect(orchestration.id).toBe('${name}Orchestration');
    expect(orchestration.getFlow('default')).toBeDefined();
    expect(orchestration.getFlow('default')?.steps).toHaveLength(1);
  });
});
`
  );

  console.log(`✅ Created Orchestration: krnl/backend/orchestrations/${name}/`);
}
