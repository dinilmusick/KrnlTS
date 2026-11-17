/**
 * @file env-node.ts
 * @description Node-only .env file loading.
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Loads a .env file and injects variables into process.env.
 */
export function loadEnv(filePath?: string): void {
  const file = filePath || path.join(process.cwd(), '.env');
  if (!fs.existsSync(file)) return;

  try {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const equalsIndex = trimmed.indexOf('=');
      if (equalsIndex === -1) continue;

      const key = trimmed.slice(0, equalsIndex).trim();
      let value = trimmed.slice(equalsIndex + 1).trim();

      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }

      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {}
}
