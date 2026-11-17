import { describe, expect, it } from 'vitest';
import { WebContainerServiceDefinition, resolveWebContainerCommand } from './webContainerService.js';
import { resolveDevelopmentCommand } from './developmentService.js';

describe('WebContainerService', () => {
  it('exposes the canonical lifecycle, execution and isolated-session surface', () => {
    expect(Object.keys(WebContainerServiceDefinition.operations)).toEqual([
      'boot', 'mount', 'run', 'runCommand', 'spawnCommand', 'teardown', 'command',
    ]);
  });

  it.each([
    ['install', ['install', '--frozen-lockfile']],
    ['lint', ['lint']],
    ['test', ['test']],
    ['build', ['build']],
    ['validate', ['validate']],
    ['check', ['lint']],
  ] as const)('resolves %s consistently across development entry points', (task, args) => {
    const expected = { command: 'pnpm', args: [...args] };
    expect(resolveWebContainerCommand(task)).toEqual(expected);
    expect(resolveDevelopmentCommand(task)).toEqual(['pnpm', [...args]]);
  });

  it('returns defensive command arguments', () => {
    const first = resolveWebContainerCommand('test');
    first.args.push('--mutated');
    expect(resolveWebContainerCommand('test').args).toEqual(['test']);
  });
});
