import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { generateComponent } from '../generators/componentGenerator.js';

describe('Frnl component generator', () => {
  it('generates a complete deterministic component scaffold', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'frnl-'));
    const dir = generateComponent('Button', root, { states: ['Idle', 'Loading'], events: ['Click', 'Focus'] });
    const expected = [
      'Button.tsx',
      'definition.ts',
      'events.ts',
      'index.ts',
      'States/Idle/state.ts',
      'States/Idle/VisualParameters.ts',
      'States/Idle/Events/Click.ts',
      'States/Idle/Events/Focus.ts',
      'States/Loading/state.ts',
      'States/Loading/VisualParameters.ts',
      'States/Loading/Events/Click.ts',
      'States/Loading/Events/Focus.ts',
      'Libraries/functions/index.ts',
      'Libraries/data/index.ts',
      'Libraries/structs/index.ts',
      'Libraries/index.ts',
    ];
    for (const relative of expected) expect(fs.existsSync(path.join(dir, relative))).toBe(true);
  });

  it('adds states and events through deterministic generators', async () => {
    const { generateState, generateEvent } = await import('../generators/componentGenerator.js');
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'frnl-incremental-'));
    generateComponent('Card', root);
    generateState('Card', 'Loading', root);
    generateEvent('Card', 'Loading', 'Click', root);
    expect(fs.existsSync(path.join(root, 'components/Card/States/Loading/state.ts'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'components/Card/States/Loading/Events/Click.ts'))).toBe(true);
    expect(fs.readFileSync(path.join(root, 'components/Card/definition.ts'), 'utf8')).toContain('LoadingState');
    expect(fs.readFileSync(path.join(root, 'components/Card/States/Loading/state.ts'), 'utf8')).toContain('Card.Loading.Click');
  });

  it('generates library files and wires them to category index', async () => {
    const { generateLibrary } = await import('../generators/componentGenerator.js');
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'frnl-lib-'));
    generateComponent('Modal', root);
    generateLibrary('Modal', 'functions', 'positioning', root);

    const libFile = path.join(root, 'components/Modal/Libraries/functions/positioning.ts');
    expect(fs.existsSync(libFile)).toBe(true);
    const categoryIndex = path.join(root, 'components/Modal/Libraries/functions/index.ts');
    expect(fs.readFileSync(categoryIndex, 'utf8')).toContain("export * from './positioning.js';");
  });

  it('generates scaffolds that pass Frnl workspace validation', async () => {
    const { validateFrnlWorkspace } = await import('@ultrst-armada/frnlts-validate');
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'frnl-scaffold-val-'));
    generateComponent('Dialog', root, { states: ['Idle', 'Open'], events: ['Click', 'Close'] });

    const result = validateFrnlWorkspace(root);
    expect(result.errors).toHaveLength(0);
    expect(result.passed).toBe(true);
  });

  it('executes CLI commands via runFrnlCli', async () => {
    const { runFrnlCli } = await import('../index.js');
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'frnl-cli-test-'));
    const prevCwd = process.cwd();
    try {
      process.chdir(root);
      const code1 = await runFrnlCli(['generate', 'component', 'Banner', '--state=Visible', '--event=Dismiss']);
      expect(code1).toBe(0);
      expect(fs.existsSync(path.join(root, 'components/Banner/Banner.tsx'))).toBe(true);

      const code2 = await runFrnlCli(['generate', 'state', 'Banner', 'Hidden']);
      expect(code2).toBe(0);
      expect(fs.existsSync(path.join(root, 'components/Banner/States/Hidden/state.ts'))).toBe(true);

      const code3 = await runFrnlCli(['generate', 'event', 'Banner', 'Hidden', 'Restore']);
      expect(code3).toBe(0);
      expect(fs.existsSync(path.join(root, 'components/Banner/States/Hidden/Events/Restore.ts'))).toBe(true);

      const code4 = await runFrnlCli(['generate', 'library', 'Banner', 'functions', 'animations']);
      expect(code4).toBe(0);
      expect(fs.existsSync(path.join(root, 'components/Banner/Libraries/functions/animations.ts'))).toBe(true);

      const code5 = await runFrnlCli(['validate']);
      expect(code5).toBe(0);

      const code6 = await runFrnlCli(['inspect', 'component', 'Banner']);
      expect(code6).toBe(0);
    } finally {
      process.chdir(prevCwd);
    }
  });
});
