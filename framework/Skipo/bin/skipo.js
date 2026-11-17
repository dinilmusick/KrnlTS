#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const args = process.argv.slice(2);
const frameworkCommands = new Set(['create', 'inspect', 'check', 'fix', 'update', 'test']);
const script = frameworkCommands.has(args[0])
  ? resolve(__dirname, '../scripts/skipo_cli.py')
  : resolve(__dirname, '../scripts/skipo_builder.py');

const child = spawn('python3', [script, ...args], { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));
