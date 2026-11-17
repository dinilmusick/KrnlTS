// ══════════════════════════════════════════════════════════════════════════════
// URL AND DEPLOYMENT ROUTING CANONICAL TYPES (CANONICAL SPEC §1-§11)
// ══════════════════════════════════════════════════════════════════════════════
import { GraphNodeType } from './depm';

/**
 * Handle contract types according to Canonical Spec §2 & §5
 */
export interface UrlHandleContract {
  datatype: 'URL';
  cardinality: 'single-output';
  purpose: 'assign externally accessible URL to owning entity';
}

export interface DeploymentHandleContract {
  datatype: 'DEPLOYMENT';
  cardinality: 'multi-connect';
  inputType: 'DEPLOYMENT_NODE';
  purpose: 'connect 1..N deployment clones/replicas';
}

/**
 * App Topology classification: Standalone (no components) vs Componentized
 */
export type AppTopologyType = 'STANDALONE' | 'COMPONENTIZED';

/**
 * Two core routing architectures defined in Canonical Spec §8
 */
export type RoutingArchitecture =
  | 'DEPLOYMENT_MANAGEMENT_BASED'
  | 'APP_BASED';

/**
 * Diagnostic violation codes for invalid topologies (Canonical Spec §10-§11)
 */
export type TopologyViolationCode =
  | 'COMPONENTIZED_APP_REJECTS_APP_URL'
  | 'COMPONENTIZED_APP_REJECTS_APP_DEPLOYMENT'
  | 'STANDALONE_APP_HAS_COMPONENTS'
  | 'INVALID_URL_NODE_TARGET'
  | 'DEPLOYMENT_CONNECTED_TO_RAW_URL'
  | 'EXCESSIVE_URL_NODES_ON_ENTITY'
  | 'EMPTY_DEPLOYMENT_HANDLE';

export interface TopologyViolation {
  code: TopologyViolationCode;
  message: string;
  sourceNodeId?: string;
  targetNodeId?: string;
  severity: 'ERROR' | 'WARNING';
}

export interface TopologyValidationResult {
  valid: boolean;
  topologyType: AppTopologyType;
  violations: TopologyViolation[];
}

/**
 * Resolved routing endpoint representing active traffic ingress
 */
export interface ResolvedRoutingEndpoint {
  id: string;
  url: string;
  entityId: string;
  entityType: 'APP' | 'APP_COMPONENT' | 'VARIANTS';
  entityName: string;
  deploymentCloneIds: string[];
  deploymentCloneCount: number;
  hasLoadBalancer: boolean;
  loadBalancerLabel?: string;
  architecture: RoutingArchitecture;
  internalDownstreamEndpoints?: ResolvedRoutingEndpoint[];
}

/**
 * Complete app routing table generated from graph semantics
 */
export interface AppRoutingTable {
  appId: string;
  topologyType: AppTopologyType;
  endpoints: ResolvedRoutingEndpoint[];
  validation: TopologyValidationResult;
}
