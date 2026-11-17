/**
 * @file srkl.ts
 * @description Master domain interfaces for SRKL (Service Hub) based on Srkl-spec.md.
 * File size < 200 lines strictly.
 */

export type ActionType = 'READ' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXECUTE' | 'SYNC' | 'REFRESH';

export type ServiceStatus = 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'UNAUTHENTICATED' | 'SYNCING';

export type AuthType = 'NONE' | 'API_KEY' | 'BEARER_TOKEN' | 'BASIC_AUTH' | 'OAUTH2' | 'CUSTOM_HEADER';

export interface CredentialField {
  name: string;
  label: string;
  type: 'string' | 'password' | 'number' | 'boolean';
  required: boolean;
  secret: boolean;
  description: string;
  guideUrl?: string;
  validationPattern?: string;
  storagePolicy?: 'LOCAL_ENCRYPTED' | 'SESSION_ONLY' | 'MEMORY';
}

export interface EndpointDefinition {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  bodyTemplate?: string;
  authentication: boolean;
  description: string;
}

export interface ActionDefinition {
  id: string;
  name: string;
  actionType: ActionType;
  description: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  destructive?: boolean;
}

export interface ResourceDefinition {
  type: string;
  name: string;
  description: string;
  supportedActions: ActionType[];
  hasChildren: boolean;
}

export interface ServiceDefinition {
  identifier: string;
  name: string;
  description: string;
  version: string;
  authType: AuthType;
  credentialFields: CredentialField[];
  endpoints: EndpointDefinition[];
  actions: ActionDefinition[];
  resources: ResourceDefinition[];
  pollingIntervalSeconds: number;
  metadata?: Record<string, unknown>;
}

export interface SurveillanceMetrics {
  status: ServiceStatus;
  health: number; // 0 - 100 percentage
  usage: number;
  quota: number;
  limitUnit: string;
  resourceCount: number;
  totalSizeBytes: number;
  lastSync: string;
  lastError?: string | null;
  latencyMs: number;
}

export interface ActivityRecord {
  id: string;
  timestamp: string;
  serviceId: string;
  serviceName: string;
  accountId?: string;
  accountName?: string;
  resourceId?: string;
  resourceName?: string;
  actionId: string;
  actionType: ActionType;
  status: 'SUCCESS' | 'FAILED' | 'IN_PROGRESS';
  durationMs: number;
  error?: string | null;
  details?: Record<string, unknown>;
}

export type DockPosition = 'top' | 'bottom' | 'left' | 'right';

export interface ServiceGroup {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isDefault?: boolean;
}

export interface ServiceTab {
  id: string;
  name: string;
  description?: string;
  groupIds: string[];
  icon?: string;
  isDefault?: boolean;
}

export type TabType = 
  | 'SERVICES'
  | 'SERVICE_BUILDER'
  | 'ACTIVITY'
  | 'SETTINGS';
