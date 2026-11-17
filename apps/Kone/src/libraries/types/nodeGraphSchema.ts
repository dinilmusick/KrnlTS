// ══════════════════════════════════════════════════════════════════════════════
// DEPM APP NODE GRAPH JSON SCHEMA SPECIFICATION (§10-§30 TOPOLOGY PERSISTENCE)
// ══════════════════════════════════════════════════════════════════════════════
import { GraphNode, GraphEdge, DeploymentEntity } from './depm';
import { UserStorageProvider } from './storage';

/**
 * Universal Depm Node Graph Document Schema (v1.0.0 JSON)
 * Standardized format describing an application's topology, nodes, deployments,
 * routing wires, and weight modifier routing.
 */
export interface DepmNodeGraphDocument {
  $schema: 'https://skipo.dev/schemas/depm-node-graph.v1.json';
  version: '1.0.0';
  appId: string;
  appName: string;
  appIcon: string;
  description?: string;
  publicLink: string;
  createdAt: string;
  updatedAt: string;
  exportedAt: string;

  author?: {
    userId?: string;
    username?: string;
    email?: string;
    name?: string;
    role?: string;
  };

  viewport?: {
    zoom: number;
    pan: { x: number; y: number };
  };

  // 1. Graph Topology: Nodes and Connections
  graph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };

  // 2. Bound Deployment Entities
  deployments: DeploymentEntity[];

  // 3. User Storage Metadata & Provenance
  storageMetadata?: {
    provider: UserStorageProvider;
    targetName: string;
    targetPath: string;
    storageConnectionId?: string;
    checksum?: string;
    syncedAt?: string;
  };
}

export interface NodeGraphValidationResult {
  valid: boolean;
  errors: string[];
  document?: DepmNodeGraphDocument;
}
