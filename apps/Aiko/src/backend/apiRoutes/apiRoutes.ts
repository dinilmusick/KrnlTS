/**
 * ASCII Architecture Flowchart: apiRoutes
 *
 *   ┌──────────────────────────────────┐
 *   │       Initialize apiRoutes       │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │            apiRouter             │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │            exportData            │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │             filename             │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ AIKO UNIFIED GATEWAY & COMPLIANCE REST API ROUTES ═══════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import { Router } from 'express';
import { PROVIDERS_META } from '../providers.js';
import { keyStore } from '../keyStore.js';
import { dbStore } from '../dbStore.js';
import { modelCatalog } from '../modelCatalog.js';
import { profileSolver } from '../profileSolver.js';
import { matchingEngine } from '../intelligence/matchingEngine.js';
import { expandSimplifiedProfile } from '../intelligence/helpers.js';
import { failoverExecutionEngine } from '../failoverEngine.js';
import { metricsLogger } from '../metricsLogger.js';
import { mcpEngine } from '../mcp/mcpEngine.js';
import { runAgentReliabilityLoop } from '../agentic/toolValidationLoop.js';
import { healthCheckService } from '../healthCheckService.js';
import { setupKeyRoutes } from './helpers.js';
import { presetRouter } from './presetRoutes.js';
import { agentChatRouter } from './agentChatRoutes.js';
import { memoryRouter } from './memoryRoutes.js';
import { IntelligenceSpecResolver } from '../agentic/intelligenceSpecResolver.js';
import { resolveAikoLuthUser, listAikoWorkspaces } from '../adapters/luthFetchAuth.js';
import { workflowService } from '../workflows/WorkflowService.js';
import { runtimeRouter } from './runtimeRoutes.js';
import { runtimeCredentialRouter } from './runtimeCredentialRoutes.js';


export const apiRouter = Router();

async function authorizeLuthRequest(req: any, res: any, next: any): Promise<void> {
  const auth = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const apiKey = String(req.headers['x-api-key'] || '').trim();
  const cookieHeader = String(req.headers.cookie || '');
  const cookies = cookieHeader.split(';').map(c => c.trim());
  let cookieToken = '';
  for (const prefix of ['better-auth.session_token=', '__Secure-better-auth.session_token=', 'luth_session=']) {
    const found = cookies.find(c => c.startsWith(prefix));
    if (found) {
      try { cookieToken = decodeURIComponent(found.slice(prefix.length)); break; } catch {}
    }
  }
  const token = auth || apiKey || cookieToken;
  if (!token) { res.status(401).json({ success: false, error: 'A verified Luth session is required.' }); return; }
  try {
    const principal = await resolveAikoLuthUser(token, process.env);
    if (!principal?.id) { res.status(401).json({ success: false, error: 'The Luth session is invalid or expired.' }); return; }
    (req as any).aikoPrincipal = { id: String(principal.id), role: principal.role || 'user' };
    req.user = principal;
    req.userId = String(principal.id);
    const workspaceMatch = req.path.match(/^\/workspaces\/([^/]+)/);
    const workspaceId = workspaceMatch ? decodeURIComponent(workspaceMatch[1]) : String(req.body?.workspaceId || req.body?.workspace || req.query?.workspace || req.headers['x-workspace-id'] || '');
    if (workspaceId) {
      const listing = await listAikoWorkspaces(String(principal.id), { ...process.env, WORKSPACE_APP_ID: 'aiko' });
      const workspaces = listing.workspaces;
      if (!workspaces.some((item: any) => String(item.id ?? item.workspaceId ?? item.workspace_id ?? '') === workspaceId)) {
        res.status(403).json({ success: false, error: 'The requested workspace is not accessible to this Luth user.' }); return;
      }
    }
    next();
  } catch {
    res.status(503).json({ success: false, error: 'Canonical Luth authentication service unavailable.' });
  }
}
async function authorizeModuleRequest(req: any, res: any): Promise<boolean> {
  if (!(req as any).aikoPrincipal) { res.status(401).json({ success: false, error: 'A verified Luth session is required.' }); return false; }
  const workspaceId = String(req.params?.workspace || '');
  if (!workspaceId) return true;
  try {
    const listing = await listAikoWorkspaces((req as any).aikoPrincipal.id, { ...process.env, WORKSPACE_APP_ID: 'aiko' });
    const workspaces = listing.workspaces;
    if (!workspaces.some((item: any) => String(item.id ?? item.workspaceId ?? item.workspace_id ?? '') === workspaceId)) {
      res.status(403).json({ success: false, error: 'The requested workspace is not accessible to this Luth user.' });
      return false;
    }
    return true;
  } catch {
    res.status(503).json({ success: false, error: 'Unable to verify Luth workspace ownership.' });
    return false;
  }
}

apiRouter.get('/providers', (_req, res) => res.json({ success: true, providers: PROVIDERS_META }));
apiRouter.get('/models', (_req, res) => res.json({ success: true, catalog: modelCatalog.getCatalog(), providerStatuses: modelCatalog.getProviderStatuses() }));
apiRouter.use(authorizeLuthRequest);

setupKeyRoutes(apiRouter);
apiRouter.use(presetRouter);
apiRouter.use(agentChatRouter);
apiRouter.use(memoryRouter);
apiRouter.use(runtimeRouter);
apiRouter.use(runtimeCredentialRouter);

apiRouter.post('/module/resolve-intelligence', async (req, res) => {
  if (!(await authorizeModuleRequest(req, res))) return;
  try {
    const agentType = req.body?.agentType || (req.body?.tool ? 'TOOL' : 'ENDPOINT');
    const result = IntelligenceSpecResolver.resolveAgentModel(agentType, {
      explicitSpecId: typeof req.body?.specId === 'string' ? req.body.specId : undefined,
      subAgentRole: typeof req.body?.subAgentRole === 'string' ? req.body.subAgentRole : undefined,
      tool: req.body?.tool,
      feature: req.body?.feature,
      agentDefinition: req.body?.agent || req.body?.agentDefinition,
    });
    res.json({ success: true, specId: result.specId, spec: result.spec });
  } catch (error) {
    res.status(400).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
});

apiRouter.get('/module/keys/export', async (req, res) => {
  if (!(await authorizeModuleRequest(req, res))) return;
  res.json({ success: true, backup: keyStore.exportKeysStructured() });
});

// ════ PROVIDERS & BACKUP ROUTES ════════════════════════════════════════════════════

apiRouter.get('/providers', (req, res) => res.json({ success: true, providers: PROVIDERS_META }));

apiRouter.get('/keys/export', (req, res) => {
  const exportData = keyStore.exportKeysStructured();
  if (req.query.download === 'true') {
    const filename = `aiko-keys-backup-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(JSON.stringify(exportData, null, 2));
  }
  res.json({ success: true, backup: exportData });
});

apiRouter.post('/keys/import', async (req, res) => {
  try {
    const payload = req.body.backup || req.body.keys || req.body;
    if (!payload) return res.status(400).json({ success: false, error: 'No key backup payload provided.' });
    const result = await keyStore.importKeys(payload);
    res.json({ success: true, message: `Imported ${result.importedCount} key(s).`, importedCount: result.importedCount, keys: result.keys });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

apiRouter.post('/rotation/strategy', (req, res) => {
  if (req.body.strategy) keyStore.setStrategy(req.body.strategy);
  res.json({ success: true, strategy: keyStore.getStrategy() });
});

// ════ MODELS & PROFILE MATCHING ════════════════════════════════════════════════════

apiRouter.get('/models', async (req, res) => {
  await modelCatalog.refreshCatalogFromEndpoints();
  res.json({ success: true, catalog: modelCatalog.getCatalog(), providerStatuses: modelCatalog.getProviderStatuses() });
});

apiRouter.post('/models/refresh', async (req, res) => {
  const result = await modelCatalog.refreshCatalogFromEndpoints();
  res.json({ success: true, catalog: modelCatalog.getCatalog(), providerStatuses: modelCatalog.getProviderStatuses(), details: result });
});

apiRouter.post('/matching/rank', (req, res) => {
  const endpointSpec = expandSimplifiedProfile(req.body);
  const rankingResult = matchingEngine.rank(endpointSpec, modelCatalog.getCatalog());
  res.json({ success: true, ranking: rankingResult });
});

apiRouter.post('/profiles/solve', (req, res) => {
  const result = profileSolver.solveProfile(req.body);
  if (!result) return res.status(404).json({ success: false, error: 'No matching profile candidate found.' });
  res.json({ success: true, solution: result });
});

// ════ INFERENCE & COMPLETIONS ══════════════════════════════════════════════════════

apiRouter.post('/remediation/plan', async (req, res) => {
  const { goal, diagnostics, files, endpoints, graph, workspace } = req.body || {};
  if (!goal) return res.status(400).json({ success: false, error: 'goal is required' });
  const prompt = [
    'You are the autonomous software-remediation planner for Dea.',
    'Return JSON only: {"patches":[{"path":"...","type":"replace","search":"...","replace":"..."}],"reasoning":"...","confidence":0}',
    'Never invent files. Use only supplied workspace files and workflow graph APIs.',
    'Preserve application architecture and do not expose secrets.',
    'GOAL:', String(goal),
    'WORKSPACE:', String(workspace || ''),
    'DIAGNOSTICS:', JSON.stringify(diagnostics || {}),
    'FOD GRAPH:', JSON.stringify(graph || {}),
    'FOD ENDPOINTS:', JSON.stringify(endpoints || []),
    'FILES:', JSON.stringify(files || []),
  ].join('\n');
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'dea-remediation';
    const result = await failoverExecutionEngine.executeProfileRequest(
      req.body?.intelligenceSpec || { reasoning: 10, planning: 10, toolUsage: 10, jsonStrictness: 10 },
      prompt, clientIp, { enableDefaultTools: false },
    );
    const raw = String(result.content || '').replace(/^\x60\x60\x60json\s*/i, '').replace(/\s*\x60\x60\x60$/i, '').trim();
    const plan = JSON.parse(raw);
    if (!Array.isArray(plan.patches)) throw new Error('Aiko remediation plan must contain patches[]');
    res.json({ success: true, ...plan, modelUsed: result.modelUsed, providerUsed: result.providerUsed });
  } catch (error) {
    res.status(502).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
});

