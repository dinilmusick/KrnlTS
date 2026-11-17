'use client';

import { useMemo } from 'react';
import { AikoModule, type AikoRuntimeLike } from '@ultrst-armada/floks/canvas-ui/aiko';
import { luthFetch } from '../../../../../libraries/client/luthAuthClient.js';

function createRuntime(workspaceId: string): AikoRuntimeLike {
  const call = async (action: string, body: Record<string, unknown> = {}) => {
    const response = await luthFetch('/api/aiko', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, workspaceId, ...body }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(String(payload?.error ?? `Aiko request failed (${response.status})`));
    return payload;
  };

  return {
    listAgents: () => call('listAgents'),
    executeAgent: (agentId, input) => call('executeAgent', { agentId, query: input }),
    listKeys: () => call('listKeys'),
    getActiveKey: (providerId) => call('getActiveKey', { providerId }),
    rotateKey: (providerId) => call('rotateKey', { providerId }),
    addKey: (input) => call('addKey', { input }),
    syncFromAikoEngine: () => call('syncFromAikoEngine'),
    listCapabilities: () => call('listCapabilities'),
    createCustomAgent: (name, capabilityIds, specId) => call('createCustomAgent', { name, capabilityIds, specId }),
  };
}

export default function AikoTab({ workspaceId = 'default' }: { workspaceId?: string }) {
  const api = useMemo(() => createRuntime(workspaceId), [workspaceId]);
  return <AikoModule runtime={api} workspaceId={workspaceId} />;
}
