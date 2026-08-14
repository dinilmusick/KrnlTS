import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testFiles = [
  'test_gross_architecture.js',
  'test_subapp_refactoring.js',
  'example16/run_test.js',
  'frontend_demo/run.js',
  'magnetic_demo/run.js',
  'example1/run_example.js',
  'test_schema.js',
  'test_registry.js',
  'test_resilience.js',
  'test_telemetry.js',
  'test_proto_schema.js'
];

console.log('====================================================');
console.log('  KrnlTS Unified UI & Core Suite Master Verification');
console.log('====================================================\n');

let passed = 0;
let failed = 0;

for (const testFile of testFiles) {
  const fullPath = path.join(__dirname, testFile);
  console.log(`▶ Running Test Suite: ${testFile}`);
  try {
    const output = execSync(`node "${fullPath}"`, {
      cwd: __dirname,
      encoding: 'utf-8',
      timeout: 120000
    });
    console.log(`✔ Passed: ${testFile}`);
    if (output && output.trim()) {
      console.log(output.trim().split('\n').map(l => `    ${l}`).join('\n'));
    }
    passed++;
  } catch (err) {
    console.error(`❌ Failed: ${testFile}`);
    console.error(err.stdout || err.stderr || err.message);
    failed++;
  }
  console.log('----------------------------------------------------');
}

console.log(`\nFinal Suite Summary: ${passed} Passed, ${failed} Failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL EXAMPLES AND UI TESTS PASSED SUCCESSFULLY!');
}
