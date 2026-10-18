import * as path from 'path';
import * as fs from 'fs';
import { getPlaneRoots } from './common.js';

export function generateFunctionalityOrchestration(name: string, projectRoot: string): void {
  const { backend } = getPlaneRoots(projectRoot);

  // Backend Functionality Orchestration
  const orchDir = path.join(backend, 'orchestrations', name);
  fs.mkdirSync(path.join(orchDir, 'tests'), { recursive: true });

  fs.writeFileSync(
    path.join(orchDir, `${name}FunctionalityOrchestration.ts`),
    `import { FunctionalityOrchestration } from '@ultrst-armada/krnl-core';

/**
 * @role functionality-orchestration
 * Declaratively composes functionalities within this service into named flows.
 */
export class ${name}FunctionalityOrchestration extends FunctionalityOrchestration {
  constructor() {
    super({
      id: '${name}FunctionalityOrchestration',
      name: '${name}',
      version: '1.0.0',
      description: '${name} declarative functionality orchestration flow',
    });

    this.flow('default')
      .thenFunctionality('Execute${name}')
      .register({ visibility: 'public' });
  }
}

export default ${name}FunctionalityOrchestration;
`
  );

  fs.writeFileSync(
    path.join(orchDir, 'tests', `${name}FunctionalityOrchestration.test.ts`),
    `import { describe, it, expect } from 'vitest';
import { ${name}FunctionalityOrchestration } from '../${name}FunctionalityOrchestration.js';

describe('${name}FunctionalityOrchestration', () => {
  it('instantiates and configures declarative functionality flow correctly', () => {
    const orchestration = new ${name}FunctionalityOrchestration();
    expect(orchestration.id).toBe('${name}FunctionalityOrchestration');
    expect(orchestration.getFlow('default')).toBeDefined();
    expect(orchestration.getFlow('default')?.steps).toHaveLength(1);
  });
});
`
  );

  console.log(`✅ Created FunctionalityOrchestration: krnl/backend/orchestrations/${name}/`);
}

/** @deprecated Alias for generateFunctionalityOrchestration */
export const generateOrchestration = generateFunctionalityOrchestration;
