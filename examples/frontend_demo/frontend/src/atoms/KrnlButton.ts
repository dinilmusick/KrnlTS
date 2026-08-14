import van from 'vanjs-core';

const { button, span } = van.tags;

export interface KrnlButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  label?: string;
  icon?: string;
  loading?: van.State<boolean> | boolean;
  disabled?: van.State<boolean> | boolean;
  type?: 'button' | 'submit' | 'reset';
  onclick?: (e: MouseEvent) => void;
}

export function KrnlButton({
  variant = 'primary',
  label = 'Action',
  icon = '⚡',
  loading = false,
  disabled = false,
  type = 'button',
  onclick
}: KrnlButtonProps) {
  const isLoading = typeof loading === 'object' && 'val' in loading ? loading : van.state(loading);
  const isDisabled = typeof disabled === 'object' && 'val' in disabled ? disabled : van.state(disabled);

  return button(
    {
      type,
      className: () => `krnl-btn krnl-btn-${variant}`,
      disabled: () => isDisabled.val || isLoading.val,
      onclick
    },
    span({ className: 'krnl-btn-icon' }, icon),
    span({ className: 'krnl-btn-label' }, () => (isLoading.val ? 'Processing...' : label))
  );
}
