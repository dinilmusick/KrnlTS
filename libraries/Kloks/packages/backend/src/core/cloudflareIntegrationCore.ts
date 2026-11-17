/**
 * @file cloudflareIntegrationCore.ts
 * @description Cloudflare Integration Service for DEPM Engine.
 * Fetches Workers and Pages projects referencing Srkl-Engine surveillance (< 200 lines).
 */

import { CloudflareResourceFetcher } from '../resourceEngine/CloudflareResourceFetcher';
import { getSrklAccounts } from './srklCore';


const cfFetcher = new CloudflareResourceFetcher();

function buildHeaders(token?: string, authKey?: string, authEmail?: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'User-Agent': 'DEPM-Engine/1.0' };
  if (token) headers['Authorization'] = `Bearer ${token.trim()}`;
  else if (authKey && authEmail) {
    headers['X-Auth-Key'] = authKey.trim();
    headers['X-Auth-Email'] = authEmail.trim();
  }
  return headers;
}

export async function fetchCloudflareData(
  payload: Record<string, any>,
  rawUserId?: string,
  env?: Record<string, unknown>
): Promise<{
  success: boolean;
  provider?: string;
  tier?: string;
  isFree?: boolean;
  projectsCount?: number;
  accountName?: string;
  accountId?: string;
  projects?: any[];
  projectObservability?: any[];
  workers?: any[];
  pages?: any[];
  usageMetrics?: any;
  unifiedMetrics?: any;
  error?: string;
}> {
  const userId = rawUserId || payload?.userId || '';
  const creds = payload?.credentials || {};
  let token = (payload?.token || payload?.apiToken || payload?.accessToken || creds.token || creds.apiToken || creds.accessToken || '').trim();
  const isCfHex = (v?: string) => Boolean(v && /^[a-f0-9]{32}$/i.test(v.trim()));
  let accountTag = [
    payload?.accountTag, payload?.cfAccountId, creds.accountId, creds.cfAccountId, creds.accountTag, payload?.accountId
  ].map((v) => (v || '').trim()).find((v) => isCfHex(v)) || '';
  let authKey = (payload?.authKey || payload?.globalApiKey || creds.authKey || creds.globalApiKey || '').trim();
  let authEmail = (payload?.authEmail || payload?.email || creds.authEmail || creds.email || '').trim();
  let accountName = payload?.accountName || creds.accountName || '';

  if (!token && !authKey && (payload?.accountId || payload?.id) && userId) {
    try {
      const srkl = await getSrklAccounts(userId, 'cloudflare', env);
      const matched = srkl.accounts?.find((a: any) => a.id === (payload.accountId || payload.id));
      const mCreds = matched?.credentials || matched?.metadata?.credentials || {};
      token = (mCreds.token || mCreds.apiToken || mCreds.accessToken || token).trim();
      if (!accountTag) {
        accountTag = [mCreds.accountId, mCreds.cfAccountId, mCreds.accountTag].map((v) => (v || '').trim()).find((v) => isCfHex(v)) || '';
      }
      authKey = (mCreds.authKey || mCreds.globalApiKey || authKey).trim();
      authEmail = (mCreds.authEmail || mCreds.email || authEmail).trim();
      if (!accountName && (matched?.name || mCreds.accountName)) accountName = matched?.name || mCreds.accountName;
    } catch (err: any) {
      console.warn('[CloudflareIntegration] SRKL account lookup fallback:', err.message);
    }
  }

  if (!token && !authKey) {
    return { success: false, error: 'Cloudflare API Token or Global API Key required.', projects: [], projectObservability: [] };
  }

  const headers = buildHeaders(token, authKey, authEmail);

  try {
    if (!accountTag) {
      const userRes = await fetch('https://api.cloudflare.com/client/v4/accounts?page=1&per_page=10', { headers, signal: AbortSignal.timeout(6000) });
      if (userRes.ok) {
        const uData: any = await userRes.json();
        const first = uData?.result?.[0];
        if (first?.id) {
          accountTag = first.id;
          if (first.name && (!accountName || accountName.toLowerCase() === 'cloudflare')) accountName = first.name;
        }
      }
    } else if (!accountName || accountName.toLowerCase() === 'cloudflare') {
      try {
        const aRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountTag)}`, { headers, signal: AbortSignal.timeout(4000) });
        if (aRes.ok) {
          const aData: any = await aRes.json();
          if (aData?.result?.name) accountName = aData.result.name;
        }
      } catch {}
    }

    if (!accountTag) {
      return { success: false, error: 'Missing Cloudflare Account ID. Please configure your Account ID or check API token permissions.', projects: [], projectObservability: [] };
    }

    let workerSubdomain = '';
    try {
      const subRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountTag)}/workers/subdomain`, { headers, signal: AbortSignal.timeout(6000) });
      const subData = await subRes.json().catch(() => ({}));
      if (subData.result?.subdomain) workerSubdomain = subData.result.subdomain;
    } catch {}

    const [workersRes, pagesRes] = await Promise.allSettled([
      fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountTag)}/workers/scripts`, { headers, signal: AbortSignal.timeout(8000) }).then((r) => r.json()),
      fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountTag)}/pages/projects`, { headers, signal: AbortSignal.timeout(8000) }).then((r) => r.json()),
    ]);

    const rawWorkers = workersRes.status === 'fulfilled' && Array.isArray(workersRes.value?.result) ? workersRes.value.result : [];
    const rawPages = pagesRes.status === 'fulfilled' && Array.isArray(pagesRes.value?.result) ? pagesRes.value.result : [];

    const workersList = rawWorkers.map((w: any) => {
      const wName = w.id || w.name;
      const host = workerSubdomain ? `${wName}.${workerSubdomain}.workers.dev` : `${wName}.workers.dev`;
      const url = `https://${host}`;
      const routes = Array.isArray(w.routes) ? w.routes : (w.routes ? [String(w.routes)] : []);
      return {
        id: w.id || w.name, name: w.name || w.id, type: 'WORKER', status: 'ACTIVE',
        framework: 'Cloudflare Worker', domain: host, domains: routes.length > 0 ? routes : [host],
        url, edgeRequestsFormatted: '0', fastDataTransferFormatted: '0 MB',
        updatedAt: w.modified_on || w.created_on || new Date().toISOString(),
      };
    });

    const pagesList = rawPages.map((p: any) => {
      const pDomain = p.subdomain ? `${p.subdomain}.pages.dev` : `${p.name}.pages.dev`;
      const rawUrl = p.canonical_deployment?.url || `https://${pDomain}`;
      const url = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
      const domains = Array.isArray(p.domains) && p.domains.length > 0 ? p.domains : [pDomain];
      return {
        id: p.name || p.id, name: p.name, type: 'PAGES_PROJECT', providerProjectId: p.id,
        providerDeploymentId: p.latest_deployment?.id,
        status: p.latest_deployment?.status || 'READY', framework: 'Cloudflare Pages',
        domain: pDomain, domains, url, edgeRequestsFormatted: '0', fastDataTransferFormatted: '0 MB',
        updatedAt: p.latest_deployment?.created_on || p.created_on || new Date().toISOString(),
      };
    });

    const allProjects = [...workersList, ...pagesList];
    const projectObservability = allProjects.map((p) => ({
      projectId: p.id, projectName: p.name, status: p.status, framework: p.framework,
      domain: p.domain, domains: p.domains, deploymentUrl: p.url, latestDeploymentUrl: p.url,
      edgeRequestsFormatted: p.edgeRequestsFormatted, fastDataTransferFormatted: p.fastDataTransferFormatted,
      type: p.type, updatedAt: p.updatedAt,
    }));

    let rawUsage: any = null;
    let unifiedMetrics: any = null;
    try {
      rawUsage = await (cfFetcher as any).fetchRawUsage({ apiToken: token, accountId: accountTag, authKey, authEmail });
      unifiedMetrics = cfFetcher.transformMetrics(rawUsage, payload.tier || 'free');
    } catch {}

    return {
      success: true, provider: 'CLOUDFLARE', tier: unifiedMetrics?.tier || 'free',
      isFree: unifiedMetrics?.isFreeTier ?? true,
      accountName: accountName || undefined,
      accountId: accountTag,
      projectsCount: allProjects.length,
      projects: allProjects, projectObservability, workers: workersList, pages: pagesList,
      usageMetrics: unifiedMetrics, unifiedMetrics,
    };
  } catch {
    // Provider credentials are scoped to Cloudflare and must never be forwarded
    // to SRKL (or any other service) as a fallback. Return a redacted provider
    // failure instead of crossing service credential boundaries.
    return {
      success: false,
      error: 'Cloudflare API request failed. Check token permissions and account configuration.',
      projects: [],
      projectObservability: [],
    };
  }
}
