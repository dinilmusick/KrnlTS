'use client';

// ═══════════════════════════════════════════════════════════════════════════
// IMPORTS & DEPENDENCIES
// ═══════════════════════════════════════════════════════════════════════════
import React from 'react';
import { CheckCircle2, Trash2, Star, RefreshCw } from 'lucide-react';
import { BaseIconButton } from '../../common/BaseIconButton';
import { BaseButton } from '@skipo/ui';
import { UserStorageConnection } from '@/libraries/types/auth';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════
interface StorageSavedConnectionsGridProps {
  savedConnections: UserStorageConnection[];
  activeConnId?: string;
  syncingClones: boolean;
  onSelectConnection: (conn: UserStorageConnection) => void;
  onDeleteConnection: (connId: string, e: React.MouseEvent) => void;
  onSetPrimaryConnection: (conn: UserStorageConnection, e: React.MouseEvent) => void;
  onSyncSingleClone: (conn: UserStorageConnection) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT: SAVED CONNECTIONS GRID
// ═══════════════════════════════════════════════════════════════════════════
export function StorageSavedConnectionsGrid({
  savedConnections,
  activeConnId,
  syncingClones,
  onSelectConnection,
  onDeleteConnection,
  onSetPrimaryConnection,
  onSyncSingleClone,
}: StorageSavedConnectionsGridProps) {
  return (
    <div className="space-y-2 font-mono">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--skipo-accent)' }}>
          WORKSPACE STORAGE OPTIONS ({savedConnections.length}):
        </span>
        <span className="text-[9px] opacity-60">PRIMARY &amp; REDUNDANCY CLONES</span>
      </div>

      {savedConnections.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {savedConnections.map((conn) => {
            const isConnSelected = activeConnId === conn.id;
            const isPrimary = conn.role === 'primary';
            const bucketName = conn.b2BucketName || conn.bucketName || (conn.provider === 'local_fs' ? 'Local Vault' : 'Standard Bucket');
            const endpoint = conn.b2Endpoint || conn.endpoint || 'Standard';

            return (
              <div
                key={conn.id}
                onClick={() => onSelectConnection(conn)}
                className={`p-3 border-2 text-left cursor-pointer transition-all flex flex-col justify-between select-none ${
                  isConnSelected
                    ? 'border-amber-400 bg-amber-400/10 shadow-sm'
                    : 'border-white/20 bg-black/20 hover:border-white/40'
                }`}
                style={{
                  borderRadius: 'var(--skipo-radius)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <CheckCircle2 size={13} className={isConnSelected ? 'text-amber-400' : 'opacity-40'} />
                      <span className="text-xs font-black uppercase truncate max-w-[140px]" style={{ color: 'var(--skipo-text)' }}>
                        {conn.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {isConnSelected && (
                        <span className="text-[8px] bg-amber-400 text-black px-1.5 py-0.5 font-bold uppercase">
                          ACTIVE
                        </span>
                      )}
                      <BaseIconButton
                        tooltip="Delete Connection"
                        icon={<Trash2 size={11} className="text-red-400" />}
                        variant="ghost"
                        size="sm"
                        onClick={(e) => onDeleteConnection(conn.id, e)}
                      />
                    </div>
                  </div>

                  <div className="text-[9px] opacity-70 mt-1 flex items-center justify-between">
                    <span className="uppercase text-amber-400 font-bold">{conn.provider.replace('_', ' ')}</span>
                    <span className="truncate max-w-[130px] font-mono">{bucketName}</span>
                  </div>
                  <div className="text-[8px] opacity-50 truncate font-mono mt-0.5">
                    {endpoint} {conn.latencyMs ? `· ${conn.latencyMs}ms` : ''}
                  </div>
                </div>

                {/* Role action bar */}
                <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-white/10">
                  <BaseButton
                    variant={isPrimary ? 'accent' : 'secondary'}
                    size="sm"
                    className="flex-1 py-1 text-[9px] font-black uppercase flex items-center justify-center gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isPrimary) onSetPrimaryConnection(conn, e);
                    }}
                  >
                    <Star size={10} className={isPrimary ? 'fill-current text-black' : 'text-amber-400'} />
                    <span>{isPrimary ? '★ PRIMARY' : 'SET PRIMARY'}</span>
                  </BaseButton>

                  {!isPrimary && conn.provider !== 'local_fs' && (
                    <BaseButton
                      variant="secondary"
                      size="sm"
                      disabled={syncingClones}
                      className="py-1 px-2.5 text-[9px] font-black uppercase flex items-center justify-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSyncSingleClone(conn);
                      }}
                    >
                      <RefreshCw size={9} className={syncingClones ? 'animate-spin' : ''} />
                      <span>SYNC</span>
                    </BaseButton>
                  )}
                </div>

                <div className="mt-1.5">
                  {isPrimary ? (
                    <span className="text-[8px] text-amber-400 font-bold uppercase tracking-wider block">
                      Primary — all other options are clones of this source
                    </span>
                  ) : (
                    <span className="text-[8px] text-sky-400 font-bold uppercase tracking-wider block">
                      Clone — receives files replicated from Primary
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 border-2 border-dashed text-center space-y-1 bg-black/20" style={{ borderColor: 'var(--skipo-border-color)' }}>
          <span className="text-xs font-black uppercase block text-amber-400">NO STORAGE OPTIONS CONNECTED</span>
          <p className="text-[10px] opacity-70">Connect Backblaze B2 or another external storage provider to persist documents.</p>
        </div>
      )}
    </div>
  );
}
