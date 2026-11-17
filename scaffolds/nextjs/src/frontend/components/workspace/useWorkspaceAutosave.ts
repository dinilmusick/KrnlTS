import { useEffect } from 'react';
import { WorkspaceAutosaveController } from '@ultrst-armada/kloks/client';

export interface UseWorkspaceAutosaveOptions {
  enabled: boolean;
  save: () => Promise<void>;
  intervalMs?: number;
}

export function useWorkspaceAutosave({ enabled, save, intervalMs = 60_000 }: UseWorkspaceAutosaveOptions): void {
  useEffect(() => {
    const controller = new WorkspaceAutosaveController({ enabled, save, intervalMs });
    controller.start();
    return () => controller.stop();
  }, [enabled, save, intervalMs]);
}
