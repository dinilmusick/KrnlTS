import van, { type State } from 'vanjs-core';

const { button, span, div } = van.tags;

export interface KrnlButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  tooltipLabel?: string;
  icon?: string;
  loading?: State<boolean> | boolean;
  disabled?: State<boolean> | boolean;
  type?: 'button' | 'submit' | 'reset';
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  onclick?: (e: MouseEvent) => void;
}

export function KrnlButton({
  variant = 'primary',
  tooltipLabel = 'Execute Action',
  icon = '⚡',
  loading = false,
  disabled = false,
  type = 'button',
  tooltipPosition = 'bottom',
  onclick
}: KrnlButtonProps): HTMLElement {
  const isLoading = typeof loading === 'object' && 'val' in loading ? loading : van.state(loading);
  const isDisabled = typeof disabled === 'object' && 'val' in disabled ? disabled : van.state(disabled);

  const btnProps: Record<string, any> = {
    type,
    class: () => `krnl-btn-icon-only krnl-btn-${variant}`,
    disabled: () => isDisabled.val || isLoading.val,
    'aria-label': tooltipLabel,
  };

  if (onclick) {
    btnProps.onclick = onclick;
  }

  return div(
    { style: 'position: relative; display: inline-flex;' },
    button(
      btnProps,
      span({ class: 'krnl-btn-icon' }, () => (isLoading.val ? '⏳' : icon)),
      span(
        { class: `krnl-tooltip krnl-tooltip-${tooltipPosition}` },
        () => (isLoading.val ? 'Processing...' : tooltipLabel)
      )
    )
  );
}
