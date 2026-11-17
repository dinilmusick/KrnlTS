import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkComponentRules } from '../rules/componentRules.js';
import { checkFileLimits, checkImportRules, FRNL_COMPONENT_MAX_LINES, FRNL_EVENT_MAX_SUBSTANTIVE_LINES } from '../rules/fileLimits.js';
import { checkComponentScaffolds } from '../workspaceRules.js';
import { formatValidation, validateFrnlWorkspace } from '../index.js';

describe('Frnl structural validation', () => {
  it('rejects multiple React components in one file', () => {
    const source = `export function A(){ return <div/>; }\nexport function B(){ return <span/>; }`;
    expect(checkComponentRules('A.tsx', source).some((d) => d.ruleId === 'frnl/one-component-per-file')).toBe(true);
  });

  it('rejects a nested component declaration', () => {
    const source = `export function A(){ function B(){ return <span/>; } return <B/>; }`;
    expect(checkComponentRules('A.tsx', source).some((d) => d.ruleId === 'frnl/no-nested-component-declaration')).toBe(true);
  });

  it('enforces the component hard line limit below 200', () => {
    const source = Array.from({ length: FRNL_COMPONENT_MAX_LINES + 1 }, () => 'x').join('\n');
    expect(checkFileLimits('A.tsx', source).some((d) => d.ruleId === 'frnl/component-line-limit')).toBe(true);
  });

  it('enforces small substantive-line limit on state event implementations to mandate Library delegation', () => {
    const lines = [
      'export function IdleClick(payload: unknown, context: any) {',
      ...Array.from({ length: FRNL_EVENT_MAX_SUBSTANTIVE_LINES + 1 }, (_, i) => `  const x${i} = ${i};`),
      '}',
    ];
    const source = lines.join('\n');
    const filePath = '/project/components/Button/States/Idle/Events/Click.ts';
    const diagnostics = checkFileLimits(filePath, source);
    expect(diagnostics.some((d) => d.ruleId === 'frnl/event-main-delegation')).toBe(true);
  });

  it('enforces .js suffixes on relative imports for NodeNext compliance', () => {
    const badSource = `import { foo } from './foo';\nimport { bar } from './bar.js';`;
    const diagnostics = checkImportRules('test.ts', badSource);
    expect(diagnostics.some((d) => d.ruleId === 'frnl/import-suffix' && d.message.includes('./foo'))).toBe(true);
    expect(diagnostics.some((d) => d.message.includes('./bar.js'))).toBe(false);
  });

  it('verifies component States and Libraries scaffold and state Events directory', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'frnl-scaffold-test-'));
    const compDir = path.join(tmp, 'components', 'Test');
    fs.mkdirSync(compDir, { recursive: true });
    fs.writeFileSync(path.join(compDir, 'Test.tsx'), 'export function Test() { return <div/>; }');

    // Missing States and Libraries
    let diags = checkComponentScaffolds(tmp);
    expect(diags.some((d) => d.ruleId === 'frnl/component-states-scaffold')).toBe(true);
    expect(diags.some((d) => d.ruleId === 'frnl/component-libraries-scaffold')).toBe(true);

    // Add States and Libraries, but state missing Events/
    const idleDir = path.join(compDir, 'States', 'Idle');
    fs.mkdirSync(idleDir, { recursive: true });
    fs.mkdirSync(path.join(compDir, 'Libraries'), { recursive: true });

    diags = checkComponentScaffolds(tmp);
    expect(diags.some((d) => d.ruleId === 'frnl/state-events-scaffold')).toBe(true);

    // Add Events/
    fs.mkdirSync(path.join(idleDir, 'Events'), { recursive: true });
    diags = checkComponentScaffolds(tmp);
    expect(diags.filter((d) => d.severity === 'error')).toHaveLength(0);
  });

  it('validates workspace and formats output', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'frnl-ws-test-'));
    const result = validateFrnlWorkspace(tmp);
    expect(result.passed).toBe(true);
    const formatted = formatValidation(result);
    expect(formatted).toContain('Checked 0 files. Errors: 0. Warnings: 0.');
  });
});
