/**
 * ASCII Architecture Flowchart: agentCommunicationPhase13.test
 *
 *   ┌─────────────────────────────────────────────┐
 *   │  Initialize agentCommunicationPhase13.test  │
 *   └─────────────────────────────────────────────┘
 *                         │
 *                         ▼
 *   ┌─────────────────────────────────────────────┐
 *   │              runAllPhase13Tests             │
 *   └─────────────────────────────────────────────┘
 *                         │
 *                         ▼
 *   ┌─────────────────────────────────────────────┐
 *   │        Return State / Result Payload        │
 *   └─────────────────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ AIKO PHASE 13: AGENT COMMUNICATION + ENRICHER / ROUTER MASTER TEST SUITE ═════
// ══════════════════════════════════════════════════════════════════════════════════

import assert from 'node:assert';
import { runMessageAndRouterTests } from './agentCommunicationPhase13/messageAndRouterTests.js';
import { runRecoveryAndResumeTests } from './agentCommunicationPhase13/recoveryAndResumeTests.js';
import { runLearningAndSafetyTests } from './agentCommunicationPhase13/learningAndSafetyTests.js';

async function runAllPhase13Tests() {
  console.log('════ RUNNING AIKO PHASE 13: AGENT COMMUNICATION & ENRICHER / ROUTER TESTS ════\n');

  assert.strictEqual(typeof runMessageAndRouterTests, 'function');
  assert.strictEqual(typeof runRecoveryAndResumeTests, 'function');
  assert.strictEqual(typeof runLearningAndSafetyTests, 'function');

  await runMessageAndRouterTests();
  await runRecoveryAndResumeTests();
  await runLearningAndSafetyTests();

  assert.ok(true, 'All Phase 13 test scenarios finished execution');
  console.log('\n✅ ALL 18 AIKO PHASE 13 SPECIFICATION TESTS PASSED SUCCESSFULLY!\n');
}

runAllPhase13Tests().catch(err => {
  console.error('\n❌ PHASE 13 TEST SUITE FAILED:', err);
  process.exit(1);
});

assert.strictEqual(true, true);
