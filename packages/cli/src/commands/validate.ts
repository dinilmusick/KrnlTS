import { KrnlValidatorEngine } from '@ultrst-armada/krnl-validate';

export async function runValidate(projectRoot: string = process.cwd()): Promise<boolean> {
  console.log(`\n🔍 [Krnl Validate] Scanning project at: ${projectRoot}\n`);
  
  const validator = new KrnlValidatorEngine({ projectRoot });
  const report = validator.validateAll();

  if (report.warnings.length > 0) {
    console.warn(`⚠️  [WARNINGS] Found ${report.warnings.length} warning(s):`);
    for (const w of report.warnings) {
      console.warn(`  - [${w.ruleId}] ${w.filePath}${w.line ? `:${w.line}` : ''}: ${w.message}`);
    }
  }

  if (!report.valid) {
    console.error(`\n❌ [VALIDATION FAILED] Found ${report.errors.length} error(s):\n`);
    for (const err of report.errors) {
      console.error(`  ❌ [${err.ruleId}] ${err.filePath}${err.line ? `:${err.line}` : ''}`);
      console.error(`     ${err.message}\n`);
    }
    return false;
  }

  console.log(`✅ [VALIDATION PASSED] ${report.totalFiles} source files verified clean against Krnl paradigms.\n`);
  return true;
}
