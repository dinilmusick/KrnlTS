import van from 'vanjs-core';

const { div, label: labelTag, input } = van.tags;

export interface KrnlTextInputProps {
  label?: string;
  value?: van.State<string> | string;
  placeholder?: string;
  onChange?: (val: string) => void;
  required?: boolean;
  type?: string;
}

export function KrnlTextInput({
  label: labelText,
  value,
  placeholder = '',
  onChange,
  required,
  type = 'text'
}: KrnlTextInputProps) {
  const valState = typeof value === 'object' && 'val' in value ? value : van.state(value || '');

  return div(
    { className: 'krnl-form-group' },
    labelText ? labelTag({ className: 'krnl-label' }, labelText, required ? ' *' : '') : null,
    input({
      className: 'krnl-input',
      type,
      placeholder,
      value: () => valState.val,
      required,
      oninput: (e: Event) => {
        const newV = (e.target as HTMLInputElement).value;
        valState.val = newV;
        if (onChange) onChange(newV);
      }
    })
  );
}
