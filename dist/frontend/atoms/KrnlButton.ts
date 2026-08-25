// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import van from 'vanjs-core';

const { button, span, div } = van.tags;

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. DATA SCHEMAS & COMPONENT PROP INTERFACES
// ══════════════════════════════════════════════════════════════════════════════════════════
export interface KrnlButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  tooltipLabel?: string;
  icon?: string;
  loading?: van.State<boolean> | boolean;
  disabled?: van.State<boolean> | boolean;
  type?: 'button' | 'submit' | 'reset';
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  onclick?: (e: MouseEvent) => void;
}

// ══════════════════════════════════════════════════════════════════════════════════════════
// 3. ATOMIC UI COMPONENT (ICON-ONLY + HOVER TOOLTIP + SUBTLE GLOW)
// ══════════════════════════════════════════════════════════════════════════════════════════

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * COMPONENT: KrnlButton
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Renders a strict icon-only Neo-Brutalist action button with subtle ambient glow
 *          on hover, displaying its descriptive action label exclusively via a hover tooltip.
 *
 * Interaction Flow Chart:
 *   [Default State: Icon Only] ───► [User Hover: Reveal Tooltip + Ambient Glow]
 *                                              │ (User Click)
 *                                              ▼
 *                                     [Trigger onclick Action]
 *
 * Example:
 *   KrnlButton({
 *     variant: 'primary',
 *     icon: '⚡',
 *     tooltipLabel: 'Execute System Telemetry Sweep',
 *     onclick: () => console.log('Action triggered')
 *   });
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
export function KrnlButton({
  variant = 'primary',
  tooltipLabel = 'Execute Action',
  icon = '⚡',
  loading = false,
  disabled = false,
  type = 'button',
  tooltipPosition = 'bottom',
  onclick
}: KrnlButtonProps) {
  const isLoading = typeof loading === 'object' && 'val' in loading ? loading : van.state(loading);
  const isDisabled = typeof disabled === 'object' && 'val' in disabled ? disabled : van.state(disabled);

  return div(
    { style: 'position: relative; display: inline-flex;' },
    button(
      {
        type,
        className: () => `krnl-btn-icon-only krnl-btn-${variant}`,
        disabled: () => isDisabled.val || isLoading.val,
        'aria-label': tooltipLabel,
        onclick
      },
      span({ className: 'krnl-btn-icon' }, () => (isLoading.val ? '⏳' : icon)),
      span(
        { className: `krnl-tooltip krnl-tooltip-${tooltipPosition}` },
        () => (isLoading.val ? 'Processing...' : tooltipLabel)
      )
    )
  );
}
