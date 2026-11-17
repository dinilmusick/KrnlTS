import React, { useState } from 'react';
import { X, Copy, Check, FileCode, Zap } from 'lucide-react';
import { BrutalistCard } from '../common/BrutalistUi';
import { IconOnlyButton } from '../common/IconOnlyButton';
import { DatabaseConnectionEntry } from '@/libraries/types/auth';

interface AdminVercelEnvModalProps {
  db: DatabaseConnectionEntry;
  onClose: () => void;
}

export default function AdminVercelEnvModal({ db, onClose }: AdminVercelEnvModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const getEnvConfigKeys = () => {
    switch (db.engine) {
      case 'neon':
        return [
          { key: 'NEON_DATABASE_URL', val: db.neon?.connectionString || db.connectionString || '' },
        ];
      case 'supabase':
        return [
          { key: 'SUPABASE_URL', val: db.supabase?.url || '' },
          { key: 'SUPABASE_SERVICE_ROLE_KEY', val: db.supabase?.serviceRoleKey || '' },
        ];
      case 'postgres':
        return [
          { key: 'POSTGRES_DATABASE_URL', val: db.connectionString || '' },
        ];
      case 'firebase':
        return [
          { key: 'FIREBASE_PROJECT_ID', val: db.firebase?.projectId || '' },
        ];
      case 'sqlite':
        return [{ key: 'SQLITE_DB_PATH', val: db.sqlite?.dbPath || './data/runtime.db' }];
      default:
        return [];
    }
  };

  const keys = getEnvConfigKeys();
  const snippet = keys.map((k) => `${k.key}="${k.val}"`).join('\n');

  const handleCopyKey = (key: string, val: string) => {
    navigator.clipboard.writeText(`${key}="${val}"`);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(snippet);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div
      id="admin-env-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 font-mono select-none"
      onClick={onClose}
    >
      <BrutalistCard
        variant="surface"
        className="w-full max-w-lg p-4 space-y-3 relative"
        style={{
          border: 'var(--skipo-border)',
          borderColor: 'var(--skipo-accent)',
          boxShadow: 'var(--skipo-shadow-hover)',
          borderRadius: 'var(--skipo-radius)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between pb-2 border-b"
          style={{ borderColor: 'var(--skipo-border-color)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="p-1.5 border"
              style={{
                backgroundColor: 'var(--skipo-accent)',
                color: 'var(--skipo-accent-fg)',
                borderColor: 'var(--skipo-border-color)',
                borderRadius: 'var(--skipo-radius-sm)',
              }}
            >
              {db.isFromEnv ? <FileCode size={16} /> : <Zap size={16} />}
            </div>
            <h3 className="text-xs font-black uppercase tracking-wide" style={{ color: 'var(--skipo-text)' }}>
              {db.name} • {db.engine.toUpperCase()}
            </h3>
          </div>
          <IconOnlyButton
            id="admin-env-modal-close"
            tooltip="Close Modal"
            icon={<X size={14} />}
            variant="surface"
            position="bottom"
            onClick={onClose}
            className="h-7 w-7"
          />
        </div>

        <div className="space-y-1.5">
          {keys.map((k) => (
            <div
              key={k.key}
              className="p-2 border flex items-center justify-between gap-2"
              style={{
                backgroundColor: 'var(--skipo-matte-bg)',
                borderColor: 'var(--skipo-border-color)',
                borderRadius: 'var(--skipo-radius-sm)',
              }}
            >
              <div className="min-w-0 flex-1">
                <div
                  className="text-[10px] font-mono font-black truncate"
                  style={{ color: 'var(--skipo-accent)' }}
                >
                  {k.key}
                </div>
              </div>
              <IconOnlyButton
                tooltip={copiedKey === k.key ? 'Copied' : 'Copy Variable'}
                icon={copiedKey === k.key ? <Check size={12} style={{ color: 'var(--skipo-success)' }} /> : <Copy size={12} />}
                variant="surface"
                position="bottom"
                onClick={() => handleCopyKey(k.key, k.val)}
                className="h-7 w-7"
              />
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase" style={{ color: 'var(--skipo-text-muted)' }}>
              .env Block
            </span>
            <IconOnlyButton
              tooltip={copiedAll ? 'Copied Full Block' : 'Copy Block'}
              icon={copiedAll ? <Check size={12} style={{ color: 'var(--skipo-success)' }} /> : <Copy size={12} />}
              variant="accent"
              position="bottom"
              onClick={handleCopyAll}
              className="h-6 w-6"
            />
          </div>
          <pre
            className="p-2 border text-[10px] font-mono overflow-x-auto whitespace-pre"
            style={{
              backgroundColor: 'var(--skipo-matte-bg)',
              borderColor: 'var(--skipo-border-color)',
              color: 'var(--skipo-success)',
              borderRadius: 'var(--skipo-radius-sm)',
            }}
          >
            {snippet}
          </pre>
        </div>
      </BrutalistCard>
    </div>
  );
}
