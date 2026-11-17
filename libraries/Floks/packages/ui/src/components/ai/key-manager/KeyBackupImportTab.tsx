import React, { useState } from 'react';
import { Upload, X, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { BaseButton, BaseInput, BaseTextarea } from '../../base/index.js';

export interface KeyBackupImportTabProps {
  onImport: (payload: unknown) => Promise<{ success: boolean; message?: string; error?: string }>;
  onClose: () => void;
  onRefreshKeys?: () => void;
}

export const KeyBackupImportTab: React.FC<KeyBackupImportTabProps> = ({ onImport, onClose, onRefreshKeys }) => {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setText(String(reader.result || ''));
      setStatus(null);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setStatus(null);
    try {
      let payload: unknown;
      try { payload = JSON.parse(text); }
      catch { setStatus({ success: false, message: 'Invalid JSON format.' }); return; }
      const result = await onImport(payload);
      setStatus({ success: result.success, message: result.message || result.error || (result.success ? 'Import complete.' : 'Import failed.') });
      if (result.success) onRefreshKeys?.();
    } catch (error) {
      setStatus({ success: false, message: error instanceof Error ? error.message : 'Import failed.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-2.5 rounded bg-slate-800/80 border border-slate-700">
        <span className="text-slate-200 font-bold">IMPORT PAYLOAD</span>
        <label className="inline-flex items-center justify-center p-2 rounded bg-indigo-600 text-white font-bold cursor-pointer">
          <Upload size={14} />
          <BaseInput type="file" accept=".json" onChange={handleFile} className="hidden" />
        </label>
      </div>
      <BaseTextarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste backup JSON string here..." rows={8} className="w-full text-[11px]" />
      {status && (
        <div className={`p-2.5 rounded flex items-center gap-2 text-[11px] border ${status.success ? 'bg-emerald-950/80 text-emerald-200 border-emerald-700' : 'bg-rose-950/80 text-rose-200 border-rose-700'}`}>
          {status.success ? <ShieldCheck size={14} /> : <AlertCircle size={14} />}
          <span>{status.message}</span>
        </div>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <BaseButton size="sm" variant="secondary" onClick={onClose}><X size={14} /></BaseButton>
        <BaseButton size="sm" variant="success" onClick={handleImport} disabled={!text.trim() || busy}>
          {busy ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
        </BaseButton>
      </div>
    </div>
  );
};
