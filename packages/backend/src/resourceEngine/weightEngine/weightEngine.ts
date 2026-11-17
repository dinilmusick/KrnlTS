import { GraphNode, GraphEdge, DeploymentEntity, AccountEntity } from '../types/depm/index';
import { computeUsageWeightScore, getConnectedDeploymentNode } from './helpers';

/**
 * Calculates the score (0.0 - 1.0) for a weight modifier or source node.
 * WEIGHT_MULTIPLY itself is not a source score — its inputs are collected by traversal.
 */
export function getWeightModifierScore(
  node: GraphNode,
  account?: AccountEntity,
  accounts: AccountEntity[] = [],
  nodes: GraphNode[] = [],
  edges: GraphEdge[] = [],
  deployments: DeploymentEntity[] = []
): number {
  const modType = node.weightModifierType || 'USER_DEFINED';

  const connectedDepNode = (nodes.length > 0 && edges.length > 0)
    ? getConnectedDeploymentNode(node.id, nodes, edges)
    : undefined;

  const connectedDepEntity = connectedDepNode
    ? deployments.find((d) => d.id === connectedDepNode.deploymentId)
    : undefined;

  const depAccountId = connectedDepEntity?.accountId || connectedDepNode?.accountId || node.accountId;
  let targetAccount = depAccountId ? accounts.find((a) => a.id === depAccountId) : undefined;
  if (!targetAccount) {
    if (account) {
      targetAccount = account;
    } else if (connectedDepNode) {
      const prov = connectedDepEntity?.provider || (connectedDepNode as any)?.deploymentProvider || 'VERCEL';
      targetAccount = accounts.find((a) => a.provider === prov) || accounts.find((a) => a.provider === 'VERCEL');
    }
  }

  // WEIGHT_RESOURCE (or legacy USAGE): score from live resource/usage metrics
  if (node.type === 'WEIGHT_RESOURCE' || (node.type as string) === 'WEIGHT_MODIFIER_USAGE' || modType === 'USAGE') {
    return computeUsageWeightScore(targetAccount, connectedDepEntity);
  }
  // WEIGHT_ACCOUNT (or legacy ACCOUNT): read account weightPreference
  if (node.type === 'WEIGHT_ACCOUNT' || (node.type as string) === 'WEIGHT_MODIFIER_ACCOUNT' || modType === 'ACCOUNT') {
    if (targetAccount && typeof targetAccount.weightPreference === 'number') {
      return Math.max(0, Math.min(1, targetAccount.weightPreference));
    }
    return 1.0;
  }
  // WEIGHT_MULTIPLY is a combinator — its score is computed by the traversal, not here
  if (node.type === 'WEIGHT_MULTIPLY') {
    return 1.0;
  }
  // WEIGHT_USER (or legacy USER_DEFINED)
  return Math.max(0, Math.min(1, node.weightValue ?? 1.0));
}

/**
 * Traverses graph to find all terminal weight modifier source nodes reachable from
 * a deployment node, including traversing through WEIGHT_MULTIPLY aggregator nodes.
 */
export function getConnectedWeightModifiers(
  deploymentNodeId: string,
  nodes: GraphNode[],
  edges: GraphEdge[]
): GraphNode[] {
  const result: GraphNode[] = [];
  const visited = new Set<string>();
  const queue: string[] = [deploymentNodeId];
  visited.add(deploymentNodeId);

  const isWeightNode = (type: string) =>
    type === 'WEIGHT_USER' ||
    type === 'WEIGHT_RESOURCE' ||
    type === 'WEIGHT_ACCOUNT' ||
    type === 'WEIGHT_MULTIPLY' ||
    type.startsWith('WEIGHT_');

  while (queue.length > 0) {
    const currId = queue.shift()!;
    const connectedEdges = edges.filter((e) => e.sourceId === currId || e.targetId === currId);
    for (const edge of connectedEdges) {
      const neighborId = edge.sourceId === currId ? edge.targetId : edge.sourceId;
      if (!visited.has(neighborId)) {
        const neighborNode = nodes.find((n) => n.id === neighborId);
        if (neighborNode && isWeightNode(neighborNode.type)) {
          visited.add(neighborId);
          if (neighborNode.type === 'WEIGHT_MULTIPLY') {
            // Traverse into the multiplier to collect its source inputs
            queue.push(neighborId);
          } else {
            // Terminal source node — collect it
            result.push(neighborNode);
            // Also traverse further (e.g. chained source → multiply → source)
            queue.push(neighborId);
          }
        }
      }
    }
  }

  return result;
}

/**
 * Computes the final combined weight for a deployment node by multiplying all connected
 * weight modifier/source node scores together (traversing through WEIGHT_MULTIPLY nodes).
 */
export function computeDeploymentFinalWeight(
  deploymentNodeId: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
  accounts: AccountEntity[],
  deployments: DeploymentEntity[]
): number {
  const modifierNodes = getConnectedWeightModifiers(deploymentNodeId, nodes, edges);

  if (modifierNodes.length === 0) {
    const depNode = nodes.find((n) => n.id === deploymentNodeId);
    const depEntity = deployments.find((d) => d.id === depNode?.deploymentId || d.id === deploymentNodeId);
    const directWeight = depNode?.weightValue ?? (depNode as any)?.weight ?? (depEntity as any)?.weight ?? (depEntity as any)?.weightPreference;
    if (typeof directWeight === 'number' && !isNaN(directWeight)) {
      return Number(Math.max(0, Math.min(1, directWeight)).toFixed(2));
    }
    return 1.0;
  }

  const depNode = nodes.find((n) => n.id === deploymentNodeId);
  const depEntity = deployments.find((d) => d.id === depNode?.deploymentId);
  const account = accounts.find((a) => a.id === depEntity?.accountId);

  let finalWeight = 1.0;
  for (const modNode of modifierNodes) {
    const score = getWeightModifierScore(modNode, account, accounts, nodes, edges, deployments);
    finalWeight *= score;
  }

  return Number(Math.max(0, Math.min(1, finalWeight)).toFixed(2));
}
