import { SpaceNode, NodeConnection } from "../../../types/index.js";
import { TraceEngine, Trace } from '../../../../spatial/TraceEngine.js';
import { AutoSolidify } from '../../../../spatial/AutoSolidify.js';
import { AttractionEngine } from '../../../../spatial/AttractionEngine.js';
import { SolidConnection } from '../../../../domain/BaseConnection.js';
import { mapSpaceNodeToBridgeNode, GraphBridgeNode, COORD_SCALE } from './magneticGraphBridge.js';

export interface Landmark {
  id: string;
  name: string;
  camera: { x: number; y: number; zoom: number };
  timestamp: number;
}

export class MagneticGraphManager {
  private cutoffDistance: number;
  private landmarks: Map<string, Landmark> = new Map();

  constructor(cutoffDistance = 260) {
    this.cutoffDistance = cutoffDistance;
  }

  public setCutoffDistance(dist: number): void {
    this.cutoffDistance = dist;
  }

  public getCutoffDistance(): number {
    return this.cutoffDistance;
  }

  public getBridgeNodes(nodes: SpaceNode[]): GraphBridgeNode[] {
    return nodes.map(mapSpaceNodeToBridgeNode);
  }


  public computeTraces(nodes: SpaceNode[]): Trace[] {
    const bridgeNodes = this.getBridgeNodes(nodes);
    return TraceEngine.computeTraces(bridgeNodes, this.cutoffDistance);
  }

  public resolveAutoSolidification(
    nodes: SpaceNode[],
    traces: Trace[],
    connections: NodeConnection[]
  ): SolidConnection[] {
    const bridgeNodes = this.getBridgeNodes(nodes);
    const solidConnections: SolidConnection[] = connections.map(
      (c) =>
        new SolidConnection({
          id: c.id,
          sourceNodeId: c.fromNodeId,
          sourceHandleId: c.fromSocketId || c.fromPort || '',
          targetNodeId: c.toNodeId,
          targetHandleId: c.toSocketId || c.toPort || '',
          wireType: (c.signalType ? c.signalType.toUpperCase() : 'AUDIO_STEREO'),
          locked: false,
        })
    );

    return AutoSolidify.resolve(bridgeNodes, traces, solidConnections);
  }

  public calculateAttractionStep(
    nodes: SpaceNode[],
    strength = 0.5,
    speed = 0.8
  ): Map<string, [number, number, number]> {
    const bridgeNodes = this.getBridgeNodes(nodes);
    const newPositions = AttractionEngine.calculateStep(bridgeNodes, strength, speed);
    const resultMap = new Map<string, [number, number, number]>();

    for (const node of nodes) {
      const pos2D = newPositions.get(node.id);
      if (pos2D) {
        resultMap.set(node.id, [pos2D.x / COORD_SCALE, node.position[1], pos2D.y / COORD_SCALE]);
      }
    }

    return resultMap;
  }

  public saveLandmark(name: string, camera: { x: number; y: number; zoom: number }): Landmark {
    const landmark: Landmark = {
      id: `lm-${Date.now()}`,
      name,
      camera: { ...camera },
      timestamp: Date.now(),
    };
    this.landmarks.set(landmark.id, landmark);
    return landmark;
  }

  public getLandmarks(): Landmark[] {
    return Array.from(this.landmarks.values());
  }

  public removeLandmark(id: string): void {
    this.landmarks.delete(id);
  }
}
