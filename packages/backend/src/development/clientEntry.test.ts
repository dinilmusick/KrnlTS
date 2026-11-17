import { describe, expect, it } from 'vitest';
import { readFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CodeValidationServiceFacade } from './codeValidationService.js';
import { WebContainerServiceFacade } from './webContainerService.js';

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../');
const repositoryRoot = resolve(backendRoot, '../../');

describe('browser-safe development client entrypoint', () => {
  it('exports WebContainer and CodeValidation facades as client runtimes', () => {
    expect(WebContainerServiceFacade.runtime).toBe('client');
    expect(CodeValidationServiceFacade.runtime).toBe('client');
    expect(WebContainerServiceFacade.execute).toBeTypeOf('function');
    expect(CodeValidationServiceFacade.execute).toBeTypeOf('function');
  });

  it('emits the public development client runtime and type entrypoints', async () => {
    const manifest = JSON.parse(await readFile(resolve(repositoryRoot, 'package.json'), 'utf8'));
    const entry = manifest.exports['./development/client'];
    expect(entry).toBeDefined();
    await access(resolve(repositoryRoot, entry.import));
    await access(resolve(repositoryRoot, entry.types));
    const runtimeSource = await readFile(resolve(repositoryRoot, entry.import), 'utf8');
    expect(runtimeSource).not.toContain('createRequire');
    expect(runtimeSource).not.toContain('node:module');
    expect(runtimeSource).not.toMatch(/chunk-[A-Z0-9]+\.js/);
  });
});
