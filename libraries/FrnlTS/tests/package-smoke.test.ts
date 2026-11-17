import { describe, expect, it } from 'vitest';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('package distribution smoke test', () => {
  it('imports built artifacts from @ultrst-armada/frnlts distribution', async () => {
    const root = await import(path.join(rootDir, 'dist/index.js'));
    const react = await import(path.join(rootDir, 'dist/react/index.js'));
    const runtime = await import(path.join(rootDir, 'dist/runtime/index.js'));

    expect(typeof root.defineFrnlComponent).toBe('function');
    expect(typeof root.createFrnlStore).toBe('function');
    expect(typeof react.useFrnlComponent).toBe('function');
    expect('FrnlSlot' in react).toBe(false);
    expect(typeof runtime.createFrnlStore).toBe('function');
    expect(typeof runtime.defineFrnlComponent).toBe('function');
    expect(typeof runtime.createFrnlFacade).toBe('function');
    expect('FrnlPrimitive' in react).toBe(false);
    expect('FrnlComposite' in react).toBe(false);
  });

  it('imports built artifacts from workspace packages', async () => {
    const validate = await import(path.join(rootDir, 'packages/validate/dist/index.js'));
    const cli = await import(path.join(rootDir, 'packages/cli/dist/index.js'));

    expect(typeof validate.validateFrnlWorkspace).toBe('function');
    expect(typeof validate.checkComponentRules).toBe('undefined'); // internal rule
    expect(typeof cli.runFrnlCli).toBe('function');
    expect(typeof cli.generateComponent).toBe('function');
  });
});
