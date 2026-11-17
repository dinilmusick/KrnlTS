// ══════════════════════════════════════════════════════════════════════════════════
// ════ AGENT INTELLIGENCE SPEC & SUBAGENT SPAWNING END-TO-END TESTS ═════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import assert from 'node:assert';
import { ToolManagerService } from '../agentic/toolManager/ToolManagerService.js';
import { IntelligenceSpecResolver } from '../agentic/intelligenceSpecResolver.js';
import { AikoAgent } from '../agentic/aikoAgent/AikoAgent.js';
import { ToolAgent } from '../agentic/toolAgent/ToolAgent.js';
import { EndpointAgent } from '../agentic/endpointAgent/EndpointAgent.js';
import { WorkspaceRepository } from '../storage/workspaceRepository.js';
import { workspaceFS } from '../storage/workspaceFileSystem.js';

async function runTests() {
  console.log('════ STARTING AGENT INTELLIGENCE SPEC E2E TEST SUITE ════');
  const ws = `test-specs-${Date.now()}`;
  const repo = new WorkspaceRepository(workspaceFS);
  const manager = new ToolManagerService(repo);

  // 1. Programmatically create a new tool with agent definition and subagent intelligence specs
  console.log('1. Testing programmatic tool creation with agent & subagents...');
  const createdTool = await manager.createTool(ws, {
    name: 'StockAnalytics',
    description: 'Real-time stock analytics and prediction platform',
    intelligenceSpecId: 'preset-logic',
    routerSpecId: 'preset-agent',
    enhancerSpecId: 'preset-code'
  });

  assert.ok(createdTool.agent, 'Tool must have first-class agent definition');
  assert.ok(createdTool.agent.subAgents.router, 'Tool agent must have router subagent');
  assert.ok(createdTool.agent.subAgents.enhancer, 'Tool agent must have enhancer subagent');
  assert.strictEqual(createdTool.agent.subAgents.router.intelligenceSpecId, 'preset-agent');
  assert.strictEqual(createdTool.agent.subAgents.enhancer.intelligenceSpecId, 'preset-code');
  assert.strictEqual(createdTool.agent.intelligenceSpecs?.router, 'preset-agent');

  // 2. Programmatically add an endpoint with agent definition and subagent intelligence specs
  console.log('2. Testing programmatic endpoint addition with agent & subagents...');
  const endpointRes = await manager.addEndpoint(ws, 'StockAnalytics', {
    name: 'predictPrice',
    description: 'Predict next day stock price based on historical trends',
    method: 'POST',
    path: '/predict',
    routerSpecId: 'preset-logic',
    enhancerSpecId: 'preset-data',
    inputSchema: { type: 'object', properties: { ticker: { type: 'string' } }, required: ['ticker'] }
  });

  const feat = endpointRes.feature;
  assert.ok(feat.agent, 'Endpoint must have first-class agent definition');
  assert.ok(feat.agent.subAgents.router, 'Endpoint agent must have router subagent');
  assert.ok(feat.agent.subAgents.enhancer, 'Endpoint agent must have enhancer subagent');
  assert.strictEqual(feat.agent.subAgents.router.intelligenceSpecId, 'preset-logic');
  assert.strictEqual(feat.agent.subAgents.enhancer.intelligenceSpecId, 'preset-data');

  // 3. Verify subagent model resolution matches the configured intelligence specs
  console.log('3. Testing model resolution for subagents of tool and endpoint...');
  const toolRouterRes = IntelligenceSpecResolver.resolveAgentModel('TOOL', {
    tool: createdTool,
    subAgentRole: 'router'
  });
  assert.strictEqual(toolRouterRes.specId, 'preset-agent');

  const toolEnhancerRes = IntelligenceSpecResolver.resolveAgentModel('TOOL', {
    tool: createdTool,
    subAgentRole: 'enhancer'
  });
  assert.strictEqual(toolEnhancerRes.specId, 'preset-code');

  const endpointRouterRes = IntelligenceSpecResolver.resolveAgentModel('ENDPOINT', {
    tool: createdTool,
    feature: feat,
    subAgentRole: 'router'
  });
  assert.strictEqual(endpointRouterRes.specId, 'preset-logic');

  const endpointEnhancerRes = IntelligenceSpecResolver.resolveAgentModel('ENDPOINT', {
    tool: createdTool,
    feature: feat,
    subAgentRole: 'enhancer'
  });
  assert.strictEqual(endpointEnhancerRes.specId, 'preset-data');

  // 4. Update intelligence spec of subagent dynamically
  console.log('4. Testing dynamic update of subagent intelligence spec...');
  const updateRes = await manager.setAgentIntelligenceSpec(ws, {
    toolName: 'StockAnalytics',
    featureName: 'predictPrice',
    subAgentRole: 'enhancer',
    intelligenceSpecId: 'preset-logic'
  });
  assert.strictEqual(updateRes.success, true);
  assert.strictEqual(updateRes.updatedAgent.subAgents.enhancer?.intelligenceSpecId, 'preset-logic');

  // 5. Spawning ToolAgent and EndpointAgent uses the resolved intelligence metadata
  console.log('5. Testing ToolAgent & EndpointAgent instantiation and execution with specs...');
  const updatedTool = await manager.getTool(ws, 'StockAnalytics');
  const updatedFeat = updatedTool.features.find(f => f.name.toLowerCase() === 'predictprice')!;
  const endpointAgent = new EndpointAgent();
  const execResult = await endpointAgent.execute({
    workspace: ws,
    tool: updatedTool,
    feature: updatedFeat,
    task: 'Predict next day price for AAPL',
    customInference: async () => JSON.stringify({ ticker: 'AAPL' })
  });
  assert.strictEqual(execResult.intelligenceSpecId, 'preset-logic');

  // 6. AikoAgent discovers ToolManager tool and can execute operations without manual user work
  console.log('6. Testing AikoAgent autonomous tool discovery & ToolManager integration...');
  const aikoAgent = new AikoAgent();
  const aikoRes = await aikoAgent.execute({
    workspace: ws,
    query: '@ToolManager list all tools in this workspace',
    customInference: async (prompt) => {
      if (prompt.includes('for Tool "ToolManager"')) {
        return JSON.stringify({
          tasks: [{ id: 't1', instruction: 'List tools', featureName: 'listTools', dependsOn: [] }]
        });
      }
      if (prompt.includes('Tool Reasoning & Synthesis Agent')) {
        return JSON.stringify({ isComplete: true, finalResult: { count: 2, tools: ['StockAnalytics', 'ToolManager'] } });
      }
      if (prompt.includes('Endpoint Payload Generation Agent')) {
        return JSON.stringify({});
      }
      if (prompt.includes('Synthesize the final response')) {
        return JSON.stringify({ isComplete: true, response: 'Discovered tools in workspace.' });
      }
      return JSON.stringify({ needsTools: true, toolQueries: [{ id: 'q1', toolName: 'ToolManager', query: 'list all tools', dependsOn: [] }] });
    }
  });
  assert.strictEqual(aikoRes.success, true);
  assert.ok(aikoRes.toolQueries.some(r => r.toolName.toLowerCase() === 'toolmanager'));

  console.log('✅ ALL AGENT INTELLIGENCE SPEC E2E TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
