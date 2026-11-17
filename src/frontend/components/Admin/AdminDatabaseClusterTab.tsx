import { luthFetch } from '../../auth/luthAuthClient';
import React, { useState, useEffect } from 'react';
import { Database, Plus, RefreshCw, X } from 'lucide-react';
import { IconOnlyButton } from '../common/IconOnlyButton';
import { DatabaseConnectionEntry, DatabaseRole } from '@/libraries/types/auth';
import AdminDatabaseItemCard from './AdminDatabaseItemCard';
import AdminVercelEnvModal from './AdminVercelEnvModal';
import AdminAddDatabaseForm from './AdminAddDatabaseForm';

interface AdminDatabaseClusterTabProps {
  onRefresh: () => void;
  currentUser: any;
}

export default function AdminDatabaseClusterTab({ onRefresh, currentUser }: AdminDatabaseClusterTabProps) {
  const [databases, setDatabases] = useState<DatabaseConnectionEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedEnvDb, setSelectedEnvDb] = useState<DatabaseConnectionEntry | null>(null);

  const loadDatabases = () => {
    luthFetch('/api/admin/cluster')
      .then((res) => (res.ok ? res.json() : Promise.reject('Failed to load database cluster.')))
      .then((data) => setDatabases(data.databases || []))
      .catch((err) => setStatusMsg({ type: 'error', text: String(err) }));
  };

  useEffect(() => {
    loadDatabases();
  }, []);

  const handleTestConnection = (dbId: string) => {
    const db = databases.find((d) => d.id === dbId);
    if (!db) return;
    setTestingId(dbId);
    setStatusMsg(null);

    luthFetch('/api/admin/cluster/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(db),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || data.error || 'Connection failed.');
        return data;
      })
      .then((data) => {
        setDatabases((prev) =>
          prev.map((d) => (d.id === dbId ? { ...d, status: 'connected', latencyMs: data.latencyMs, lastTestedAt: new Date().toISOString() } : d))
        );
        setStatusMsg({ type: 'success', text: `Verified ${db.name} (${data.latencyMs}ms)` });
      })
      .catch((err) => setStatusMsg({ type: 'error', text: `Probe failed for ${db.name}: ${err.message}` }))
      .finally(() => setTestingId(null));
  };

  const handleSetPrimary = (dbId: string) => {
    const target = databases.find((d) => d.id === dbId);
    setDatabases((prev) =>
      prev.map((db) => ({ ...db, role: (db.id === dbId ? 'primary' : 'redundant_clone') as DatabaseRole, lastSyncedAt: new Date().toISOString() }))
    );
    setStatusMsg({ type: 'success', text: `Primary: ${target?.name}` });
  };

  const handleDeleteDb = (dbId: string) => {
    const target = databases.find((d) => d.id === dbId);
    if (target?.role === 'primary') {
      setStatusMsg({ type: 'error', text: 'Primary database cannot be removed.' });
      return;
    }
    setDatabases((prev) => prev.filter((d) => d.id !== dbId));
    setStatusMsg({ type: 'success', text: 'Removed connection.' });
  };

  const handleAddDatabase = (newEntry: DatabaseConnectionEntry) => {
    setDatabases((prev) => [...prev, newEntry]);
    setShowAddForm(false);
    setStatusMsg({ type: 'success', text: `Attached ${newEntry.name}.` });
  };

  const handleSyncClones = () => {
    setSyncing(true);
    luthFetch('/api/admin/cluster/replicate', { method: 'POST' })
      .then(() => {
        setDatabases((prev) =>
          prev.map((db) => ({ ...db, lastSyncedAt: new Date().toISOString(), status: 'connected' as const, recordsCloned: (db.recordsCloned || 0) + 1 }))
        );
        setStatusMsg({ type: 'success', text: 'Replication synchronized.' });
      })
      .catch((err) => setStatusMsg({ type: 'error', text: `Sync failed: ${err.message}` }))
      .finally(() => setSyncing(false));
  };

  const handleCopyEnv = (db: DatabaseConnectionEntry) => {
    const key = db.envVarKey || (db.role === 'primary' ? 'DATABASE_URL' : `CLONE_${db.engine.toUpperCase()}_DATABASE_URL`);
    const val = db.neon?.connectionString || db.postgres?.connectionString || db.supabase?.url || 'postgresql://...';
    navigator.clipboard.writeText(`${key}="${val}"`);
    setCopiedId(db.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div id="admin-database-cluster-tab" className="space-y-4 font-mono select-none">
      <div
        className="flex flex-wrap items-center justify-between gap-2 p-2 border-2"
        style={{
          backgroundColor: 'var(--skipo-matte-bg)',
          borderColor: 'var(--skipo-border-color)',
          borderRadius: 'var(--skipo-radius-sm)',
        }}
      >
        <div className="flex items-center gap-2">
          <Database size={16} style={{ color: 'var(--skipo-accent)' }} />
          <h2 className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--skipo-text)' }}>
            DATABASE CLUSTER
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <IconOnlyButton
            id="btn-replicate-clones"
            tooltip="Replicate Database Clones"
            icon={<RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />}
            variant="accent"
            position="bottom"
            onClick={handleSyncClones}
            disabled={syncing}
            className="h-8 w-8"
          />
          <IconOnlyButton
            id="btn-toggle-add-db"
            tooltip={showAddForm ? 'Close Form' : 'Add Database Connection'}
            icon={showAddForm ? <X size={14} /> : <Plus size={14} />}
            variant="surface"
            position="bottom"
            onClick={() => setShowAddForm(!showAddForm)}
            className="h-8 w-8"
          />
        </div>
      </div>

      {statusMsg && (
        <div
          id="admin-cluster-status-banner"
          className="p-2 border-2 text-xs font-bold"
          style={{
            backgroundColor: 'var(--skipo-matte-bg)',
            borderColor: statusMsg.type === 'success' ? 'var(--skipo-success)' : 'var(--skipo-danger)',
            color: statusMsg.type === 'success' ? 'var(--skipo-success)' : 'var(--skipo-danger)',
            borderRadius: 'var(--skipo-radius-sm)',
          }}
        >
          {statusMsg.text}
        </div>
      )}

      {showAddForm && <AdminAddDatabaseForm onAdd={handleAddDatabase} onCancel={() => setShowAddForm(false)} />}

      <div className="space-y-2">
        {databases.map((db) => (
          <AdminDatabaseItemCard
            key={db.id}
            db={db}
            isTesting={testingId === db.id}
            copiedId={copiedId}
            onTest={handleTestConnection}
            onSetPrimary={handleSetPrimary}
            onDelete={handleDeleteDb}
            onOpenEnvModal={(selected) => setSelectedEnvDb(selected)}
            onCopyEnv={handleCopyEnv}
          />
        ))}
      </div>

      {selectedEnvDb && <AdminVercelEnvModal db={selectedEnvDb} onClose={() => setSelectedEnvDb(null)} />}
    </div>
  );
}
