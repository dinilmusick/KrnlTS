/**
 * @file cloudflareSurveillance.ts
 * @description Real-time Cloudflare Workers, Pages, and Edge surveillance.
 * File size < 200 lines strictly.
 */

export interface CloudflareResourceItem {
  id: string;
  type: 'WORKER' | 'PAGES_PROJECT' | 'ZONE' | 'R2_BUCKET';
  name: string;
  url?: string;
  status: string;
  updatedAt?: string;
  routes?: string[];
  subdomain?: string;
  meta?: Record<string, unknown>;
}

function buildAuthHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'SRKL-Universal-Hub/1.0',
  };
  if (token) headers['Authorization'] = `Bearer ${token.trim()}`;
  return headers;
}

export async function checkCloudflareHealth(token?: string, accountId?: string, email?: string, globalApiKey?: string, accountName?: string) {
  const startTime = Date.now();
  if (!token) {
    return {
      success: true, status: 'STANDBY', serviceId: 'cloudflare', provider: 'Cloudflare Platform',
      message: 'No Cloudflare API Token attached. Add API Token to surveil live workers & pages.',
      latencyMs: Date.now() - startTime, timestamp: new Date().toISOString(),
    };
  }

  const headers = buildAuthHeaders(token);
  try {
    const res = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', { headers, signal: AbortSignal.timeout(8000) });
    const data = await res.json().catch(() => ({}));
    const latencyMs = Date.now() - startTime;

    if (res.ok && data.success) {
      return {
        success: true, status: 'ONLINE', serviceId: 'cloudflare', provider: 'Cloudflare Platform',
        latencyMs, account: accountName || 'Cloudflare Account', accountId, liveCheck: 'PASSED', timestamp: new Date().toISOString(),
      };
    }

    if (accountId) {
      const accRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/scripts`, { headers, signal: AbortSignal.timeout(8000) });
      const accData = await accRes.json().catch(() => ({}));
      if (accRes.ok && accData.success) {
        return {
          success: true, status: 'ONLINE', serviceId: 'cloudflare', provider: 'Cloudflare Platform',
          latencyMs: Date.now() - startTime, account: accountName || 'Cloudflare Account', accountId, liveCheck: 'PASSED', timestamp: new Date().toISOString(),
        };
      }
    }

    const errDetail = data.errors?.[0]?.message || `Cloudflare authentication error ${res.status}`;
    return { success: false, status: 'DEGRADED', serviceId: 'cloudflare', latencyMs, error: errDetail, timestamp: new Date().toISOString() };
  } catch (err: unknown) {
    return { success: false, status: 'OFFLINE', serviceId: 'cloudflare', latencyMs: Date.now() - startTime, error: err instanceof Error ? err.message : String(err), timestamp: new Date().toISOString() };
  }
}

export async function getCloudflareResources(token?: string, accountId?: string, email?: string, globalApiKey?: string, accountName?: string) {
  const resources: CloudflareResourceItem[] = [];
  let workersCount = 0;
  let pagesCount = 0;
  let r2Count = 0;
  let apiError: string | null = null;
  const headers = buildAuthHeaders(token);

  if (token && accountId) {
    try {
      let workerSubdomain = '';
      try {
        const subRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/subdomain`, { headers, signal: AbortSignal.timeout(6000) });
        const subData = await subRes.json().catch(() => ({}));
        if (subData.result?.subdomain) workerSubdomain = subData.result.subdomain;
      } catch {}

      const [workersRes, pagesRes, r2Res] = await Promise.allSettled([
        fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/scripts`, { headers, signal: AbortSignal.timeout(8000) }).then((r) => r.json()),
        fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/pages/projects`, { headers, signal: AbortSignal.timeout(8000) }).then((r) => r.json()),
        fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/r2/buckets`, { headers, signal: AbortSignal.timeout(8000) }).then((r) => r.json()),
      ]);

      if (workersRes.status === 'fulfilled' && workersRes.value?.result && Array.isArray(workersRes.value.result)) {
        workersCount = workersRes.value.result.length;
        for (const w of workersRes.value.result) {
          const wName = w.id || w.name;
          const host = workerSubdomain ? `${wName}.${workerSubdomain}.workers.dev` : `${wName}.workers.dev`;
          resources.push({
            id: w.id || w.name,
            type: 'WORKER',
            name: w.name || w.id,
            url: `https://${host}`,
            status: 'ONLINE',
            updatedAt: w.modified_on || w.created_on,
            routes: Array.isArray(w.routes) ? w.routes : (w.routes ? [String(w.routes)] : []),
            meta: { usageModel: w.usage_model, etag: w.etag },
          });
        }
      } else if (workersRes.status === 'fulfilled' && workersRes.value?.errors?.length) {
        apiError = workersRes.value.errors[0]?.message || 'Workers API error';
      }

      if (pagesRes.status === 'fulfilled' && pagesRes.value?.result && Array.isArray(pagesRes.value.result)) {
        pagesCount = pagesRes.value.result.length;
        for (const p of pagesRes.value.result) {
          const pageUrl = p.canonical_deployment?.url || (p.subdomain ? `https://${p.subdomain}.pages.dev` : `https://${p.name}.pages.dev`);
          resources.push({
            id: p.name || p.id,
            type: 'PAGES_PROJECT',
            name: p.name,
            url: pageUrl,
            subdomain: p.subdomain,
            status: p.latest_deployment?.status || 'READY',
            updatedAt: p.latest_deployment?.created_on || p.created_on,
            meta: { productionBranch: p.production_branch, domains: p.domains || [] },
          });
        }
      }

      if (r2Res.status === 'fulfilled' && r2Res.value?.result?.buckets && Array.isArray(r2Res.value.result.buckets)) {
        r2Count = r2Res.value.result.buckets.length;
        for (const b of r2Res.value.result.buckets) {
          resources.push({
            id: b.name,
            type: 'R2_BUCKET',
            name: b.name,
            status: 'ONLINE',
            updatedAt: b.creation_date,
            meta: { location: b.location },
          });
        }
      }
    } catch (err: unknown) {
      apiError = err instanceof Error ? err.message : String(err);
    }
  } else if (!accountId) {
    apiError = 'Missing Account ID. Please configure your 32-character Cloudflare Account ID.';
  }

  return {
    success: !apiError,
    serviceId: 'cloudflare',
    account: accountName || accountId || 'Cloudflare Account',
    accountId,
    summary: { totalWorkers: workersCount, totalPages: pagesCount, totalR2Buckets: r2Count },
    count: resources.length,
    resources,
    error: apiError || undefined,
    timestamp: new Date().toISOString(),
  };
}
