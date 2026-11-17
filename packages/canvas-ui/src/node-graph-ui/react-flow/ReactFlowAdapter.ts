import type { BaseNode } from '@floks/contracts';
import type { SolidConnection, ViewLink } from '@floks/contracts';
import type { Trace } from '@floks/contracts';
import type { BaseViewWindow } from '@floks/contracts';

export interface ReactFlowNodeData {
  nodeId: string;
  label: string;
  type: string;
  handles: {
    id: string;
    direction: 'INPUT' | 'OUTPUT';
    category: 'DATA' | 'VIEW';
    dataType: string;
    offset: { x: number; y: number };
  }[];
  positionLocked: boolean;
  customData?: Record<string, unknown>;
}

export interface ReactFlowEdgeData {
  connectionId: string;
  sourceNodeId: string;
  sourceHandleId: string;
  targetNodeId: string;
  targetHandleId: string;
  wireType: string;
  locked: boolean;
  isTrace?: boolean;
  isViewLink?: boolean;
}

export class ReactFlowAdapter {
  public static toReactFlowNodes(nodes: BaseNode[]): Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: ReactFlowNodeData;
  }> {
    return nodes.map(node => ({
      id: node.id,
      type: 'magneticNode',
      position: { x: node.position.x, y: node.position.y },
      data: {
        nodeId: node.id,
        label: node.label,
        type: node.type,
        handles: node.handles.map(h => ({
          id: h.id,
          direction: h.direction,
          category: h.handleCategory,
          dataType: h.dataType,
          offset: { ...h.offset }
        })),
        positionLocked: node.positionLocked,
        customData: node.state
      }
    }));
  }

  public static toReactFlowEdges(
    connections: SolidConnection[],
    traces: Trace[] = [],
    viewLinks: ViewLink[] = []
  ): Array<{
    id: string;
    source: string;
    sourceHandle: string;
    target: string;
    targetHandle: string;
    type: string;
    animated?: boolean;
    data: ReactFlowEdgeData;
  }> {
    const edges: Array<{
      id: string;
      source: string;
      sourceHandle: string;
      target: string;
      targetHandle: string;
      type: string;
      animated?: boolean;
      data: ReactFlowEdgeData;
    }> = [];

    // Solid Connections
    for (const conn of connections) {
      edges.push({
        id: conn.id,
        source: conn.sourceNodeId,
        sourceHandle: conn.sourceHandleId,
        target: conn.targetNodeId,
        targetHandle: conn.targetHandleId,
        type: 'magneticSolidEdge',
        data: {
          connectionId: conn.id,
          sourceNodeId: conn.sourceNodeId,
          sourceHandleId: conn.sourceHandleId,
          targetNodeId: conn.targetNodeId,
          targetHandleId: conn.targetHandleId,
          wireType: conn.wireType,
          locked: conn.locked,
          isTrace: false
        }
      });
    }

    // Transient Traces
    for (const trace of traces) {
      edges.push({
        id: trace.id,
        source: trace.sourceNodeId,
        sourceHandle: trace.sourceHandleId,
        target: trace.targetNodeId,
        targetHandle: trace.targetHandleId,
        type: 'magneticTraceEdge',
        animated: true,
        data: {
          connectionId: trace.id,
          sourceNodeId: trace.sourceNodeId,
          sourceHandleId: trace.sourceHandleId,
          targetNodeId: trace.targetNodeId,
          targetHandleId: trace.targetHandleId,
          wireType: trace.wireType,
          locked: false,
          isTrace: true
        }
      });
    }

    // View Links
    for (const link of viewLinks) {
      edges.push({
        id: link.id,
        source: link.sourceNodeId,
        sourceHandle: link.sourceViewHandleId,
        target: link.targetViewWindowId,
        targetHandle: 'window-in',
        type: 'viewLinkEdge',
        data: {
          connectionId: link.id,
          sourceNodeId: link.sourceNodeId,
          sourceHandleId: link.sourceViewHandleId,
          targetNodeId: link.targetViewWindowId,
          targetHandleId: 'window-in',
          wireType: 'VIEW',
          locked: true,
          isViewLink: true
        }
      });
    }

    return edges;
  }

  public static toReactFlowViewWindows(windows: BaseViewWindow[]): Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: {
      windowId: string;
      viewType: string;
      sourceNodeId: string;
      dynamicState: string;
      pinnedLive: boolean;
      size: { width: number; height: number };
    };
  }> {
    return windows.map(w => ({
      id: w.id,
      type: 'viewWindowWidget',
      position: { x: w.position.x, y: w.position.y },
      data: {
        windowId: w.id,
        viewType: w.viewType,
        sourceNodeId: w.sourceNodeId,
        dynamicState: w.dynamicState,
        pinnedLive: w.pinnedLive,
        size: { ...w.size }
      }
    }));
  }
}
