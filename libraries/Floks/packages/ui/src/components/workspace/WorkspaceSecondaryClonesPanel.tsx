import React, { useState } from 'react';
import { RefreshCw, Trash2, Plus, ShieldCheck, Cloud, HardDrive } from 'lucide-react';

export interface WorkspaceSecondaryClone {
  id: string;
  label: string;
  provider: 'backblaze_b2' | 'local_fs' | string;
  b2BucketName?: string;
  localFolderName?: string;
  lastSyncedAt?: string;
  status?: 'synced' | 'syncing' | 'error' | string;
}

interface Props {
  workspace: any;
  onClonesUpdated?: () => void;
  onClose?: () => void;
}

export const WorkspaceSecondaryClonesPanel: React.FC<Props> = ({ workspace, onClonesUpdated, onClose }) => {
  const [clones, setClones] = useState<WorkspaceSecondaryClone[]>(workspace.secondaryClones || []);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [addingClone, setAddingClone] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newBucket, setNewBucket] = useState('');
  const [newProvider, setNewProvider] = useState<'backblaze_b2' | 'local_fs'>('backblaze_b2');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleSync = async (cloneId?: string) => {
    setSyncing(cloneId || 'all');
    try {
      const res = await fetch(`/api/workspaces/${encodeURIComponent(workspace.id)}/sync-clones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloneIds: cloneId ? [cloneId] : undefined }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Replication failed');
      setStatusMsg(`✓ Replicated ${data.totalFilesSynced} files.`);
      onClonesUpdated?.();
    } catch (err: any) {
      setStatusMsg(`⚠ Error: ${err.message}`);
    } finally {
      setSyncing(null);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    try {
      const res = await fetch(`/api/workspaces/${encodeURIComponent(workspace.id)}/clones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: newLabel.trim(),
          provider: newProvider,
          b2BucketName: newProvider === 'backblaze_b2' ? (newBucket.trim() || 'ultrst-apps') : undefined,
          localFolderName: newProvider === 'local_fs' ? newLabel.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setClones(data.clones || []);
      setAddingClone(false);
      setNewLabel('');
      setNewBucket('');
      onClonesUpdated?.();
    } catch (err: any) {
      setStatusMsg(`⚠ Error: ${err.message}`);
    }
  };

  const handleDelete = async (cloneId: string) => {
    if (!confirm('Remove this secondary clone?')) return;
    try {
      const res = await fetch(`/api/workspaces/${encodeURIComponent(workspace.id)}/clones/${encodeURIComponent(cloneId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setClones(data.clones || []);
      onClonesUpdated?.();
    } catch (err: any) {
      setStatusMsg(`⚠ Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-3 font-mono pt-3 border-t border-[var(--skipo-border-color)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-sky-400" />
          <span className="text-[11px] font-black uppercase text-[var(--skipo-text)]">CLONES ({clones.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {clones.length > 0 && (
            <button type="button" disabled={Boolean(syncing)} onClick={() => handleSync()} className="px-2 py-1 text-[9px] font-bold border border-sky-500/50 bg-sky-500/20 text-sky-300 rounded flex items-center gap-1">
              <RefreshCw size={10} className={syncing === 'all' ? 'animate-spin' : ''} /> SYNC ALL
            </button>
          )}
          <button type="button" onClick={() => setAddingClone(!addingClone)} className="px-2 py-1 text-[9px] font-bold border rounded flex items-center gap-1">
            <Plus size={10} /> ADD
          </button>
          {onClose && <button type="button" onClick={onClose} className="px-2 py-1 text-[9px] border rounded">BACK</button>}
        </div>
      </div>
      {statusMsg && <div className="p-2 border border-sky-500/40 bg-sky-950/20 text-[10px] text-sky-200 rounded">{statusMsg}</div>}
      {clones.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {clones.map((c) => (
            <div key={c.id} className="p-2 border border-sky-500/30 rounded flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold flex items-center gap-1">
                  {c.provider === 'backblaze_b2' ? <Cloud size={11} className="text-amber-400" /> : <HardDrive size={11} className="text-emerald-400" />} {c.label}
                </span>
                <button type="button" onClick={() => handleDelete(c.id)} className="text-red-400 p-1"><Trash2 size={10} /></button>
              </div>
              <div className="text-[9px] text-[var(--skipo-text-muted)] truncate">Target: {c.b2BucketName || c.localFolderName || 'Backup'}</div>
              <div className="pt-1 flex items-center justify-between">
                <span className="text-[8px] font-bold uppercase text-sky-300">{c.status || 'CONNECTED'}</span>
                <button type="button" disabled={Boolean(syncing)} onClick={() => handleSync(c.id)} className="px-2 py-0.5 text-[9px] border rounded">
                  <RefreshCw size={9} className={syncing === c.id ? 'animate-spin' : ''} /> SYNC
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-2 border border-dashed text-[10px] text-center text-[var(--skipo-text-muted)]">No secondary clones configured.</div>
      )}
      {addingClone && (
        <form onSubmit={handleAdd} className="p-3 border rounded space-y-2">
          <input type="text" required value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Clone Label" className="w-full border rounded px-2 py-1 text-xs bg-transparent" />
          <select value={newProvider} onChange={(e) => setNewProvider(e.target.value as any)} className="w-full border rounded px-2 py-1 text-xs bg-transparent">
            <option value="backblaze_b2">Backblaze B2</option>
            <option value="local_fs">Local Disk Folder</option>
          </select>
          {newProvider === 'backblaze_b2' && <input type="text" value={newBucket} onChange={(e) => setNewBucket(e.target.value)} placeholder="Bucket Name" className="w-full border rounded px-2 py-1 text-xs bg-transparent" />}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAddingClone(false)} className="px-2 py-1 text-[9px] border rounded">CANCEL</button>
            <button type="submit" className="px-2 py-1 text-[9px] font-bold bg-sky-500 text-black rounded">SAVE</button>
          </div>
        </form>
      )}
    </div>
  );
};
