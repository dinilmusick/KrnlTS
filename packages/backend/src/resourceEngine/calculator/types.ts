// ══════════════════════════════════════════════════════════════════════════════
// DEPM SYSTEM TYPES - UNIVERSAL RESOURCE CALCULATOR & PROVIDER ADAPTERS
// Strict decoupling: Top-level engine operates on GeneralizedResourceVector
// ══════════════════════════════════════════════════════════════════════════════
import { ProviderType } from '../types/depm/base';

export type ResourceCategory =
  | 'compute'
  | 'memory'
  | 'execution'
  | 'requests'
  | 'network'
  | 'storage';

export interface GeneralizedResourceMetric {
  id: string;                 // e.g. 'fluid_active_cpu', 'fluid_provisioned_memory'
  name: string;               // e.g. 'Fluid Active CPU'
  category: ResourceCategory;
  used: number;               // numerical consumed quantity
  limit: number;              // quota / ceiling limit
  unit: string;               // 'seconds', 'gb-hours', 'count', 'bytes', 'mb'
  usedFormatted: string;      // e.g. '30m 27s'
  limitFormatted: string;     // e.g. '4h'
  remainingFormatted: string; // e.g. '3h 29m'
  percentUsed: number;        // 0 - 100
  percentRemaining: number;   // 0 - 100
  isMonthlyDepletable: boolean; // true for monthly quotas that deplete via app usage
  importanceWeight: number;   // contribution weight (e.g. 0.35)
}

export interface GeneralizedResourceVector {
  provider: ProviderType | string;
  tier: string;               // 'hobby' | 'pro' | 'free' | 'enterprise'
  periodLabel: string;        // 'Last 30 days'
  metrics: GeneralizedResourceMetric[];
  metadata?: Record<string, any>;
}

export interface ResourceCalculationResult {
  effectiveWeight: number;         // 0.00 to 1.00 (e.g. 0.92)
  percentRemaining: number;        // 0 to 100 (e.g. 92)
  dominantBottleneck: GeneralizedResourceMetric;
  metrics: GeneralizedResourceMetric[];
  summaryLabel: string;            // e.g. 'CPU: 30m 27s (87% rem)'
}

export interface IResourceProviderAdapter {
  readonly provider: ProviderType;
  readonly defaultTier: string;

  fetchUsage(creds: Record<string, any>, options?: any): Promise<any>;
  transformToGeneralizedVector(
    raw: any,
    tier?: string,
    projectsCount?: number,
    existingMetrics?: any
  ): GeneralizedResourceVector;
}
