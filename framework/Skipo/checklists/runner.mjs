#!/usr/bin/env node
/**
 * checklists/runner.mjs - Node.js ESM bridge runner for Skipo Dynamic Checklist Validators.
 * Provides seamless integration with npm scripts, pnpm, and CI environments.
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const validatorPy = path.join(__dirname, 'full_system_validator.py');

const args = process.argv.slice(2);
const pythonCmd = process.env.PYTHON_BIN || 'python3';

const child = spawn(pythonCmd, [validatorPy, ...args], {
  stdio: 'inherit'
});

child.on('error', (err) => {
  if (err.code === 'ENOENT') {
    console.error(`\n❌ Error: '${pythonCmd}' not found in PATH.`);
    console.error(`Skipo Dynamic Checklists require Python 3 (standard library).`);
    console.error(`Please ensure Python 3 is installed, or set PYTHON_BIN=/path/to/python3.\n`);
  } else {
    console.error(`\n❌ Failed to launch checklist validator:`, err);
  }
  process.exit(1);
});

child.on('close', (code) => {
  process.exit(code ?? 1);
});
