import van from 'vanjs-core';
import type { BaseSchemes } from 'rete';
import type { AreaPlugin } from 'rete-area-plugin';

const { div, span, button } = van.tags;

export interface VanJSRenderOptions {
  onNodeContextMenu?: (nodeId: string, event: MouseEvent) => void;
  onSocketConnect?: (socketId: string) => void;
}

/**
 * VanJSRenderPlugin: Pure Direct-DOM VanJS rendering plugin for Rete.js v2.
 * Renders Neo-Brutalist 2.5D nodes with zero React overhead.
 */
export function createVanJSRenderPlugin<Schemes extends BaseSchemes>(options: VanJSRenderOptions = {}) {
  return (area: AreaPlugin<Schemes, any>) => {
    area.addPipe((context) => {
      if (context.type === 'render') {
        const { element } = context.data;

        if (context.data.type === 'node') {
          const nodeData = context.data.data as any;
          const nodeType = nodeData.nodeType || 'functionality';

          const nodeView = div(
            {
              class: `krnl-node krnl-node-${nodeType}`,
              style: `
                background: rgba(22, 22, 30, 0.95);
                border: 2px solid ${nodeType === 'entity' ? '#d4af37' : '#4b5263'};
                border-radius: 10px;
                padding: 12px 16px;
                min-width: 220px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), 0 0 12px ${nodeType === 'entity' ? 'rgba(212, 175, 55, 0.3)' : 'transparent'};
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
                color: #f5ede4;
                position: relative;
                user-select: none;
              `,
              oncontextmenu: (e: MouseEvent) => {
                e.preventDefault();
                if (options.onNodeContextMenu) {
                  options.onNodeContextMenu(nodeData.id, e);
                }
              }
            },
            div(
              { style: 'font-size: 10px; text-transform: uppercase; color: #d4af37; font-weight: bold; margin-bottom: 4px;' },
              nodeType
            ),
            div(
              { style: 'font-size: 15px; font-weight: bold; margin-bottom: 8px;' },
              nodeData.label || nodeData.name || 'Unnamed Node'
            ),
            nodeData.filePath ? div(
              { style: 'font-size: 9px; color: #7f848e; font-family: monospace; overflow: hidden; text-overflow: ellipsis;' },
              nodeData.filePath
            ) : null
          );

          element.replaceChildren(nodeView);
        }
      }
      return context;
    });
  };
}
