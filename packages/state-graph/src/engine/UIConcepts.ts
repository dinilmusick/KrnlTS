/**
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * UIConcepts: Universal UI Theme Tokens, Styling Helpers & Tooltip Invariants
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * @role component
 */
let activePaletteResolver: () => any = () => ({
  id: 'black_and_gold',
  name: 'Black & Gold',
  backgroundPrimary: '#0a0a0d',
  accentPrimary: '#f59e0b',
});

export function configureActivePaletteResolver(resolver: () => any): void {
  activePaletteResolver = resolver;
}

export function getActivePalette(): any {
  return activePaletteResolver();
}

export interface TooltipPlacementOptions {
  viewportTopThreshold?: number;
  elementRect?: DOMRect | null;
  preferredDirection?: 'top' | 'bottom' | 'left' | 'right';
}

export function resolveTooltipDirection(
  preferred: 'top' | 'bottom' | 'left' | 'right' = 'bottom',
  elementRect?: DOMRect | null,
  topThreshold = 80
): 'top' | 'bottom' | 'left' | 'right' {
  if (elementRect && elementRect.top < topThreshold) {
    return 'bottom';
  }
  return preferred;
}

export function getTooltipPlacementClasses(direction?: string): string {
  switch (direction) {
    case 'top':
      return 'bottom-full mb-1.5 left-1/2 -translate-x-1/2';
    case 'bottom':
      return 'top-full mt-1.5 left-1/2 -translate-x-1/2';
    case 'left':
      return 'right-full mr-1.5 top-1/2 -translate-y-1/2';
    case 'right':
      return 'left-full ml-1.5 top-1/2 -translate-y-1/2';
    default:
      return 'top-full mt-1.5 left-1/2 -translate-x-1/2';
  }
}

export function parseBufferedNumber(
  raw: string,
  min: number,
  max: number,
  fallback: number
): number {
  const trimmed = raw.trim();
  if (trimmed === '') return fallback;
  const num = Number(trimmed);
  if (isNaN(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

export const UIConcepts = {
  resolveTooltipDirection,
  getTooltipPlacementClasses,
  parseBufferedNumber,
  getActivePalette,
  glows: {
    amber: 'shadow-[0_0_12px_rgba(245,158,11,0.35)]',
    sky: 'shadow-[0_0_12px_rgba(14,165,233,0.35)]',
    emerald: 'shadow-[0_0_12px_rgba(16,185,129,0.35)]',
    rose: 'shadow-[0_0_12px_rgba(244,63,94,0.35)]',
    cyan: 'shadow-[0_0_12px_rgba(6,182,212,0.35)]',
    purple: 'shadow-[0_0_12px_rgba(168,85,247,0.35)]',
  },
};
