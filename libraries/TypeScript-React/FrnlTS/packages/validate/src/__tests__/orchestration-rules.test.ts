import { describe, expect, it } from 'vitest';
import { checkOrchestrationRules, FRNL_ORCHESTRATION_MAX_LINES } from '../rules/orchestrationRules.js';

describe('Frnl orchestration validation', () => {
  it('accepts a valid page orchestration', () => {
    const source = "import { defineFrnlOrchestration } from '@ultrst-armada/frnlts';\nexport const Save = defineFrnlOrchestration({ id: 'settings.Save', name: 'Save', setup: () => undefined });";
    expect(checkOrchestrationRules('/project/pages/settings/orchestrations/Save.ts', source)).toEqual([]);
  });

  it('rejects orchestration files over the hard line limit', () => {
    const source = [
      "import { defineFrnlOrchestration } from '@ultrst-armada/frnlts';",
      ...Array.from({ length: FRNL_ORCHESTRATION_MAX_LINES }, () => 'void 0;'),
      'export const Save = defineFrnlOrchestration({ id: "settings.Save", name: "Save", setup: () => undefined });',
    ].join('\n');
    expect(checkOrchestrationRules('/project/pages/settings/orchestrations/Save.ts', source).some((d) => d.ruleId === 'frnl/orchestration-line-limit')).toBe(true);
  });

  it('rejects arbitrary files placed in an orchestration directory', () => {
    const source = 'export const value = 1;';
    expect(checkOrchestrationRules('/project/pages/settings/orchestrations/Save.ts', source).some((d) => d.ruleId === 'frnl/orchestration-definition-required')).toBe(true);
  });
});
