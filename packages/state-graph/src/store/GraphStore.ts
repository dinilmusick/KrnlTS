import { BaseNode } from '../domain/BaseNode.js';
import { SolidConnection } from '../domain/BaseConnection.js';
import type { GraphSettings, Group } from '../domain/BaseGraph.js';
import { DEFAULT_GRAPH_SETTINGS } from '../domain/BaseGraph.js';
import type { Trace } from '../spatial/TraceEngine.js';
import { TraceEngine } from '../spatial/TraceEngine.js';
import { AutoSolidify } from '../spatial/AutoSolidify.js';
import { ViewWindowManager } from '../management/ViewWindowManager.js';
import { LandmarkManager } from '../management/LandmarkManager.js';
import { ViewEngine } from '../management/ViewEngine.js';

export type GraphListener = () => void;

export class GraphStore {
  public nodes: BaseNode[] = [];
  public connections: SolidConnection[] = [];
  public traces: Trace[] = [];
  public groups: Group[] = [];
  public settings: GraphSettings = { ...DEFAULT_GRAPH_SETTINGS };
  public selectedNodeIds: Set<string> = new Set();
  
  public readonly viewWindows: ViewWindowManager = new ViewWindowManager();
  public readonly landmarks: LandmarkManager = new LandmarkManager();
  public readonly views: ViewEngine = new ViewEngine();

  private listeners: Set<GraphListener> = new Set();

  public subscribe(listener: GraphListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public refreshTraces(): void {
    if (!this.settings.tracingEnabled) {
      this.traces = [];
      this.notify();
      return;
    }

    this.traces = TraceEngine.computeTraces(this.nodes, this.settings.traceCutoffDistance);

    if (this.settings.autoSolidify) {
      this.connections = AutoSolidify.resolve(this.nodes, this.traces, this.connections);
    }

    this.notify();
  }

  public solidifyTrace(traceId: string): SolidConnection | undefined {
    const trace = this.traces.find(t => t.id === traceId);
    if (!trace) return undefined;

    const sourceNode = this.nodes.find(n => n.id === trace.sourceNodeId);
    const targetNode = this.nodes.find(n => n.id === trace.targetNodeId);
    if (!sourceNode || !targetNode) return undefined;

    const conn = new SolidConnection({
      id: `conn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sourceNodeId: trace.sourceNodeId,
      sourceHandleId: trace.sourceHandleId,
      targetNodeId: trace.targetNodeId,
      targetHandleId: trace.targetHandleId,
      wireType: trace.wireType
    });

    this.connections.push(conn);
    this.refreshTraces();
    return conn;
  }

  public lockAllConnections(): void {
    for (const conn of this.connections) {
      conn.locked = true;
    }
    this.notify();
  }
}
