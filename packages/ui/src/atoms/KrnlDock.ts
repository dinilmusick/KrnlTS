import van from 'vanjs-core';
import { KrnlTooltip } from './KrnlTooltip.js';

export interface KrnlDockItem {
  id: string;
  icon: string | HTMLElement;
  label: string;
  badge?: string | number;
  onClick: () => void;
  active?: boolean;
}

export interface KrnlDockProps {
  items: KrnlDockItem[];
  position?: 'bottom' | 'top' | 'left' | 'right';
  className?: string;
}

/**
 * KrnlDock: macOS-style 4-edge dock window switcher adhering to Skipo Neo-Brutalist UI standard.
 */
export function KrnlDock({ items, position = 'bottom', className = '' }: KrnlDockProps): HTMLElement {
  const { div, button, span } = van.tags;
  const activeId = van.state(items.find(i => i.active)?.id || items[0]?.id || '');

  const dockStyle = `
    position: fixed;
    ${position === 'bottom' ? 'bottom: 16px; left: 50%; transform: translateX(-50%); flex-direction: row;' : ''}
    ${position === 'top' ? 'top: 16px; left: 50%; transform: translateX(-50%); flex-direction: row;' : ''}
    ${position === 'left' ? 'left: 16px; top: 50%; transform: translateY(-50%); flex-direction: column;' : ''}
    ${position === 'right' ? 'right: 16px; top: 50%; transform: translateY(-50%); flex-direction: column;' : ''}
    display: flex;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(24, 24, 28, 0.85);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 10px rgba(212, 175, 55, 0.15);
    z-index: 9000;
  `;

  return div(
    { class: `krnl-dock krnl-dock-${position} ${className}`, style: dockStyle },
    items.map(item => {
      const isItemActive = () => activeId.val === item.id;

      const btn = button(
        {
          class: 'krnl-dock-item',
          style: () => `
            display: flex;
            align-items: center;
            justify-content: center;
            width: 44px;
            height: 44px;
            border-radius: 10px;
            background: ${isItemActive() ? 'rgba(212, 175, 55, 0.25)' : 'rgba(255, 255, 255, 0.05)'};
            border: 1px solid ${isItemActive() ? '#d4af37' : 'rgba(255, 255, 255, 0.1)'};
            color: ${isItemActive() ? '#d4af37' : '#e0e0e0'};
            cursor: pointer;
            transition: all 0.15s ease;
            position: relative;
          `,
          onclick: () => {
            activeId.val = item.id;
            item.onClick();
          }
        },
        typeof item.icon === 'string' ? span({ style: 'font-size: 20px;' }, item.icon) : item.icon,
        item.badge ? span(
          {
            style: 'position: absolute; top: -4px; right: -4px; background: #e06c75; color: white; border-radius: 8px; font-size: 10px; padding: 2px 5px; font-weight: bold;'
          },
          String(item.badge)
        ) : null
      );

      return KrnlTooltip({
        text: item.label,
        placement: position === 'top' ? 'bottom' : 'top',
        children: btn
      });
    })
  );
}
