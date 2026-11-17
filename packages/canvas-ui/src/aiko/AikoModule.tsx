'use client';
import React, { useEffect, useMemo, useState } from 'react';

export interface AikoIntelligenceSpec { [key: string]: unknown; }
export interface AikoAgentDefinition {
  schemaVersion?: '1.0.0' | string;
  id: string;
  name: string;
  description?: string;
  agentType: 'TOOL' | 'ENDPOINT' | 'AIKO';
  tool?: Record<string, unknown>;
  intelligenceSpec?: AikoIntelligenceSpec;
  intelligenceSpecId?: string;
  sourceKind?: 'endpoint' | 'fod-flow' | 'gutts-api' | 'custom';
  sourceId?: string;
  allowedToolIds?: string[];
  custom?: boolean;
}
export interface AikoCapability {
  id: string;
  name: string;
  description?: string;
  sourceKind?: 'endpoint' | 'fod-flow' | 'gutts-api' | 'custom';
  sourceId?: string;
}
export interface AikoKey { id: string; providerId: string; label: string; status?: string; isActive?: boolean; emailGroup?: string; expiresAt?: string | null; }
export interface AikoRuntimeLike {
  listAgents(): Promise<AikoAgentDefinition[]>;
  executeAgent(agentId: string, input: string): Promise<unknown>;
  listKeys(): Promise<AikoKey[]>;
  getActiveKey(providerId: string): Promise<AikoKey | null>;
  rotateKey(providerId: string): Promise<AikoKey | null>;
  addKey?(input: { providerId: string; label: string; key: string; emailGroup?: string }): Promise<unknown>;
  syncFromAikoEngine(): Promise<{ synced: number; message?: string }>;
  listCapabilities?(): Promise<AikoCapability[]>;
  createCustomAgent?(name: string, capabilityIds: string[], specId?: string): Promise<AikoAgentDefinition>;
}
export interface AikoModuleProps { runtime: AikoRuntimeLike; workspaceId: string; className?: string; }

