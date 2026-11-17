export interface UserWorkspaceRecord {
  id: string;
  name: string;
  description?: string;
  engine: 'local_fs' | 's3_blob' | 'supabase' | 'backblaze_b2';
  storageProvider?: 'local_fs' | 's3_blob' | 'supabase' | 'backblaze_b2';
  storageConnectionId?: string;
  localFolderName?: string;
  localFolderKey?: string;
  b2BucketName?: string;
  b2Endpoint?: string;
  b2Region?: string;
  workspacePath?: string;
  createdAt: number;
  itemCount: number;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  workspaces?: UserWorkspaceRecord[];
  activeWorkspaceId?: string;
}

export interface GuestSession {
  leaseId: string;
  workspaceId: string;
  appId: "aiko";
  issuedAt: number;
  expiresAt: number;
  capabilities: string[];
}

export interface SystemDbStatus {
  connected?: boolean;
  latencyMs?: number;
  clusterName?: string;
  engine?: string;
}
