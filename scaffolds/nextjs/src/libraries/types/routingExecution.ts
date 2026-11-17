// ══════════════════════════════════════════════════════════════════════════════
// ROUTING EXECUTION & RUN LOGS CANONICAL TYPES
// Inspired by n8n Execution Run Logs and Realtime Graph Flow Telemetry
// ══════════════════════════════════════════════════════════════════════════════

import { ProviderType } from './depm/base';

export type ExecutionStatus = 'SUCCESS' | 'WARNING' | 'ERROR';

export interface ExecutionCandidateDeployment {
  nodeId: string;
  deploymentId: string;
  name: string;
  weight: number;
  healthy: boolean;
  isSelected: boolean;
  url: string;
  region?: string;
  provider?: ProviderType | string;
}

export interface ExecutionTraceHop {
  step: number;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  action: string;
  timestamp: string;
  durationMs: number;
  outputSummary?: string;
}

export interface RoutingExecutionRecord {
  id: string;
  appId: string;
  appName?: string;
  timestamp: string; // ISO 8601
  status: ExecutionStatus;
  clientIp: string;
  clientCountry?: string;
  clientCity?: string;
  userAgent?: string;
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  ingressUrl: string;
  requestedPath: string;
  queryParams?: Record<string, string>;
  sourceNodeId: string; // Ingress URL Node
  sourceNodeName?: string;
  targetNodeId: string; // Evaluated Entity Node (App, Component, Variant)
  targetNodeName?: string;
  selectedDeploymentNodeId: string;
  selectedDeploymentId: string;
  selectedDeploymentName: string;
  selectedDeploymentUrl: string;
  provider: ProviderType | string;
  strategy: 'MAX_WEIGHT' | 'WEIGHTED' | 'ROUND_ROBIN' | 'RANDOM' | 'FAILOVER_PRIORITY';
  latencyMs: number;
  httpStatus: number;
  pathNodeIds: string[]; // Ordered list of visited node IDs
  activeEdgeIds: string[]; // Ordered list of visited edge IDs
  candidateDeployments?: ExecutionCandidateDeployment[];
  hops?: ExecutionTraceHop[];
  details?: {
    requestHeaders?: Record<string, string>;
    loadBalancerDecisionReason?: string;
    targetHealth?: string;
    spendImpact?: number;
  };
}

export interface ExecutionFilterOptions {
  status?: 'ALL' | ExecutionStatus;
  searchQuery?: string;
  dateRange?: 'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK';
  clientIp?: string;
}
