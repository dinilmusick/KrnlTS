import van from 'vanjs-core';

const { div, label: labelTag, textarea } = van.tags;

export interface KrnlTextAreaProps {
  label?: string;
  value?: van.State<string> | string;
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
}: KrnlTextAreaProps) {
  const valState = typeof value === 'object' && 'val' in value ? value : van.state(value || '');

  return div(
    { className: 'krnl-form-group' },
    labelText ? labelTag({ className: 'krnl-label' }, labelText) : null,
    textarea({
      className: 'krnl-input krnl-textarea',
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
