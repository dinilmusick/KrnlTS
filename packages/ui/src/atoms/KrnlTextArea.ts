import van, { type State } from 'vanjs-core';

const { div, label: labelTag, textarea } = van.tags;

export interface KrnlTextAreaProps {
  label?: string;
  value?: State<string> | string;
  placeholder?: string;
  onChange?: (val: string) => void;
  rows?: number;
}

export function KrnlTextArea({
  label: labelText,
  value,
  placeholder = '',
  onChange,
  rows = 4
}: KrnlTextAreaProps): HTMLElement {
  const valState = typeof value === 'object' && 'val' in value ? value : van.state(value || '');

  return div(
    { class: 'krnl-form-group' },
    labelText ? labelTag({ class: 'krnl-label' }, labelText) : null,
    textarea({
      class: 'krnl-input krnl-textarea',
      rows,
      placeholder,
      value: () => valState.val,
      oninput: (e: Event) => {
        const newV = (e.target as HTMLTextAreaElement).value;
        valState.val = newV;
        if (onChange) onChange(newV);
      }
    })
  );
}
