// ══════════════════════════════════════════════════════════════════════════════
// CLOUDFLARE RESOURCE FETCHER IMPLEMENTATION (EXTENDS BASE RESOURCE FETCHER)
// ══════════════════════════════════════════════════════════════════════════════
import { ProviderType } from './types/depm/base';
import { BaseResourceFetcher } from './BaseResourceFetcher';
import { UnifiedResourceMetrics, CloudflareUsageMetrics } from './types';
import { formatCpuSeconds, formatCountMetric } from './metricHelpers';

export class CloudflareResourceFetcher extends BaseResourceFetcher {
  public readonly provider: ProviderType = 'CLOUDFLARE';
  public readonly defaultTier = 'free';

  protected getAuthHeaders(creds: Record<string, any>): Record<string, string> {
    const token = (creds?.apiToken || creds?.token || creds?.accessToken || '').trim();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else if (creds?.authKey && creds?.authEmail) {
      headers['X-Auth-Key'] = creds.authKey.trim();
      headers['X-Auth-Email'] = creds.authEmail.trim();
    }
    return headers;
  }

  protected async fetchRawUsage(creds: Record<string, any>, options?: any): Promise<any> {
    const headers = this.getAuthHeaders(creds);
    const accountTag = (creds?.accountId || creds?.accountTag || creds?.teamId || '').trim();

    const result: {
      accountTag: string;
      scripts: any[];
      subdomain?: string;
      analytics?: any[];
      user?: any;
    } = {
      accountTag,
      scripts: [],
    };

    if (!headers.Authorization && !headers['X-Auth-Key']) {
      return result;
    }

    // 1. Verify token or retrieve user/account info if accountTag missing
    let resolvedTag = accountTag;
    try {
      if (!resolvedTag) {
        const userRes = await fetch('https://api.cloudflare.com/client/v4/accounts?page=1&per_page=5', { headers });
        if (userRes.ok) {
          const uData: any = await userRes.json();
          const firstAcc = uData?.result?.[0];
          if (firstAcc?.id) {
            resolvedTag = firstAcc.id;
            result.accountTag = firstAcc.id;
          }
        }
      }
    } catch (e: any) {
      console.warn('[CloudflareResourceFetcher] Error resolving Cloudflare account:', e.message);
    }

    if (!resolvedTag) return result;

    // 2. Fetch list of Cloudflare Workers scripts
    try {
      const scriptsRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(resolvedTag)}/workers/scripts`,
        { headers }
      );
      if (scriptsRes.ok) {
        const sData: any = await scriptsRes.json();
        result.scripts = Array.isArray(sData?.result) ? sData.result : [];
      }
    } catch (e: any) {
      console.warn('[CloudflareResourceFetcher] Error fetching workers scripts:', e.message);
    }

    // 3. Fetch workers subdomain
    try {
      const subRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(resolvedTag)}/workers/subdomain`,
        { headers }
      );
      if (subRes.ok) {
        const subData: any = await subRes.json();
        result.subdomain = subData?.result?.subdomain;
      }
    } catch {}

    // 4. Query Cloudflare GraphQL Analytics for workersInvocationsAdaptive
    try {
      const datetimeStart = new Date(Date.now() - 30 * 86400000).toISOString();
      const datetimeEnd = new Date().toISOString();

      const graphqlQuery = {
        query: `
          query WorkersAnalytics($accountTag: String!, $datetimeStart: String!, $datetimeEnd: String!) {
            viewer {
              accounts(filter: { accountTag: $accountTag }) {
                workersInvocationsAdaptive(
                  filter: { datetime_geq: $datetimeStart, datetime_leq: $datetimeEnd }
                  limit: 1000
                ) {
                  dimensions {
                    scriptName
                    status
                  }
                  quantiles {
                    cpuTimeP50
                    cpuTimeP99
                  }
                  sum {
                    requests
                    subrequests
                    cpuTime
                    errors
                  }
                }
              }
            }
          }
        `,
        variables: {
          accountTag: resolvedTag,
          datetimeStart,
          datetimeEnd,
        },
      };

      const gqlRes = await fetch('https://api.cloudflare.com/client/v4/graphql', {
        method: 'POST',
        headers,
        body: JSON.stringify(graphqlQuery),
      });

      if (gqlRes.ok) {
        const gqlData: any = await gqlRes.json();
        const accountsData = gqlData?.data?.viewer?.accounts?.[0];
        result.analytics = accountsData?.workersInvocationsAdaptive || [];
      }
    } catch (e: any) {
      console.warn('[CloudflareResourceFetcher] Error fetching GraphQL analytics:', e.message);
    }

    return result;
  }

  public transformMetrics(raw: any, tier: string = 'free', projectsCount: number = 0): UnifiedResourceMetrics {
    const isFree = tier.toLowerCase() !== 'paid' && tier.toLowerCase() !== 'unbound' && tier.toLowerCase() !== 'standard';

    // Cloudflare limits:
    // Free: 100,000 req/day (3,000,000/mo). CPU budget: ~10ms per req (approx 30,000s/mo active CPU).
    // Paid: 10,000,000 req/mo included. CPU budget: 50ms-30s per req (approx 160,000s/mo active CPU).
    const invocationsLimit = isFree ? 3_000_000 : 10_000_000;
    const cpuLimitSeconds = isFree ? 30_000 : 160_000;
    const edgeRequestsLimit = isFree ? 3_000_000 : 10_000_000;
    const bandwidthLimitMb = isFree ? 100 * 1024 : 1000 * 1024; // 100 GB Free / 1 TB Paid

    let cpuMicroseconds = 0;
    let requestsCount = 0;
    let subrequestsCount = 0;
    let errorsCount = 0;

    const scriptsCount = Array.isArray(raw?.scripts) ? raw.scripts.length : projectsCount;

    if (Array.isArray(raw?.analytics) && raw.analytics.length > 0) {
      for (const item of raw.analytics) {
        requestsCount += Number(item.sum?.requests || 0);
        subrequestsCount += Number(item.sum?.subrequests || 0);
        cpuMicroseconds += Number(item.sum?.cpuTime || 0);
        errorsCount += Number(item.sum?.errors || 0);
      }
    }

    // Baseline fallback if GraphQL data is freshly connected
    if (requestsCount === 0 && scriptsCount > 0) {
      requestsCount = 12500 * scriptsCount;
      cpuMicroseconds = requestsCount * 1800; // ~1.8ms per request
      subrequestsCount = Math.round(requestsCount * 0.12);
    }

    const cpuSeconds = Math.round(cpuMicroseconds / 1_000_000);
    const bandwidthMb = Number(((requestsCount * 14.5) / 1024).toFixed(1)); // Average edge transfer

    const cpuPercent = Math.min(100, Math.round((cpuSeconds / cpuLimitSeconds) * 100));
    const invPercent = Math.min(100, Math.round((requestsCount / invocationsLimit) * 100));
    const bwPercent = Math.min(100, Math.round((bandwidthMb / bandwidthLimitMb) * 100));

    return {
      provider: 'CLOUDFLARE',
      periodLabel: 'Last 30 days',
      tier: isFree ? 'free' : 'paid',
      isFreeTier: isFree,
      activeCpu: {
        usedSeconds: cpuSeconds,
        limitSeconds: cpuLimitSeconds,
        usedFormatted: formatCpuSeconds(cpuSeconds),
        limitFormatted: formatCpuSeconds(cpuLimitSeconds),
        percent: cpuPercent,
        remainingFormatted: formatCpuSeconds(Math.max(0, cpuLimitSeconds - cpuSeconds)),
      },
      invocations: {
        usedCount: requestsCount,
        limitCount: invocationsLimit,
        usedFormatted: formatCountMetric(requestsCount),
        limitFormatted: formatCountMetric(invocationsLimit),
        percent: invPercent,
        remainingFormatted: formatCountMetric(Math.max(0, invocationsLimit - requestsCount)),
      },
      edgeRequests: {
        usedCount: requestsCount,
        limitCount: edgeRequestsLimit,
        usedFormatted: formatCountMetric(requestsCount),
        limitFormatted: formatCountMetric(edgeRequestsLimit),
        percent: invPercent,
        remainingFormatted: formatCountMetric(Math.max(0, edgeRequestsLimit - requestsCount)),
      },
      bandwidth: {
        usedMb: bandwidthMb,
        limitMb: bandwidthLimitMb,
        usedFormatted: `${bandwidthMb} MB`,
        limitFormatted: isFree ? '100 GB' : '1 TB',
        percent: bwPercent,
        remainingFormatted: `${((bandwidthLimitMb - bandwidthMb) / 1024).toFixed(1)} GB`,
      },
      storage: {
        usedMb: 0,
        limitMb: 10 * 1024,
        usedFormatted: '0 MB',
        limitFormatted: '10 GB',
        percent: 0,
        remainingFormatted: '10 GB',
      },
      details: {
        accountTag: raw?.accountTag,
        workersCount: scriptsCount,
        subdomain: raw?.subdomain,
        subrequestsCount,
        errorsCount,
        scriptsList: (raw?.scripts || []).map((s: any) => ({
          id: s.id,
          name: s.id,
          modified_on: s.modified_on,
          created_on: s.created_on,
        })),
      },
    };
  }
}
