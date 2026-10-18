/**
 * @file build.ts
 * @description Production build runner reconciling manifests, validating purity, and compiling TypeScript.
 */

import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { KrnlPackageReconciler } from '@ultrst-armada/krnl-core';
import { runValidate } from './validate.js';
import { generateMagneticDeclarations } from './watch.js';

export interface BuildOptions {
  service?: string;
  orchestration?: string;
  all?: boolean;
}

export async function runBuild(
  projectRoot: string = process.cwd(),
  options: BuildOptions = {}
): Promise<{ success: boolean; error?: string }> {
  // 1. Reconcile package dependencies from manifests
  KrnlPackageReconciler.reconcile(projectRoot, true);

  const target = options.service || options.orchestration;
  if (target) {
    console.log(`🏗️  [Krnl Build] Target service/orchestration variant: "${target}"`);
  } else if (options.all) {
    console.log(`🏗️  [Krnl Build] Combined multi-service build`);
  }

  // 2. Validate AST and 4-layer purity
  console.log('🔍 [Krnl Build] Running AST & layer purity validation...');
  const valid = await runValidate(projectRoot);
  if (!valid) {
    console.error('❌ [Krnl Build] Build aborted due to validation errors.');
    return { success: false, error: 'Validation failed' };
  }

  // 3. Generate ambient declarations
  generateMagneticDeclarations(projectRoot);

  // 4. Compile project if tsconfig.json is present
  const tsConfigPath = path.join(projectRoot, 'tsconfig.json');
  if (fs.existsSync(tsConfigPath)) {
    console.log('🏗️  [Krnl Build] Compiling TypeScript source files to dist/...');
    const localTsc = path.join(projectRoot, 'node_modules', '.bin', 'tsc');
    const tscCmd = fs.existsSync(localTsc) ? localTsc : 'tsc';
    try {
      execSync(`${tscCmd} -p tsconfig.json`, { cwd: projectRoot, stdio: 'inherit' });
    } catch (err: any) {
      console.error('❌ [Krnl Build] TypeScript compilation failed.');
      return { success: false, error: 'TypeScript compilation failed' };
    }
  } else {
    console.log('ℹ️  [Krnl Build] No tsconfig.json found; skipping TypeScript compiler invocation.');
  }

  console.log('✅ [Krnl Build] Project validation, declaration generation, and compilation completed successfully.');
  return { success: true };
}
