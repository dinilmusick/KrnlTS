/**
 * @file browser-safe.test.ts
 * @description Verifies that Kloks browser-safe client export has zero server-only dependency closure.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  BrowserExecutionClient,
  createBrowserExecutionClient,
} from '../packages/client/src/index.js';

describe('Kloks Browser-Safe Client Export Boundary', () => {
  it('client bundle contains no forbidden server-only module imports', () => {
    const distPath = path.resolve(__dirname, '../packages/client/dist/index.js');
    expect(fs.existsSync(distPath)).toBe(true);
    const content = fs.readFileSync(distPath, 'utf8');

    const forbiddenImports = [
      'node:fs',
      'node:path',
      'node:process',
      'node:events',
      'node:crypto',
      'node:buffer',
      'node:http',
      'node:https',
      'from "fs"',
      "from 'fs'",
      'from "path"',
      "from 'path'",
      'from "bullmq"',
      "from 'bullmq'",
      'from "redis"',
      "from 'redis'",
      'from "ioredis"',
      "from 'ioredis'",
      'from "better-sqlite3"',
      "from 'better-sqlite3'",
      '@aws-sdk',
      '@neondatabase',
      'bcryptjs',
    ];

    for (const forbidden of forbiddenImports) {
      expect(content).not.toContain(forbidden);
    }
  });

  it('BrowserExecutionClient operates without Node globals or server dependencies', () => {
    const client = createBrowserExecutionClient({
      gatewayUrl: 'https://example.com/api/queue',
    });

    expect(client).toBeInstanceOf(BrowserExecutionClient);

    const cmd = client.createCommand('workspace.create', {
      name: 'Test Project',
      owner: 'user-1',
    });

    expect(cmd.id).toBeDefined();
    expect(cmd.type).toBe('workspace.create');
    expect(cmd.payload).toEqual({ name: 'Test Project', owner: 'user-1' });
    expect(cmd.correlationId).toBeDefined();
    expect(typeof cmd.createdAt).toBe('number');
  });
});
