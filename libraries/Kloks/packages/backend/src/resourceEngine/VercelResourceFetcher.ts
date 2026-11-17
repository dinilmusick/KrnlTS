// ══════════════════════════════════════════════════════════════════════════════
// VERCEL RESOURCE FETCHER IMPLEMENTATION (EXTENDS BASE RESOURCE FETCHER)
// ══════════════════════════════════════════════════════════════════════════════
import { ProviderType } from './types/depm/base';
import { BaseResourceFetcher } from './BaseResourceFetcher';
import { UnifiedResourceMetrics } from './types';
import { buildUsageMetrics, formatCpuSeconds, formatCountMetric } from './metricHelpers';

export class VercelResourceFetcher extends BaseResourceFetcher {
  public readonly provider: ProviderType = 'VERCEL';
  public readonly defaultTier = 'hobby';

  protected getAuthHeaders(creds: Record<string, any>): Record<string, string> {
    const token = (creds?.token || creds?.apiToken || creds?.accessToken || '').trim();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  protected async fetchRawUsage(creds: Record<string, any>, options?: any): Promise<any> {
    const token = (creds?.token || creds?.apiToken || creds?.accessToken || '').trim();
    if (!token) return null;

    const teamId = (creds?.teamId || '').trim();
    const headers = this.getAuthHeaders(creds);
    const fromIso = new Date(Date.now() - 30 * 86400000).toISOString();
    const toIso = new Date().toISOString();
    const teamQuery = teamId ? `&teamId=${encodeURIComponent(teamId)}` : '';

    let rawUsage: any = null;
    try {
      const reqUrl = `https://api.vercel.com/v2/usage?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}&type=requests${teamQuery}`;
      const res = await fetch(reqUrl, { headers });
      if (res.ok) {
        rawUsage = await res.json();
      }
      try {
        const buildUrl = `https://api.vercel.com/v2/usage?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}&type=builds${teamQuery}`;
        const bRes = await fetch(buildUrl, { headers });
        if (bRes.ok) {
          const bData = await bRes.json();
          if (rawUsage && typeof rawUsage === 'object') {
            rawUsage.builds = bData.data || [];
          }
        }
      } catch {}
    } catch (err: any) {
      console.warn('[VercelResourceFetcher] Error fetching usage from Vercel API:', err.message);
    }
    return rawUsage;
  }

  public transformMetrics(raw: any, tier: string = 'hobby', projectsCount: number = 1): UnifiedResourceMetrics {
    const { usageMetrics } = buildUsageMetrics(tier, raw, projectsCount);
    const isHobby = tier === 'hobby';

    return {
      provider: 'VERCEL',
      periodLabel: usageMetrics.periodLabel,
      tier,
      isFreeTier: isHobby,
      activeCpu: {
        usedSeconds: usageMetrics.fluidActiveCpu.usedSeconds,
        limitSeconds: usageMetrics.fluidActiveCpu.limitSeconds,
        usedFormatted: usageMetrics.fluidActiveCpu.usedFormatted,
        limitFormatted: usageMetrics.fluidActiveCpu.limitFormatted,
        percent: usageMetrics.fluidActiveCpu.percent,
        remainingFormatted: usageMetrics.fluidActiveCpu.remainingFormatted,
      },
      invocations: {
        usedCount: usageMetrics.functionInvocations.usedCount,
        limitCount: usageMetrics.functionInvocations.limitCount,
        usedFormatted: usageMetrics.functionInvocations.usedFormatted,
        limitFormatted: usageMetrics.functionInvocations.limitFormatted,
        percent: usageMetrics.functionInvocations.percent,
        remainingFormatted: usageMetrics.functionInvocations.remainingFormatted,
      },
      edgeRequests: {
        usedCount: usageMetrics.edgeRequests.usedCount,
        limitCount: usageMetrics.edgeRequests.limitCount,
        usedFormatted: usageMetrics.edgeRequests.usedFormatted,
        limitFormatted: usageMetrics.edgeRequests.limitFormatted,
        percent: usageMetrics.edgeRequests.percent,
        remainingFormatted: usageMetrics.edgeRequests.remainingFormatted,
      },
      bandwidth: {
        usedMb: Math.round(usageMetrics.fastDataTransfer.usedGb * 1024),
        limitMb: usageMetrics.fastDataTransfer.limitGb * 1024,
        usedFormatted: usageMetrics.fastDataTransfer.usedFormatted,
        limitFormatted: usageMetrics.fastDataTransfer.limitFormatted,
        percent: usageMetrics.fastDataTransfer.percent,
        remainingFormatted: usageMetrics.fastDataTransfer.remainingFormatted,
      },
      memory: {
        usedGbHours: usageMetrics.fluidProvisionedMemory.usedGbHours,
        limitGbHours: usageMetrics.fluidProvisionedMemory.limitGbHours,
        usedFormatted: usageMetrics.fluidProvisionedMemory.usedFormatted,
        limitFormatted: usageMetrics.fluidProvisionedMemory.limitFormatted,
        percent: usageMetrics.fluidProvisionedMemory.percent,
        remainingFormatted: usageMetrics.fluidProvisionedMemory.remainingFormatted,
      },
      storage: {
        usedMb: usageMetrics.functionsStorage.usedMb,
        limitMb: usageMetrics.functionsStorage.limitMb,
        usedFormatted: usageMetrics.functionsStorage.usedFormatted,
        limitFormatted: usageMetrics.functionsStorage.limitFormatted,
        percent: usageMetrics.functionsStorage.percent,
        remainingFormatted: usageMetrics.functionsStorage.remainingFormatted,
      },
      details: {
        fastOriginTransfer: usageMetrics.fastOriginTransfer,
        edgeRequestCpuDuration: usageMetrics.edgeRequestCpuDuration,
        isrReads: usageMetrics.isrReads,
        middlewareInvocations: usageMetrics.middlewareInvocations,
        rawVercelMetrics: usageMetrics,
      },
    };
  }
}
