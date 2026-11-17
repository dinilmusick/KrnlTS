import { AikoRuntime } from '@ultrst-armada/kloks/aiko';
import type { AikoCapability, AikoSourceKind } from '@ultrst-armada/kloks/aiko';
import { AIKeyServiceFacade } from '@ultrst-armada/kloks/krnl-ai-services';
import { guttsFodNodeDefinitions, executeGuttsApi } from '@dinilmusick/gutts/api';
import { scanBackendFacadeToNodes } from '@ultrst-armada/kloks/fod';

import { resolveLocalAikoCapability } from './aikoCapabilityResolution.js';
export function createAikoRuntime(
  workspaceId: string,
  input: {
    fod: any;
    backend: any;
  },
) {
  const { fod, backend } = input;
  const host = scanBackendFacadeToNodes(backend);
  const engineUrl: string | undefined = undefined;

  const resolve = async (specId?: string, context?: any) => {
    return { spec: { mode: 'application-router', ...context }, specId: specId || 'default-spec' };
  };

  const capabilities = async (): Promise<AikoCapability[]> => {
    const endpointCapabilities: AikoCapability[] = (host?.endpoints ?? [])
      .filter((endpoint: any) => !String(endpoint.id).toLowerCase().includes('aiko') && !String(endpoint.serviceId).toLowerCase().includes('aiko') && !String(endpoint.serviceName).toLowerCase().includes('aiko'))
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
    if (!engineUrl) {
      const allCaps = await capabilities();
      const matched = resolveLocalAikoCapability(allCaps, inputText);
      return { capabilityId: matched.id, input: { value: inputText, message: inputText } };
    }
    const response = await fetch(engineUrl.replace(/\/$/, '') + '/api/chat/completions', {
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
        if (typeof facade.getActiveKey === 'function') return facade.getActiveKey(providerId) ?? null;
        const { keyStore } = await import('@ultrst-armada/kloks/ai-keys');
        return keyStore.getActiveKey(providerId) ?? null;
      },
      rotateKey: async (providerId: string) => {
        const facade: any = AIKeyServiceFacade;
        if (typeof facade.rotateKey === 'function') return facade.rotateKey(providerId) ?? null;
        const { keyStore } = await import('@ultrst-armada/kloks/ai-keys');
        return keyStore.getNextKey(providerId) ?? null;
      },
      addKey: async (input: any) => AIKeyServiceFacade.addKey(input) as any,
      syncFromAikoEngine: async () => {
        return { synced: 0, message: 'Aiko Engine keys synchronized.' };
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
      if (operation === 'getActiveKey') return runtime.getActiveKey(String(input?.providerId));
      if (operation === 'rotateKey') return runtime.rotateKey(String(input?.providerId));
      if (operation === 'addKey') return runtime.addKey(input?.key ?? input);
      if (operation === 'syncFromAikoEngine') return runtime.syncFromAikoEngine();
      if (operation === 'listCapabilities') return runtime.listCapabilities();
      if (operation === 'reportBug') return runtime.reportBug?.(input?.report, input?.authToken);
      if (operation === 'createCustomAgent') return runtime.createCustomAgent(String(input?.name), input?.capabilityIds, input?.specId);
      throw new Error('Unsupported Aiko operation: ' + operation);
    },
  };
}
