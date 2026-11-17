import { useEffect, useState } from 'react';
import {
  FrnlPage,
  BaseButton,
  BaseCard,
  InfiniteCanvas,
  DockBar,
  type WorkspaceRecord,
  LoginGate,
  WorkspaceGate,
} from '../../components/components.js';
import { apiClient } from '../../../libraries/client/apiClient.js';

export function HomePage({ isGuest }: { isGuest?: boolean } = {}) {
  const [token, setToken] = useState<string | null>(isGuest ? 'guest-token' : null);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(isGuest ? 'ws-guest' : null);
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>(
    isGuest ? [{ id: 'ws-guest', name: 'Guest Session', storageProvider: 'memory' }] : []
  );
  const [canvasTransform, setCanvasTransform] = useState({ x: 0, y: 0, scale: 1 });

  useEffect(() => {
    if (!token || isGuest) return;
    apiClient.getWorkspaces()
      .then((data: any) => {
        if (data && Array.isArray(data.workspaces)) {
          setWorkspaces(data.workspaces);
          if (data.activeWorkspaceId) setActiveWorkspaceId(data.activeWorkspaceId);
        }
      })
      .catch(() => setWorkspaces([{ id: 'ws-default', name: 'Default Workspace', workspacePath: '/workspace' }]));
  }, [token, isGuest]);

  const createWorkspace = async (input: { name: string; description?: string; storage: any }) => {
    const created = await apiClient.createWorkspace('system', input);
    setWorkspaces((current) => [...current, created]);
    setActiveWorkspaceId(created.id);
  };

  if (!token) return <LoginGate appName="Skipo App" onSuccess={(result) => setToken(result.token || 'demo-token')} />;

  if (!activeWorkspaceId) {
    return (
      <WorkspaceGate
        appName="Skipo App"
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={(workspace) => setActiveWorkspaceId(workspace.id)}
        onCreateWorkspace={createWorkspace}
        onLogout={() => { setToken(null); setActiveWorkspaceId(null); }}
      />
    );
  }

  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId);
  return (
    <FrnlPage appName="Skipo" title={activeWorkspace?.name ?? 'Workspace'}
      topBarActions={<BaseButton onClick={() => setActiveWorkspaceId(null)}>Switch Workspace</BaseButton>}>
      <BaseCard>
        <InfiniteCanvas items={[]} transform={canvasTransform} onTransformChange={setCanvasTransform} />
        <DockBar items={[]} />
      </BaseCard>
    </FrnlPage>
  );
}

export default HomePage;
