/**
 * @file types.ts
 * @description Universal types for node graph document persistence, serialization, and storage sync.
 */

export interface UniversalGraphNode {
  id: string;
  type?: string;
  label?: string;
  name?: string;
  appId?: string;
  deploymentId?: string;
  position?: { x: number; y: number };
  data?: Record<string, any>;
  [key: string]: any;
}

export interface UniversalGraphEdge {
  id: string;
  source: string;
  target: string;
  sourceSocket?: string;
  targetSocket?: string;
  appId?: string;
  data?: Record<string, any>;
  [key: string]: any;
}

export interface UniversalAppEntity {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  publicLink?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface UniversalStorageConnection {
  id: string;
  provider: 'local_fs' | 'backblaze_b2' | 'cloudflare_r2' | 'aws_s3' | 'supabase' | string;
  localFolderName?: string;
  b2BucketName?: string;
  s3BucketName?: string;
  r2BucketName?: string;
  supabaseBucketName?: string;
  [key: string]: any;
}

export interface UniversalNodeGraphDocument {
  $schema?: string;
  version: string;
  appId: string;
  appName: string;
  appIcon?: string;
  description?: string;
  publicLink?: string;
  createdAt: string;
  updatedAt: string;
  exportedAt: string;

  author?: {
    userId?: string;
    username?: string;
    email?: string;
    name?: string;
    role?: string;
  };

  viewport?: {
    zoom: number;
    pan: { x: number; y: number };
  };

  graph: {
    nodes: UniversalGraphNode[];
    edges: UniversalGraphEdge[];
  };

  deployments?: any[];

  storageMetadata?: {
    provider: string;
    targetName: string;
    targetPath: string;
    storageConnectionId?: string;
    checksum?: string;
    syncedAt?: string;
  };
}

export interface NodeGraphValidationResult {
  valid: boolean;
  errors: string[];
  document?: UniversalNodeGraphDocument;
}

export interface SaveGraphOptions {
  app: UniversalAppEntity;
  nodes: UniversalGraphNode[];
  edges: UniversalGraphEdge[];
  deployments?: any[];
  viewport?: { zoom: number; pan: { x: number; y: number } };
  storageConnection?: UniversalStorageConnection;
}

export const LOCAL_STORAGE_GRAPHS_PREFIX = 'depm_graph_doc_';
