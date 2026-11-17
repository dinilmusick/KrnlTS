import { BaseViewWindow, CustomViewWindow } from '../domain/BaseViewWindow.js';
import { ViewLink } from '../domain/BaseConnection.js';
import type { NodePosition, NodeSize } from '../domain/BaseNode.js';

export interface CreateViewWindowParams {
  id?: string;
  viewType: string;
  sourceNodeId: string;
  sourceViewHandleId: string;
  position: NodePosition;
  size?: NodeSize;
}

export class ViewWindowManager {
  private windows: Map<string, BaseViewWindow> = new Map();
  private links: Map<string, ViewLink> = new Map();

  public createWindow(params: CreateViewWindowParams): { window: BaseViewWindow; link: ViewLink } {
    const id = params.id ?? `vw-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const window = new CustomViewWindow({
      id,
      viewType: params.viewType,
      sourceNodeId: params.sourceNodeId,
      position: params.position,
      size: params.size,
      selected: true,
      pinnedLive: false
    });

    const link = new ViewLink({
      id: `vlink-${params.sourceNodeId}-${id}`,
      sourceNodeId: params.sourceNodeId,
      sourceViewHandleId: params.sourceViewHandleId,
      targetViewWindowId: id
    });

    // Deselect other unpinned windows so new window becomes ACTIVE
    this.selectWindow(id);

    this.windows.set(id, window);
    this.links.set(id, link);

    return { window, link };
  }

  public selectWindow(id: string): void {
    for (const [wId, win] of this.windows) {
      win.setSelected(wId === id);
    }
  }

  public pinLive(id: string, pinned: boolean): void {
    const win = this.windows.get(id);
    if (win) {
      win.setPinnedLive(pinned);
    }
  }

  public removeWindow(id: string): boolean {
    this.links.delete(id);
    return this.windows.delete(id);
  }

  public getProcessingWindows(): BaseViewWindow[] {
    return Array.from(this.windows.values()).filter(
      w => w.dynamicState === 'ACTIVE' || w.dynamicState === 'PINNED_LIVE'
    );
  }

  public getWindow(id: string): BaseViewWindow | undefined {
    return this.windows.get(id);
  }

  public getLink(windowId: string): ViewLink | undefined {
    return this.links.get(windowId);
  }

  public listWindows(): BaseViewWindow[] {
    return Array.from(this.windows.values());
  }

  public listLinks(): ViewLink[] {
    return Array.from(this.links.values());
  }
}
