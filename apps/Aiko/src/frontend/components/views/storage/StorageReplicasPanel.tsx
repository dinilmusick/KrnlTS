/**
 * ASCII Architecture Flowchart: StorageReplicasPanel
 *
 *   ┌────────────────────────────────────────┐
 *   │    Initialize StorageReplicasPanel     │
 *   └────────────────────────────────────────┘
 */

import React from 'react';
import { Cloud, Folder, Layers, Database, HardDrive, CheckCircle2 } from 'lucide-react';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface StorageEndpoint {
  id: string;
  provider: string;
  label: string;
  status: string;
}

export interface StorageReplicasPanelProps {
  backups: StorageEndpoint[];
}

const PROVIDER_ICONS: Record<string, React.ElementType> = {
  local_fs: Folder,
  backblaze_b2: Cloud,
  cloudflare_r2: Database,
  supabase_storage: Layers,
  aws_s3: HardDrive
};

// ════ STORAGEREPLICASPANEL IMPLEMENTATION ═════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const StorageReplicasPanel: React.FC<StorageReplicasPanelProps> = ({ backups }) => {
  return (
    <div className="p-4 rounded-xl border-2 border-slate-700 dark:border-slate-400 bg-white dark:bg-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,0.8)] dark:shadow-[4px_4px_0px_0px_rgba(148,163,184,0.3)]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Replicas
        </span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded border border-slate-400 dark:border-slate-600 text-slate-700 dark:text-slate-300">
          {backups.length} Connected
        </span>
      </div>

      <div className="space-y-2">
        {backups.map((replica) => {
          const Icon = PROVIDER_ICONS[replica.provider] || Cloud;
          return (
            <div
              key={replica.id}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40"
            >
              <div className="flex items-center gap-3">
                <Icon size={16} className="text-slate-600 dark:text-slate-400" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {replica.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 size={13} />
                <span>Ready</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};