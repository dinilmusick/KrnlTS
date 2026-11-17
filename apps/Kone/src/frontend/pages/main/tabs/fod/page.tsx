'use client';

import { useEffect, useMemo, useState } from 'react';
import { FodModule, type FodRuntimeLike } from '@ultrst-armada/floks/canvas-ui/fod';
import type { FodNodeDefinition, FodFlow } from '@ultrst-armada/kloks/fod';
import { luthFetch } from '../../../../../libraries/client/luthAuthClient.js';

function createRuntime(workspaceId: string): FodRuntimeLike {
  const call = async (path: string, init?: RequestInit) => {
    const response = await luthFetch(
      `/api/fod?workspaceId=${encodeURIComponent(workspaceId)}${path}`,
      { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } },
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(String(payload?.error ?? `FOD request failed (${response.status})`));
    return payload;
  };

  return {
    listFlows: () => call('') as Promise<FodFlow[]>,
    getFlow: (id) => call(`&flowId=${encodeURIComponent(id)}`) as Promise<FodFlow | null>,
    saveFlow: (flow) => call('', { method: 'POST', body: JSON.stringify({ action: 'save', flow }) }) as Promise<FodFlow>,
    deleteFlow: (id) => call('', { method: 'POST', body: JSON.stringify({ action: 'delete', flowId: id }) }) as Promise<boolean>,
    executeFlow: (id) => call('', { method: 'POST', body: JSON.stringify({ action: 'execute', flowId: id }) }),
  };
}

export default function FodTab({ workspaceId = 'default' }: { workspaceId?: string }) {
  const [nodes, setNodes] = useState<FodNodeDefinition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const api = useMemo(() => createRuntime(workspaceId), [workspaceId]);

  useEffect(() => {
    let active = true;
    setError(null);
    void luthFetch(`/api/fod/nodes?workspaceId=${encodeURIComponent(workspaceId)}`)
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(String(payload?.error ?? `FOD node discovery failed (${response.status})`));
        return payload as FodNodeDefinition[];
      })
      .then((value) => {
        if (active) setNodes(Array.isArray(value) ? value : []);
      })
      .catch((cause) => {
        if (!active) return;
        setNodes([]);
        setError(cause instanceof Error ? cause.message : String(cause));
      });
    return () => { active = false; };
  }, [workspaceId]);

  return (
    <section style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {error && <p role="alert" style={{ margin: 8 }}>{error}</p>}
      <div style={{ flex: 1, minHeight: 0 }}>
        <FodModule runtime={api} workspaceId={workspaceId} nodeDefinitions={nodes} />
      </div>
    </section>
  );
}
