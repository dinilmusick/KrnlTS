import React from 'react';
import {
  WorkspaceTilesMenu,
  type WorkspaceCreateInput,
  type WorkspaceRecord,
  type WorkspaceStorageOption,
} from '@ultrst-armada/floks/ui';
import { apiClient } from '../../../libraries/client/apiClient.js';

export interface WorkspaceGateProps {
  workspaces: WorkspaceRecord[];
  userId?: string;
  currentUser?: { id: string; email?: string; name?: string; username?: string } | null;
  storageOptions?: WorkspaceStorageOption[];
  onManageStorage?: () => void;
  activeWorkspaceId?: string | null;
  onSelectWorkspace: (ws: WorkspaceRecord) => void;
  onCreateWorkspace?: (input: WorkspaceCreateInput) => Promise<void> | void;
  onDeleteWorkspace?: (id: string) => Promise<void> | void;
  onLogout?: () => void;
  appName?: string;
}

export const WorkspaceGate: React.FC<WorkspaceGateProps> = ({
  workspaces,
  userId,
  currentUser,
  storageOptions,
  onManageStorage,
  activeWorkspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
  onDeleteWorkspace,
  onLogout,
  appName = 'SKIPO APP',
}) => (
  <WorkspaceTilesMenu
    workspaces={workspaces}
    userId={userId || currentUser?.id}
    currentUser={currentUser}
    storageOptions={storageOptions}
    onManageStorage={onManageStorage}
    activeWorkspaceId={activeWorkspaceId}
    onSelectWorkspace={onSelectWorkspace}
    onCreateWorkspace={async (input) => {
      if (onCreateWorkspace) await onCreateWorkspace(input);
      else {
        const result = await apiClient.createWorkspace(userId || currentUser?.id || 'system', input as unknown as Record<string, unknown>);
        if (!result?.success) throw new Error(result?.error || 'Workspace creation failed.');
      }
    }}
    onDeleteWorkspace={onDeleteWorkspace}
    onLogout={onLogout}
    appName={appName}
    mode="working-workspace"
  />
);
