/**
 * @file browser-safe.test.ts
 * @description Verifies that Floks UI and Canvas-UI bundles contain zero server-only modules.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Floks Browser-Safe Export Boundary', () => {
  it('UI and Canvas-UI distribution bundles contain zero server-only dependencies', () => {
    const bundles = [
      path.resolve(__dirname, '../packages/ui/dist/index.js'),
      path.resolve(__dirname, '../packages/canvas-ui/dist/index.js'),
      path.resolve(__dirname, '../packages/contracts/dist/index.js'),
    ];

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
      'kloks/backend',
      '@ultrst-armada/kloks/backend',
    ];

    for (const bundlePath of bundles) {
      if (fs.existsSync(bundlePath)) {
        const content = fs.readFileSync(bundlePath, 'utf8');
        for (const forbidden of forbiddenImports) {
          expect(content).not.toContain(forbidden);
        }
      }
    }
  });
});