apiRouter.post('/generate', async (req, res) => {
  try {
    const { profile, prompt, tools, tool_choice, enableDefaultTools } = req.body;
    if (!prompt) return res.status(400).json({ success: false, error: 'Prompt is required.' });
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'external-client';
    const result = await failoverExecutionEngine.executeProfileRequest(profile || {}, prompt, clientIp, { tools, tool_choice, enableDefaultTools: enableDefaultTools !== false });
    res.json({ success: true, data: result });
  } catch (err: unknown) {
    res.status(502).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

apiRouter.post('/chat/direct', async (req, res) => {
  try {
    const { providerId, modelId, prompt, tools, tool_choice, enableDefaultTools } = req.body;
    if (!providerId || !modelId || !prompt) return res.status(400).json({ success: false, error: 'Missing parameters' });
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'chat-tester';
    const result = await failoverExecutionEngine.executeDirectRequest(providerId, modelId, prompt, clientIp, { tools, tool_choice, enableDefaultTools: enableDefaultTools !== false });
    res.json({ success: true, data: result });
  } catch (err: unknown) {
    res.status(502).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

apiRouter.post('/chat/completions', async (req, res) => {
  try {
    const { messages, model_profile, intelligenceSpec, tools, tool_choice, enableDefaultTools } = req.body;
    const prompt = messages?.[messages.length - 1]?.content || 'Hello';
    const profile = intelligenceSpec ? { intelligenceSpec } : (model_profile || {});
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'external-app';
    const result = await failoverExecutionEngine.executeProfileRequest(profile, prompt, clientIp, { tools, tool_choice, messages, enableDefaultTools: enableDefaultTools !== false });

    res.json({
      id: `chatcmpl-aiko-${Date.now()}`, object: 'chat.completion', created: Math.floor(Date.now() / 1000), model: result.modelUsed,
      choices: [{ index: 0, message: { role: 'assistant', content: result.content || null, tool_calls: result.toolCalls?.length ? result.toolCalls : undefined }, finish_reason: result.toolCalls?.length ? 'tool_calls' : 'stop' }],
      usage: { prompt_tokens: Math.round(prompt.length / 4), completion_tokens: Math.round((result.content || '').length / 4), total_tokens: result.tokensEstimate },
      aiko_metadata: { contractId: result.contractId, providerUsed: result.providerUsed, keyUsedId: result.keyUsedId, latencyMs: result.latencyMs, failoverChain: result.failoverChain }
    });
  } catch (err: unknown) {
    res.status(500).json({ error: { message: String(err), type: 'aiko_gateway_error' } });
  }
});

// ════ OBSERVABILITY & MCP ══════════════════════════════════════════════════════════

apiRouter.get('/metrics', (req, res) => res.json({ success: true, summary: metricsLogger.getMetricsSummary(), logs: metricsLogger.getLogs(30) }));

apiRouter.post('/mcp', async (req, res) => {
  try {
    res.json(await mcpEngine.handleJsonRpc(req.body));
  } catch (err: unknown) {
    res.status(500).json({ jsonrpc: '2.0', id: req.body?.id || null, error: { code: -32603, message: `Internal MCP Error: ${String(err)}` } });
  }
});

apiRouter.get('/mcp/tools', (req, res) => res.json({ success: true, tools: mcpEngine.getSystemTools() }));

apiRouter.post('/agent/mcp-query', async (req, res) => {
  try {
    const { prompt, tools, maxRetries, requiredContext, intelligenceSpec, mcpServers } = req.body;
    if (!prompt) return res.status(400).json({ success: false, error: 'Prompt is required.' });
    const result = await runAgentReliabilityLoop({ prompt, tools, maxRetries: maxRetries || 3, requiredContext, intelligenceSpec, mcpServers });
    res.json({ success: result.success, data: result });
  } catch (err: unknown) {
    res.status(502).json({ success: false, error: String(err) });
  }
});

apiRouter.post('/health-check/run-all', async (req, res) => {
  try {
    res.json({ success: true, status: await healthCheckService.runRoutineCheck() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || String(err) });
  }
});


apiRouter.get('/workspaces/:workspace/workflows', async (req, res) => {
  try { res.json({ success: true, workflows: await workflowService.list(req.params.workspace) }); }
  catch (error) { res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) }); }
});
apiRouter.get('/workspaces/:workspace/workflows/node-catalog', async (_req, res) => {
  try { res.json({ success: true, nodes: workflowService.getNodeDefinitions() }); }
  catch (error) { res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) }); }
});
apiRouter.post('/workspaces/:workspace/workflows/validate', async (req, res) => {
  try { res.json({ success: true, errors: workflowService.validateGraph(req.body?.graph || { nodes: [], edges: [] }) }); }
  catch (error) { res.status(400).json({ success: false, error: error instanceof Error ? error.message : String(error) }); }
});
apiRouter.get('/workspaces/:workspace/workflows/:workflowId', async (req, res) => {
  try {
    const workflow = await workflowService.get(req.params.workspace, req.params.workflowId);
    if (!workflow) return res.status(404).json({ success: false, error: 'Workflow not found.' });
    res.json({ success: true, workflow });
  } catch (error) { res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) }); }
});
apiRouter.post('/workspaces/:workspace/workflows', async (req, res) => {
  try { res.status(201).json({ success: true, workflow: await workflowService.create(req.params.workspace, req.body || {}) }); }
  catch (error) { res.status(400).json({ success: false, error: error instanceof Error ? error.message : String(error) }); }
});
apiRouter.put('/workspaces/:workspace/workflows/:workflowId', async (req, res) => {
  try { res.json({ success: true, workflow: await workflowService.update(req.params.workspace, req.params.workflowId, req.body || {}) }); }
  catch (error) { res.status(400).json({ success: false, error: error instanceof Error ? error.message : String(error) }); }
});
apiRouter.delete('/workspaces/:workspace/workflows/:workflowId', async (req, res) => {
  try { const deleted = await workflowService.delete(req.params.workspace, req.params.workflowId); if (!deleted) return res.status(404).json({ success: false, error: 'Workflow not found.' }); res.json({ success: true }); }
  catch (error) { res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) }); }
});
apiRouter.get('/workspaces/:workspace/workflows/:workflowId/graph', async (req, res) => {
  try { res.json({ success: true, graph: await workflowService.getGraph(req.params.workspace, req.params.workflowId) }); }
  catch (error) { res.status(404).json({ success: false, error: error instanceof Error ? error.message : String(error) }); }
});
apiRouter.put('/workspaces/:workspace/workflows/:workflowId/graph', async (req, res) => {
  try { res.json({ success: true, graph: await workflowService.saveGraph(req.params.workspace, req.params.workflowId, req.body?.graph) }); }
  catch (error) { res.status(400).json({ success: false, error: error instanceof Error ? error.message : String(error) }); }
});
apiRouter.post('/workspaces/:workspace/workflows/:workflowId/execute', async (req, res) => {
  try { res.json(await workflowService.execute(req.params.workspace, req.params.workflowId, req.body?.input, { ...(req.body?.context || {}), userId: (req as any).aikoPrincipal.id, roles: (req as any).aikoPrincipal.role ? [(req as any).aikoPrincipal.role] : ['user'], workspaceId: req.params.workspace })); }
  catch (error) { res.status(400).json({ success: false, errors: [error instanceof Error ? error.message : String(error)] }); }
});
apiRouter.get('/workspaces/:workspace/workflows/:workflowId/versions', async (req, res) => {
  try { res.json({ success: true, versions: await workflowService.listVersions(req.params.workspace, req.params.workflowId) }); }
  catch (error) { res.status(404).json({ success: false, error: error instanceof Error ? error.message : String(error) }); }
});
apiRouter.get('/workspaces/:workspace/workflows/:workflowId/executions', async (req, res) => {
  try { res.json({ success: true, executions: await workflowService.listExecutions(req.params.workspace, req.params.workflowId) }); }
  catch (error) { res.status(404).json({ success: false, error: error instanceof Error ? error.message : String(error) }); }
});
apiRouter.get('/workspaces/:workspace/workflows/:workflowId/executions/:executionId', async (req, res) => {
  try { res.json({ success: true, execution: await workflowService.getExecution(req.params.workspace, req.params.workflowId, req.params.executionId) }); }
  catch (error) { res.status(404).json({ success: false, error: error instanceof Error ? error.message : String(error) }); }
});
apiRouter.get('/workspaces/:workspace/workflows/:workflowId/tool-output', async (req, res) => {
  try { res.json({ success: true, handle: await workflowService.getToolOutputHandle(req.params.workspace, req.params.workflowId) }); }
  catch (error) { res.status(404).json({ success: false, error: error instanceof Error ? error.message : String(error) }); }
});
apiRouter.post('/workspaces/:workspace/workflows/:workflowId/tool-execute', async (req, res) => {
  try { res.json({ success: true, result: await workflowService.executeToolCapability(req.params.workspace, req.params.workflowId, req.body?.input || {}, { ...req.body?.context, userId: (req as any).aikoPrincipal.id, workspaceId: req.params.workspace }) }); }
  catch (error) { res.status(400).json({ success: false, error: error instanceof Error ? error.message : String(error) }); }
});
export default apiRouter;