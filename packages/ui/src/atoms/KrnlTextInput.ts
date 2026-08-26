import van, { type State } from 'vanjs-core';

const { div, label: labelTag, input } = van.tags;

export interface KrnlTextInputProps {
  label?: string;
  value?: State<string> | string;
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
  required = false,
  type = 'text'
}: KrnlTextInputProps): HTMLElement {
  const valState = typeof value === 'object' && 'val' in value ? value : van.state(value || '');

  const inputProps: Record<string, any> = {
    class: 'krnl-input',
    type,
    placeholder,
    value: () => valState.val,
    required: !!required,
    oninput: (e: Event) => {
      const newV = (e.target as HTMLInputElement).value;
      valState.val = newV;
      if (onChange) onChange(newV);
    }
  };

  return div(
    { class: 'krnl-form-group' },
    labelText ? labelTag({ class: 'krnl-label' }, labelText, required ? ' *' : '') : null,
    input(inputProps)
  );
}
