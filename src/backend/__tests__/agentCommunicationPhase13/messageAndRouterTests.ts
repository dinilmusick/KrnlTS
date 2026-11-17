/**
 * ASCII Architecture Flowchart: messageAndRouterTests
 *
 *   ┌────────────────────────────────────┐
 *   │  Initialize messageAndRouterTests  │
 *   └────────────────────────────────────┘
 *                     │
 *                     ▼
 *   ┌────────────────────────────────────┐
 *   │      runMessageAndRouterTests      │
 *   └────────────────────────────────────┘
 *                     │
 *                     ▼
 *   ┌────────────────────────────────────┐
 *   │             successMsg             │
 *   └────────────────────────────────────┘
 *                     │
 *                     ▼
 *   ┌────────────────────────────────────┐
 *   │                val1                │
 *   └────────────────────────────────────┘
 *                     │
 *                     ▼
 *   ┌────────────────────────────────────┐
 *   │   Return State / Result Payload    │
 *   └────────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ PHASE 13: MESSAGE CONTRACT & ROUTER TESTS (1 - 6) ═══════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import assert from 'node:assert';
import {
  AgentMessage,
  validateAgentMessage,
  createSuccessMessage,
  createFailureMessage,
  createInsufficientInfoMessage,
  EndpointAgent,
  ToolAgent,
  AgentContext
} from '../../agentic/index.js';
import { userTool, userUpdateFeature, userSearchFeature } from './testFixtures.js';

export async function runMessageAndRouterTests() {
  console.log('1. Testing common message schema validation across all agent levels...');
  const successMsg = createSuccessMessage({
    correlationId: 'corr-101',
    source: { level: 'ENDPOINT', agentId: 'ep-1', toolName: 'UserTool', featureName: 'searchUser' },
    task: { taskId: 't-1', instruction: 'Find user' },
    data: { userId: 'usr-42' }
  });
  const val1 = validateAgentMessage(successMsg);
  assert.strictEqual(val1.valid, true);

  const failMsg = createFailureMessage({
    correlationId: 'corr-101',
    source: { level: 'TOOL', agentId: 'tool-1', toolName: 'UserTool' },
    task: { taskId: 't-2', instruction: 'Update' },
    error: { code: 'HTTP_500', source: 'TRANSPORT', message: 'Server down', retryable: false }
  });
  const val2 = validateAgentMessage(failMsg);
  assert.strictEqual(val2.valid, true);

  const insufMsg = createInsufficientInfoMessage({
    correlationId: 'corr-101',
    source: { level: 'AIKO', agentId: 'aiko-1' },
    task: { taskId: 't-3', instruction: 'Process' },
    missing: [{ key: 'userId', description: 'User ID required', required: true }],
    reason: 'Missing userId'
  });
  const val3 = validateAgentMessage(insufMsg);
  assert.strictEqual(val3.valid, true);

  console.log('2. Testing success propagation and structured result consumption...');
  const epAgent = new EndpointAgent(undefined, {
    customFetch: async () => new Response(JSON.stringify({ userId: 'usr-999', email: 'test@corp.com' }), { status: 200 })
  });

  const epContext: AgentContext = {
    agentLevel: 'ENDPOINT',
    agentId: 'ep-agent',
    workspace: 'default',
    toolDefinition: userTool,
    featureDefinition: userSearchFeature,
    customInference: async () => JSON.stringify({ normalizedInstruction: 'Search', structuredPayload: { email: 'test@corp.com' } })
  };

  const epResult = await epAgent.executeTask({ taskId: 'task-s-1', instruction: 'Search test@corp.com' }, epContext, 'corr-202');
  assert.strictEqual(epResult.status, 'SUCCESS');
  assert.strictEqual((epResult.result?.data as any)?.userId, 'usr-999');

  console.log('3. Testing endpoint insufficiency -> Tool Agent escalation...');
  const insufficientEpAgent = new EndpointAgent();
  const epInsufContext: AgentContext = {
    agentLevel: 'ENDPOINT',
    agentId: 'ep-agent',
    workspace: 'default',
    toolDefinition: userTool,
    featureDefinition: userUpdateFeature,
    customInference: async () => JSON.stringify({ normalizedInstruction: 'Update profile', structuredPayload: {} })
  };

  const epInsufResult = await insufficientEpAgent.executeTask(
    { taskId: 'task-insuf-1', instruction: 'Set department to Engineering' },
    epInsufContext,
    'corr-303'
  );
  assert.strictEqual(epInsufResult.status, 'INSUFFICIENT_INFORMATION');
  assert.ok(epInsufResult.insufficiency?.missing.some(m => m.key === 'userId'));

  console.log('4. Testing endpoint failure -> Tool Agent escalation...');
  const failingEpAgent = new EndpointAgent(undefined, {
    customFetch: async () => new Response(JSON.stringify({ error: 'Database locked' }), { status: 500 })
  });
  const epFailContext: AgentContext = {
    agentLevel: 'ENDPOINT',
    agentId: 'ep-agent',
    workspace: 'default',
    toolDefinition: userTool,
    featureDefinition: userSearchFeature,
    customInference: async () => JSON.stringify({ normalizedInstruction: 'Search', structuredPayload: { email: 'fail@corp.com' } })
  };

  const epFailResult = await failingEpAgent.executeTask(
    { taskId: 'task-fail-1', instruction: 'Search fail@corp.com' },
    epFailContext,
    'corr-404'
  );
  assert.strictEqual(epFailResult.status, 'FAILURE');
  assert.ok(epFailResult.error?.message.includes('500') || epFailResult.error?.message.includes('Database locked'));

  console.log('5. Testing tool recovery through sibling endpoint in same tool...');
  const mockToolFetch: typeof fetch = async (url) => {
    const u = String(url);
    if (u.includes('/users/search')) {
      return new Response(JSON.stringify({ userId: 'usr-auto-found', email: 'alice@corp.local' }), { status: 200 });
    }
    if (u.includes('/users/update')) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  };

  const toolAgent = new ToolAgent(new EndpointAgent(undefined, { customFetch: mockToolFetch }));
  const toolContext: AgentContext = {
    agentLevel: 'TOOL',
    agentId: 'tool-user',
    workspace: 'default',
    toolDefinition: userTool,
    customInference: async (prompt) => {
      if (prompt.includes('Tool Router Sub-Agent')) {
        return JSON.stringify({
          action: 'ROUTE',
          tasks: [{ id: 'rec-1', instruction: 'Search user alice@corp.local to get userId', target: 'searchUser' }]
        });
      }
      if (prompt.includes('Tool Enricher Sub-Agent')) {
        return JSON.stringify({ normalizedInstruction: 'Tool task', tasks: [{ id: 'up-1', instruction: 'Update Alice dept to Engineering', target: 'updateProfile' }] });
      }
      if (prompt.includes('updateProfile')) {
        if (prompt.includes('usr-auto-found')) {
          return JSON.stringify({ normalizedInstruction: 'Update', structuredPayload: { userId: 'usr-auto-found', department: 'Engineering' } });
        }
        return JSON.stringify({ normalizedInstruction: 'Update without userId', structuredPayload: { department: 'Engineering' } });
      }
      if (prompt.includes('searchUser')) {
        return JSON.stringify({ normalizedInstruction: 'Search user', structuredPayload: { email: 'alice@corp.local' } });
      }
      return JSON.stringify({ normalizedInstruction: 'Tool task', tasks: [{ id: 'up-1', instruction: 'Update Alice dept to Engineering', target: 'updateProfile' }] });
    }
  };

  const toolRecoveryMsg = await toolAgent.executeToolTask(
    { taskId: 'tool-t-1', instruction: 'Update Alice department to Engineering' },
    toolContext,
    'corr-505'
  );
  assert.strictEqual(toolRecoveryMsg.status, 'SUCCESS');

  console.log('6. Testing tool escalation to AIKO Agent when tool has no sibling capable...');
  const unresolvableToolContext: AgentContext = {
    agentLevel: 'TOOL',
    agentId: 'tool-user',
    workspace: 'default',
    toolDefinition: userTool,
    customInference: async (prompt) => {
      if (prompt.includes('Tool Router Sub-Agent')) {
        return JSON.stringify({ action: 'ESCALATE', reasoning: 'Cannot resolve missing info in UserDirectory' });
      }
      return JSON.stringify({ normalizedInstruction: 'Update', structuredPayload: { department: 'Sales' } });
    }
  };

  const toolEscalateMsg = await toolAgent.executeToolTask(
    { taskId: 'tool-t-2', instruction: 'Update unknown user' },
    unresolvableToolContext,
    'corr-606'
  );
  assert.strictEqual(toolEscalateMsg.status, 'INSUFFICIENT_INFORMATION');
}