import van from 'vanjs-core';

export interface KrnlTooltipProps {
  text: string;
  placement?: 'auto' | 'top' | 'bottom' | 'left' | 'right';
  children: HTMLElement | HTMLElement[];
}

/**
 * KrnlTooltip enforces the Skipo UI Invariant:
 * Elements near the top edge (< 80px) MUST pop downwards to prevent clipping.
 */
export function KrnlTooltip({ text, placement = 'auto', children }: KrnlTooltipProps): HTMLElement {
  const { div, span } = van.tags;
  const isVisible = van.state(false);
  const calculatedPlacement = van.state(placement);

  const wrapper = div(
    {
      class: 'krnl-tooltip-wrapper',
      style: 'position: relative; display: inline-flex;',
      onmouseenter: (e: MouseEvent) => {
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        if (placement === 'auto') {
          calculatedPlacement.val = rect.top < 80 ? 'bottom' : 'top';
        } else {
          calculatedPlacement.val = placement;
        }
        isVisible.val = true;
      },
      onmouseleave: () => {
        isVisible.val = false;
      }
    },
    Array.isArray(children) ? children : [children],
    () => {
      if (!isVisible.val) return span({ style: 'display: none;' });

      let positionStyle = 'position: absolute; z-index: 9999; white-space: nowrap; pointer-events: none;';
      if (calculatedPlacement.val === 'bottom') {
        positionStyle += ' top: calc(100% + 6px); left: 50%; transform: translateX(-50%);';
      } else if (calculatedPlacement.val === 'top') {
        positionStyle += ' bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%);';
      } else if (calculatedPlacement.val === 'left') {
        positionStyle += ' right: calc(100% + 6px); top: 50%; transform: translateY(-50%);';
      } else {
        positionStyle += ' left: calc(100% + 6px); top: 50%; transform: translateY(-50%);';
      }

      return div(
        {
          class: 'krnl-tooltip-content',
          style: `${positionStyle} background: rgba(18, 18, 18, 0.95); color: #e5c07b; border: 1px solid #d4af37; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-family: monospace; box-shadow: 0 4px 12px rgba(0,0,0,0.5);`
        },
        text
      );
    }
  );

  return wrapper;
}
