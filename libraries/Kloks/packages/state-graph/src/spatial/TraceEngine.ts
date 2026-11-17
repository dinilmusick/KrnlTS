import type { BaseNode } from '../domain/BaseNode.js';
import type { BaseHandle } from '../domain/BaseHandle.js';
import { CompatibilityMatrix, type CompatibilityResolution } from '../rules/CompatibilityMatrix.js';
import { SpatialEngine } from './SpatialEngine.js';

export interface Trace {
  id: string;
  sourceNodeId: string;
  sourceHandleId: string;
  targetNodeId: string;
  targetHandleId: string;
  wireType: string;
  compatibility: CompatibilityResolution;
  spatialScore: number;
}

export class TraceEngine {
  public static computeTraces(nodes: BaseNode[], cutoffDistance: number): Trace[] {
    const traces: Trace[] = [];

    // Extract all output data handles and input data handles
    const outputPairs: { node: BaseNode; handle: BaseHandle }[] = [];
    const inputPairs: { node: BaseNode; handle: BaseHandle }[] = [];

    for (const node of nodes) {
      for (const handle of node.handles) {
        if (handle.handleCategory !== 'DATA') continue;
        if (handle.direction === 'OUTPUT') {
          outputPairs.push({ node, handle });
        } else if (handle.direction === 'INPUT') {
          inputPairs.push({ node, handle });
        }
      }
    }

    for (const out of outputPairs) {
      const outPos = SpatialEngine.calculateEffectiveHandlePosition(out.node, out.handle);

      for (const inp of inputPairs) {
        if (out.node.id === inp.node.id) continue; // Same node connections ignored in basic trace

        const resolution = CompatibilityMatrix.resolve(out.handle, inp.handle, out.node, inp.node);
        if (!resolution.allowed) continue;

        const inpPos = SpatialEngine.calculateEffectiveHandlePosition(inp.node, inp.handle);
        const distance = SpatialEngine.calculateDistance(outPos, inpPos);

        if (distance <= cutoffDistance) {
          traces.push({
            id: `trace-${out.node.id}:${out.handle.id}->${inp.node.id}:${inp.handle.id}`,
            sourceNodeId: out.node.id,
            sourceHandleId: out.handle.id,
            targetNodeId: inp.node.id,
            targetHandleId: inp.handle.id,
            wireType: resolution.wireType ?? 'DEFAULT',
            compatibility: resolution,
            spatialScore: distance
          });
        }
      }
    }

    return traces;
  }
}
