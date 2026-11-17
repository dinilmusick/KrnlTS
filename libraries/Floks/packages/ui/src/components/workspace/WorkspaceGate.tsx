import React, { useMemo } from 'react';
import { LogOut, ArrowLeft } from 'lucide-react';
import { WorkspaceTilesMenu, type WorkspaceRecord } from './WorkspaceTilesMenu.js';
import { type WorkspaceStorageService, type WorkspaceCreateInput, type WorkspaceStorageOption, type WorkspaceCreateDialogVisibility } from './WorkspaceCreateDialog.js';

export interface WorkspaceGateProps {
  workspaces: WorkspaceRecord[] | any[];
  activeWorkspaceId?: string | null;
  userId?: string;
  currentUser?: { id: string; email: string; name?: string; role?: string } | null;
  appName?: string;
  appSubtitle?: string;
  storageService?: WorkspaceStorageService;
  storageOptions?: WorkspaceStorageOption[];
  visibility?: WorkspaceCreateDialogVisibility;
  onSelectWorkspace: (workspace: WorkspaceRecord) => void;
  onCreateWorkspace?: (input: WorkspaceCreateInput | any) => Promise<void> | void;
  onUpdateWorkspace?: (workspaceId: string, patch: { name: string; description?: string }) => Promise<void> | void;
  onDeleteWorkspace?: (workspaceId: string) => Promise<void> | void;
  onLogout?: () => void;
  canClose?: boolean;
  onClose?: () => void;
  loading?: boolean;
  error?: string | null;
}

export const WorkspaceGate: React.FC<WorkspaceGateProps> = ({
  workspaces,
  activeWorkspaceId,
  userId,
  currentUser,
  appName = 'Workspaces',
  appSubtitle = 'WORKSPACE VAULT GATEWAY • ISOLATION ENFORCED (LAW L6)',
  storageService,
  storageOptions,
  visibility,
  onSelectWorkspace,
  onCreateWorkspace,
  onUpdateWorkspace,
  onDeleteWorkspace,
  onLogout,
  canClose,
  onClose,
  loading = false,
  error = null,
}) => {
  const normalizedWorkspaces: WorkspaceRecord[] = useMemo(() => {
    return (workspaces || []).map((w: any) => ({
      id: w.id,
      title: w.title || w.name || 'Workspace',
      name: w.name || w.title || 'Workspace',
      description: w.description || 'Workspace vault for workflows and graph state',
      workspacePath: w.workspacePath || './projects',
      storageProvider: w.storageProvider || w.storage?.provider || 'local_fs',
      storageConnectionId: w.storageConnectionId || w.storage?.storageConnectionId,
      b2BucketName: w.b2BucketName || w.storage?.b2BucketName,
      b2Endpoint: w.b2Endpoint || w.storage?.b2Endpoint,
      b2Region: w.b2Region || w.storage?.b2Region,
      localFolderName: w.localFolderName || w.storage?.localFolderName,
      metadata: w.metadata,
    }));
  }, [workspaces]);

  const effectiveUserId = userId || currentUser?.id || 'system';

  return (
    <div
      className="min-h-screen h-screen w-screen bg-[var(--skipo-bg,#0b0e17)] text-[var(--skipo-text,#f8fafc)] font-mono p-6 sm:p-8 flex flex-col items-center justify-center overflow-auto"
      style={{ minHeight: '100vh', height: '100vh', width: '100vw' }}
    >
      <div className="w-full max-w-4xl my-auto">
        <header className="mb-6 flex items-center justify-between border-b border-[var(--skipo-border-color,#1e293b)] pb-4">
          <div>
            <h1 className="text-2xl font-black tracking-wider text-[var(--skipo-accent,#f59e0b)] uppercase">
              {appName}
            </h1>
            <p className="text-xs text-[var(--skipo-text-muted,#94a3b8)] font-mono tracking-tight mt-0.5">
              {appSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canClose && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-3 border border-[var(--skipo-border-color,#1e293b)] hover:border-[var(--skipo-accent,#f59e0b)] text-[var(--skipo-text-muted)] hover:text-[var(--skipo-text)] text-[10px] font-black flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft size={13} /> BACK TO APP
              </button>
            )}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="h-8 px-3 border border-red-500/60 hover:bg-red-950/20 text-red-300 text-[10px] font-black flex items-center gap-1.5 transition-colors"
              >
                <LogOut size={12} /> LOGOUT
              </button>
            )}
          </div>
        </header>

        <WorkspaceTilesMenu
          workspaces={normalizedWorkspaces}
          activeWorkspaceId={activeWorkspaceId}
          userId={effectiveUserId}
          currentUser={currentUser}
          appName={appName}
          storageService={storageService}
          storageOptions={storageOptions}
          visibility={visibility}
          onSelectWorkspace={onSelectWorkspace}
          onCreateWorkspace={onCreateWorkspace || (() => {})}
          onUpdateWorkspace={onUpdateWorkspace}
          onDeleteWorkspace={onDeleteWorkspace}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
};

export default WorkspaceGate;
