// ══════════════════════════════════════════════════════════════════════════════
// DEPM SYSTEM TYPES - UNIFIED RESOURCE ENGINE
// ══════════════════════════════════════════════════════════════════════════════
import { ProviderType } from './types/depm/base';

export interface UnifiedResourceMetricItem<T = number> {
  used: T;
  limit: T;
  usedFormatted: string;
  limitFormatted: string;
  percent: number;
  remainingFormatted: string;
}

export interface UnifiedResourceMetrics {
  provider: ProviderType;
  periodLabel: string;
  tier: string;
  isFreeTier: boolean;
  activeCpu: {
    usedSeconds: number;
    limitSeconds: number;
    usedFormatted: string;
    limitFormatted: string;
    percent: number;
    remainingFormatted: string;
  };
  invocations: {
    usedCount: number;
    limitCount: number;
    usedFormatted: string;
    limitFormatted: string;
    percent: number;
    remainingFormatted: string;
  };
  edgeRequests: {
    usedCount: number;
    limitCount: number;
    usedFormatted: string;
    limitFormatted: string;
    percent: number;
    remainingFormatted: string;
  };
  bandwidth: {
    usedMb: number;
    limitMb: number;
    usedFormatted: string;
    limitFormatted: string;
    percent: number;
    remainingFormatted: string;
  };
  memory?: {
    usedGbHours: number;
    limitGbHours: number;
    usedFormatted: string;
    limitFormatted: string;
    percent: number;
    remainingFormatted: string;
  };
  storage?: {
    usedMb: number;
    limitMb: number;
    usedFormatted: string;
    limitFormatted: string;
    percent: number;
    remainingFormatted?: string;
  };
  details?: Record<string, any>;
}

export interface CloudflareProjectItem {
  id: string;
  name: string;
  type: 'worker' | 'pages';
  status: 'ACTIVE' | 'PAUSED';
  subdomain?: string;
  routes?: string[];
  updatedAt?: string;
}

export interface CloudflareObservability {
  projectId: string;
  projectName: string;
  status: 'ACTIVE' | 'PAUSED';
  cpuTimeMs: number;
  cpuTimeFormatted: string;
  requestsCount: number;
  requestsFormatted: string;
  subrequestsCount: number;
  bandwidthMb: number;
  errorsCount: number;
  updatedAt: string;
}

export interface CloudflareUsageMetrics extends UnifiedResourceMetrics {
  provider: 'CLOUDFLARE';
  workersCount: number;
  pagesCount: number;
  subrequests: {
    usedCount: number;
    usedFormatted: string;
  };
  errors: {
    usedCount: number;
    usedFormatted: string;
  };
}
