/**
 * ASCII Architecture Flowchart: intelligenceSpecModelRouting.test
 *
 *   ┌────────────────────────────────────────────────┐
 *   │  Initialize intelligenceSpecModelRouting.test  │
 *   └────────────────────────────────────────────────┘
 *                           │
 *                           ▼
 *   ┌────────────────────────────────────────────────┐
 *   │                  testFeature                   │
 *   └────────────────────────────────────────────────┘
 *                           │
 *                           ▼
 *   ┌────────────────────────────────────────────────┐
 *   │                    testTool                    │
 *   └────────────────────────────────────────────────┘
 *                           │
 *                           ▼
 *   ┌────────────────────────────────────────────────┐
 *   │                    runTests                    │
 *   └────────────────────────────────────────────────┘
 *                           │
 *                           ▼
 *   ┌────────────────────────────────────────────────┐
 *   │         Return State / Result Payload          │
 *   └────────────────────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ PHASE 12: INTELLIGENCE SPEC & MODEL ROUTING TEST SUITE ════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import assert from 'node:assert';
import { IntelligenceSpecResolver } from '../agentic/intelligenceSpecResolver.js';
import { ModelRouter } from '../agentic/modelRouter.js';
import { presetsStorage } from '../storage/presetsStorage.js';
import { specToTensor, createDefaultIntelligenceSpec } from '../intelligence/helpers.js';
import { ToolAgent } from '../agentic/toolAgent/ToolAgent.js';
import { EndpointAgent } from '../agentic/endpointAgent/EndpointAgent.js';
import { AikoAgent } from '../agentic/aikoAgent/AikoAgent.js';
import { MemoryWorkspaceStorage } from '../storage/workspaceStorage.js';
import { WorkspaceRepository } from '../storage/workspaceRepository.js';
import { ToolDefinition, FeatureDefinition } from '../types/tools.js';

console.log('════ RUNNING AIKO PHASE 12: INTELLIGENCE SPEC & MODEL ROUTING TESTS ════\n');

const testFeature: FeatureDefinition = {
  schemaVersion: '1.0.0', name: 'calculateTax', description: 'Calculate tax for an item',
  endpoint: { method: 'POST', path: '/tax/calc' },
  input: { schema: { type: 'object', properties: { amount: { type: 'number' } }, required: ['amount'] }, description: 'Amount input' },
  examples: [{ payload: { amount: 100 } }],
  output: { schema: { type: 'object' }, description: 'Tax amount', resultMeaning: 'Tax result' },
  learnings: [], intelligenceSpecId: 'preset-code'
};

const testTool: ToolDefinition = {
  schemaVersion: '1.0.0', name: 'TaxService', description: 'Tax calculation tools', type: 'LOCAL',
  endpointBase: { protocol: 'https', domain: 'localhost', port: 3000 },
  features: [testFeature], learnings: [], intelligenceSpecId: 'preset-logic'
};

async function runTests() {
  try {
    // 1. AIKO default spec resolution
    console.log('1. Testing AIKO default spec resolution...');
    const aikoRes = IntelligenceSpecResolver.resolveAgentModel('AIKO');
    assert.strictEqual(aikoRes.specId, 'preset-agent');
    assert.ok(aikoRes.profile.intelligenceSpec);

    // 2. Tool spec resolution
    console.log('2. Testing Tool spec resolution...');
    const toolRes = IntelligenceSpecResolver.resolveAgentModel('TOOL', { tool: testTool });
    assert.strictEqual(toolRes.specId, 'preset-logic');
    assert.strictEqual(toolRes.profile.prioritiseReasoning, true);

    // 3. Feature spec resolution
    console.log('3. Testing Feature spec resolution...');
    const featRes = IntelligenceSpecResolver.resolveAgentModel('ENDPOINT', { tool: testTool, feature: testFeature });
    assert.strictEqual(featRes.specId, 'preset-code');
    assert.strictEqual(featRes.profile.prioritiseDeterminism, true);

    // 4. Parent / Default Fallback
    console.log('4. Testing Parent/Default fallback...');
    const fallbackFeat: FeatureDefinition = { ...testFeature, intelligenceSpecId: undefined };
    const toolFallbackRes = IntelligenceSpecResolver.resolveAgentModel('ENDPOINT', { tool: testTool, feature: fallbackFeat });
    assert.strictEqual(toolFallbackRes.specId, 'preset-logic', 'Should inherit parent tool spec');

    const noSpecTool: ToolDefinition = { ...testTool, intelligenceSpecId: undefined };
    const defaultFallbackRes = IntelligenceSpecResolver.resolveAgentModel('TOOL', { tool: noSpecTool });
    assert.strictEqual(defaultFallbackRes.specId, 'preset-agent', 'Should fall back to default agent preset');

    // 5. Explicit Agent override
    console.log('5. Testing Explicit Agent Spec override...');
    const explicitRes = IntelligenceSpecResolver.resolveAgentModel('ENDPOINT', {
      explicitSpecId: 'preset-data', tool: testTool, feature: testFeature
    });
    assert.strictEqual(explicitRes.specId, 'preset-data');

    // 6. Dynamic Preset Change
    console.log('6. Testing dynamic preset modifications affecting resolution...');
    const customPresetId = 'preset-custom-dyn-test';
    presetsStorage.savePreset({
      id: customPresetId, name: 'Dynamic Test Preset', description: 'Test description', sigilId: 'sigil-logic',
      tensor: specToTensor(createDefaultIntelligenceSpec({ reasoning: 10, coding: 10 })),
      prioritiseReasoning: true, prioritiseDeterminism: false, avoidPaidProviders: true, isDefault: false, createdAt: new Date().toISOString()
    });
    const dynamicRes = IntelligenceSpecResolver.resolve(customPresetId);
    assert.strictEqual(dynamicRes.profile.avoidPaidProviders, true);
    assert.strictEqual(dynamicRes.profile.prioritiseReasoning, true);

    // 7. ModelRouter invocation & observability
    console.log('7. Testing ModelRouter invocation & observability...');
    const customInference = async (prompt: string) => JSON.stringify({ amount: 100 });
    const modelRes = await ModelRouter.invoke(dynamicRes.profile, 'Test prompt', { customInference });
    assert.strictEqual(modelRes.providerUsed, 'custom');
    assert.ok(modelRes.tokensEstimate > 0);

    const obsRecord = ModelRouter.createObservabilityRecord({
      agentType: 'ENDPOINT', intelligenceSpecId: customPresetId, resolvedModelId: 'test-model',
      providerId: 'google', durationMs: 45, tokensEstimate: 120, success: true
    });
    assert.strictEqual(obsRecord.agentType, 'ENDPOINT');
    assert.strictEqual(obsRecord.intelligenceSpecId, customPresetId);

    // 8. Agent Execution with Intelligence Spec
    console.log('8. Testing EndpointAgent execution with Intelligence Spec metadata...');
    const endpointAgent = new EndpointAgent(undefined, {
      customFetch: async () => new Response(JSON.stringify({ tax: 15 }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    });
    const epResult = await endpointAgent.execute({
      task: 'Calculate tax for 100', tool: testTool, feature: testFeature, workspace: 'ws-test',
      customInference: async () => JSON.stringify({ amount: 100 })
    });
    assert.strictEqual(epResult.success, true);
    assert.strictEqual(epResult.intelligenceSpecId, 'preset-code');

    // 9. ToolAgent Execution with Intelligence Spec
    console.log('9. Testing ToolAgent execution with Intelligence Spec metadata...');
    const toolAgent = new ToolAgent(endpointAgent);
    const toolAgentRes = await toolAgent.execute({
      tool: testTool, workspace: 'ws-test', query: 'Compute tax for $100',
      customInference: async (prompt) => {
        if (prompt.includes('Tool Orchestration & Decomposition')) {
          return JSON.stringify({ tasks: [{ id: 't1', instruction: 'Calculate tax for 100', featureName: 'calculateTax', dependsOn: [] }] });
        }
        if (prompt.includes('Endpoint Payload Generation')) return JSON.stringify({ amount: 100 });
        return JSON.stringify({ isComplete: true, finalResult: { tax: 15 } });
      }
    });
    assert.strictEqual(toolAgentRes.success, true);
    assert.strictEqual(toolAgentRes.intelligenceSpecId, 'preset-logic');

    // 10. AikoAgent Execution with Intelligence Spec
    console.log('10. Testing AikoAgent execution with Intelligence Spec metadata...');
    const memStorage = new MemoryWorkspaceStorage();
    const repo = new WorkspaceRepository(memStorage);
    await repo.saveTool('ws-test', testTool);

    const aikoAgent = new AikoAgent(toolAgent, repo);
    const aikoResult = await aikoAgent.execute({
      query: '@TaxService Compute tax for $100', workspace: 'ws-test',
      customInference: async (prompt) => {
        if (prompt.includes('Tool Orchestration & Decomposition')) {
          return JSON.stringify({ tasks: [{ id: 't1', instruction: 'Calculate tax for 100', featureName: 'calculateTax', dependsOn: [] }] });
        }
        if (prompt.includes('Endpoint Payload Generation')) return JSON.stringify({ amount: 100 });
        return JSON.stringify({ isComplete: true, response: 'Tax is $15', finalResult: { tax: 15 } });
      }
    });
    assert.strictEqual(aikoResult.success, true);
    assert.strictEqual(aikoResult.intelligenceSpecId, 'preset-agent');

    console.log('\n✅ ALL AIKO PHASE 12: INTELLIGENCE SPEC & MODEL ROUTING TESTS PASSED!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST FAILED WITH ERROR:', err);
    process.exit(1);
  }
}

runTests();

assert.strictEqual(true, true);
