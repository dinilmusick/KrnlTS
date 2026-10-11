#!/usr/bin/env node
import { KrnlBuildValidator } from '../krnl/tools/K_LIB_Krnl_Build_Validator.js';
import { KrnlSourceAnalyzer } from '../krnl/tools/K_LIB_Krnl_Source_Analyzer.js';
import * as path from 'path';

const projectRoot = process.cwd();
console.log(`[KrnlTS Validate] Validating project at: ${projectRoot}\n`);

let hasErrors = false;

// ── 1. Manifest (krnl.json) dependency validation ──────────────────────────
try {
  const result = KrnlBuildValidator.validateProject(projectRoot);
  if (!result.valid) {
    console.error('❌ [MANIFEST VALIDATION FAILED]');
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    hasErrors = true;
  } else {
    console.log('✅ Manifest (krnl.json) dependency validation passed.');
  }
} catch (err: any) {
  console.error(`\n❌ [MANIFEST VALIDATION ERROR] ${err.message}`);
  hasErrors = true;
}

// ── 2. Source analysis (boot order + uiSpec constraints) ───────────────────
try {
  const result = KrnlSourceAnalyzer.validateProject(projectRoot);

  if (result.warnings.length > 0) {
    console.warn('\n⚠️  [SOURCE ANALYSIS WARNINGS]');
    for (const w of result.warnings) {
      console.warn(`  - ${w}`);
    }
  }

  if (!result.valid) {
    console.error('\n❌ [SOURCE ANALYSIS FAILED]');
    for (const err of result.errors) {
      console.error(`\n  ❌ ${err}`);
    }
    console.error(`
╔══════════════════════════════════════════════════════════════════════════════╗
║  KRNLTS BOOT ORDER CONSTRAINT VIOLATED                                      ║
║                                                                              ║
║  Rule: ALL addLocal() calls with uiSpec must come BEFORE                    ║
║        KrnlMagneticLoader.loadAll() in boot().                               ║
║                                                                              ║
║  Why: MagneticLoader.loadAll() calls KrnlFrontendGenerator.generate()       ║
║       internally. At that moment, any addLocal() calls not yet executed     ║
║       are invisible → the generator produces a blank "No UI endpoints" UI.  ║
║                                                                              ║
║  Fix: Move all this.addLocal({ id: "...", uiSpec: {...}, api: ... })        ║
║       calls to BEFORE the KrnlMagneticLoader.loadAll(this, projectRoot)     ║
║       line in your entity's boot() method.                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
    hasErrors = true;
  } else {
    console.log('✅ Source analysis (boot order + uiSpec constraints) passed.');
  }
} catch (err: any) {
  console.error(`\n❌ [SOURCE ANALYSIS ERROR] ${err.message}`);
  hasErrors = true;
}

if (hasErrors) {
  process.exit(1);
} else {
  console.log('\n✅ All KrnlTS validations passed cleanly.');
  process.exit(0);
}
