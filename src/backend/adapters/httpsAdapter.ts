// Spec: MULTI_TARGET_BUILD_SPEC §2 Protocol Adapter Invariant & Law L8
import { PROVIDERS_META } from '../providers.js';
import { WorkerExecutionBoundary } from '@ultrst-armada/krnl';
import { matchingEngine } from '../intelligence/matchingEngine.js';
import { presetsStorage } from '../storage/presetsStorage.js';
import { extractLuthToken } from '@ultrst-armada/kloks/auth';
import { resolveAikoLuthUser, listAikoWorkspaces } from './luthFetchAuth.js';
import { getSrklAccounts, getSrklStatus, listBackblazeBuckets } from '../srkl/srklService.js';
import { IntelligenceSpecResolver } from '../agentic/intelligenceSpecResolver.js';
import { failoverExecutionEngine } from '../failoverEngine.js';
import { keyStore } from '../keyStore.js';
import { modelCatalog } from '../modelCatalog.js';
import { workflowService } from '../workflows/WorkflowService.js';
import { RuntimeProviderAccountService } from '../runtimeAccounts/RuntimeProviderAccountService.js';
import { mcpEngine } from '../mcp/mcpEngine.js';
import { runAgentReliabilityLoop } from '../agentic/toolValidationLoop.js';
import { metricsLogger } from '../metricsLogger.js';
import { healthCheckService } from '../healthCheckService.js';
import { handleAuthAndDatabaseRequest } from './authFetchHandler.js';
import { handleStorageRequest } from './storageFetchHandler.js';

export interface Env {
  ENVIRONMENT?: string;
  APP_NAME?: string;
  AIKO_GATEWAY_DOMAIN?: string;
  APP_URL?: string;
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
  [key: string]: unknown;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id, X-Workspace-Id, X-Requested-With',
};

