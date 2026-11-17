/**
 * Browser-safe Kloks state-graph entry.
 *
 * The aggregate state-graph entry also exposes KrnlTS service facades intended
 * for server/runtime use. Browser consumers such as Floks need only the pure
 * graph/state/rules/spatial and graph-engine primitives below.
 */
export * from './types.js';
export * from './Viewport.js';
export * from './BoxSelection.js';
export * from './state/index.js';
export * from './rules/index.js';
export * from './spatial/index.js';
export * from './store/index.js';
export * from './engine/index.js';
export * from './domain/index.js';
export {
  type GraphDefinition,
  type GroupNode,
  type Landmark,
  type PhysicalInputDefinition,
  type PhysicalOutputDefinition,
  type SubgraphNode,
  convertPhysicalInputToStreamHandle,
  convertPhysicalOutputToStreamHandle,
} from './engine/index.js';
export {
  GroupNode as DomainGroupNode,
  SubgraphNode as DomainSubgraphNode,
  instantiateSubgraph,
} from './domain/index.js';
