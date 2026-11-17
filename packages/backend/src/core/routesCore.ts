/**
 * @file routesCore.ts
 * @description Universal Gateway & Routing Service for DEPM.
 * Governs public routes resolution, dynamic database hydration, and load-balancing ingress.
 * Runs identically in Node.js, Vercel Serverless, and Cloudflare Workers (< 200 lines).
 */

import { PublicRouteRecord, serverPublicRoutes, setServerPublicRoutes } from './publicRoutesStore';
import { resolveDynamicRouteFromDb } from './dynamicRouteResolver';

let runtimeRoutes: PublicRouteRecord[] = [...serverPublicRoutes];
const executionStore = new Map<string, any[]>();

export function getPublicRoutes() {
  return { success: true, count: runtimeRoutes.length, routes: runtimeRoutes };
}

export async function getPublicRouteByPath(rawPath: string, env?: Record<string, unknown>) {
  const clean = rawPath.replace(/^\/+/, '').trim().toLowerCase();
  const cleanNoExt = clean.replace(/\.ultrst$/, '');
  let route = runtimeRoutes.find((r) => {
    const p = r.path.toLowerCase().replace(/^\/+|\/+$/g, '');
    const pNoExt = p.replace(/\.ultrst$/, '');
    return p === clean || pNoExt === cleanNoExt || p === cleanNoExt || pNoExt === clean;
  });

  if (!route) {
    const fromDb = await resolveDynamicRouteFromDb(rawPath, env);
    if (fromDb) {
      upsertRoute(fromDb);
      route = fromDb;
    }
  }

  if (!route) return { success: false, error: `Public route "${rawPath}" not found.`, status: 404 };
  return { success: true, route, status: 200 };
}

export function getAllRoutes() {
  return { success: true, count: runtimeRoutes.length, routes: runtimeRoutes };
}

export function deleteRoute(id: string) {
  runtimeRoutes = runtimeRoutes.filter((r) => r.id !== id && r.path !== id);
  setServerPublicRoutes(runtimeRoutes);
  return { success: true, count: runtimeRoutes.length };
}

export function upsertRoute(rawRouteData: any) {
  const routeData = rawRouteData?.route || rawRouteData;
  if (!routeData || !routeData.path) return { success: false, error: 'Route path is required.', status: 400 };

  const id = routeData.id || `route_${Date.now()}`;
  const idx = runtimeRoutes.findIndex((r) => r.id === id || r.path === routeData.path);
  const updated: PublicRouteRecord = {
    ...routeData,
    id,
    path: routeData.path.replace(/^\/+/, ''),
    endpoint: `/${routeData.path.replace(/^\/+/, '')}`,
    status: routeData.status || 'PUBLISHED',
    public: routeData.public !== undefined ? Boolean(routeData.public) : true,
    deployments: Array.isArray(routeData.deployments) ? routeData.deployments : [],
    load_balancing_config: routeData.load_balancing_config || { strategy: 'MAX_WEIGHT' },
    createdAt: routeData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: routeData.stats || { requests: 0 },
  };

  if (idx >= 0) runtimeRoutes[idx] = updated;
  else runtimeRoutes.push(updated);

  setServerPublicRoutes(runtimeRoutes);
  return { success: true, route: updated, status: 200 };
}

export function getGatewayConfig(env?: Record<string, unknown>) {
  const rawDomain = (env?.DEPM_GATEWAY_DOMAIN as string) || (typeof process !== 'undefined' ? process.env?.DEPM_GATEWAY_DOMAIN : '') || '';
  const domain = rawDomain.trim();
  return {
    success: true,
    domain,
    gatewayDomain: domain,
    isConfigured: Boolean(domain),
    mode: 'EDGE_WORKER_PROXY',
    registeredRoutesCount: runtimeRoutes.length,
    activeRoutes: runtimeRoutes.map((r) => ({ id: r.id, path: r.path, deploymentsCount: r.deployments.length })),
  };
}

