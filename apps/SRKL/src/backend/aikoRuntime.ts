import { AikoRuntime } from '@ultrst-armada/kloks/aiko';
import type { AikoCapability, AikoSourceKind } from '@ultrst-armada/kloks/aiko';
import { AIKeyServiceFacade } from '@ultrst-armada/kloks/krnl-ai-services';
import { guttsFodNodeDefinitions, executeGuttsApi } from '@dinilmusick/gutts/api';
import { scanBackendFacadeToNodes } from '@ultrst-armada/kloks/fod';
import { queryUnifiedDb } from '@ultrst-armada/kloks/backend/node';

interface AikoEngineSettings { url: string; moduleToken: string; }

let aikoSettingsCache: { value: AikoEngineSettings; expiresAt: number } | null = null;

async function getAikoEngineSettings(): Promise<AikoEngineSettings> {
  if (aikoSettingsCache && Date.now() < aikoSettingsCache.expiresAt) return aikoSettingsCache.value;
  let value: AikoEngineSettings = { url: '', moduleToken: '' };
  try {
    const result = await queryUnifiedDb<{ credentials: unknown }>(
      `SELECT credentials FROM public."ultrst-credentials" WHERE id = 'system' LIMIT 1`
    );
    const raw = result.rows[0]?.credentials;
    const credentials = typeof raw === 'string' ? JSON.parse(raw) : raw || {};
    const aiko = (credentials as any).aiko || {};
    value = {
      url: String(aiko.deploymentUrl || aiko.engineUrl || aiko.url || '').trim().replace(/\/+$/, ''),
      moduleToken: String(aiko.moduleToken || ''),
    };
  } catch {}
  aikoSettingsCache = { value, expiresAt: Date.now() + 30_000 };
  return value;
}

