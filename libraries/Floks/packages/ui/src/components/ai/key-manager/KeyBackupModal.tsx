import React, { useEffect, useState } from 'react';
import { Download, Upload, FileText, X } from 'lucide-react';
import { BaseButton } from '../../base/BaseButton.js';
import { KeyBackupExportTab } from './KeyBackupExportTab.js';
import { KeyBackupImportTab } from './KeyBackupImportTab.js';
import type { KeyBackupModalProps } from './contracts.js';

export const KeyBackupModal: React.FC<KeyBackupModalProps> = ({
  isOpen,
  onClose,
  loadExportPayload,
  onImport,
  onRefreshKeys,
  title = 'API KEYS BACKUP & RECOVERY',
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [payload, setPayload] = useState<unknown>(null);

  useEffect(() => {
    if (isOpen) loadExportPayload().then(setPayload).catch(() => setPayload(null));
  }, [isOpen, loadExportPayload]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" onWheel={(e) => e.stopPropagation()}>
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-slate-700 rounded-xl shadow-2xl font-mono text-xs overflow-hidden flex flex-col max-h-[90vh]" onWheel={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-3 border-b-2 border-slate-700 bg-slate-800 text-slate-100">
          <div className="flex items-center gap-2"><FileText size={16} /><span className="font-extrabold text-sm">{title}</span></div>
          <BaseButton size="sm" variant="ghost" onClick={onClose}><X size={16} /></BaseButton>
        </div>
        <div className="flex border-b-2 border-slate-700 bg-slate-950">
          <BaseButton size="sm" variant={activeTab === 'export' ? 'accent' : 'ghost'} onClick={() => setActiveTab('export')} className="flex-1 rounded-none">
            <Download size={14} /> EXPORT
          </BaseButton>
          <BaseButton size="sm" variant={activeTab === 'import' ? 'accent' : 'ghost'} onClick={() => setActiveTab('import')} className="flex-1 rounded-none">
            <Upload size={14} /> IMPORT
          </BaseButton>
        </div>
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {activeTab === 'export'
            ? <KeyBackupExportTab exportPayload={payload} />
            : <KeyBackupImportTab onImport={onImport} onClose={onClose} onRefreshKeys={onRefreshKeys} />}
        </div>
      </div>
    </div>
  );
};
