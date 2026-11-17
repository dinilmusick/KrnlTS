// ══════════════════════════════════════════════════════════════════════════════
// SKIPO COMPONENT: Workspace Storage Readonly Panel (Primary Immutability)
// Adheres strictly to Skipo governance (< 200 lines).
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Lock, Cloud, HardDrive, ShieldCheck, Copy, Check } from 'lucide-react';

interface Props {
  workspace: any;
}

export const WorkspaceStorageReadonlyPanel: React.FC<Props> = ({ workspace }) => {
  const [copied, setCopied] = useState(false);
  const isB2 = workspace.storageProvider === 'backblaze_b2';
  const target = isB2 ? (workspace.b2BucketName || 'ultrst-apps') : (workspace.localFolderName || workspace.name);

  const handleCopy = () => {
    navigator.clipboard?.writeText(target);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3 font-mono select-none">
      <div className="flex items-center justify-between pb-1 border-b border-[var(--skipo-border-color)]">
        <span className="text-[10px] font-black uppercase text-[var(--skipo-text)] flex items-center gap-1.5">
          <Lock size={12} className="text-amber-400" />
          <span>CONNECTED STORAGE VAULT</span>
        </span>
        <span className="text-[9px] px-2 py-0.5 border border-amber-500/50 bg-amber-500/10 text-amber-300 font-bold rounded">
          READ ONLY · LOCKED PRIMARY
        </span>
      </div>

      <div className="p-3.5 border-2 border-[var(--skipo-border-color)] bg-[var(--skipo-bg)] rounded-lg space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded border border-[var(--skipo-border-color)] bg-[var(--skipo-surface)] text-[var(--skipo-accent)]">
              {isB2 ? <Cloud size={18} className="text-amber-400" /> : <HardDrive size={18} />}
            </div>
            <div>
              <span className="text-xs font-black uppercase text-[var(--skipo-text)] block">
                {isB2 ? 'Backblaze B2 Cloud Vault' : 'Local Workstation Vault'}
              </span>
              <span className="text-[10px] text-[var(--skipo-text-muted)] block">
                Target: {target}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="px-2 py-1 text-[10px] border border-[var(--skipo-border-color)] bg-[var(--skipo-surface)] hover:border-[var(--skipo-accent)] text-[var(--skipo-text)] rounded flex items-center gap-1 cursor-pointer"
            title="Copy target"
          >
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            <span>{copied ? 'COPIED' : 'COPY'}</span>
          </button>
        </div>

        <div className="border border-[var(--skipo-border-color)]/70 rounded bg-[var(--skipo-surface)] divide-y divide-[var(--skipo-border-color)]/60 text-[10px]">
          <div className="px-3 py-1.5 flex justify-between">
            <span className="text-[var(--skipo-text-muted)]">Storage Provider:</span>
            <span className="font-bold text-white uppercase font-mono">{workspace.storageProvider || 'local_fs'}</span>
          </div>
          <div className="px-3 py-1.5 flex justify-between">
            <span className="text-[var(--skipo-text-muted)]">Canonical Vault Path:</span>
            <span className="font-mono text-emerald-400 truncate max-w-[240px]">{workspace.workspacePath || target}</span>
          </div>
        </div>
      </div>

      <div className="p-2.5 border border-dashed border-[var(--skipo-border-color)] bg-[var(--skipo-surface)]/50 rounded text-[10px] text-[var(--skipo-text-muted)] leading-relaxed space-y-1">
        <div className="flex items-center gap-1 text-[var(--skipo-text)] font-bold">
          <ShieldCheck size={12} className="text-emerald-400" />
          <span>Storage Immutability Protocol:</span>
        </div>
        <p>
          Primary storage cannot be mutated post-creation. Add secondary redundant clones below to replicate and back up files across cloud buckets and local disks.
        </p>
      </div>
    </div>
  );
};
