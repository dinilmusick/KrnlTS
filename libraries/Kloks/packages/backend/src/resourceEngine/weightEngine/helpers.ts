import { GraphNode, GraphEdge, DeploymentEntity, AccountEntity } from '../types/depm/index';
import { ResourceFetcherRegistry } from '../ResourceFetcherRegistry';

/**
 * Calculates the score (0.0 - 1.0) for a WEIGHT_RESOURCE node based on real-time account usage metrics.
 * Dynamically resolves provider-specific fetchers (Vercel, Cloudflare, etc.) using OOP inheritance.
 * - Active CPU receives the most weight (50% / 0.50) across all services.
 * - Function Invocations: 15% (0.15).
 * - Compute Memory / Subrequests: 15% (0.15).
 * - Edge Requests: 10% (0.10).
 * - Fast Data Transfer / Bandwidth: 5% (0.05).
 * - Other compute / network metrics: 5% (0.05).
 * - Storage category parameters (Functions Storage, Deployment Storage, R2) are strictly EXCLUDED (0%).
 */
export function computeUsageWeightScore(
  account?: AccountEntity,
  deployment?: DeploymentEntity
): number {
  return ResourceFetcherRegistry.computeScore(account, deployment);
}

/**
 * Traverses from a weight modifier node to find its connected deployment node.
 */
export function getConnectedDeploymentNode(
  weightNodeId: string,
  nodes: GraphNode[],
  edges: GraphEdge[]
): GraphNode | undefined {
  const visited = new Set<string>();
  const queue: string[] = [weightNodeId];
  visited.add(weightNodeId);

  while (queue.length > 0) {
    const currId = queue.shift()!;
    const connectedEdges = edges.filter((e) => e.sourceId === currId || e.targetId === currId);
    for (const edge of connectedEdges) {
      const neighborId = edge.sourceId === currId ? edge.targetId : edge.sourceId;
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        const neighborNode = nodes.find((n) => n.id === neighborId);
        if (neighborNode) {
          if (neighborNode.type === 'DEPLOYMENT') {
            return neighborNode;
          }
          if (neighborNode.type.startsWith('WEIGHT_')) {
            queue.push(neighborId);
          }
        }
      }
    }
  }

  return undefined;
}
