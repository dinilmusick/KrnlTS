import type { GraphStore } from './GraphStore.js';
import { BaseNode, CustomNode, type BaseNodeProps } from '../domain/BaseNode.js';
import type { HandleOffset } from '../domain/BaseHandle.js';
import { SolidConnection } from '../domain/BaseConnection.js';
import type { Group } from '../domain/BaseGraph.js';

export class CommandApi {
  constructor(private store: GraphStore) {}

  public get nodes() {
    return {
      create: (props: BaseNodeProps): BaseNode => {
        const node = new CustomNode(props);
        this.store.nodes.push(node);
        this.store.refreshTraces();
        return node;
      },
      delete: (nodeId: string): void => {
        this.store.nodes = this.store.nodes.filter(n => n.id !== nodeId);
        this.store.connections = this.store.connections.filter(
          c => c.sourceNodeId !== nodeId && c.targetNodeId !== nodeId
        );
        this.store.selectedNodeIds.delete(nodeId);
        this.store.refreshTraces();
      },
      move: (nodeId: string, x: number, y: number): void => {
        const node = this.store.nodes.find(n => n.id === nodeId);
        if (node && !node.positionLocked) {
          node.position = { x, y };
          this.store.refreshTraces();
        }
      },
      lockPosition: (nodeId: string): void => {
        const node = this.store.nodes.find(n => n.id === nodeId);
        if (node) {
          node.lockPosition();
          this.store.notify();
        }
      },
      unlockPosition: (nodeId: string): void => {
        const node = this.store.nodes.find(n => n.id === nodeId);
        if (node) {
          node.unlockPosition();
          this.store.notify();
        }
      }
    };
  }

  public get handles() {
    return {
      move: (nodeId: string, handleId: string, offset: HandleOffset): void => {
        const node = this.store.nodes.find(n => n.id === nodeId);
        const handle = node?.getHandle(handleId);
        if (handle) {
          handle.offset = { ...offset };
          this.store.refreshTraces();
        }
      },
      resetOffset: (nodeId: string, handleId: string): void => {
        const node = this.store.nodes.find(n => n.id === nodeId);
        const handle = node?.getHandle(handleId);
        if (handle) {
          handle.offset = { x: 0, y: 0 };
          this.store.refreshTraces();
        }
      }
    };
  }

  public get traces() {
    return {
      refresh: (): void => this.store.refreshTraces(),
      enable: (): void => {
        this.store.settings.tracingEnabled = true;
        this.store.refreshTraces();
      },
      disable: (): void => {
        this.store.settings.tracingEnabled = false;
        this.store.refreshTraces();
      },
      solidify: (traceId: string) => this.store.solidifyTrace(traceId)
    };
  }

  public get connections() {
    return {
      create: (sourceNodeId: string, sourceHandleId: string, targetNodeId: string, targetHandleId: string, wireType?: string) => {
        const conn = new SolidConnection({
          id: `conn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          sourceNodeId,
          sourceHandleId,
          targetNodeId,
          targetHandleId,
          wireType
        });
        this.store.connections.push(conn);
        this.store.refreshTraces();
        return conn;
      },
      delete: (connectionId: string): void => {
        this.store.connections = this.store.connections.filter(c => c.id !== connectionId);
        this.store.refreshTraces();
      },
      lock: (connectionId: string): void => {
        const conn = this.store.connections.find(c => c.id === connectionId);
        if (conn) {
          conn.locked = true;
          this.store.notify();
        }
      },
      unlock: (connectionId: string): void => {
        const conn = this.store.connections.find(c => c.id === connectionId);
        if (conn) {
          conn.locked = false;
          this.store.notify();
        }
      },
      lockAll: (): void => this.store.lockAllConnections()
    };
  }

  public get groups() {
    return {
      create: (group: Group): void => {
        this.store.groups.push(group);
        this.store.notify();
      },
      delete: (groupId: string): void => {
        this.store.groups = this.store.groups.filter(g => g.id !== groupId);
        this.store.notify();
      }
    };
  }

  public get landmarks() {
    return {
      create: (num: number, name: string, camera: { x: number; y: number }, zoom: number) => {
        const lm = this.store.landmarks.createLandmark(num, name, camera, zoom);
        this.store.notify();
        return lm;
      },
      delete: (id: string) => {
        const res = this.store.landmarks.deleteLandmark(id);
        this.store.notify();
        return res;
      },
      list: () => this.store.landmarks.list()
    };
  }

  public get viewWindows() {
    return {
      create: (params: Parameters<typeof this.store.viewWindows.createWindow>[0]) => {
        const res = this.store.viewWindows.createWindow(params);
        this.store.notify();
        return res;
      },
      close: (id: string) => {
        const res = this.store.viewWindows.removeWindow(id);
        this.store.notify();
        return res;
      },
      select: (id: string) => {
        this.store.viewWindows.selectWindow(id);
        this.store.notify();
      },
      pinLive: (id: string, pinned: boolean) => {
        this.store.viewWindows.pinLive(id, pinned);
        this.store.notify();
      }
    };
  }
}
