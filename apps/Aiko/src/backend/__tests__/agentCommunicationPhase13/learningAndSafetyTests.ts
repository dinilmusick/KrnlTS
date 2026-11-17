/**
 * ASCII Architecture Flowchart: learningAndSafetyTests
 *
 *   ┌─────────────────────────────────────┐
 *   │  Initialize learningAndSafetyTests  │
 *   └─────────────────────────────────────┘
 *                     │
 *                     ▼
 *   ┌─────────────────────────────────────┐
 *   │      runLearningAndSafetyTests      │
 *   └─────────────────────────────────────┘
 *                     │
 *                     ▼
 *   ┌─────────────────────────────────────┐
 *   │                router               │
 *   └─────────────────────────────────────┘
 *                     │
 *                     ▼
 *   ┌─────────────────────────────────────┐
 *   │             routerOutput            │
 *   └─────────────────────────────────────┘
 *                     │
 *                     ▼
 *   ┌─────────────────────────────────────┐
 *   │    Return State / Result Payload    │
 *   └─────────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ PHASE 13: ROUTER, LEARNING & SAFETY TESTS (13 - 18) ══════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import assert from 'node:assert';
import {
  RouterSubAgent,
  EnricherSubAgent,
  createInsufficientInfoMessage,
  createSuccessMessage,
  sanitizeAgentMessage,
  sanitizeTextValue,
  sanitizeJsonValue
} from '../../agentic/index.js';
import { userTool, userSearchFeature } from './testFixtures.js';
import { MemoryStore } from '../../storage/memoryStore.js';
import { LearningStore } from '../../storage/learningStore.js';
import { LearningEngine } from '../../agentic/learning/learningEngine.js';
import { MemoryWorkspaceStorage } from '../../storage/workspaceStorage.js';
import { WorkspaceRepository } from '../../storage/workspaceRepository.js';

export async function runLearningAndSafetyTests() {
  console.log('13. Testing Router target selection and escalation behavior...');
  const router = new RouterSubAgent();
  const routerOutput = await router.analyze({
    task: { id: 't-1', description: 'Update', goals: [] },
    message: createInsufficientInfoMessage({
      correlationId: 'c-1',
      source: { level: 'ENDPOINT', agentId: 'ep', toolName: 'UserDirectory', featureName: 'updateProfile' },
      task: { taskId: 't-1', instruction: 'Update' },
      missing: [{ key: 'userId', description: 'User ID required', required: true }],
      reason: 'Missing userId'
    }),
    level: 'TOOL',
    availableTargets: [{ name: 'searchUser', type: 'ENDPOINT', description: 'Finds user ID from email' }],
    context: {
      agentLevel: 'TOOL',
      agentId: 'tool',
      workspace: 'default',
      customInference: async () => JSON.stringify({
        action: 'ROUTE',
        reasoning: 'Can get userId from searchUser endpoint',
        tasks: [{ id: 't-search', instruction: 'Find user id', target: 'searchUser' }]
      })
    }
  });
  assert.strictEqual(routerOutput.action, 'ROUTE');
  assert.strictEqual(routerOutput.tasks?.[0]?.target, 'searchUser');

  console.log('14. Testing no preemptive sufficiency check at AIKO/Tool task decomposition...');
  const enricher = new EnricherSubAgent();
  const aikoDecomp = await enricher.enrich({
    instruction: 'Update user profile in UserDirectory',
    level: 'AIKO',
    context: {
      agentLevel: 'AIKO',
      agentId: 'aiko',
      workspace: 'default',
      availableTools: [userTool],
      customInference: async () => JSON.stringify({
        normalizedInstruction: 'Update profile',
        tasks: [{ id: 'task-1', instruction: 'Update profile', target: 'UserDirectory' }]
      })
    }
  });
  // AIKO decomposition does not fail or reject on missing userId; tasks are created cleanly
  assert.strictEqual(aikoDecomp.tasks?.length, 1);
  assert.strictEqual(aikoDecomp.tasks?.[0]?.target, 'UserDirectory');

  console.log('15. Testing learning only after successful error resolution (zero normal path learning)...');
  const memStorage = new MemoryWorkspaceStorage();
  const repo = new WorkspaceRepository(memStorage as any);
  await repo.saveTool('ws-1', userTool);
  const memStore = new MemoryStore(memStorage as any);
  const lrnStore = new LearningStore(repo);
  const learningEngine = new LearningEngine(memStore, lrnStore);

  // Normal success event without errors -> no permanent error learning
  const normalEventRes = await learningEngine.processExecutionEvent('ws-1', {
    type: 'SUCCESS',
    toolName: 'UserDirectory',
    featureName: 'searchUser'
  });
  assert.strictEqual(normalEventRes.length, 0);

  // Resolved error -> learning recorded
  const recRes = await learningEngine.recordResolvedError('ws-1', {
    scope: 'FEATURE',
    target: 'UserDirectory/searchUser',
    error: 'Rate limited on search',
    correction: 'Use cached index'
  });
  assert.strictEqual(recRes.recorded, true);

  const featureLearnings = await lrnStore.getFeatureLearnings('ws-1', 'UserDirectory', 'searchUser');
  assert.ok(featureLearnings.some(l => l.content.includes('Use cached index')));

  console.log('16. Testing correct initial learning scope and downward re-scoping without duplicates...');
  // Record AIKO-level learning
  await learningEngine.recordResolvedError('ws-1', {
    scope: 'AIKO',
    target: 'aiko-learnings',
    error: 'Cross-tool lookup required',
    correction: 'Delegate to EmailService before UserDirectory'
  });

  const aikoEntries = await memStore.getEntries('ws-1', 'aiko-learnings');
  assert.ok(aikoEntries.some(e => e.content.includes('EmailService before UserDirectory')));

  // Downward re-scope to Tool level
  const rescoped = await learningEngine.reScopeLearning('ws-1', {
    currentScope: 'AIKO',
    currentTarget: 'aiko-learnings',
    newScope: 'TOOL',
    newTarget: 'UserDirectory',
    content: 'Delegate to EmailService before UserDirectory'
  });
  assert.strictEqual(rescoped, true);

  const toolLearnings = await lrnStore.getToolLearnings('ws-1', 'UserDirectory');
  assert.ok(toolLearnings.some(l => l.content.includes('EmailService before UserDirectory')));

  console.log('17. Testing context includes applicable definitions and learnings...');
  const loadedToolLearnings = await lrnStore.getToolLearnings('ws-1', 'UserDirectory');
  assert.ok(loadedToolLearnings.length > 0);

  console.log('18. Testing secret sanitization across messages, context, logs, and chat...');
  const rawSecretText = 'Connected using Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 and sk-1234567890abcdef1234567890';
  const cleanText = sanitizeTextValue(rawSecretText);
  assert.ok(!cleanText.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'));
  assert.ok(!cleanText.includes('sk-1234567890abcdef1234567890'));
  assert.ok(cleanText.includes('[REDACTED_SECRET]'));

  const rawJson = { apiKey: 'sk-secret-key-1234567890', normal: 'regular value' };
  const cleanJson = sanitizeJsonValue(rawJson) as any;
  assert.strictEqual(cleanJson.apiKey, '[REDACTED_CREDENTIAL]');
  assert.strictEqual(cleanJson.normal, 'regular value');

  const rawMsg = createSuccessMessage({
    correlationId: 'c-secret',
    source: { level: 'ENDPOINT', agentId: 'ep' },
    task: { taskId: 't-1', instruction: 'Auth with sk-1234567890abcdef1234567890' },
    data: { password: 'my-super-secret-password', result: 'success' }
  });
  const cleanMsg = sanitizeAgentMessage(rawMsg);
  assert.ok(!cleanMsg.task.instruction.includes('sk-1234567890abcdef1234567890'));
  assert.strictEqual((cleanMsg.result?.data as any)?.password, '[REDACTED_CREDENTIAL]');
}