export function createAikoRuntime(
  workspaceId: string,
  input: {
    fod: any;
    backend: any;
  },
) {
  const { fod, backend } = input;
  const host = scanBackendFacadeToNodes(backend);

  const resolve = async (specId?: string, context?: any) => {
    const settings = await getAikoEngineSettings();
    if (!settings.url) return { spec: { mode: 'application-router', ...context }, specId: specId || 'default-spec' };
    const response = await fetch(settings.url + '/api/module/resolve-intelligence', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(settings.moduleToken ? { 'x-aiko-module-token': settings.moduleToken } : {}),
      },
      body: JSON.stringify({ specId, ...context }),
    });
    if (!response.ok) throw new Error('Aiko Engine intelligence resolver request failed.');
    return response.json();
  };

  const capabilities = async (): Promise<AikoCapability[]> => {
    const endpointCapabilities: AikoCapability[] = (host?.endpoints ?? [])
      .filter((endpoint: any) => !String(endpoint.id).toLowerCase().includes('aiko') && !String(endpoint.serviceId).toLowerCase().includes('aiko'))
      .map((endpoint: any) => ({
        id: String(endpoint.id),
        name: endpoint.operationName || endpoint.id,
        description: endpoint.description,
        sourceKind: 'endpoint' as AikoSourceKind,
        sourceId: String(endpoint.id),
        inputSchema: endpoint.inputSchema,
        execute: (input: unknown) => endpoint.invoke(input),
      }));

    const flowCapabilities: AikoCapability[] = (await fod.listFlows()).map((flow: any) => ({
      id: String(flow.id),
      name: flow.name,
      description: flow.description,
      sourceKind: 'fod-flow' as AikoSourceKind,
      sourceId: String(flow.id),
      inputSchema: flow.inputSchema,
      execute: async (input: unknown) => {
        const result = await fod.executeFlow(String(flow.id), input);
        if (!result.success) throw new Error(result.errors?.[0]?.message || 'Flow execution failed');
        return result.output;
      },
    }));

    const guttsCapabilities: AikoCapability[] = guttsFodNodeDefinitions.map((node: any) => ({
      id: String(node.metadata.apiId),
      name: node.label,
      description: node.description,
      sourceKind: 'gutts-api' as AikoSourceKind,
      sourceId: String(node.metadata.apiId),
      inputSchema: node.inputSchema,
      execute: (input: unknown) => executeGuttsApi(String(node.metadata.apiId), input as Record<string, unknown>),
    }));

    return [...endpointCapabilities, ...flowCapabilities, ...guttsCapabilities];
  };

  const resolveNaturalLanguage = async (agent: any, inputText: string) => {
    const settings = await getAikoEngineSettings();
    if (!settings.url) {
      const allCaps = await capabilities();
      const matched = allCaps.find((c: any) =>
        inputText.toLowerCase().includes(c.name.toLowerCase()) ||
        inputText.toLowerCase().includes(c.id.toLowerCase())
      ) ?? allCaps[0];
      return { capabilityId: matched?.id ?? 'default', input: { value: inputText, message: inputText } };
    }
    const response = await fetch(settings.url + '/api/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: inputText }],
        intelligenceSpec: agent.intelligenceSpec,
        tools: [{ type: 'function', function: {
          name: agent.tool.id,
          description: agent.tool.description || agent.tool.name,
          parameters: agent.tool.inputSchema || { type: 'object' },
        }}],
        tool_choice: { type: 'function', function: { name: agent.tool.id } },
      }),
    });
    if (!response.ok) throw new Error('Aiko Engine natural-language resolution failed.');
    const payload = await response.json();
    const argumentsText = payload.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!argumentsText) throw new Error('Aiko Engine did not return a structured tool payload.');
    return JSON.parse(argumentsText);
  };

  const applicationAgent = {
    schemaVersion: '1.0.0' as const,
    id: 'skipo-application-agent',
    name: 'Application Agent',
    description: 'Universal conversational application router',
    agentType: 'AIKO' as const,
    intelligenceSpec: { mode: 'application-router' },
    sourceKind: 'custom' as const,
    sourceId: 'application',
    custom: true,
    tool: {
      id: 'skipo.application',
      name: 'Application Agent',
      description: 'Route a natural-language request to an application capability.',
      sourceKind: 'custom' as const,
      sourceId: 'application',
      inputSchema: { type: 'object', properties: { capabilityId: { type: 'string' }, input: {} }, required: ['capabilityId', 'input'] },
      execute: async (value: unknown) => {
        const request = value as { capabilityId?: string; input?: unknown };
        const capability = (await capabilities()).find(item => item.id === request.capabilityId);
        if (!capability) throw new Error('Application Agent resolved an unknown capability: ' + request.capabilityId);
        return capability.execute(request.input);
      },
    },
  };

  return new AikoRuntime({
    customAgents: [applicationAgent],
    capabilities,
    resolver: { resolve },
    resolveNaturalLanguage,
    keys: {
      listKeys: async () => (AIKeyServiceFacade.getKeys() as any[]).map((key: any) => ({
        id: key.id, providerId: key.providerId, label: key.label, status: key.status,
        isActive: key.isActive, emailGroup: key.emailGroup, expiresAt: key.expiresAt,
      })),
      getActiveKey: async (providerId: string) => {
        const facade: any = AIKeyServiceFacade;
        return typeof facade.getActiveKey === 'function' ? facade.getActiveKey(providerId) ?? null : null;
      },
      rotateKey: async (providerId: string) => {
        const facade: any = AIKeyServiceFacade;
        return typeof facade.rotateKey === 'function' ? facade.rotateKey(providerId) ?? null : null;
      },
      addKey: async (input: any) => AIKeyServiceFacade.addKey(input) as any,
      syncFromAikoEngine: async () => {
        const settings = await getAikoEngineSettings();
        if (!settings.url) throw new Error('Aiko Engine deployment URL is not configured in system credentials.');
        const response = await fetch(settings.url + '/api/module/keys/export', {
          headers: settings.moduleToken ? { 'x-aiko-module-token': settings.moduleToken } : undefined,
        });
        if (!response.ok) throw new Error('Aiko Engine key synchronization failed.');
        const payload = await response.json();
        const importer = (AIKeyServiceFacade as any).importKeys.bind(AIKeyServiceFacade);
        const imported = await importer(payload.backup);
        return { synced: imported.importedCount, message: 'Aiko Engine keys synchronized.' };
      },
    },
  });
}

export function createAikoServiceFacade(createRuntime: (workspaceId: string) => any) {
  return {
    id: 'kloks.aiko',
    name: 'AikoService',
    version: '1.0.0',
    runtime: 'server' as const,
    deployment: 'local' as const,
    execute: async (operation: string, input?: any) => {
      const runtime = createRuntime(String(input?.workspaceId || 'default'));
      if (operation === 'listAgents') return runtime.listAgents();
      if (operation === 'executeAgent') return runtime.executeAgent(String(input?.agentId), input?.query);
      if (operation === 'listKeys') return runtime.listKeys();
      if (operation === 'syncFromAikoEngine') return runtime.syncFromAikoEngine();
      if (operation === 'listCapabilities') return runtime.listCapabilities();
      if (operation === 'createCustomAgent') return runtime.createCustomAgent(String(input?.name), input?.capabilityIds, input?.specId);
      throw new Error('Unsupported Aiko operation: ' + operation);
    },
  };
}
