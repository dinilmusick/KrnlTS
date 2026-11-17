export interface WorkspaceDescriptor {
  id: string;
  name: string;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
}
export type SyncState = 'SYNCED' | 'SYNCING' | 'ERROR' | 'OFFLINE';
export type ConflictPolicy = 'primary_wins' | 'backup_wins' | 'newest_wins';

export interface WorkspaceSecondaryClone {
  id: string;
  label: string;
  provider: string;
  b2BucketName?: string;
  b2KeyId?: string;
  b2ApplicationKey?: string;
  b2Region?: string;
  b2Endpoint?: string;
  localFolderName?: string;
  localFolderKey?: string;
  createdAt: string;
  lastSyncedAt?: string;
  filesSynced?: number;
  status?: 'CONNECTED' | 'SYNCED' | 'ERROR';
}

export interface WorkspaceSyncSummary {
  success: boolean;
  workspaceId: string;
  folderKey: string;
  workingDir?: string;
  persistenceType: string;
  targetLocation: string;
  syncedFiles: Array<{ fileName: string; action: string; sizeBytes?: number }>;
  uploadedCount: number;
  downloadedCount: number;
  syncedAt: string;
  error?: string;
}

export interface WorkspaceConfig {
  id: string;
  sync: {
    enabled: boolean;
    mode: 'on_write' | 'manual';
    conflictStrategy: ConflictPolicy;
    deletePropagation: boolean;
  };
}