export function getExecutions(appId: string) {
  const list = executionStore.get(appId) || [];
  return { success: true, appId, count: list.length, executions: list };
}

export function recordExecution(appId: string, data: any) {
  const current = executionStore.get(appId) || [];
  const rec = { id: `exec_${Date.now()}`, appId, timestamp: new Date().toISOString(), durationMs: data.durationMs || 10, status: data.status || 'SUCCESS', details: data };
  current.unshift(rec);
  if (current.length > 50) current.pop();
  executionStore.set(appId, current);
  return { success: true, execution: rec };
}

export function matchGatewayIngress(urlPath: string, search?: string): { destinationUrl: string } | null {
  const [pathnameOnly, internalQuery] = urlPath.split('?');
  const clean = pathnameOnly.replace(/^\/+/, '').trim().toLowerCase();
  if (!clean || clean.startsWith('api/') || clean === 'api') return null;
  const cleanNoExt = clean.replace(/\.ultrst$/, '');
  const finalSearch = search || (internalQuery ? `?${internalQuery}` : undefined);

  const match = runtimeRoutes.find((r) => {
    const p = r.path.toLowerCase().replace(/^\/+|\/+$/g, '');
    const pNoExt = p.replace(/\.ultrst$/, '');
    return p === clean || pNoExt === cleanNoExt || p === cleanNoExt || pNoExt === clean;
  });
  if (!match || !match.deployments || match.deployments.length === 0) return null;

  const healthy = match.deployments.filter((d) => d.healthy !== false);
  const candidates = healthy.length > 0 ? healthy : match.deployments;
  if (candidates.length === 0) return null;

  const config = match.load_balancing_config || { strategy: 'MAX_WEIGHT' };
  const strategy = config.strategy || 'MAX_WEIGHT';

  let selected = candidates[0];
  if (strategy === 'MAX_WEIGHT') {
    let maxWeight = -Infinity;
    for (const cand of candidates) {
      const w = typeof cand.weight === 'number' ? cand.weight : 1.0;
      if (w > maxWeight) { maxWeight = w; selected = cand; }
    }
  } else if (strategy === 'WEIGHTED') {
    const totalWeight = candidates.reduce((sum, c) => sum + Math.max(0.01, typeof c.weight === 'number' ? c.weight : 1), 0);
    let rand = Math.random() * totalWeight;
    for (const cand of candidates) {
      rand -= Math.max(0.01, typeof cand.weight === 'number' ? cand.weight : 1);
      if (rand <= 0) { selected = cand; break; }
    }
  } else if (strategy === 'FAILOVER_PRIORITY') {
    const sorted = [...candidates].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
    selected = sorted[0] || candidates[0];
  } else if (strategy === 'ROUND_ROBIN') {
    selected = candidates[(match.stats?.requests || 0) % candidates.length];
  } else {
    selected = candidates[Math.floor(Math.random() * candidates.length)];
  }

  if (!selected || !selected.url) return null;
  let dest = selected.url;
  if (!/^https?:\/\//i.test(dest)) dest = `https://${dest}`;

  if (config.preserveQueryParams && finalSearch) {
    const cleanSearch = finalSearch.startsWith('?') ? finalSearch.slice(1) : finalSearch;
    if (cleanSearch) {
      const sep = dest.includes('?') ? '&' : '?';
      dest = `${dest}${sep}${cleanSearch}`;
    }
  }
  return { destinationUrl: dest };
}

export async function matchGatewayIngressAsync(
  urlPath: string,
  search?: string,
  env?: Record<string, unknown>
): Promise<{ destinationUrl: string } | null> {
  const syncMatch = matchGatewayIngress(urlPath, search);
  if (syncMatch) return syncMatch;

  const resolved = await resolveDynamicRouteFromDb(urlPath, env);
  if (resolved) {
    upsertRoute(resolved);
    return matchGatewayIngress(urlPath, search);
  }
  return null;
}
