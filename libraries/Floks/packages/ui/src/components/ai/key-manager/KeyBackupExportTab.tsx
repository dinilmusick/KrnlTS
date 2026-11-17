import React, { useState } from 'react';
import { Download, Copy, Check } from 'lucide-react';
import { BaseButton } from '../../base/BaseButton.js';

export interface KeyBackupExportTabProps {
  exportPayload: unknown;
  fileNamePrefix?: string;
}

export const KeyBackupExportTab: React.FC<KeyBackupExportTabProps> = ({ exportPayload, fileNamePrefix = 'ai-keys-backup' }) => {
  const [copied, setCopied] = useState(false);
  const jsonString = exportPayload ? JSON.stringify(exportPayload, null, 2) : '';

  const handleDownload = () => {
    if (!exportPayload) return;
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${fileNamePrefix}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (!jsonString) return;
    await navigator.clipboard.writeText(jsonString);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const metadata = exportPayload && typeof exportPayload === 'object'
    ? (exportPayload as Record<string, any>).exportMetadata
    : undefined;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded bg-slate-800/80 border border-slate-700">
        <div className="flex items-center gap-3">
          <span className="text-slate-200 font-bold">EXPORT PAYLOAD</span>
          <span className="text-[10px] text-emerald-400">{metadata?.totalKeys || 0} KEYS</span>
          <span className="text-[10px] text-indigo-400">{metadata?.totalEmailProfiles || 0} SECTIONS</span>
        </div>
        <div className="flex items-center gap-2">
          <BaseButton size="sm" variant="secondary" aria-label="Copy JSON payload" onClick={handleCopy} disabled={!jsonString}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </BaseButton>
          <BaseButton size="sm" variant="success" aria-label="Export backup file" onClick={handleDownload} disabled={!jsonString}>
            <Download size={14} />
          </BaseButton>
        </div>
      </div>
      <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-slate-200 text-[11px] max-h-72 overflow-y-auto whitespace-pre-wrap select-all">
        {jsonString || 'Loading export payload...'}
      </pre>
    </div>
  );
};
