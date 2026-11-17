import type { FrnlFrontendApiOptions, FrnlGeometry, FrnlMeasurementAdapter, FrnlRealizedState } from './frontend-api.js';

export type FrnlDomMeasurementAdapterOptions = {
  readonly root?: Document | HTMLElement;
};

/**
 * Optional browser adapter. Semantic component identity remains FrnlTS state;
 * the DOM only contributes realized geometry and visibility.
 */
export function createFrnlDomMeasurementAdapter(
  options: FrnlDomMeasurementAdapterOptions = {},
): FrnlMeasurementAdapter {
  const root = options.root ?? (typeof document === 'undefined' ? undefined : document);
  return {
    measure(componentId: string): FrnlRealizedState | undefined {
      if (!root) return undefined;
      const escaped = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(componentId) : componentId.replace(/["\\]/g, '\\\\$&');
      const element = root.querySelector<HTMLElement>(
        '[data-frnl-component][id="' + escaped + '"]',
      );
      if (!element) return undefined;
      const rect = element.getBoundingClientRect();
      const style = typeof window !== 'undefined' ? window.getComputedStyle(element) : undefined;
      const visible = Boolean(
        rect.width > 0 &&
        rect.height > 0 &&
        style?.display !== 'none' &&
        style?.visibility !== 'hidden' &&
        Number(style?.opacity ?? 1) > 0,
      );
      const geometry: FrnlGeometry = Object.freeze({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      });
      return Object.freeze({ mounted: true, visible, geometry });
    },
  };
}

export type { FrnlFrontendApiOptions };