function jsonRes(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

async function parseBody(req: Request): Promise<any> {
  try { return await req.json(); } catch { return {}; }
}


interface VerifiedAikoPrincipal { id: string; role?: string; }
const aikoWorkerBoundary = new WorkerExecutionBoundary('aiko_worker_main');
export interface AikoHttpAuthDependencies { resolveUserFromToken?: (token: string) => Promise<any>; listWorkspaces?: (userId: string, env: Record<string, unknown>) => Promise<any>; }
function luthToken(request: Request): string {
  return extractLuthToken(request);
}
async function requireLuthPrincipal(request: Request, auth: AikoHttpAuthDependencies = {}, env: Env = {}): Promise<VerifiedAikoPrincipal | Response> {
  const token = luthToken(request);
  if (!token) return jsonRes({ success: false, error: 'A verified Luth session is required.' }, 401);
  try { const principal = await (auth.resolveUserFromToken || ((value: string) => resolveAikoLuthUser(value, env)))(token); return principal?.id ? { id: String(principal.id), role: principal.role } : jsonRes({ success: false, error: 'The Luth session is invalid or expired.' }, 401); }
  catch { return jsonRes({ success: false, error: 'Canonical Luth authentication service unavailable.' }, 503); }
}
const runtimeProviderAccounts = new RuntimeProviderAccountService();

async function requireWorkspaceAccess(principal: VerifiedAikoPrincipal, workspaceId: string, auth: AikoHttpAuthDependencies = {}, env: Env = {}): Promise<Response | null> {
  if (!workspaceId) return jsonRes({ success: false, error: 'An explicit workspace ID is required.' }, 400);
  try { const listing = await (auth.listWorkspaces || ((userId: string, bindings: Record<string, unknown>) => listAikoWorkspaces(userId, bindings)))(principal.id, { ...env, WORKSPACE_APP_ID: 'aiko' }); const workspaces = Array.isArray(listing) ? listing : Array.isArray((listing as any)?.workspaces) ? (listing as any).workspaces : []; return workspaces.some((item: any) => String(item.id ?? item.workspaceId ?? item.workspace_id ?? '') === workspaceId) ? null : jsonRes({ success: false, error: 'The requested workspace is not accessible to this Luth user.' }, 403); }
  catch { return jsonRes({ success: false, error: 'Unable to verify Luth workspace ownership.' }, 503); }
}

export async function fetchHandler(request: Request, env: Env = {}, auth: AikoHttpAuthDependencies = {}): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;
  const { method } = request;

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // Assets fallback for Frontend SPA (Cloudflare Workers)
  // Non-API routes must be served directly from env.ASSETS before API authentication gates.
  if (env.ASSETS && typeof env.ASSETS.fetch === 'function' && !pathname.startsWith('/api/') && pathname !== '/health') {
    return await env.ASSETS.fetch(request);
  }

  // 1. Health Probe Gate
  if (pathname === '/api/health' || pathname === '/health') {
    return jsonRes({ status: 'ok', app: 'Aiko Multi-Vendor AI Gateway', version: '1.0.0' });
  }

  // 2. Providers
  if (pathname === '/api/v1/providers' || pathname === '/api/providers') {
    return jsonRes({ success: true, providers: PROVIDERS_META });
  }

  // 3. Models Catalog
  if (pathname === '/api/v1/models' || pathname === '/api/models') {
    const catalog = modelCatalog.getCatalog();
    const providerStatuses = modelCatalog.getProviderStatuses();
    return jsonRes({ success: true, catalog, providerStatuses });
  }

  const authResponse = await handleAuthAndDatabaseRequest(request, pathname, env);
  if (authResponse) return authResponse;

  const storageResponse = await handleStorageRequest(request, pathname, env);
  if (storageResponse) return storageResponse;

  // Non-API routes: if not handled by assets, return 404 (never an API auth rejection)
  if (!pathname.startsWith('/api/') && pathname !== '/mcp') {
    return jsonRes({ error: `Not Found: ${pathname}` }, 404);
  }

  const principal = await requireLuthPrincipal(request, auth, env);
  if (principal instanceof Response) return principal;

  if (pathname === '/api/v1/models/refresh' || pathname === '/api/models/refresh') {
    const details = await modelCatalog.refreshCatalogFromEndpoints();
    return jsonRes({
      success: true,
      catalog: modelCatalog.getCatalog(),
      providerStatuses: modelCatalog.getProviderStatuses(),
      details,
    });
  }

  if ((pathname === '/api/runtime/providers' || pathname === '/api/v1/runtime/providers') && method === 'GET') {
    return jsonRes({ success: true, providers: runtimeProviderAccounts.listProviders() });
  }

  // 4. Authenticated observability and health checks.
  if ((pathname === '/api/metrics' || pathname === '/api/v1/metrics') && method === 'GET') {
    return jsonRes({ success: true, summary: metricsLogger.getMetricsSummary(), logs: metricsLogger.getLogs(30) });
  }
  if ((pathname === '/api/health-check/run-all' || pathname === '/api/v1/health-check/run-all') && method === 'POST') {
    try {
      return jsonRes({ success: true, status: await healthCheckService.runRoutineCheck() });
    } catch (error) {
      return jsonRes({ success: false, error: error instanceof Error ? error.message : String(error) }, 500);
    }
  }

  // 4. MCP JSON-RPC transport and system tool discovery (Luth-authenticated).
  if ((pathname === '/api/mcp' || pathname === '/api/v1/mcp') && method === 'POST') {
    const payload = await parseBody(request);
    const workspaceId = String(payload?.workspaceId || payload?.workspace || url.searchParams.get('workspace') || request.headers.get('x-workspace-id') || '');
    if (workspaceId) { const denied = await requireWorkspaceAccess(principal, workspaceId, auth, env); if (denied) return denied; }
    try {
      return jsonRes(await mcpEngine.handleJsonRpc(payload));
    } catch (error) {
      return jsonRes({
        jsonrpc: '2.0',
        id: payload?.id ?? null,
        error: { code: -32603, message: `Internal MCP Error: ${String(error)}` },
      }, 500);
    }
  }
  if ((pathname === '/api/mcp/tools' || pathname === '/api/v1/mcp/tools') && method === 'GET') {
    return jsonRes({ success: true, tools: mcpEngine.getSystemTools() });
  }
  if ((pathname === '/api/agent/mcp-query' || pathname === '/api/v1/agent/mcp-query') && method === 'POST') {
    const body = await parseBody(request);
    if (!body.prompt) return jsonRes({ success: false, error: 'Prompt is required.' }, 400);
    const workspaceId = String(body.workspaceId || body.workspace || url.searchParams.get('workspace') || request.headers.get('x-workspace-id') || '');
    if (workspaceId) { const denied = await requireWorkspaceAccess(principal, workspaceId, auth, env); if (denied) return denied; }
    try {
    const result = await runAgentReliabilityLoop({
      prompt: body.prompt,
      tools: body.tools,
      maxRetries: body.maxRetries || 3,
      requiredContext: body.requiredContext,
      intelligenceSpec: body.intelligenceSpec,
      mcpServers: body.mcpServers,
    });
    return jsonRes({ success: result.success, data: result });
    } catch (error) {
      return jsonRes({ success: false, error: String(error) }, 502);
    }
  }

  // 5. Key Management
  if (pathname === '/api/v1/keys' || pathname === '/api/keys') {
    if (method === 'GET') {
      if (principal.role !== 'admin') return jsonRes({ success: false, error: 'Administrator access is required.' }, 403);
      const providerId = url.searchParams.get('providerId') || undefined;
      const modelId = url.searchParams.get('modelId') || undefined;
      const keys = keyStore.getKeys(providerId as any, modelId);
      const strategy = keyStore.getStrategy();
      const usageStats = (keyStore as any).getUsageStats?.() || [];
      return jsonRes({ success: true, keys, strategy, usageStats });
    }
    if (method === 'POST') {
      if (principal.role !== 'admin') return jsonRes({ success: false, error: 'Administrator access is required.' }, 403);
      const body = await parseBody(request);
      const key = await keyStore.addKey(body);
      return jsonRes({ success: true, key }, 201);
    }
  }

  const requireAdmin = () => principal.role === 'admin' ? null : jsonRes({ success: false, error: 'Administrator access is required.' }, 403);

  // 5. Presets
  if (pathname === '/api/v1/presets' || pathname === '/api/presets') {
    if (method === 'GET') {
      return jsonRes({ success: true, presets: presetsStorage.loadPresets() });
    }
    if (method === 'POST') {
      const denied = requireAdmin(); if (denied) return denied;
      const body = await parseBody(request);
      const saved = presetsStorage.savePreset(body);
      return jsonRes({ success: true, preset: saved }, 201);
    }
  }

  // 6. Preferences Presets
  if (pathname === '/api/v1/preferences-presets' || pathname === '/api/preferences-presets') {
    if (method === 'GET') {
      return jsonRes({ success: true, presets: presetsStorage.loadPreferencesPresets() });
    }
    if (method === 'POST') {
      const denied = requireAdmin(); if (denied) return denied;
      const body = await parseBody(request);
      const saved = presetsStorage.savePreferencesPreset(body);
      return jsonRes({ success: true, preset: saved }, 201);
    }
  }

  // 7. Intelligence Matching Rank
  if (pathname === '/api/v1/matching/rank' || pathname === '/api/matching/rank') {
    const spec = await parseBody(request);
    const rankings = matchingEngine.rank(spec);
    return jsonRes({ success: true, rankings });
  }

  // 8. Queue / Worker Command Execution Gateway
  if (pathname === '/api/v1/command' && method === 'POST') {
    const cmd = await parseBody(request);
    const result = await aikoWorkerBoundary.processJob(cmd);
    return jsonRes(result);
  }

  // 8.5. SRKL Ecosystem & Backblaze B2 Routes
  if ((pathname === '/api/srkl/accounts' || pathname === '/api/v1/srkl/accounts') && method === 'GET') {
    const principal = await resolveAikoLuthUser(luthToken(request), env);
    const userId = principal?.id || '';
    const service = url.searchParams.get('service') || '';
    return jsonRes(await getSrklAccounts(userId, service, luthToken(request), env));
  }
  if ((pathname === '/api/srkl/sync' || pathname === '/api/v1/srkl/sync') && method === 'POST') {
    const b = await parseBody(request);
    const principal = await resolveAikoLuthUser(luthToken(request), env);
    const userId = principal?.id || '';
    return jsonRes(await getSrklAccounts(userId, undefined, luthToken(request), env));
  }
  if ((pathname === '/api/srkl/status' || pathname === '/api/v1/srkl/status') && method === 'GET') {
    return jsonRes(await getSrklStatus(env));
  }
  if ((pathname === '/api/srkl/backblaze/buckets' || pathname === '/api/v1/srkl/backblaze/buckets' || pathname === '/api/backblaze/buckets' || pathname === '/api/v1/backblaze/buckets') && method === 'POST') {
    const b = await parseBody(request);
    const principal = await resolveAikoLuthUser(luthToken(request), env);
    const userId = principal?.id || '';
    const res = await listBackblazeBuckets(b, userId, luthToken(request), env);
    return jsonRes(res, res.success ? 200 : 400);
  }

  // 8.6. Module Integration Routes (Skipo & Embedded Aiko)
  if ((pathname === '/api/module/resolve-intelligence' || pathname === '/api/v1/module/resolve-intelligence') && method === 'POST') {
    const b = await parseBody(request);
    const agentType = b?.agentType || (b?.tool ? 'TOOL' : 'ENDPOINT');
    const result = IntelligenceSpecResolver.resolveAgentModel(agentType, {
      explicitSpecId: typeof b?.specId === 'string' ? b.specId : undefined,
      subAgentRole: typeof b?.subAgentRole === 'string' ? b.subAgentRole : undefined,
      tool: b?.tool, feature: b?.feature, agentDefinition: b?.agent || b?.agentDefinition,
    });
    return jsonRes({ success: true, specId: result.specId, spec: result.spec });
  }

  if ((pathname === '/api/module/keys/export' || pathname === '/api/v1/module/keys/export' || pathname === '/api/keys/export' || pathname === '/api/v1/keys/export') && method === 'GET') {
    return jsonRes({ success: true, backup: keyStore.exportKeysStructured() });
  }

  const routePath = pathname.replace(/^\/api\/v1/, '/api');
  const runtimeAccountRoute = routePath.match(/^\/api\/workspaces\/([^/]+)\/runtime\/accounts(?:\/([^/]+))?$/);
  if (runtimeAccountRoute) {
    const workspaceId = decodeURIComponent(runtimeAccountRoute[1]);
    const denied = await requireWorkspaceAccess(principal, workspaceId, auth, env);
    if (denied) return denied;
    const accountId = runtimeAccountRoute[2] ? decodeURIComponent(runtimeAccountRoute[2]) : undefined;
    if (!accountId && method === 'GET') return jsonRes({ success: true, accounts: await runtimeProviderAccounts.list(workspaceId), providers: runtimeProviderAccounts.listProviders() });
    if (!accountId && method === 'POST') return jsonRes({ success: true, account: await runtimeProviderAccounts.create(workspaceId, await parseBody(request)) }, 201);
    if (accountId && method === 'PUT') return jsonRes({ success: true, account: await runtimeProviderAccounts.update(workspaceId, accountId, await parseBody(request)) });
    if (accountId && method === 'DELETE') return jsonRes({ success: await runtimeProviderAccounts.delete(workspaceId, accountId) });
    return jsonRes({ success: false, error: 'Method not allowed for runtime account resource.' }, 405);
  }

  const workflowRoute = routePath.match(/^\/api\/workspaces\/([^/]+)\/workflows(?:\/([^/]+))?(?:\/(node-catalog|validate|graph|execute|versions|executions|tool-output|tool-execute))?$/);
  if (workflowRoute) {
    const workspaceId = decodeURIComponent(workflowRoute[1]);
    const denied = await requireWorkspaceAccess(principal, workspaceId, auth, env);
    if (denied) return denied;
    const workflowId = workflowRoute[2] ? decodeURIComponent(workflowRoute[2]) : undefined;
    const operation = workflowRoute[3];
    const body = await parseBody(request);
    if (!workflowId && method === 'GET') return jsonRes({ success: true, workflows: await workflowService.list(workspaceId) });
    if (!workflowId && method === 'POST') return jsonRes({ success: true, workflow: await workflowService.create(workspaceId, body) }, 201);
    if (operation === 'node-catalog' && method === 'GET') return jsonRes({ success: true, nodes: workflowService.getNodeDefinitions() });
    if (operation === 'validate' && method === 'POST') return jsonRes({ success: true, errors: workflowService.validateGraph(body.graph || { nodes: [], edges: [] }) });
    if (workflowId && !operation && method === 'GET') { const workflow = await workflowService.get(workspaceId, workflowId); return workflow ? jsonRes({ success: true, workflow }) : jsonRes({ success: false, error: 'Workflow not found.' }, 404); }
    if (workflowId && !operation && method === 'PUT') return jsonRes({ success: true, workflow: await workflowService.update(workspaceId, workflowId, body) });
    if (workflowId && !operation && method === 'DELETE') return jsonRes({ success: await workflowService.delete(workspaceId, workflowId) });
    if (workflowId && operation === 'graph' && method === 'GET') return jsonRes({ success: true, graph: await workflowService.getGraph(workspaceId, workflowId) });
    if (workflowId && operation === 'graph' && method === 'PUT') return jsonRes({ success: true, graph: await workflowService.saveGraph(workspaceId, workflowId, body.graph) });
    if (workflowId && operation === 'execute' && method === 'POST') return jsonRes(await workflowService.execute(workspaceId, workflowId, body.input, { ...(body.context || {}), userId: principal.id, roles: principal.role ? [principal.role] : ['user'], workspaceId }));
    if (workflowId && operation === 'versions' && method === 'GET') return jsonRes({ success: true, versions: await workflowService.listVersions(workspaceId, workflowId) });
    if (workflowId && operation === 'executions' && method === 'GET') return jsonRes({ success: true, executions: await workflowService.listExecutions(workspaceId, workflowId) });
    if (workflowId && operation === 'tool-output' && method === 'GET') return jsonRes({ success: true, handle: await workflowService.getToolOutputHandle(workspaceId, workflowId) });
    if (workflowId && operation === 'tool-execute' && method === 'POST') return jsonRes({ success: true, result: await workflowService.executeToolCapability(workspaceId, workflowId, body.input || {}, { ...(body.context || {}), userId: principal.id, workspaceId }) });
    return jsonRes({ success: false, error: 'Method not allowed for workflow resource.' }, 405);
  }

  // 8.7. OpenAI-Compatible Chat Completions with Tool Calls
  if ((pathname === '/api/chat/completions' || pathname === '/api/v1/chat/completions') && method === 'POST') {
    const { messages, model_profile, intelligenceSpec, tools, tool_choice, enableDefaultTools } = await parseBody(request);
    const prompt = messages?.[messages.length - 1]?.content || 'Hello';
    const profile = intelligenceSpec ? { intelligenceSpec } : (model_profile || {});
    const clientIp = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const result = await failoverExecutionEngine.executeProfileRequest(profile, prompt, clientIp, { tools, tool_choice, messages, enableDefaultTools: enableDefaultTools !== false });
    return jsonRes({
      id: `chatcmpl-aiko-${Date.now()}`, object: 'chat.completion', created: Math.floor(Date.now() / 1000), model: result.modelUsed,
      choices: [{ index: 0, message: { role: 'assistant', content: result.content || null, tool_calls: result.toolCalls?.length ? result.toolCalls : undefined }, finish_reason: result.toolCalls?.length ? 'tool_calls' : 'stop' }],
      usage: { prompt_tokens: Math.round(prompt.length / 4), completion_tokens: Math.round((result.content || '').length / 4), total_tokens: result.tokensEstimate },
      aiko_metadata: { contractId: result.contractId, providerUsed: result.providerUsed, keyUsedId: result.keyUsedId, latencyMs: result.latencyMs, failoverChain: result.failoverChain }
    });
  }

  return jsonRes({ error: `Not Found: ${pathname}` }, 404);
}

export default {
  async fetch(request: Request, env: Env = {}): Promise<Response> {
    return fetchHandler(request, env);
  },
};