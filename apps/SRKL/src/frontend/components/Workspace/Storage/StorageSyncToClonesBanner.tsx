'use client';

// ═══════════════════════════════════════════════════════════════════════════
// IMPORTS & DEPENDENCIES
// ═══════════════════════════════════════════════════════════════════════════
import React from 'react';
import { RefreshCw } from 'lucide-react';
import { BaseButton } from '@skipo/ui';
import { UserStorageConnection } from '@/libraries/types/auth';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════
interface StorageSyncToClonesBannerProps {
  savedConnections: UserStorageConnection[];
  syncingClones: boolean;
  onSyncToClones: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT: SYNC TO CLONES BANNER
// ═══════════════════════════════════════════════════════════════════════════
export function StorageSyncToClonesBanner({
  savedConnections,
  syncingClones,
  onSyncToClones,
}: StorageSyncToClonesBannerProps) {
  const cloneCount = savedConnections.filter((c) => c.role !== 'primary' && c.provider !== 'local_fs').length;
  if (cloneCount === 0) return null;

  return (
    <div
      className="p-3 border-2 flex flex-wrap items-center justify-between gap-3 font-mono"
      style={{
        backgroundColor: 'var(--skipo-surface)',
        borderColor: 'var(--skipo-border-color)',
        borderRadius: 'var(--skipo-radius)',
      }}
    >
      <div className="space-y-0.5">
        <span className="text-[10px] font-black uppercase text-sky-300 block flex items-center gap-1.5">
          <RefreshCw size={11} className={syncingClones ? 'animate-spin' : ''} />
          REPLICATE WORKSPACE TO ALL CLONES
        </span>
        <span className="text-[9px] opacity-75 block text-sky-200">
          Copies active workspace encrypted SQLite vault &amp; logs from Primary → {cloneCount} Clone{cloneCount !== 1 ? 's' : ''}
        </span>
      </div>

      <BaseButton
        variant="accent"
        size="sm"
        disabled={syncingClones}
        onClick={onSyncToClones}
        className="font-black text-[10px] uppercase flex items-center gap-1.5 px-3 py-1.5"
      >
        <RefreshCw size={11} className={syncingClones ? 'animate-spin' : ''} />
        <span>{syncingClones ? 'REPLICATING...' : `SYNC ALL TO CLONES (${cloneCount})`}</span>
      </BaseButton>
    </div>
  );
}
