// ══════════════════════════════════════════════════════════════════════════════
// BASE RESOURCE FETCHER ABSTRACT CLASS (OOP EXTENSIBILITY CONTRACT)
// ══════════════════════════════════════════════════════════════════════════════
import { ProviderType } from './types/depm/base';
import { AccountEntity, DeploymentEntity } from './types/depm/entities';
import { UnifiedResourceMetrics } from './types';

export abstract class BaseResourceFetcher {
  public abstract readonly provider: ProviderType;
  public abstract readonly defaultTier: string;

  /**
   * Constructs HTTP authorization headers from stored account credentials.
   */
  protected abstract getAuthHeaders(creds: Record<string, any>): Record<string, string>;

  /**
   * Queries the provider's live metrics endpoint(s).
   */
  protected abstract fetchRawUsage(creds: Record<string, any>, options?: any): Promise<any>;

  /**
   * Transforms provider-specific raw payload into the normalized UnifiedResourceMetrics structure.
   */
  public abstract transformMetrics(raw: any, tier?: string, projectsCount?: number): UnifiedResourceMetrics;

  /**
   * Template method: Resolves credentials, queries the provider's APIs, and normalizes metrics.
   */
  public async fetchMetrics(account: AccountEntity): Promise<UnifiedResourceMetrics> {
    const creds = account.metadata?.credentials || {};
    const tier = (account.tier as string) || this.defaultTier;
    const raw = await this.fetchRawUsage(creds, {
      accountId: account.id,
      accountName: account.name || account.emailOrSlug,
    });
    return this.transformMetrics(raw, tier, account.deploymentCount || 0);
  }

  /**
   * Shared weighted resource score calculation (0.0 to 1.0).
   * - Active CPU receives the highest weight (50% / 0.50).
   * - Invocations: 15% (0.15).
   * - Compute Memory / Subrequests: 15% (0.15).
   * - Edge Requests: 10% (0.10).
   * - Bandwidth / Data Transfer: 5% (0.05).
   * - Other compute / network metrics: 5% (0.05).
   * - Storage parameters (Functions Storage, Deployment Storage, R2) are strictly EXCLUDED (0%).
   */
  public computeWeightScore(
    metrics?: UnifiedResourceMetrics | Record<string, any>,
    deployment?: DeploymentEntity,
    account?: AccountEntity
  ): number {
    if (!metrics) {
      if (account && account.aggregateQuota > 0) {
        return Number(Math.max(0, Math.min(1, (account.aggregateQuota - account.aggregateUsage) / account.aggregateQuota)).toFixed(2));
      }
      if (deployment && deployment.quota > 0) {
        return Number(Math.max(0, Math.min(1, (deployment.quota - deployment.usage) / deployment.quota)).toFixed(2));
      }
      return 1.0;
    }

    const calcRemaining = (item: any): number | null => {
      if (!item) return null;
      if (typeof item.percent === 'number' && !isNaN(item.percent)) {
        return Math.max(0, Math.min(1, (100 - item.percent) / 100));
      }
      if (item.usedSeconds !== undefined && item.limitSeconds !== undefined && item.limitSeconds > 0) {
        return Math.max(0, Math.min(1, (item.limitSeconds - item.usedSeconds) / item.limitSeconds));
      }
      if (item.usedCount !== undefined && item.limitCount !== undefined && item.limitCount > 0) {
        return Math.max(0, Math.min(1, (item.limitCount - item.usedCount) / item.limitCount));
      }
      if (item.usedGbHours !== undefined && item.limitGbHours !== undefined && item.limitGbHours > 0) {
        return Math.max(0, Math.min(1, (item.limitGbHours - item.usedGbHours) / item.limitGbHours));
      }
      if (item.usedMb !== undefined && item.limitMb !== undefined && item.limitMb > 0) {
        return Math.max(0, Math.min(1, (item.limitMb - item.usedMb) / item.limitMb));
      }
      if (item.usedGb !== undefined && item.limitGb !== undefined && item.limitGb > 0) {
        return Math.max(0, Math.min(1, (item.limitGb - item.usedGb) / item.limitGb));
      }
      return null;
    };

    // Extract metrics whether using UnifiedResourceMetrics or legacy VercelUsageMetrics
    const cpuMetric = (metrics as UnifiedResourceMetrics).activeCpu || (metrics as any).fluidActiveCpu;
    const invMetric = (metrics as UnifiedResourceMetrics).invocations || (metrics as any).functionInvocations;
    const memMetric = (metrics as UnifiedResourceMetrics).memory || (metrics as any).fluidProvisionedMemory;
    const edgeMetric = (metrics as UnifiedResourceMetrics).edgeRequests || (metrics as any).edgeRequests;
    const bwMetric = (metrics as UnifiedResourceMetrics).bandwidth || (metrics as any).fastDataTransfer;
    const otherMetric =
      (metrics as any).edgeRequestCpuDuration ||
      (metrics as any).fastOriginTransfer ||
      (metrics as any).subrequests ||
      (metrics as any).isrReads ||
      (metrics as any).middlewareInvocations;

    // Weight distribution: Active CPU has primary 50% weight; storage is strictly 0%
    const weightedItems: Array<{ remaining: number | null; weight: number }> = [
      { remaining: calcRemaining(cpuMetric), weight: 0.50 },
      { remaining: calcRemaining(invMetric), weight: 0.15 },
      { remaining: calcRemaining(memMetric), weight: 0.15 },
      { remaining: calcRemaining(edgeMetric), weight: 0.10 },
      { remaining: calcRemaining(bwMetric), weight: 0.05 },
      { remaining: calcRemaining(otherMetric), weight: 0.05 },
    ];

    let totalWeight = 0;
    let weightedSum = 0;

    for (const { remaining, weight } of weightedItems) {
      if (remaining !== null) {
        weightedSum += remaining * weight;
        totalWeight += weight;
      }
    }

    if (totalWeight > 0) {
      const normalizedScore = weightedSum / totalWeight;
      return Number(Math.max(0, Math.min(1, normalizedScore)).toFixed(2));
    }

    return 1.0;
  }
}
