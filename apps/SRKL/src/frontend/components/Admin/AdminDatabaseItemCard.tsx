import React from 'react';
import { Database, FileCode, Zap, RefreshCw, Star, Trash2, Copy, Check } from 'lucide-react';
import { BaseButton } from '@skipo/ui';
import { BrutalistCard } from '../common/BrutalistUi';
import { IconOnlyButton } from '../common/IconOnlyButton';
import { Tooltip } from '../common/Tooltip';
import { DatabaseConnectionEntry } from '@/libraries/types/auth';

interface AdminDatabaseItemCardProps {
  key?: React.Key;
  db: DatabaseConnectionEntry;
  isTesting: boolean;
  copiedId: string | null;
  onTest: (dbId: string) => void;
  onSetPrimary: (dbId: string) => void;
  onDelete: (dbId: string) => void;
  onOpenEnvModal: (db: DatabaseConnectionEntry) => void;
  onCopyEnv: (db: DatabaseConnectionEntry) => void;
}

export default function AdminDatabaseItemCard({
  db,
  isTesting,
  copiedId,
  onTest,
  onSetPrimary,
  onDelete,
  onOpenEnvModal,
  onCopyEnv,
}: AdminDatabaseItemCardProps) {
  const isPrimary = db.role === 'primary';

  return (
    <BrutalistCard
      id={`db-card-${db.id}`}
      variant={isPrimary ? 'surface' : 'subtle'}
      className="p-2.5 relative transition-all"
      style={{
        borderColor: isPrimary ? 'var(--skipo-accent)' : 'var(--skipo-border-color)',
        boxShadow: isPrimary ? 'var(--skipo-shadow-hover), var(--skipo-accent-glow)' : 'var(--skipo-shadow)',
      }}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="space-y-1 flex-1 min-w-[200px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-xs font-black uppercase flex items-center gap-1.5"
              style={{ color: 'var(--skipo-text)' }}
            >
              <Database
                size={13}
                style={{ color: isPrimary ? 'var(--skipo-accent)' : 'var(--skipo-text-muted)' }}
              />
              {db.name}
            </span>

            {/* Role Badge */}
            <span
              className="text-[9px] font-black px-1.5 py-0.5 uppercase border"
              style={{
                backgroundColor: isPrimary ? 'var(--skipo-accent)' : 'var(--skipo-matte-bg)',
                color: isPrimary ? 'var(--skipo-accent-fg)' : 'var(--skipo-text-muted)',
                borderColor: 'var(--skipo-border-color)',
                borderRadius: 'var(--skipo-radius-sm)',
              }}
            >
              {db.role.replace('_', ' ')}
            </span>

            {/* Online / Status Badge */}
            <span
              className="text-[9px] font-black px-1.5 py-0.5 uppercase flex items-center gap-1 border"
              style={{
                backgroundColor: 'var(--skipo-matte-bg)',
                color: db.status === 'connected' ? 'var(--skipo-success)' : 'var(--skipo-danger)',
                borderColor: db.status === 'connected' ? 'var(--skipo-success)' : 'var(--skipo-danger)',
                borderRadius: 'var(--skipo-radius-sm)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: db.status === 'connected' ? 'var(--skipo-success)' : 'var(--skipo-danger)',
                }}
              />
              {db.status === 'connected' ? 'ONLINE' : 'STANDBY'} {db.latencyMs ? `(${db.latencyMs}ms)` : ''}
            </span>

            {/* .ENV Provenance Indicator Flag / Button */}
            {db.isFromEnv ? (
              <Tooltip content="Environment Persistent (.env)">
                <BaseButton
                  id={`btn-env-badge-${db.id}`}
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onOpenEnvModal(db)}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-black uppercase border cursor-pointer transition-colors"
                  style={{
                    backgroundColor: 'var(--skipo-matte-bg)',
                    borderColor: 'var(--skipo-success)',
                    color: 'var(--skipo-success)',
                    borderRadius: 'var(--skipo-radius-sm)',
                  }}
                >
                  <FileCode size={10} />
                  <span>.ENV</span>
                </BaseButton>
              </Tooltip>
            ) : (
              <Tooltip content="Runtime In-Memory (Click to get .env)">
                <BaseButton
                  id={`btn-runtime-badge-${db.id}`}
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onOpenEnvModal(db)}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-black uppercase border cursor-pointer transition-colors"
                  style={{
                    backgroundColor: 'var(--skipo-matte-bg)',
                    borderColor: 'var(--skipo-accent)',
                    color: 'var(--skipo-accent)',
                    borderRadius: 'var(--skipo-radius-sm)',
                  }}
                >
                  <Zap size={10} />
                  <span>RUNTIME</span>
                </BaseButton>
              </Tooltip>
            )}
          </div>

          {/* Engine & Configuration summary */}
          <div
            className="text-[10px] font-mono select-all break-all"
            style={{ color: 'var(--skipo-text-muted)' }}
          >
            {db.engine === 'neon' && 'Serverless Postgres • Ecosystem: ultrst-users'}
            {db.engine === 'supabase' && 'Supabase Cloud BaaS • Ecosystem: ultrst-users'}
            {db.engine === 'postgres' && `PostgreSQL Standard • URI: ${db.connectionString || 'Configured'}`}
            {db.engine === 'firebase' && `Cloud Firestore • Project: ${db.firebase?.projectId || 'Configured'}`}
            {db.engine === 'sqlite' && `SQLite Database • Path: ${db.sqlite?.dbPath || 'runtime.db'}`}
          </div>
        </div>

        {/* Right Icon-Only Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <IconOnlyButton
            id={`btn-test-db-${db.id}`}
            tooltip="Test Database Latency"
            icon={<RefreshCw size={13} className={isTesting ? 'animate-spin' : ''} />}
            variant="surface"
            position="bottom"
            onClick={() => onTest(db.id)}
            disabled={isTesting}
            className="h-8 w-8"
          />

          {!isPrimary && (
            <>
              <IconOnlyButton
                id={`btn-promote-db-${db.id}`}
                tooltip="Promote to Primary"
                icon={<Star size={13} />}
                variant="surface"
                position="bottom"
                onClick={() => onSetPrimary(db.id)}
                className="h-8 w-8"
              />

              <IconOnlyButton
                id={`btn-delete-db-${db.id}`}
                tooltip="Remove Database"
                icon={<Trash2 size={13} />}
                variant="danger"
                position="bottom"
                onClick={() => onDelete(db.id)}
                className="h-8 w-8"
              />
            </>
          )}

          <IconOnlyButton
            id={`btn-copy-env-${db.id}`}
            tooltip={copiedId === db.id ? 'Copied' : 'Copy .env Config'}
            icon={copiedId === db.id ? <Check size={13} style={{ color: 'var(--skipo-success)' }} /> : <Copy size={13} />}
            variant="surface"
            position="bottom"
            onClick={() => onCopyEnv(db)}
            className="h-8 w-8"
          />
        </div>
      </div>
    </BrutalistCard>
  );
}
