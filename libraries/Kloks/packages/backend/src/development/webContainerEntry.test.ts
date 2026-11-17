import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { WebContainerServiceFacade } from './webContainerService.js';

describe('browser-safe WebContainer package entrypoint', () => {
  it('exports the client WebContainer facade from its isolated source module', () => {
    expect(WebContainerServiceFacade.runtime).toBe('client');
    expect(WebContainerServiceFacade.execute).toBeTypeOf('function');
  });

  it('maps the dedicated package subpath directly to the WebContainer module', async () => {
    const packageJson = JSON.parse(await readFile(resolve(process.cwd(), 'package.json'), 'utf8'));
    expect(packageJson.exports['./development/webcontainer']).toEqual({
      types: './packages/backend/dist/development/webContainerService.d.ts',
      import: './packages/backend/dist/development/webContainerService.js',
      default: './packages/backend/dist/development/webContainerService.js',
    });
  });
});
