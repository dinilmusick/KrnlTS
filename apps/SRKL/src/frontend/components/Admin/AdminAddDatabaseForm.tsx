import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { BrutalistInput, BrutalistSelect } from '../common/BrutalistUi';
import { IconOnlyButton } from '../common/IconOnlyButton';
import { AdminBackendEngine, DatabaseConnectionEntry } from '@/libraries/types/auth';

interface AdminAddDatabaseFormProps {
  onAdd: (newEntry: Partial<DatabaseConnectionEntry>) => void;
  onCancel: () => void;
}

export default function AdminAddDatabaseForm({ onAdd, onCancel }: AdminAddDatabaseFormProps) {
  const [name, setName] = useState('');
  const [engine, setEngine] = useState<AdminBackendEngine>('neon');
  const [connStr, setConnStr] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [firebaseProjectId, setFirebaseProjectId] = useState('');
  const tableName = 'ultrst-users';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newEntry: Partial<DatabaseConnectionEntry> = {
      name: name.trim(),
      engine,
      role: 'redundant_clone',
      target: 'all',
      enabled: true,
      status: 'disconnected',
      isFromEnv: false,
      connectionString: engine === 'postgres' || engine === 'neon' ? connStr.trim() : undefined,
      neon: engine === 'neon' ? { connectionString: connStr.trim(), tableName } : undefined,
      supabase: engine === 'supabase' ? { url: supabaseUrl.trim(), serviceRoleKey: supabaseKey.trim(), tableName } : undefined,
      firebase: engine === 'firebase' ? { projectId: firebaseProjectId.trim(), collectionName: tableName } : undefined,
    };

    onAdd(newEntry);
  };

  return (
    <form
      onSubmit={handleSubmit}
      id="admin-add-db-form"
      className="p-3 border-2 space-y-3 select-none"
      style={{
        backgroundColor: 'var(--skipo-surface)',
        borderColor: 'var(--skipo-accent)',
        borderRadius: 'var(--skipo-radius)',
        boxShadow: 'var(--skipo-shadow)',
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--skipo-accent)' }}>
          REGISTER REPLICA
        </span>
        <div className="flex items-center gap-1">
          <IconOnlyButton
            id="btn-cancel-add-db"
            type="button"
            tooltip="Cancel Registration"
            icon={<X size={14} />}
            variant="surface"
            position="bottom"
            onClick={onCancel}
            className="h-7 w-7"
          />
          <IconOnlyButton
            id="btn-submit-add-db"
            type="submit"
            tooltip="Register & Attach Database"
            icon={<Plus size={14} />}
            variant="accent"
            position="bottom"
            className="h-7 w-7"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <BrutalistInput
          id="input-db-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Connection Label"
          inspectionLabel="Database Connection Name"
          required
        />
        <BrutalistSelect
          id="select-db-engine"
          value={engine}
          onChange={(e) => setEngine(e.target.value as AdminBackendEngine)}
          inspectionLabel="Database Engine Type"
          className="w-full"
        >
          <option value="neon">Neon Serverless Postgres</option>
          <option value="postgres">PostgreSQL Standard</option>
          <option value="supabase">Supabase Cloud BaaS</option>
          <option value="firebase">Google Cloud Firestore</option>
        </BrutalistSelect>
      </div>

      {(engine === 'neon' || engine === 'postgres') && (
        <BrutalistInput
          id="input-db-conn-str"
          value={connStr}
          onChange={(e) => setConnStr(e.target.value)}
          placeholder="postgresql://user:password@host/db?sslmode=require"
          inspectionLabel="Postgres Connection URI"
          required
        />
      )}

      {engine === 'supabase' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <BrutalistInput
            id="input-supabase-url"
            value={supabaseUrl}
            onChange={(e) => setSupabaseUrl(e.target.value)}
            placeholder="https://xyzcompany.supabase.co"
            inspectionLabel="Supabase Project URL"
            required
          />
          <BrutalistInput
            id="input-supabase-key"
            type="password"
            value={supabaseKey}
            onChange={(e) => setSupabaseKey(e.target.value)}
            placeholder="Service Role Key"
            inspectionLabel="Supabase API Key"
            required
          />
        </div>
      )}

      {engine === 'firebase' && (
        <BrutalistInput
          id="input-firebase-project"
          value={firebaseProjectId}
          onChange={(e) => setFirebaseProjectId(e.target.value)}
          placeholder="Firebase Project ID"
          inspectionLabel="Firebase Project Identifier"
          required
        />
      )}
    </form>
  );
}
