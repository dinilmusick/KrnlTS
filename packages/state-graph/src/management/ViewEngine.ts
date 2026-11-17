import type { GraphView, GraphSettings } from '../domain/BaseGraph.js';
import type { BaseNode, NodePosition, NodeSize } from '../domain/BaseNode.js';
import type { BaseViewWindow } from '../domain/BaseViewWindow.js';

export interface CaptureGraphSnapshotParams {
  id?: string;
  name: string;
  nodes: BaseNode[];
  viewWindows: BaseViewWindow[];
  camera: { x: number; y: number };
  zoom: number;
  selectedNodeIds: string[];
  settingsOverrides?: Partial<GraphSettings>;
}

export class ViewEngine {
  private views: Map<string, GraphView> = new Map();

  constructor(initialViews: GraphView[] = []) {
    for (const v of initialViews) {
      this.views.set(v.id, { ...v });
    }
  }

  public captureView(params: CaptureGraphSnapshotParams): GraphView {
    const nodePositions: Record<string, NodePosition> = {};
    const nodeSizes: Record<string, NodeSize> = {};
    const handleOffsets: Record<string, { x: number; y: number }> = {};

    for (const n of params.nodes) {
      nodePositions[n.id] = { ...n.position };
      nodeSizes[n.id] = { ...n.size };
      for (const h of n.handles) {
        if (h.offset.x !== 0 || h.offset.y !== 0) {
          handleOffsets[`${n.id}:${h.id}`] = { ...h.offset };
        }
      }
    }

    const viewWindowsData = params.viewWindows.map(vw => ({
      id: vw.id,
      viewType: vw.viewType,
      sourceNodeId: vw.sourceNodeId,
      position: { ...vw.position },
      size: { ...vw.size },
      pinnedLive: vw.pinnedLive
    }));

    const id = params.id ?? `view-${Date.now()}`;
    const graphView: GraphView = {
      id,
      name: params.name,
      nodePositions,
      nodeSizes,
      handleOffsets,
      groupStates: {},
      viewWindows: viewWindowsData,
      camera: { ...params.camera },
      zoom: params.zoom,
      selectedNodes: [...params.selectedNodeIds],
      graphSettingsOverrides: params.settingsOverrides ? { ...params.settingsOverrides } : {}
    };

    this.views.set(id, graphView);
    return graphView;
  }

  public getView(id: string): GraphView | undefined {
    return this.views.get(id);
  }

  public listViews(): GraphView[] {
    return Array.from(this.views.values());
  }

  public deleteView(id: string): boolean {
    return this.views.delete(id);
  }
}
