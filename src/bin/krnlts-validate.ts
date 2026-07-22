#!/usr/bin/env node
import { KrnlBuildValidator } from '../krnl/tools/K_LIB_Krnl_Build_Validator.js';
import * as path from 'path';

const projectRoot = process.cwd();
console.log(`[KrnlTS Build Validator] Validating project manifest at: ${projectRoot}`);

try {
  const result = KrnlBuildValidator.validateProject(projectRoot);
  if (!result.valid) {
    console.error('\n❌ [KRNLTS BUILD VALIDATION FAILED]');
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  } else {
    console.log('✅ [KrnlTS Build Validator] krnl.json dependency validation passed cleanly.');
    process.exit(0);
  }
} catch (err: any) {
  console.error(`\n❌ [KRNLTS BUILD VALIDATION ERROR] ${err.message}`);
  process.exit(1);
}
