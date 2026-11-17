#!/usr/bin/env node
/**
 * mutators/runner.mjs - Node.js bridge for Skipo Deterministic Codebase Mutators.
 * Spawns python3 mutators/mutate.py seamlessly across platforms.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pythonScript = join(__dirname, 'mutate.py');
const forwardedArgs = process.argv.slice(2).filter(arg => arg !== '--');
const args = [pythonScript, ...forwardedArgs];

const child = spawn('python3', args, {
  stdio: 'inherit',
  shell: false
});

child.on('error', (err) => {
  console.error('\x1b[91m✖ Failed to spawn python3:\x1b[0m', err.message);
  console.error('\x1b[93m💡 Ensure Python 3 is installed and available in PATH.\x1b[0m');
  process.exit(1);
});

child.on('close', (code) => {
  process.exit(code ?? 0);
});
