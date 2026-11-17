import { SpaceNode } from "../../types/index.js";
import { NodeSocketsResult } from './types';

/**
 * Global registry for custom node socket providers.
 */
const customNodeSocketRegistry: Map<string, (node: SpaceNode) => NodeSocketsResult> = new Map();

export function registerCustomNodeSockets(nodeType: string, provider: (node: SpaceNode) => NodeSocketsResult): void {
  customNodeSocketRegistry.set(nodeType, provider);
}

export function unregisterCustomNodeSockets(nodeType: string): void {
  customNodeSocketRegistry.delete(nodeType);
}

export function getCustomNodeSocketProvider(nodeType: string) {
  return customNodeSocketRegistry.get(nodeType);
}

export function hasCustomNodeSocketProvider(nodeType: string): boolean {
  return customNodeSocketRegistry.has(nodeType);
}
