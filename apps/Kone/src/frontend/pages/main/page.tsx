'use client';

import { useEffect, useMemo, useState } from 'react';
import { BaseButton } from '@ultrst-armada/floks/ui';
import { WorkspaceGate } from '@ultrst-armada/floks/ui';
import { createKloksWorkspaceStorageService } from '@ultrst-armada/floks';
import { luthFetch } from '../../../libraries/client/luthAuthClient.js';
import FodTab from './tabs/fod/page.js';
import AikoTab from './tabs/aiko/page.js';
import PerformancesTab from './tabs/performances/page.js';
import SettingsPage from '../settings/page.js';
import { apiClient } from '../../../libraries/client/apiClient.js';

type Tab = 'fod' | 'aiko' | 'performances' | 'settings';
type Workspace = {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  [key: string]: unknown;
};

function setActiveWorkspace(workspaceId: string) {
  localStorage.setItem('skipo-active-workspace', workspaceId);
  window.dispatchEvent(new Event('skipo-workspace-changed'));
}

export function MainPage() {
  const [tab, setTab] = useState<Tab>('fod');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(
    () => localStorage.getItem('skipo-active-workspace'),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadWorkspaces = async () => {
      setLoading(true);
      try {
        const data: any = await apiClient.getWorkspaces();
        if (cancelled) return;
        const next = Array.isArray(data.workspaces) ? data.workspaces : [];
        setWorkspaces(next);
        const stored = localStorage.getItem('skipo-active-workspace');
        const active = data.activeWorkspaceId && next.some((w: Workspace) => w.id === data.activeWorkspaceId)
          ? data.activeWorkspaceId
          : stored && next.some((w: Workspace) => w.id === stored)
            ? stored
            : null;
        setActiveWorkspaceId(active);
        if (active) setActiveWorkspace(active);
        setError(null);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const onWorkspaceChanged = () => { void loadWorkspaces(); };
    void loadWorkspaces();
    window.addEventListener('skipo-workspace-changed', onWorkspaceChanged);
    return () => {
      cancelled = true;
      window.removeEventListener('skipo-workspace-changed', onWorkspaceChanged);
    };
  }, []);

  const storageService = useMemo(() => createKloksWorkspaceStorageService({
    invoke: async (serviceId, operation, input) => {
      if (serviceId !== 'kloks.backend.storage') {
        throw new Error(`Unsupported canonical service: ${serviceId}`);
      }
      const routes: Record<string, { path: string; method: 'GET' | 'POST' }> = {
        getProviderCapabilities: { path: '/api/storage/providers', method: 'GET' },
        getConnections: { path: '/api/storage/connections', method: 'GET' },
        testBackblazeCredentials: { path: '/api/storage/connections/backblaze/test', method: 'POST' },
        createBackblazeConnection: { path: '/api/storage/connections/backblaze', method: 'POST' },
        listBackblazeConnectionBuckets: { path: '/api/storage/connections/backblaze/buckets', method: 'POST' },
        createGoogleDriveAuthorizationRequest: { path: '/api/storage/connections/google/authorize', method: 'GET' },
        listGoogleDriveFolders: { path: '/api/storage/connections/google/folders', method: 'POST' },
        getGoogleDriveAccountIdentity: { path: '/api/storage/connections/google/identity', method: 'POST' },
        selectGoogleDriveRootFolder: { path: '/api/storage/connections/google/root', method: 'POST' },
      };
      const route = routes[operation];
      if (!route) throw new Error(`Unsupported Kloks storage operation: ${operation}`);

      const requestUrl = new URL(route.path, window.location.origin);
      if (operation === 'createGoogleDriveAuthorizationRequest') {
        const returnTo = typeof input.returnTo === 'string' ? input.returnTo : window.location.href;
        requestUrl.searchParams.set('returnTo', returnTo);
      }

      const response = await luthFetch(requestUrl.toString(), {
        method: route.method,
        ...(route.method === 'POST'
          ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }
          : {}),
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => ({})) as Record<string, any>;
      if (!response.ok || payload.success === false) {
        throw new Error(String(payload.error || `Storage service returned HTTP ${response.status}.`));
      }
      if (operation === 'getGoogleDriveAccountIdentity') return payload.identity ?? payload;
      if (operation === 'listGoogleDriveFolders') return payload.folders || [];
      if (operation === 'selectGoogleDriveRootFolder') return payload.folder;
      return payload;
    },
  }), []);

  const selectWorkspace = (workspace: Workspace) => {
    setActiveWorkspaceId(workspace.id);
    setActiveWorkspace(workspace.id);
  };

  const createWorkspace = async (input: Record<string, unknown>) => {
    const created = await apiClient.createWorkspace('', input);
    const workspace = (created as any)?.workspace ?? created;
    if (!workspace?.id) throw new Error('Workspace service returned no workspace.');
    setWorkspaces((current) => [...current.filter((item) => item.id !== workspace.id), workspace]);
    selectWorkspace(workspace);
  };

  if (!activeWorkspaceId) {
    return (
      <WorkspaceGate
        appName="Kone"
        appSubtitle="WORKSPACE VAULT GATEWAY • CANONICAL WORKSPACE SERVICE"
        workspaces={workspaces}
        activeWorkspaceId={null}
        onSelectWorkspace={(workspace: any) => selectWorkspace(workspace)}
        onCreateWorkspace={createWorkspace}
        loading={loading}
        error={error}
        storageService={storageService}
        visibility={{ storagePolicy: { providers: ['google_drive', 'backblaze_b2'] } }}
      />
    );
  }

  const workspace = workspaces.find((item) => item.id === activeWorkspaceId);
  const workspaceId = activeWorkspaceId;

  return (
    <div data-kone-main-page="true" style={{ height: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ height: 48, display: 'flex', gap: 8, alignItems: 'center', padding: '0 12px', borderBottom: 'var(--skipo-border)' }}>
        <strong style={{ marginRight: 8 }}>{workspace?.name ?? 'Kone'}</strong>
        <BaseButton size="sm" variant={tab === 'fod' ? 'accent' : 'secondary'} onClick={() => setTab('fod')}>FOD</BaseButton>
        <BaseButton size="sm" variant={tab === 'aiko' ? 'accent' : 'secondary'} onClick={() => setTab('aiko')}>Aiko</BaseButton>
        <BaseButton size="sm" variant={tab === 'performances' ? 'accent' : 'secondary'} onClick={() => setTab('performances')}>Performances</BaseButton>
        <BaseButton size="sm" variant={tab === 'settings' ? 'accent' : 'secondary'} onClick={() => setTab('settings')}>Settings</BaseButton>
        <BaseButton size="sm" variant="secondary" onClick={() => { setActiveWorkspaceId(null); setActiveWorkspace(''); localStorage.removeItem('skipo-active-workspace'); window.dispatchEvent(new Event('skipo-workspace-changed')); }}>Switch Workspace</BaseButton>
      </header>
      <main style={{ flex: 1, minHeight: 0 }}>
        {tab === 'fod'
          ? <FodTab workspaceId={workspaceId} />
          : tab === 'aiko'
            ? <AikoTab workspaceId={workspaceId} />
            : tab === 'performances'
              ? <PerformancesTab workspaceId={workspaceId} />
              : <SettingsPage workspace={workspace} />}
      </main>
    </div>
  );
}

export default MainPage;
