// ══════════════════════════════════════════════════════════════════════════════════
// ════ PHASE 13: RECOVERY & RESUME TESTS (7 - 12) ═══════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import assert from 'node:assert';
import {
  createSuccessMessage,
  createFailureMessage,
  createInsufficientInfoMessage,
  validateAgentMessage,
  RouterSubAgent,
  EnricherSubAgent,
} from '../../agentic/index.js';
import { userTool } from './testFixtures.js';

export async function runRecoveryAndResumeTests() {
  console.log('7. Testing failure message schema and error code propagation...');
  const failMsg = createFailureMessage({
    correlationId: 'c-fail-1',
    source: { level: 'ENDPOINT', agentId: 'ep-1', toolName: 'UserDirectory', featureName: 'updateProfile' },
    task: { taskId: 't-fail-1', instruction: 'Update profile' },
    error: { code: 'VALIDATION_ERROR', source: 'EXECUTOR', message: 'Missing required field: userId', retryable: true },
  });
  assert.strictEqual(validateAgentMessage(failMsg).valid, true);
  assert.strictEqual(failMsg.status, 'FAILURE');
  assert.strictEqual(failMsg.error?.code, 'VALIDATION_ERROR');
  assert.strictEqual(failMsg.error?.retryable, true);

  console.log('8. Testing InsufficientInfo message schema with missing field list...');
  const insuffMsg = createInsufficientInfoMessage({
    correlationId: 'c-insuff-1',
    source: { level: 'TOOL', agentId: 'tool-1', toolName: 'UserDirectory' },
    task: { taskId: 't-insuff-1', instruction: 'Update profile' },
    missing: [
      { key: 'userId', description: 'User identifier', required: true },
      { key: 'email', description: 'User email for lookup', required: false },
    ],
    reason: 'Cannot update without userId',
  });
  assert.strictEqual(validateAgentMessage(insuffMsg).valid, true);
  assert.strictEqual(insuffMsg.status, 'INSUFFICIENT_INFORMATION');
  assert.strictEqual(insuffMsg.insufficiency?.missing?.length, 2);
  assert.strictEqual(insuffMsg.insufficiency?.missing?.[0]?.key, 'userId');

  console.log('9. Testing router ESCALATE action when no target resolves the missing info...');
  const router = new RouterSubAgent();
  const escalateOut = await router.analyze({
    task: { id: 't-esc', description: 'Update profile', goals: [] },
    message: insuffMsg,
    level: 'TOOL',
    availableTargets: [],
    context: {
      agentLevel: 'TOOL',
      agentId: 'tool-1',
      workspace: 'default',
      customInference: async () => JSON.stringify({
        action: 'ESCALATE',
        reasoning: 'No available target can supply userId',
        tasks: [],
      }),
    },
  });
  assert.strictEqual(escalateOut.action, 'ESCALATE');

  console.log('10. Testing router RETRY action for recoverable transient errors...');
  const retryOut = await router.analyze({
    task: { id: 't-retry', description: 'Retry fetch', goals: [] },
    message: createFailureMessage({
      correlationId: 'c-retry',
      source: { level: 'ENDPOINT', agentId: 'ep-retry' },
      task: { taskId: 't-retry', instruction: 'Fetch user data' },
      error: { code: 'TIMEOUT', source: 'TRANSPORT', message: 'Request timed out', retryable: true },
    }),
    level: 'ENDPOINT',
    availableTargets: [{ name: 'UserDirectory', type: 'ENDPOINT', description: 'User data store' }],
    context: {
      agentLevel: 'ENDPOINT',
      agentId: 'ep-retry',
      workspace: 'default',
      customInference: async () => JSON.stringify({
        action: 'RETRY',
        reasoning: 'Transient timeout — safe to retry same endpoint',
        tasks: [{ id: 't-r2', instruction: 'Retry user fetch', target: 'UserDirectory' }],
      }),
    },
  });
  assert.strictEqual(retryOut.action, 'RETRY');

  console.log('11. Testing enricher normalizes instruction before task decomposition...');
  const enricher = new EnricherSubAgent();
  const enrichOut = await enricher.enrich({
    instruction: '   update  the  user  profile  for   userId=123  ',
    level: 'TOOL',
    context: {
      agentLevel: 'TOOL',
      agentId: 'tool-1',
      workspace: 'default',
      availableTools: [userTool],
      customInference: async () => JSON.stringify({
        normalizedInstruction: 'Update the user profile for userId=123',
        tasks: [
          { id: 't-enrich-1', instruction: 'Update profile', target: 'UserDirectory' },
        ],
      }),
    },
  });
  assert.ok(enrichOut.tasks && enrichOut.tasks.length >= 1);
  assert.strictEqual(enrichOut.tasks?.[0]?.target, 'UserDirectory');

  console.log('12. Testing success message carries result data and correlationId...');
  const successMsg = createSuccessMessage({
    correlationId: 'c-success-resume',
    source: { level: 'ENDPOINT', agentId: 'ep-success', toolName: 'UserDirectory', featureName: 'searchUser' },
    task: { taskId: 't-success', instruction: 'Search user by email' },
    data: { userId: 'u-42', email: 'user@example.com', name: 'Test User' },
  });
  assert.strictEqual(successMsg.status, 'SUCCESS');
  assert.strictEqual(successMsg.correlationId, 'c-success-resume');
  assert.strictEqual((successMsg.result?.data as any)?.userId, 'u-42');
  assert.strictEqual(validateAgentMessage(successMsg).valid, true);
}
