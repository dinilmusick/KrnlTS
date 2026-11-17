/**
 * @file dynamicRouteResolver.ts
 * @description Resolves public ingress routes and calculates dynamic deployment weights
 * directly from live database user profiles and account resources.
 * Works across Node.js, Vercel Serverless, and Cloudflare Workers (< 160 lines).
 */

import { queryUnifiedDb } from './unifiedDb';
import { PublicRouteRecord } from './publicRoutesStore';
import { computeDeploymentFinalWeight } from '../resourceEngine/weightEngine';

export async function resolveDynamicRouteFromDb(
  rawPath: string,
  env?: Record<string, unknown>
): Promise<PublicRouteRecord | null> {
  const [pathnameOnly] = rawPath.split('?');
  const clean = pathnameOnly.replace(/^\/+/, '').trim().toLowerCase();
  if (!clean || clean.startsWith('api/') || clean === 'api') return null;
  const cleanNoExt = clean.replace(/\.ultrst$/, '');

  try {
    const res = await queryUnifiedDb('SELECT id, email, app_profiles FROM "ultrst-users"', [], env);
    for (const user of res.rows) {
      const profiles = typeof user.app_profiles === 'string' ? JSON.parse(user.app_profiles) : user.app_profiles || {};
      const depmData = profiles.depm?.workspace_data || {};

      for (const [, data] of Object.entries(depmData)) {
        const cand = data as any;
        if (!cand || (!cand.nodes && !cand.graphNodes)) continue;

        const nodes = cand.graphNodes || cand.nodes || [];
        const edges = cand.graphEdges || cand.edges || [];
        const candDeployments = cand.deployments || [];
        const candAccounts = cand.accounts || [];

        const matchingNode = nodes.find((n: any) => {
          const names = [n.name, n.urlValue, n.publicLink, n.domainUrl, n.componentName]
            .filter(Boolean)
            .map((s: string) => String(s).toLowerCase().replace(/^\/+|\/+$/g, ''));
          return names.some((s: string) => {
            const sNoExt = s.replace(/\.ultrst$/, '');
            return s === clean || sNoExt === cleanNoExt || s === cleanNoExt || sNoExt === clean;
          });
        });

        if (!matchingNode) continue;

        const depNodes: any[] = [];
        if (matchingNode.type === 'DEPLOYMENT') {
          depNodes.push(matchingNode);
        } else {
          const visited = new Set<string>([matchingNode.id]);
          const queue = [matchingNode.id];
          while (queue.length > 0) {
            const currId = queue.shift()!;
            const connEdges = edges.filter((e: any) => e.sourceId === currId || e.targetId === currId);
            for (const edge of connEdges) {
              const neighborId = edge.sourceId === currId ? edge.targetId : edge.sourceId;
              if (!visited.has(neighborId)) {
                visited.add(neighborId);
                const neighbor = nodes.find((n: any) => n.id === neighborId);
                if (neighbor) {
                  if (neighbor.type === 'DEPLOYMENT') {
                    depNodes.push(neighbor);
                  } else if (
                    neighbor.type.startsWith('WEIGHT_') ||
                    neighbor.type === 'APP' ||
                    neighbor.type === 'APP_NODE' ||
                    neighbor.type === 'APP_COMPONENT' ||
                    neighbor.type === 'VARIANTS' ||
                    neighbor.type === 'ROUTER' ||
                    neighbor.type === 'URL_NODE'
                  ) {
                    queue.push(neighborId);
                  }
                }
              }
            }
          }
        }

        if (depNodes.length === 0) continue;

        const targets = depNodes.map((dn: any, idx: number) => {
          const depEnt = candDeployments.find((d: any) => d.id === dn.deploymentId || d.id === dn.id);
          const url = dn.deploymentUrl || dn.domainUrl || dn.urlValue || depEnt?.deploymentUrl || depEnt?.publicOrigin;
          const calculatedWeight = computeDeploymentFinalWeight(
            dn.id,
            nodes,
            edges,
            candAccounts,
            candDeployments
          );

          return {
            id: `tgt_${dn.id || idx}`,
            name: dn.name || depEnt?.name || 'Deployment',
            url,
            provider: dn.deploymentProvider || depEnt?.provider || 'VERCEL',
            weight: calculatedWeight,
            healthy: depEnt?.health !== 'UNHEALTHY',
            priority: idx + 1,
          };
        });

        const validTargets = targets.filter((t) => {
          if (!t.url) return false;
          try {
            const u = new URL(t.url);
            const gwDomain = (env?.DEPM_GATEWAY_DOMAIN as string) || '';
            if (gwDomain && u.hostname === new URL(gwDomain).hostname) return false;
            if (u.hostname.startsWith('depm-engine.')) return false;
          } catch {}
          return true;
        });

        if (validTargets.length === 0) continue;

        return {
          id: `route_${cleanNoExt}`,
          name: `${matchingNode.name || cleanNoExt} Ingress Route`,
          path: clean,
          status: 'PUBLISHED',
          public: true,
          endpoint: `/${clean}`,
          deployments: validTargets,
          load_balancing_config: {
            strategy: 'MAX_WEIGHT',
            healthCheckRequired: true,
            autoRedirectDelayMs: 0,
            preserveQueryParams: true,
            preservePathSuffix: true,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          stats: { requests: 0 },
        };
      }
    }
  } catch (err) {
    console.warn('[DynamicRouteResolver] Failed to resolve route from database:', err);
  }

  return null;
}
