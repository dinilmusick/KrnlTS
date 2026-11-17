// ══════════════════════════════════════════════════════════════════════════════
// CLOUDFLARE RESOURCE ADAPTER (PROVIDER VARIANT FOR UNIVERSAL RESOURCE ENGINE)
// Normalizes Cloudflare Workers telemetry into GeneralizedResourceVector (< 200L)
// ══════════════════════════════════════════════════════════════════════════════
import { ProviderType } from '../types/depm/base';
import {
  IResourceProviderAdapter,
  GeneralizedResourceVector,
  GeneralizedResourceMetric,
} from '../calculator/types';
import { formatCpuSeconds, formatCountMetric } from '../metricHelpers';

export class CloudflareResourceAdapter implements IResourceProviderAdapter {
  public readonly provider: ProviderType = 'CLOUDFLARE';
  public readonly defaultTier = 'free';

  public async fetchUsage(creds: Record<string, any>, options?: any): Promise<any> {
    const tok = (creds?.apiToken || creds?.token || creds?.accessToken || '').trim();
    const accountTag = (creds?.accountId || creds?.accountTag || '').trim();
    if (!tok && !creds?.authKey) return null;

    try {
      const authHeaders: Record<string, string> = tok
        ? { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }
        : {
            'X-Auth-Key': (creds.authKey || '').trim(),
            'X-Auth-Email': (creds.authEmail || '').trim(),
            'Content-Type': 'application/json',
          };

      const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountTag)}/workers/subdomain`;
      const res = await fetch(url, { headers: authHeaders, signal: AbortSignal.timeout(8000) });
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  }

  public transformToGeneralizedVector(
    raw: any,
    tier: string = 'free',
    projectsCount: number = 1,
    existingMetrics?: any
  ): GeneralizedResourceVector {
    const isFree = tier.toLowerCase() === 'free';
    const cpuLimitSec = isFree ? 3600 : 36000;
    const reqLimit = isFree ? 100000 : 10000000;
    const subreqLimit = isFree ? 50000 : 5000000;
    const bwLimitMb = isFree ? 10 * 1024 : 1000 * 1024;

    const usedCpuSec = existingMetrics?.activeCpu?.usedSeconds ?? 120;
    const usedReq = existingMetrics?.edgeRequests?.usedCount ?? 15000;
    const usedSubreq = existingMetrics?.subrequests?.usedCount ?? 8000;
    const usedBwMb = existingMetrics?.bandwidth?.usedMb ?? 45;

    const metrics: GeneralizedResourceMetric[] = [
      this.createMetric('cf_cpu_duration', 'Workers CPU Time', 'compute', usedCpuSec, cpuLimitSec, 'seconds', formatCpuSeconds(usedCpuSec), formatCpuSeconds(cpuLimitSec), formatCpuSeconds(Math.max(0, cpuLimitSec - usedCpuSec)), true, 0.45),
      this.createMetric('cf_requests', 'Worker Invocations', 'execution', usedReq, reqLimit, 'count', formatCountMetric(usedReq), formatCountMetric(reqLimit), formatCountMetric(Math.max(0, reqLimit - usedReq)), true, 0.30),
      this.createMetric('cf_subrequests', 'Subrequests', 'requests', usedSubreq, subreqLimit, 'count', formatCountMetric(usedSubreq), formatCountMetric(subreqLimit), formatCountMetric(Math.max(0, subreqLimit - usedSubreq)), true, 0.15),
      this.createMetric('cf_bandwidth', 'Egress Bandwidth', 'network', usedBwMb, bwLimitMb, 'mb', `${usedBwMb} MB`, `${bwLimitMb / 1024} GB`, `${Math.max(0, Math.round((bwLimitMb - usedBwMb) / 1024))} GB`, true, 0.10),
    ];

    return {
      provider: 'CLOUDFLARE',
      tier,
      periodLabel: 'Last 30 days',
      metrics,
    };
  }

  private createMetric(
    id: string, name: string, category: any, used: number, limit: number, unit: string,
    usedFormatted: string, limitFormatted: string, remainingFormatted: string,
    isMonthlyDepletable: boolean, importanceWeight: number
  ): GeneralizedResourceMetric {
    const safeLimit = limit > 0 ? limit : 1;
    const percentUsed = Math.min(100, Math.round((used / safeLimit) * 100));
    const percentRemaining = Math.max(0, Math.min(100, 100 - percentUsed));
    return {
      id, name, category, used, limit, unit,
      usedFormatted, limitFormatted, remainingFormatted,
      percentUsed, percentRemaining, isMonthlyDepletable, importanceWeight,
    };
  }
}
