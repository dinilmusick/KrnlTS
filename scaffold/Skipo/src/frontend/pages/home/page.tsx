import { useState } from 'react';
import {
  FrnlPage,
  BaseButton,
  BaseCard,
  WorkspaceTilesMenu,
  InfiniteCanvas,
  DockBar,
  type WorkspaceRecord,
  LuthAuthPage,
} from '../../components/components.js';

export function HomePage() {
  const [active, setActive] = useState<WorkspaceRecord | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>([
    { id: 'ws-default', title: 'Primary Workspace', storageProvider: 'memory' },
  ]);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });

  return (
    <LuthAuthPage
      ecosystemId="ultrst-armada"
      applicationId="skipo"
      appName="Skipo"
      authenticatedContent={(auth) => {
        if (!active) {
          return (
            <FrnlPage appName="Skipo">
              <WorkspaceTilesMenu
                workspaces={workspaces}
                userId={auth.user?.id}
                storageOptions={[{ id: 'memory', provider: 'memory', label: 'In-memory (ephemeral)' }]}
                visibility={{ storagePolicy: { providers: ['memory'] } }}
                activeWorkspaceId={null}
                onSelectWorkspace={setActive}
                onCreateWorkspace={async (input) => {
                  const workspace: WorkspaceRecord = {
                    id: `ws-${Date.now()}`,
                    title: input.name.trim(),
                    name: input.name.trim(),
                    description: input.description,
                    storageProvider: input.storageProvider || 'memory',
                    storageConnectionId: input.storageConnectionId,
                  };
                  setWorkspaces((current) => [...current, workspace]);
                  setActive(workspace);
                }}
                onLogout={() => {
                  setActive(null);
                  void auth.signOut();
                }}
              />
            </FrnlPage>
          );
        }

        return (
          <FrnlPage
            appName="Skipo"
            title={active.title}
            topBarActions={<BaseButton onClick={() => setActive(null)}>Switch Workspace</BaseButton>}
          >
            <BaseCard>
              <InfiniteCanvas items={[]} transform={transform} onTransformChange={setTransform} />
              <DockBar items={[]} />
            </BaseCard>
          </FrnlPage>
        );
      }}
    />
  );
}

export default HomePage;
