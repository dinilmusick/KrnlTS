/**
 * ASCII Architecture Flowchart: StorageProviderSelector
 *
 *   ┌──────────────────────────────────────────┐
 *   │   Initialize StorageProviderSelector     │
 *   └──────────────────────────────────────────┘
 */

import React from 'react';
import { HardDrive, Cloud, Folder, Layers, Database } from 'lucide-react';
import { NeoButton } from '../../common/NeoButton.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface StorageProviderSelectorProps {
  selectedProvider: string;
  onSelectProvider: (id: string) => void;
}

const STORAGE_PROVIDERS = [
  { id: 'local_fs', label: 'Local Folder', icon: Folder },
  { id: 'backblaze_b2', label: 'Backblaze B2', icon: Cloud },
  { id: 'cloudflare_r2', label: 'Cloudflare R2', icon: Database },
  { id: 'supabase_storage', label: 'Supabase', icon: Layers },
  { id: 'aws_s3', label: 'AWS S3', icon: HardDrive }
];

// ════ STORAGEPROVIDERSELECTOR IMPLEMENTATION ═════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const StorageProviderSelector: React.FC<StorageProviderSelectorProps> = ({
  selectedProvider,
  onSelectProvider
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {STORAGE_PROVIDERS.map((item) => {
        const Icon = item.icon;
        const isSelected = selectedProvider === item.id;
        return (
          <div
            key={item.id}
            onClick={() => onSelectProvider(item.id)}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              isSelected
                ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60 shadow-[3px_3px_0px_0px_rgba(79,70,229,0.9)] ring-2 ring-indigo-500/20'
                : 'border-slate-700 dark:border-slate-400 bg-white dark:bg-slate-900 hover:border-slate-900 dark:hover:border-slate-200 shadow-[2px_2px_0px_0px_rgba(15,23,42,0.6)]'
            }`}
          >
            <NeoButton
              icon={Icon}
              tooltipText={`Select ${item.label}`}
              onClick={() => onSelectProvider(item.id)}
              active={isSelected}
              variant={isSelected ? 'accent' : 'secondary'}
              size="md"
            />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};