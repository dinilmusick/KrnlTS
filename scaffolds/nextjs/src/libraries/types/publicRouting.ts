// ══════════════════════════════════════════════════════════════════════════════
// ULTRST ROUTER :: PUBLIC ENDPOINT ARCHITECTURE TYPES
// In accordance with ULTRST_ROUTER::PUBLIC_ENDPOINT_ARCHITECTURE specification
// ══════════════════════════════════════════════════════════════════════════════

export type PublicRouteStatus = 'PUBLISHED' | 'DRAFT' | 'PAUSED';

export type LoadBalancingStrategy =
  | 'MAX_WEIGHT'
  | 'WEIGHTED'
  | 'ROUND_ROBIN'
  | 'RANDOM'
  | 'FAILOVER_PRIORITY';

export interface RouteDeploymentTarget {
  id: string;
  name: string;
  url: string;
  provider?: string;
  weight: number;
  healthy: boolean;
  priority?: number;
  region?: string;
  nodeId?: string;
  deploymentId?: string;
}

export interface RouteLoadBalancingConfig {
  strategy: LoadBalancingStrategy;
  healthCheckRequired?: boolean;
  autoRedirectDelayMs?: number;
  preserveQueryParams?: boolean;
  preservePathSuffix?: boolean;
  fallbackUrl?: string;
}

export interface PublicRoute {
  id: string;
  name?: string;
  path: string;
  status: PublicRouteStatus;
  public: boolean;
  endpoint: string;
  deployments: RouteDeploymentTarget[];
  load_balancing_config: RouteLoadBalancingConfig;
  appId?: string;
  nodeId?: string;
  createdAt: string;
  updatedAt: string;
  stats?: {
    requests: number;
    lastRoutedAt?: string;
    lastSelectedDeploymentId?: string;
  };
}

export interface RouteEvaluationTraceItem {
  deploymentId: string;
  name: string;
  url: string;
  weight: number;
  healthy: boolean;
  probabilityPercent?: number;
  isWinner: boolean;
  reason: string;
}

export interface ClientRouteDecision {
  routeId: string;
  routePath: string;
  selectedDeployment: RouteDeploymentTarget;
  destinationUrl: string;
  strategy: LoadBalancingStrategy;
  clientTrace: RouteEvaluationTraceItem[];
  computedAt: string;
  executionDurationMs: number;
}