export function AikoModule({ runtime, workspaceId, className }: AikoModuleProps) {
  const [agents, setAgents] = useState<AikoAgentDefinition[]>([]);
  const [capabilities, setCapabilities] = useState<AikoCapability[]>([]);
  const [keys, setKeys] = useState<AikoKey[]>([]);
  const [activeAgent, setActiveAgent] = useState<string>('');
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [provider, setProvider] = useState(''); const [label, setLabel] = useState(''); const [secret, setSecret] = useState(''); const [group, setGroup] = useState('');
  const [customName, setCustomName] = useState('');
  const [customCapIds, setCustomCapIds] = useState<string[]>([]);
  const [customSpecId, setCustomSpecId] = useState('');

  const refresh = async () => {
    const [nextAgents, nextKeys, nextCaps] = await Promise.all([
      runtime.listAgents(),
      runtime.listKeys(),
      runtime.listCapabilities ? runtime.listCapabilities() : Promise.resolve([]),
    ]);
    setAgents(nextAgents);
    setKeys(nextKeys);
    setCapabilities(nextCaps);
    if (!activeAgent && nextAgents[0]) setActiveAgent(nextAgents[0].id);
  };

  useEffect(() => { void refresh(); }, [workspaceId]);

  const groups = useMemo(() => {
    const map = new Map<string, AikoAgentDefinition[]>();
    for (const agent of agents) {
      const key = agent.sourceKind ?? 'custom';
      const list = map.get(key) ?? [];
      list.push(agent);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [agents]);

  const execute = async () => {
    if (!activeAgent || !input.trim()) return;
    setBusy(true);
    try {
      setResult(JSON.stringify(await runtime.executeAgent(activeAgent, input), null, 2));
    } catch (error) {
      setResult(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  const addKey = async () => {
    if (!runtime.addKey || !provider || !label || !secret) return;
    await runtime.addKey({ providerId: provider, label, key: secret, emailGroup: group || undefined });
    setSecret('');
    await refresh();
  };

  const sync = async () => {
    setBusy(true);
    try {
      const response = await runtime.syncFromAikoEngine();
      setMessage(response.message ?? ('Synced ' + response.synced + ' keys'));
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  const createCustomAgent = async () => {
    if (!runtime.createCustomAgent || !customName.trim() || customCapIds.length === 0) return;
    setBusy(true);
    try {
      const created = await runtime.createCustomAgent(customName.trim(), customCapIds, customSpecId.trim() || undefined);
      setCustomName('');
      setCustomCapIds([]);
      setCustomSpecId('');
      await refresh();
      setActiveAgent(created.id);
      setMessage(`Created custom agent ${created.name}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={className} data-aiko-module="true" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gridTemplateRows: '48px 1fr', height: '100%', minHeight: 500 }}>
      <header style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderBottom: '1px solid var(--skipo-border,#333)' }}>
        <strong>AIKO</strong>
        <button type="button" onClick={() => void sync()} disabled={busy}>Fetch from Aiko Engine</button>
        <span>{message}</span>
      </header>
      <aside style={{ overflow: 'auto', padding: 10, borderRight: '1px solid var(--skipo-border,#333)' }}>
        <h4>Agents</h4>
        {groups.map(([groupName, list]) => (
          <section key={groupName}>
            <strong>{groupName}</strong>
            {list.map(agent => (
              <button key={agent.id} type="button" onClick={() => setActiveAgent(agent.id)} style={{ display: 'block', width: '100%', textAlign: 'left', margin: '4px 0' }}>
                {agent.name} {agent.custom ? '(custom)' : ''}
              </button>
            ))}
          </section>
        ))}

        {runtime.createCustomAgent && (
          <section style={{ margin: '12px 0', padding: 8, border: '1px solid var(--skipo-border,#333)', borderRadius: 4 }}>
            <h5>Create Custom Agent</h5>
            <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Agent name" style={{ width: '100%', marginBottom: 4 }} />
            <input value={customSpecId} onChange={e => setCustomSpecId(e.target.value)} placeholder="Optional Spec ID" style={{ width: '100%', marginBottom: 4 }} />
            <div style={{ maxHeight: 90, overflow: 'auto', fontSize: 12, margin: '4px 0' }}>
              {capabilities.map(cap => (
                <label key={cap.id} style={{ display: 'block' }}>
                  <input
                    type="checkbox"
                    checked={customCapIds.includes(cap.id)}
                    onChange={e => {
                      setCustomCapIds(prev => e.target.checked ? [...prev, cap.id] : prev.filter(id => id !== cap.id));
                    }}
                  /> {cap.name}
                </label>
              ))}
            </div>
            <button type="button" onClick={() => void createCustomAgent()} disabled={busy || !customName.trim() || customCapIds.length === 0}>
              Create Custom Agent
            </button>
          </section>
        )}

        <h4>API Keys</h4>
        <div>
          <input value={provider} onChange={event => setProvider(event.target.value)} placeholder="Provider" />
          <input value={label} onChange={event => setLabel(event.target.value)} placeholder="Label" />
          <input value={group} onChange={event => setGroup(event.target.value)} placeholder="Email group" />
          <input value={secret} onChange={event => setSecret(event.target.value)} placeholder="API key" type="password" />
          <button type="button" onClick={() => void addKey()}>Add key</button>
        </div>
        {keys.map(key => (
          <div key={key.id}>
            {key.providerId}: {key.label} {key.isActive ? '(active)' : ''} <button type="button" onClick={() => void runtime.rotateKey(key.providerId)}>Rotate</button>
          </div>
        ))}
      </aside>
      <main style={{ padding: 16, overflow: 'auto' }}>
        {activeAgent ? (
          <>
            <h3>{agents.find(agent => agent.id === activeAgent)?.name}</h3>
            <pre>{JSON.stringify(agents.find(agent => agent.id === activeAgent)?.intelligenceSpec, null, 2)}</pre>
            <textarea value={input} onChange={event => setInput(event.target.value)} placeholder="Describe what you want the agent to do" rows={5} style={{ width: '100%' }} />
            <button type="button" onClick={() => void execute()} disabled={busy || !input.trim()}>Execute</button>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{result}</pre>
          </>
        ) : (
          <p>No Aiko agent selected.</p>
        )}
      </main>
    </div>
  );
}
AikoModule.displayName = 'AikoModule';
