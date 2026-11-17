// ══════════════════════════════════════════════════════════════════════════════
// DEPM SYSTEM TYPES - ENTITIES
// ══════════════════════════════════════════════════════════════════════════════

import { ProviderType, AccountTier, HealthState, NodeType, SystemDbConfig, SystemBucketConfig, AdminCredentialsConfig } from './base';
import { VercelUsageMetrics, VercelProjectObservability } from './vercel';

export interface AccountEntity {
  id: string;
  provider: ProviderType;
  name: string;
  emailOrSlug: string;
  tier?: AccountTier;
  status: 'CONNECTED' | 'EXPIRING' | 'ERROR';
  credentialType: 'API_TOKEN' | 'OAUTH' | 'SERVICE_KEY';
  deploymentCount: number;
  aggregateUsage: number;
  aggregateSpend: number;
  aggregateQuota: number;
  resetTime: string;
  createdAt: string;
  weightPreference?: number;
  usageMetrics?: VercelUsageMetrics;
  projectObservability?: VercelProjectObservability[];
  projectsList?: Array<{
    id: string;
    name: string;
    status: 'ACTIVE' | 'PAUSED';
    framework?: string;
    url?: string;
    updatedAt?: string;
  }>;
  metadata?: Record<string, any>;
  sharedVariables?: Record<string, string>;
}

export interface DeploymentEntity {
  id: string;
  name: string;
  provider: ProviderType;
  accountId: string;
  providerDeploymentId: string;
  publicOrigin: string;
  bubbleTargetType?: 'DOMAIN' | 'DEPLOYMENT';
  domainUrl?: string;
  deploymentUrl?: string;
  status: 'READY' | 'BUILDING' | 'ERROR' | 'OFFLINE';
  health: HealthState;
  usage: number;
  spend: number;
  quota: number;
  quotaRemaining: number;
  resetTime: string;
  requestRate: number;
  resourceRate: number;
  createdAt: string;
}

export interface AggregatedUrlItem {
  url: string;
  sourceNodeId: string;
  sourceNodeName: string;
  sourceNodeType: NodeType;
  isDirect: boolean;
  distance: number;
}

export interface GraphNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  appId: string;
  icon?: string;
  name?: string;
  componentName?: string;
  publicLink?: string;
  urlValue?: string;
  urls?: string[];
  aggregatedUrls?: string[];
  aggregatedUrlItems?: AggregatedUrlItem[];
  directUrls?: string[];
  deploymentId?: string;
  accountId?: string;
  bubbleTargetType?: 'DOMAIN' | 'DEPLOYMENT';
  domainUrl?: string;
  deploymentUrl?: string;
  weightModifierType?: 'USAGE' | 'USER_DEFINED' | 'ACCOUNT';
  weightValue?: number;
  systemDbData?: SystemDbConfig;
  systemBucketData?: SystemBucketConfig;
  adminCredsData?: AdminCredentialsConfig;
  appData?: AppEntity;
  evolutionScore?: number;
  redundancyScore?: number;
  modularityScore?: number;
  variantsScore?: number;
  visibilityScore?: number;
  evolutionStage?: string;
  ecosystemData?: {
    connectedAppsCount?: number;
    health?: HealthState;
    status?: string;
    routingRate?: number;
    redundancyScore?: number;
    modularityScore?: number;
    variantsScore?: number;
    visibilityScore?: number;
    evolutionScore?: number;
  };
}

export interface GraphEdge {
  id: string;
  appId: string;
  sourceId: string;
  targetId: string;
  sourceSocketId?: string;
  targetSocketId?: string;
  label?: string;
}

export interface AppEntity {
  id: string;
  name: string;
  icon: string;
  description?: string;
  publicLink: string;
  folderName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EcosystemEntity {
  id: string;
  name: string;
  icon: string;
  description?: string;
  health?: HealthState;
  status?: string;
  connectedAppsCount?: number;
  meshLinkCount?: number;
  nodes?: GraphNode[];
  edges?: GraphEdge[];
  createdAt: string;
  updatedAt: string;
}
