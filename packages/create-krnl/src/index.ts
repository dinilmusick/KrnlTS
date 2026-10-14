#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { KrnlPackageReconciler } from '@dinilmusick/krnl-core';
import { getBasePackageJson, getTsConfig, getAppEntrypoint } from './templates/configTemplates.js';
import { scaffoldBackend } from './templates/backendTemplates.js';
import { scaffoldFrontend } from './templates/frontendTemplates.js';

const rawArg = process.argv[2] || 'my-krnl-app';
const targetDir = path.resolve(process.cwd(), rawArg);
const projectName = path.basename(targetDir);

console.log(`\n🚀 [create-krnl] Scaffolding new Krnl project in: ${targetDir}\n`);

if (fs.existsSync(targetDir)) {
  console.error(`❌ Directory "${projectName}" already exists.`);
  process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });

// 1. Base package.json, tsconfig, and app entrypoint
fs.writeFileSync(path.join(targetDir, 'package.json'), getBasePackageJson(projectName));
fs.writeFileSync(path.join(targetDir, 'tsconfig.json'), getTsConfig(projectName));
fs.writeFileSync(path.join(targetDir, `${projectName}.ts`), getAppEntrypoint(projectName));

// 2. Scaffold backend and frontend symmetric planes
scaffoldBackend(targetDir);
scaffoldFrontend(targetDir, projectName);

// 3. Reconcile package.json
KrnlPackageReconciler.reconcile(targetDir, true);

console.log(`\n🎉 Project successfully scaffolded at: ${targetDir}`);
console.log(`\nTo get started:\n  cd ${projectName}\n  pnpm install\n  krnl dev\n`);
