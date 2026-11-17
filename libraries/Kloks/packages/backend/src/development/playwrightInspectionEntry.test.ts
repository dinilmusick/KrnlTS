import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../');
const repositoryRoot = resolve(backendRoot, '../../');

describe('published Kloks browser inspection entrypoint', () => {
  it('emits the service and type files referenced by the public export map', async () => {
    const manifest = JSON.parse(await readFile(resolve(repositoryRoot, 'package.json'), 'utf8'));
    const entry = manifest.exports['./browser-inspection'];
    expect(entry).toBeDefined();
    await access(resolve(repositoryRoot, entry.import));
    await access(resolve(repositoryRoot, entry.types));
  });
});
