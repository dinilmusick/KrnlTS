import type { UIAuthoringNode } from './types.js';

export function getAuthoringDepth(node: UIAuthoringNode, nodes: UIAuthoringNode[]): number {
  let depth = 0;
  let parentId = node.parentId;
  while (parentId) {
    const parent = nodes.find((item) => item.id === parentId);
    if (!parent) break;
    depth += 1;
    parentId = parent.parentId;
  }
  return depth;
}

export function getAuthoringChildren(nodeId: string, nodes: UIAuthoringNode[]): UIAuthoringNode[] {
  return nodes.filter((node) => node.parentId === nodeId);
}


/** Returns a node and all descendants, even when the input tree is malformed. */
export function getAuthoringSubtreeIds(nodeId: string, nodes: UIAuthoringNode[]): Set<string> {
  const ids = new Set<string>([nodeId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of nodes) {
      if (node.parentId && ids.has(node.parentId) && !ids.has(node.id)) {
        ids.add(node.id);
        changed = true;
      }
    }
  }
  return ids;
}
