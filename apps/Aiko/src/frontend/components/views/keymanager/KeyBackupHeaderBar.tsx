/**
 * ASCII Architecture Flowchart: KeyBackupHeaderBar
 *
 *   ┌────────────────────────────────────────┐
 *   │     Initialize KeyBackupHeaderBar      │
 *   └────────────────────────────────────────┘
 */

import React from 'react';
import { FileText, Download, Upload } from 'lucide-react';
import { BaseButton } from '@ultrst-armada/floks';
import { Tooltip } from '../../common/Tooltip.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface KeyBackupHeaderBarProps {
  onOpenBackup: () => void;
}

// ════ KEYBACKUPHEADERBAR IMPLEMENTATION ═══════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const KeyBackupHeaderBar: React.FC<KeyBackupHeaderBarProps> = ({ onOpenBackup }) => {
  return (
    <div className="flex flex-wrap items-center justify-between p-3 rounded-lg border-2 border-slate-700/80 bg-indigo-950/40 dark:bg-indigo-950/60 font-mono text-xs gap-2">
      <div className="flex items-center gap-2 text-indigo-300">
        <FileText size={16} className="text-indigo-400 shrink-0" />
        <span className="font-extrabold tracking-tight">API KEYS BACKUP & RECOVERY</span>
      </div>

      <div className="flex items-center gap-2">
        <Tooltip text="EXPORT BACKUP">
          <BaseButton
            size="sm"
            variant="success"
            onClick={onOpenBackup}
            className="px-3 py-1.5"
          >
            <Download size={13} />
          </BaseButton>
        </Tooltip>

        <Tooltip text="IMPORT BACKUP">
          <BaseButton
            size="sm"
            variant="accent"
            onClick={onOpenBackup}
            className="px-3 py-1.5"
          >
            <Upload size={13} />
          </BaseButton>
        </Tooltip>
      </div>
    </div>
  );
};