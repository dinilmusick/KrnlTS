/**
 * @file WorkspaceCloneSyncEngine.ts
 * @description Primary Vault -> Secondary Clones Replication Engine for Skipo.
 * Conforms to Skipo Governance (< 200 lines).
 */

import { SkipoBase } from '@kloks/functions/base';
import { WorkspaceSecondaryClone } from './types.js';

export interface CloneReplicationResult {
  cloneId: string;
  label: string;
  provider: string;
  filesSynced: number;
  status: 'SYNCED' | 'ERROR';
  error?: string;
}

export class WorkspaceCloneSyncEngine extends SkipoBase {
  constructor() {
    super({ name: 'WorkspaceCloneSyncEngine' });
  }

  async replicateToClones(
    files: Array<{ relPath: string; content: Uint8Array; contentType?: string }>,
    clones: WorkspaceSecondaryClone[],
    uploadFn: (clone: WorkspaceSecondaryClone, relPath: string, content: Uint8Array, contentType?: string) => Promise<void>
  ): Promise<{ results: CloneReplicationResult[]; totalSynced: number }> {
    const results: CloneReplicationResult[] = [];
    let totalSynced = 0;
    const nowIso = new Date().toISOString();

    for (const clone of clones) {
      try {
        let count = 0;
        for (const file of files) {
          await uploadFn(clone, file.relPath, file.content, file.contentType);
          count++;
        }
        clone.lastSyncedAt = nowIso;
        clone.filesSynced = count;
        clone.status = 'SYNCED';
        results.push({ cloneId: clone.id, label: clone.label, provider: clone.provider, filesSynced: count, status: 'SYNCED' });
        totalSynced += count;
      } catch (err: any) {
        clone.status = 'ERROR';
        results.push({ cloneId: clone.id, label: clone.label, provider: clone.provider, filesSynced: 0, status: 'ERROR', error: err.message });
      }
    }

    return { results, totalSynced };
  }
}
