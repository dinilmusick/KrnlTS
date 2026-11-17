/**
 * @file publicRoutesStore.ts
 * @description In-memory store and interface for DEPM public routes.
 * Pure Web-standard, zero Node/Express dependencies (< 100 lines).
 */

export interface PublicRouteRecord {
  id: string;
  path: string;
  name?: string;
  status: 'PUBLISHED' | 'DRAFT' | 'PAUSED';
  public: boolean;
  endpoint: string;
  deployments: Array<{
    id: string;
    name: string;
    url: string;
    provider?: string;
    weight: number;
    healthy: boolean;
    priority?: number;
    region?: string;
  }>;
  load_balancing_config: {
    strategy: 'MAX_WEIGHT' | 'WEIGHTED' | 'ROUND_ROBIN' | 'RANDOM' | 'FAILOVER_PRIORITY';
    healthCheckRequired?: boolean;
    autoRedirectDelayMs?: number;
    preserveQueryParams?: boolean;
    preservePathSuffix?: boolean;
    fallbackUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
  stats?: { requests: number; lastRoutedAt?: string };
}

export let serverPublicRoutes: PublicRouteRecord[] = [
  {
    id: 'route_flay',
    name: 'Flay Realtime API Gateway',
    path: 'flay',
    status: 'PUBLISHED',
    public: true,
    endpoint: '/flay',
    deployments: [
      {
        id: 'dep_flay_edge_sfo',
        name: 'flay-worker-sfo (US West Edge)',
        url: 'https://flay-worker.workers.dev',
        provider: 'CLOUDFLARE',
        weight: 0.88,
        healthy: true,
        priority: 1,
        region: 'sfo',
      },
      {
        id: 'dep_flay_edge_cdg',
        name: 'flay-worker-cdg (EU Paris Edge)',
        url: 'https://flay-eu.workers.dev',
        provider: 'CLOUDFLARE',
        weight: 0.92,
        healthy: true,
        priority: 2,
        region: 'cdg',
      },
    ],
    load_balancing_config: {
      strategy: 'WEIGHTED',
      autoRedirectDelayMs: 2000,
      preserveQueryParams: true,
      preservePathSuffix: true,
      healthCheckRequired: true,
    },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    stats: { requests: 89 },
  },
];

export function setServerPublicRoutes(routes: PublicRouteRecord[]) {
  serverPublicRoutes = routes;
}
