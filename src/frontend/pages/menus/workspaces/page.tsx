/**
 * Canonical Skipo Gate 2 Workspaces Menu Page.
 * Generic workspace UI is owned by Floks.
 */
import React, { useMemo } from 'react';
import { jsonFetch } from '../../../../libraries/apiClient/apiClient.js';
import {
  WorkspaceTilesMenu as FloksWorkspaceTilesMenu,
  createKloksWorkspaceStorageService,
  type WorkspaceRecord,
  type WorkspaceStorageService,
  type WorkspaceTilesMenuProps as FloksWorkspaceTilesMenuProps,
} from '@ultrst-armada/floks';

export interface WorkspacesPageProps {
  currentUser?: { id: string; email: string; name?: string } | null;
  storageOptions?: Array<{ id: string; provider: string; label?: string; name?: string; role?: 'primary' | 'redundant_clone'; enabled?: boolean; localFolderName?: string; localFolderKey?: string; bucketName?: string; b2BucketName?: string; googleEmail?: string; googleRootFolderId?: string; googleRootFolderName?: string }>;
  workspaces: Array<{
    id: string;
    name: string;
    description?: string;
    storageProvider?: string;
    storageConnectionId?: string;
    localFolderName?: string;
    b2BucketName?: string;
    b2Endpoint?: string;
    b2Region?: string;
    workspacePath?: string;
  }>;
  activeWorkspaceId?: string | null;
  onSelectWorkspace: (id: string) => void;
  onCreateWorkspace: (name: string, description?: string, engineOrOptions?: string | Record<string, any>) => Promise<boolean> | boolean;
  onDeleteWorkspace?: (id: string) => Promise<boolean> | boolean;
  onLogout?: () => void;
  systemDbStatus?: unknown;
  onClose?: () => void;
  canClose?: boolean;
}

export function WorkspacesPage({
  currentUser,
  storageOptions,
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
  onDeleteWorkspace,
  onLogout,
}: WorkspacesPageProps) {
  const storageService: WorkspaceStorageService = useMemo(() => createKloksWorkspaceStorageService({
    invoke: async (serviceId, operation, input) => {
      if (serviceId !== 'kloks.backend.storage') {
        throw new Error(`Unsupported canonical service: ${serviceId}`);
      }

      const routes: Record<string, { path: string; method: 'GET' | 'POST' }> = {
        getProviderCapabilities: { path: '/api/v1/storage/providers', method: 'GET' },
        getConnections: { path: '/api/v1/storage/connections', method: 'GET' },
        testBackblazeCredentials: { path: '/api/v1/storage/connections/backblaze/test', method: 'POST' },
        createBackblazeConnection: { path: '/api/v1/storage/connections/backblaze', method: 'POST' },
        listBackblazeConnectionBuckets: { path: '/api/v1/storage/connections/backblaze/buckets', method: 'POST' },
        createGoogleDriveAuthorizationRequest: { path: '/api/v1/storage/connections/google/connect', method: 'POST' },
        getGoogleDriveAccountIdentity: { path: '/api/v1/storage/connections/google/identity', method: 'POST' },
        selectGoogleDriveRootFolder: { path: '/api/v1/storage/connections/google/root', method: 'POST' },
        listGoogleDriveFolders: { path: '/api/v1/storage/connections/google/folders', method: 'POST' },
      };
      const route = routes[operation];
      if (!route) throw new Error(`Unsupported Kloks storage operation: ${operation}`);

      const payload = await jsonFetch<Record<string, any>>(
        route.path.replace(/^\/api\/v1/, ''),
        route.method,
        route.method === 'POST' ? input : undefined,
        { 'Cache-Control': 'no-store' },
      );
      if (payload.success === false) {
        throw new Error(String(payload.error || 'Canonical storage service request failed.'));
      }
      if (operation === 'getGoogleDriveAccountIdentity') return payload.identity;
      return payload;
    },
  }), []);

  const records: WorkspaceRecord[] = workspaces.map((workspace) => ({
    ...workspace,
    title: workspace.name,
  }));

  const handleCreate: FloksWorkspaceTilesMenuProps['onCreateWorkspace'] = async (input: any) => {
    const result = await onCreateWorkspace(input.name, input.description, input);
    if (result === false) throw new Error('Workspace creation failed.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--skipo-bg,#0a0e17)] p-6 overflow-auto">
      <FloksWorkspaceTilesMenu
        appName="Aiko"
        currentUser={currentUser}
        userId={currentUser?.id}
        workspaces={records}
        activeWorkspaceId={activeWorkspaceId}
        storageOptions={storageOptions}
        storageService={storageService}
        onSelectWorkspace={(workspace) => onSelectWorkspace(workspace.id)}
        onCreateWorkspace={handleCreate}
        onDeleteWorkspace={async (id) => { await onDeleteWorkspace?.(id); }}
        onLogout={onLogout}
      />
    </div>
  );
}

export default WorkspacesPage;
