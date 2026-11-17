/**
 * @file AppLayout.tsx
 * @description SRKL application composition. Canonical auth/workspace UI is owned by Floks.
 */

import React from 'react';
import { AppShell as SkipoAppShell, WorkspaceTilesMenu, createKloksWorkspaceStorageService, type WorkspaceRecord, type WorkspaceStorageService } from '@ultrst-armada/floks/ui';
import { AppShellHeader } from './AppShellHeader';
import { MainContent } from './MainContent';
import { AppShellFooter } from './AppShellFooter';
import { useHub } from '../../context/HubContext';
import { WelcomePage } from '../common/WelcomePage';
import AdminWorkspaceView from '../Admin/AdminWorkspaceView';
import { luthFetch } from '../../auth/luthAuthClient';

export function AppLayout(): React.ReactElement {
  const { currentUser, login, logout, workspaces, activeWorkspaceId, switchWorkspace, reloadWorkspaces } = useHub();

  const workspaceStorageService: WorkspaceStorageService = React.useMemo(() => createKloksWorkspaceStorageService({
    invoke: async (serviceId, operation, input) => {
      if (serviceId !== 'kloks.backend.storage') {
        throw new Error(`Unsupported canonical storage service: ${serviceId}`);
      }
      const routes: Record<string, { path: string; method: 'GET' | 'POST' }> = {
        getProviderCapabilities: { path: '/api/workspaces/storage/providers', method: 'GET' },
        getConnections: { path: '/api/workspaces/storage/connections', method: 'GET' },
        testBackblazeCredentials: { path: '/api/workspaces/storage/backblaze/test', method: 'POST' },
        createBackblazeConnection: { path: '/api/workspaces/storage/backblaze', method: 'POST' },
        listBackblazeConnectionBuckets: { path: '/api/workspaces/storage/backblaze/buckets', method: 'POST' },
        createGoogleDriveAuthorizationRequest: { path: '/api/workspaces/storage/google/start', method: 'GET' },
        listGoogleDriveFolders: { path: '/api/workspaces/storage/google/folders', method: 'POST' },
        getGoogleDriveAccountIdentity: { path: '/api/workspaces/storage/google/identity', method: 'POST' },
        selectGoogleDriveRootFolder: { path: '/api/workspaces/storage/google/select-root', method: 'POST' },
      };
      const route = routes[operation];
      if (!route) throw new Error(`Unsupported Kloks storage operation: ${operation}`);
      const url = new URL(route.path, window.location.origin);
      if (operation === 'createGoogleDriveAuthorizationRequest') {
        url.searchParams.set('response', 'json');
        url.searchParams.set('returnTo', String(input.returnTo ?? window.location.href));
      }
      const response = await luthFetch(url.toString(), {
        method: route.method,
        ...(route.method === 'POST'
          ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }
          : {}),
      });
      const payload = await response.json().catch(() => ({})) as Record<string, any>;
      if (!response.ok || payload.success === false) {
        throw new Error(String(payload.error || `Storage service returned HTTP ${response.status}.`));
      }
      if (operation === 'getGoogleDriveAccountIdentity') return payload.identity;
      return payload;
    },
  }), []);

  if (!currentUser) return <WelcomePage onLoginSuccess={login} />;

  if (currentUser.role === 'admin') {
    return <AdminWorkspaceView currentUser={currentUser} onLogout={logout} />;
  }

  if (!activeWorkspaceId) {
    const records: WorkspaceRecord[] = workspaces.map((workspace: any) => ({
      ...workspace,
      title: workspace.title || workspace.name || 'Workspace',
    }));

    const createWorkspace = async (input: any) => {
      const response = await luthFetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: input.name,
          description: input.description || '',
          storage: input.storage,
          storageConnection: input.storageConnection,
          storageProvider: input.storageProvider,
          storageConnectionId: input.storageConnectionId || null,
          localFolderName: input.localFolderName,
          localFolderKey: input.localFolderKey,
          b2BucketName: input.b2BucketName,
          b2Endpoint: input.b2Endpoint || input.storageConnection?.b2Endpoint,
          b2Region: input.b2Region || input.storageConnection?.b2Region,
          googleEmail: input.googleEmail,
          googleRootFolderId: input.googleRootFolderId,
          googleRootFolderName: input.googleRootFolderName,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.workspace) {
        throw new Error(data.error || 'Failed to initialize workspace.');
      }
      switchWorkspace(data.workspace.id);
      await reloadWorkspaces();
    };

    const deleteWorkspace = async (workspaceId: string) => {
      const response = await luthFetch(`/api/workspaces/${workspaceId}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to delete workspace.');
      await reloadWorkspaces();
    };

    return (
      <div className="min-h-screen h-screen w-screen bg-[var(--skipo-bg,#0b0e17)] text-[var(--skipo-text,#f8fafc)] font-mono p-6 sm:p-8 flex flex-col items-center justify-center overflow-auto">
        <div className="w-full max-w-4xl my-auto">
          <WorkspaceTilesMenu
            appName="SRKL"
            currentUser={currentUser}
            userId={currentUser.id}
            workspaces={records}
            activeWorkspaceId={activeWorkspaceId}
            storageService={workspaceStorageService}
            visibility={{
              storagePolicy: { providers: ['google_drive', 'backblaze_b2'] },
              hiddenStorageProviders: ['local_fs'],
              hiddenFields: ['localFolderName', 'canonicalFolderPreview'],
            }}
            onSelectWorkspace={(workspace) => switchWorkspace(workspace.id)}
            onCreateWorkspace={createWorkspace}
            onDeleteWorkspace={deleteWorkspace}
            onLogout={() => void logout()}
          />
        </div>
      </div>
    );
  }

  return (
    <SkipoAppShell
      id="srkl-app-container"
      header={<AppShellHeader />}
      footer={<AppShellFooter />}
      className="skipo-theme-bg select-none"
    >
      <div className="relative flex-1 flex flex-col min-h-full">
        <MainContent />
      </div>
    </SkipoAppShell>
  );
}
