/**
 * ASCII Architecture Flowchart: apiClient
 *
 *   ┌──────────────────────────────────┐
 *   │       Initialize apiClient       │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │             API_BASE             │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │            jsonFetch             │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │               opts               │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ UNIFIED AIKO API CLIENT IMPLEMENTATION ═══════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import type { ApiKeyEntry, RotationStrategy, ModelProfileRequest, ProviderId, InferenceFeedbackRequest } from '../aiContracts.js';
import { createCanonicalAuthClient } from '@ultrst-armada/kloks/auth';

const API_BASE = '/api/v1';

export const luthAuthClient = createCanonicalAuthClient({
  ecosystemId: 'ultrst-armada',
  applicationId: 'aiko',
  autoRegister: true,
  origin: typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost:3001',
});

export async function jsonFetch<T = any>(path: string, method = 'GET', body?: any, customHeaders?: Record<string, string>): Promise<T> {
  const opts: RequestInit = { method, credentials: 'include' };
  const headers: Record<string, string> = {};
  new Headers(luthAuthClient.getAuthHeaders()).forEach((value, key) => { headers[key] = value; });
  if (customHeaders) Object.assign(headers, customHeaders);
  if (body) {
    headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  opts.headers = headers;
  const res = await fetch(`${API_BASE}${path}`, opts);
  return res.json();
}

export const apiClient = {
  getKeys: async (providerId?: ProviderId, modelId?: string) => {
    const q = new URLSearchParams();
    if (providerId) q.append('providerId', providerId);
    if (modelId) q.append('modelId', modelId);
    const data = await jsonFetch(`/keys?${q.toString()}`);
    return {
      keys: data.keys || [], strategy: data.strategy || 'least-latency',
      nextKeyId: data.nextKeyId || null, permanentKeyId: data.permanentKeyId || null,
      permanentKeys: data.permanentKeys || {}, usageStats: data.usageStats || []
    };
  },
  getNextKey: async (providerId: ProviderId, modelId?: string) => {
    const q = new URLSearchParams({ providerId });
    if (modelId) q.append('modelId', modelId);
    const data = await jsonFetch(`/keys/next?${q.toString()}`);
    return { nextKeyId: data.nextKeyId || null, nextKey: data.nextKey || null };
  },
  getKeyUsageStats: async (keyId?: string, modelId?: string) => {
    const q = new URLSearchParams();
    if (keyId) q.append('keyId', keyId);
    if (modelId) q.append('modelId', modelId);
    const data = await jsonFetch(`/keys/usage?${q.toString()}`);
    return data.usageStats || [];
  },
  addKey: (payload: { providerId: ProviderId; label: string; key: string; weight?: number }) => jsonFetch('/keys', 'POST', payload),
  verifyKey: (id: string) => jsonFetch(`/keys/${id}/verify`, 'POST'),
  setNextKey: (id: string) => jsonFetch(`/keys/${id}/set-next`, 'POST'),
  setPermanentKey: (id: string) => jsonFetch(`/keys/${id}/set-permanent`, 'POST'),
  updateKeyStatus: (id: string, status: ApiKeyEntry['status']) => jsonFetch(`/keys/${id}/status`, 'PUT', { status }),
  updateKeyLabel: (id: string, label: string) => jsonFetch(`/keys/${id}`, 'PUT', { label }),
  resetKeyProbabilities: (id: string) => jsonFetch(`/keys/${id}/reset-probabilities`, 'POST'),
  checkKeyModels: (id: string) => jsonFetch(`/keys/${id}/check-models`, 'POST'),
  resetAllKeyFailures: () => jsonFetch('/keys/reset-all-failures', 'POST'),
  deleteKey: (id: string) => jsonFetch(`/keys/${id}`, 'DELETE'),
  exportKeysBackup: () => jsonFetch('/keys/export').then(d => d.backup),
  importKeysBackup: (backupPayload: any) => jsonFetch('/keys/import', 'POST', { backup: backupPayload }),
  setStrategy: (strategy: RotationStrategy) => jsonFetch('/rotation/strategy', 'POST', { strategy }),
  getCatalog: () => jsonFetch('/models').then(d => ({ catalog: d.catalog || [], providerStatuses: d.providerStatuses || [] })),
  refreshCatalog: () => jsonFetch('/models/refresh', 'POST'),
  rankMatching: (endpointSpec: any) => jsonFetch('/matching/rank', 'POST', endpointSpec),
  solveProfile: (profile: ModelProfileRequest | any) => jsonFetch('/profiles/solve', 'POST', profile),
  generate: (profile: ModelProfileRequest | any, prompt: string) => jsonFetch('/generate', 'POST', { profile, prompt }),
  executeDirectChat: (providerId: ProviderId, modelId: string, prompt: string) => jsonFetch('/chat/direct', 'POST', { providerId, modelId, prompt }),
  sendDirectAgentChat: (params: { workspaceId?: string; providerId: ProviderId; modelId: string; prompt: string }) =>
    jsonFetch('/chat/direct', 'POST', { workspace: params.workspaceId, providerId: params.providerId, modelId: params.modelId, prompt: params.prompt }),
  sendInferenceFeedback: (payload: InferenceFeedbackRequest) => jsonFetch('/inference/feedback', 'POST', payload),
  checkModelAvailability: (modelId?: string) => jsonFetch('/models/check-availability', 'POST', { modelId }),
  getMetrics: () => jsonFetch('/metrics').then(d => ({ summary: d.summary, logs: d.logs || [] })),
  sendMcpJsonRpc: (payload: any) => jsonFetch('/mcp', 'POST', payload),
  getMcpTools: () => jsonFetch('/mcp/tools'),
  registerMcpTool: (toolDef: any) => jsonFetch('/mcp/tools', 'POST', toolDef),
  getMcpServers: () => jsonFetch('/mcp/servers'),
  registerMcpServer: (name: string, url: string) => jsonFetch('/mcp/servers', 'POST', { name, url }),
  runAgentMcpQuery: (payload: any) => jsonFetch('/agent/mcp-query', 'POST', payload),
  getPresets: () => jsonFetch('/presets'),
  getPresetById: (id: string) => jsonFetch(`/presets/${id}`),
  savePreset: (preset: any) => jsonFetch('/presets', 'POST', preset),
  createPreset: (preset: any) => jsonFetch('/presets', 'POST', preset),
  updatePreset: (id: string, preset: any) => jsonFetch(`/presets/${id}`, 'PUT', preset),
  deletePreset: (id: string) => jsonFetch(`/presets/${id}`, 'DELETE'),
  resetPresets: () => jsonFetch('/presets/reset', 'POST'),
  getPreferencesPresets: () => jsonFetch('/preferences-presets'),
  getPreferencesPresetById: (id: string) => jsonFetch(`/preferences-presets/${id}`),
  savePreferencesPreset: (preset: any) => jsonFetch('/preferences-presets', 'POST', preset),
  updatePreferencesPreset: (id: string, preset: any) => jsonFetch(`/preferences-presets/${id}`, 'PUT', preset),
  deletePreferencesPreset: (id: string) => jsonFetch(`/preferences-presets/${id}`, 'DELETE'),
  resetPreferencesPresets: () => jsonFetch('/preferences-presets/reset', 'POST'),
  checkKeyHealth: (keyId: string) => jsonFetch(`/keys/${keyId}/health-check`, 'POST'),
  runRoutineHealthCheck: () => jsonFetch('/health-check/run-all', 'POST'),
  getHealthCheckStatus: () => jsonFetch('/health-check/status'),
  getStorageConfig: () => jsonFetch('/storage/config'),
  setStoragePrimary: (provider: string) => jsonFetch('/storage/primary', 'POST', { provider }),
  triggerStorageSync: () => jsonFetch('/storage/sync', 'POST'),
  login: async (payload: { email: string; password: string }) => {
    const res = await jsonFetch('/auth/login', 'POST', payload);
    const token = res?.session?.token || res?.token;
    if (token) (luthAuthClient as any).tokenStore.set(token);
    return res;
  },
  register: async (payload: { email: string; password: string; name?: string; role?: string }) => {
    const res = await jsonFetch('/auth/register', 'POST', payload);
    const token = res?.session?.token || res?.token;
    if (token) (luthAuthClient as any).tokenStore.set(token);
    return res;
  },
  getMe: (token?: string) =>
    jsonFetch('/auth/me', 'GET', undefined, token ? { Authorization: `Bearer ${token}` } : undefined),
  logout: async () => {
    const res = await jsonFetch('/auth/logout', 'POST');
    luthAuthClient.clearAuthToken();
    return res;
  },
  getWorkspaces: () => jsonFetch('/auth/workspaces'),
  createWorkspace: (ws: Record<string, any>) => jsonFetch('/auth/workspaces', 'POST', ws),
  deleteWorkspace: (id: string) => jsonFetch(`/auth/workspaces/${id}`, 'DELETE'),
  getSrklAccounts: (service?: string, userId?: string, email?: string) => {
    const q = new URLSearchParams();
    if (service) q.append('service', service);
    if (userId) q.append('userId', userId);
    if (email) q.append('email', email);
    const qs = q.toString();
    return jsonFetch(`/srkl/accounts${qs ? `?${qs}` : ''}`);
  },
  getSrklBuckets: (payload: { keyId?: string; applicationKey?: string; accountId?: string; userId?: string; credentials?: any }) =>
    jsonFetch('/srkl/backblaze/buckets', 'POST', payload),
  getSrklStatus: () => jsonFetch('/srkl/status'),
  syncSrklAccounts: (userId?: string) =>
    jsonFetch('/srkl/sync', 'POST', { userId }),
  getSystemDatabaseStatus: () => jsonFetch('/database/status'),
  testSystemDatabase: () => jsonFetch('/database/test', 'POST'),
  executeAgentChat: (query: string, workspace: string, chatHistory?: any[], selectedProvider?: string, selectedModel?: string) =>
    jsonFetch('/chat/agent', 'POST', { query, workspace, chatHistory, selectedProvider, selectedModel }),
  getWorkflows: (workspace: string) => jsonFetch('/workspaces/' + encodeURIComponent(workspace) + '/workflows'),
  getRuntimeAccounts: (workspace: string) => jsonFetch('/workspaces/' + encodeURIComponent(workspace) + '/runtime/accounts'),
  createRuntimeAccount: (workspace: string, payload: { providerId: string; displayName: string; emailGroup?: string; fields: Record<string, string> }) => jsonFetch('/workspaces/' + encodeURIComponent(workspace) + '/runtime/accounts', 'POST', payload),
  deleteRuntimeAccount: (workspace: string, accountId: string) => jsonFetch('/workspaces/' + encodeURIComponent(workspace) + '/runtime/accounts/' + encodeURIComponent(accountId), 'DELETE'),
  updateRuntimeAccount: (workspace: string, accountId: string, payload: { providerId: string; displayName: string; emailGroup?: string; fields?: Record<string, string> }) => jsonFetch('/workspaces/' + encodeURIComponent(workspace) + '/runtime/accounts/' + encodeURIComponent(accountId), 'PUT', payload),
  getWorkflow: (workspace: string, workflowId: string) => jsonFetch('/workspaces/' + encodeURIComponent(workspace) + '/workflows/' + encodeURIComponent(workflowId)),
  createWorkflow: (workspace: string, workflow: { name: string; description: string; icon?: string; intelligenceSpecId?: string | null }) => jsonFetch('/workspaces/' + encodeURIComponent(workspace) + '/workflows', 'POST', workflow),
  updateWorkflow: (workspace: string, workflowId: string, workflow: { name: string; description: string; icon?: string; intelligenceSpecId?: string | null }) => jsonFetch('/workspaces/' + encodeURIComponent(workspace) + '/workflows/' + encodeURIComponent(workflowId), 'PUT', workflow),
  deleteWorkflow: (workspace: string, workflowId: string) => jsonFetch('/workspaces/' + encodeURIComponent(workspace) + '/workflows/' + encodeURIComponent(workflowId), 'DELETE'),
  getWorkflowNodeCatalog: (workspace: string) => jsonFetch('/workspaces/' + encodeURIComponent(workspace) + '/workflows/node-catalog'),
  validateWorkflowGraph: (workspace: string, graph: any) => jsonFetch('/workspaces/' + encodeURIComponent(workspace) + '/workflows/validate', 'POST', { graph }),
  getWorkflowGraph: (workspace: string, workflowId: string) => jsonFetch('/workspaces/' + encodeURIComponent(workspace) + '/workflows/' + encodeURIComponent(workflowId) + '/graph'),
  saveWorkflowGraph: (workspace: string, workflowId: string, graph: any) => jsonFetch('/workspaces/' + encodeURIComponent(workspace) + '/workflows/' + encodeURIComponent(workflowId) + '/graph', 'PUT', { graph }),
  executeWorkflow: (workspace: string, workflowId: string, input?: unknown, context?: unknown) => jsonFetch('/workspaces/' + encodeURIComponent(workspace) + '/workflows/' + encodeURIComponent(workflowId) + '/execute', 'POST', { input, context }),
  getWorkspaceTools: (workspace: string) => jsonFetch(`/workspaces/${encodeURIComponent(workspace)}/tools`),
  getWorkspaceTool: (workspace: string, toolName: string) => jsonFetch(`/workspaces/${encodeURIComponent(workspace)}/tools/${encodeURIComponent(toolName)}`),
  saveWorkspaceTool: (workspace: string, tool: any) => jsonFetch(`/workspaces/${encodeURIComponent(workspace)}/tools`, 'POST', tool),
  deleteWorkspaceTool: (workspace: string, toolName: string) => jsonFetch(`/workspaces/${encodeURIComponent(workspace)}/tools/${encodeURIComponent(toolName)}`, 'DELETE'),
  getWorkspaceToolFeatures: (workspace: string, toolName: string) => jsonFetch(`/workspaces/${encodeURIComponent(workspace)}/tools/${encodeURIComponent(toolName)}/features`),
  getWorkspaceToolFeature: (workspace: string, toolName: string, featureName: string) => jsonFetch(`/workspaces/${encodeURIComponent(workspace)}/tools/${encodeURIComponent(toolName)}/features/${encodeURIComponent(featureName)}`),
  saveWorkspaceToolFeature: (workspace: string, toolName: string, feature: any) => jsonFetch(`/workspaces/${encodeURIComponent(workspace)}/tools/${encodeURIComponent(toolName)}/features`, 'POST', feature),
  deleteWorkspaceToolFeature: (workspace: string, toolName: string, featureName: string) => jsonFetch(`/workspaces/${encodeURIComponent(workspace)}/tools/${encodeURIComponent(toolName)}/features/${encodeURIComponent(featureName)}`, 'DELETE')
};

export default apiClient;