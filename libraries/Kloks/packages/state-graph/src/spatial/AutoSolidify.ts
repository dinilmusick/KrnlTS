import type { BaseNode } from '../domain/BaseNode.js';
import { SolidConnection } from '../domain/BaseConnection.js';
import type { Trace } from './TraceEngine.js';
import { SpatialEngine } from './SpatialEngine.js';

interface CandidatePair {
  trace: Trace;
  sourceNode: BaseNode;
  targetNode: BaseNode;
  exactDistance: number;
  offsetDistance: number;
}

export class AutoSolidify {
  public static resolve(
    nodes: BaseNode[],
    traces: Trace[],
    existingConnections: SolidConnection[]
  ): SolidConnection[] {
    const nodeMap = new Map<string, BaseNode>(nodes.map(n => [n.id, n]));
    const lockedConnections = existingConnections.filter(c => c.locked);

    // Keep all locked connections
    const resultConnections: SolidConnection[] = [...lockedConnections];

    // Set of locked endpoints
    const lockedEndpoints = new Set<string>();
    for (const c of lockedConnections) {
      lockedEndpoints.add(`out:${c.sourceNodeId}:${c.sourceHandleId}`);
      lockedEndpoints.add(`in:${c.targetNodeId}:${c.targetHandleId}`);
    }

    // Build candidate list
    const candidates: CandidatePair[] = [];
    for (const trace of traces) {
      const sourceNode = nodeMap.get(trace.sourceNodeId);
      const targetNode = nodeMap.get(trace.targetNodeId);
      if (!sourceNode || !targetNode) continue;

      const sourceHandle = sourceNode.getHandle(trace.sourceHandleId);
      const targetHandle = targetNode.getHandle(trace.targetHandleId);
      if (!sourceHandle || !targetHandle) continue;

      // Skip if either endpoint is locked in another connection
      const outKey = `out:${sourceNode.id}:${sourceHandle.id}`;
      const inKey = `in:${targetNode.id}:${targetHandle.id}`;
      if (lockedEndpoints.has(outKey) || lockedEndpoints.has(inKey)) {
        continue;
      }

      const offsetDist = SpatialEngine.calculateOffsetMagnitude(sourceHandle) +
        SpatialEngine.calculateOffsetMagnitude(targetHandle);

      candidates.push({
        trace,
        sourceNode,
        targetNode,
        exactDistance: trace.spatialScore,
        offsetDistance: offsetDist
      });
    }

    // Sort candidates according to canonical tie-breaking rules:
    // 1. exact handle distance ASC
    // 2. handle offset distance ASC
    // 3. deterministic node ID ordering (sourceNode.id, then targetNode.id)
    candidates.sort((a, b) => {
      if (Math.abs(a.exactDistance - b.exactDistance) > 0.0001) {
        return a.exactDistance - b.exactDistance;
      }
      if (Math.abs(a.offsetDistance - b.offsetDistance) > 0.0001) {
        return a.offsetDistance - b.offsetDistance;
      }
      const sComp = a.sourceNode.id.localeCompare(b.sourceNode.id);
      if (sComp !== 0) return sComp;
      return a.targetNode.id.localeCompare(b.targetNode.id);
    });

    const claimedOutputs = new Set<string>();
    const claimedInputs = new Set<string>();

    for (const cand of candidates) {
      const sHandle = cand.sourceNode.getHandle(cand.trace.sourceHandleId)!;
      const tHandle = cand.targetNode.getHandle(cand.trace.targetHandleId)!;

      const outKey = `${cand.sourceNode.id}:${sHandle.id}`;
      const inKey = `${cand.targetNode.id}:${tHandle.id}`;

      const outAvailable = sHandle.connectionMode === 'MULTI' || !claimedOutputs.has(outKey);
      const inAvailable = tHandle.connectionMode === 'MULTI' || !claimedInputs.has(inKey);

      if (outAvailable && inAvailable) {
        claimedOutputs.add(outKey);
        claimedInputs.add(inKey);

        resultConnections.push(new SolidConnection({
          id: `conn-${cand.sourceNode.id}-${sHandle.id}-${cand.targetNode.id}-${tHandle.id}`,
          sourceNodeId: cand.sourceNode.id,
          sourceHandleId: sHandle.id,
          targetNodeId: cand.targetNode.id,
          targetHandleId: tHandle.id,
          wireType: cand.trace.wireType,
          locked: false
        }));
      }
    }

    return resultConnections;
  }
}
