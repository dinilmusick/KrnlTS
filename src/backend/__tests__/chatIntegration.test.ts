/**
 * ASCII Architecture Flowchart: chatIntegration.test
 *
 *   ┌───────────────────────────────────┐
 *   │  Initialize chatIntegration.test  │
 *   └───────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌───────────────────────────────────┐
 *   │            docuFeature            │
 *   └───────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌───────────────────────────────────┐
 *   │              toolDocu             │
 *   └───────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌───────────────────────────────────┐
 *   │             toolSlack             │
 *   └───────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌───────────────────────────────────┐
 *   │   Return State / Result Payload   │
 *   └───────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ AIKO CHAT & TOOL MENTION INTEGRATION COMPREHENSIVE TESTS ═════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import assert from 'node:assert';
import { parseMessage } from '../agentic/chat/messageParser.js';
import { getMentionAutocomplete, applyMentionSelection } from '../agentic/chat/autocomplete.js';
import { ChatExecutionBridge } from '../agentic/chat/chatExecutionBridge.js';
import { AikoAgent } from '../agentic/aikoAgent/AikoAgent.js';
import { ToolAgent } from '../agentic/toolAgent/ToolAgent.js';
import { ToolDefinition, FeatureDefinition } from '../types/tools.js';
import { WorkspaceRepository } from '../storage/workspaceRepository.js';
import { MemoryWorkspaceStorage } from '../storage/workspaceStorage.js';

console.log('════ RUNNING AIKO CHAT & TOOL MENTION TESTS ════\n');

const docuFeature: FeatureDefinition = {
  schemaVersion: '1.0.0',
  name: 'readDoc',
  description: 'Reads document by ID',
  endpoint: { method: 'POST', path: '/doc/read' },
  input: { schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }, description: 'doc id' },
  examples: [{ payload: { id: 'doc-1' } }],
  output: { schema: { type: 'object', properties: { content: { type: 'string' } }, required: ['content'] }, description: 'doc content', resultMeaning: 'Found doc' },
  learnings: []
};

const toolDocu: ToolDefinition = {
  schemaVersion: '1.0.0',
  name: 'DocuStack',
  description: 'Enterprise Document Knowledge System',
  type: 'LOCAL',
  endpointBase: { protocol: 'https', domain: 'docs.corp.internal', port: 443 },
  features: [docuFeature],
  learnings: []
};

const toolSlack: ToolDefinition = {
  schemaVersion: '1.0.0',
  name: 'SlackNotifier',
  description: 'Slack channel notifications tool',
  type: 'LOCAL',
  endpointBase: { protocol: 'https', domain: 'slack.corp.internal', port: 443 },
  features: [{
    schemaVersion: '1.0.0',
    name: 'postMsg',
    description: 'Posts message',
    endpoint: { method: 'POST', path: '/msg' },
    input: { schema: { type: 'object', properties: { msg: { type: 'string' } }, required: ['msg'] }, description: 'msg' },
    examples: [{ payload: { msg: 'hi' } }],
    output: { schema: { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'] }, description: 'status', resultMeaning: 'posted' },
    learnings: []
  }],
  learnings: []
};

async function runTests() {
  const tools = [toolDocu, toolSlack];

  console.log('1. Testing @Tool mention parsing, offsets, and mixed text...');
  const p1 = parseMessage('Please check @DocuStack for quarterly revenue reports', tools);
  assert.strictEqual(p1.mentions.length, 1);
  assert.strictEqual(p1.mentions[0].toolName, 'DocuStack');
  assert.strictEqual(p1.cleanedQuery, 'Please check for quarterly revenue reports');
  assert.strictEqual(p1.resolvedTools.length, 1);
  assert.strictEqual(p1.resolvedTools[0].name, 'DocuStack');

  console.log('2. Testing multiple tool mentions & canonical resolution...');
  const p2 = parseMessage('@DocuStack retrieve invoices and ping @SlackNotifier immediately', tools);
  assert.strictEqual(p2.mentions.length, 2);
  assert.strictEqual(p2.resolvedTools.length, 2);
  assert.strictEqual(p2.unknownMentions.length, 0);

  console.log('3. Testing unknown tool mention rejection...');
  const p3 = parseMessage('@UnknownGhostTool execute something', tools);
  assert.strictEqual(p3.unknownMentions.length, 1);
  assert.strictEqual(p3.unknownMentions[0], 'UnknownGhostTool');
  assert.strictEqual(p3.resolvedTools.length, 0);

  console.log('4. Testing autocomplete suggestions & selection insertion...');
  const auto1 = getMentionAutocomplete('Check @doc', 10, tools);
  assert.strictEqual(auto1.isOpen, true);
  assert.strictEqual(auto1.suggestions.length, 1);
  assert.strictEqual(auto1.suggestions[0].name, 'DocuStack');

  const { newText, newCursor } = applyMentionSelection('Check @doc', auto1.startIndex, auto1.endIndex, 'DocuStack');
  assert.strictEqual(newText, 'Check @DocuStack ');
  assert.strictEqual(newCursor, 17);

  console.log('5. Testing workspace-specific tools & workspace switching...');
  const memStorage = new MemoryWorkspaceStorage();
  const repo = new WorkspaceRepository(memStorage);
  await repo.saveTool('ws-finance', toolDocu);
  await repo.saveTool('ws-ops', toolSlack);

  const finTools = await repo.listTools('ws-finance');
  const opsTools = await repo.listTools('ws-ops');
  assert.deepStrictEqual(finTools, ['docustack']);
  assert.deepStrictEqual(opsTools, ['slacknotifier']);

  console.log('6. Testing ChatExecutionBridge explicit routing & execution state...');
  const mockFetch: typeof fetch = async () => new Response(JSON.stringify({ content: 'Report data' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });

  const toolAgent = new ToolAgent(undefined, { customFetch: mockFetch });
  const aikoAgent = new AikoAgent(toolAgent, repo);
  const bridge = new ChatExecutionBridge(aikoAgent, repo);

  const resChat = await bridge.executeChat({
    workspace: 'ws-finance',
    query: '@DocuStack get doc-1',
    customInference: async (prompt) => {
      if (prompt.includes('for Tool "DocuStack"')) {
        return JSON.stringify({
          tasks: [{ id: 't1', instruction: 'Read doc-1', featureName: 'readDoc', dependsOn: [] }]
        });
      }
      if (prompt.includes('Tool Reasoning & Synthesis Agent')) {
        return JSON.stringify({ isComplete: true, finalResult: { content: 'Report data' } });
      }
      if (prompt.includes('Endpoint Payload Generation Agent')) {
        return JSON.stringify({ id: 'doc-1' });
      }
      if (prompt.includes('Synthesize the final response')) {
        return JSON.stringify({ isComplete: true, response: 'Successfully retrieved document.' });
      }
      return '{}';
    }
  });

  assert.strictEqual(resChat.success, true);
  assert.strictEqual(resChat.message.toolMentions?.length, 1);
  assert.strictEqual(resChat.message.agentExecution?.phase, 'RESULT');
  assert.strictEqual(resChat.message.agentExecution?.tools[0].toolName, 'DocuStack');

  console.log('7. Testing unknown tool chat error with zero secret leakage...');
  const resBadChat = await bridge.executeChat({
    workspace: 'ws-finance',
    query: '@GhostApp perform magic with Bearer sk-secret-123'
  });

  assert.strictEqual(resBadChat.success, false);
  assert.strictEqual(resBadChat.message.error, true);
  assert.ok(resBadChat.message.content.includes('TOOL_NOT_FOUND'));
  assert.strictEqual(resBadChat.message.content.includes('sk-secret-123'), false);

  console.log('✅ ALL AIKO CHAT & TOOL MENTION TESTS PASSED SUCCESSFULLY!\n');
}

runTests().catch(err => {
  console.error('❌ AIKO CHAT & TOOL MENTION TESTS FAILED:');
  console.error(err);
  process.exit(1);
});

assert.strictEqual(true, true);
