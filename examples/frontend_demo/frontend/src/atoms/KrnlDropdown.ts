import van from 'vanjs-core';

const { div, label: labelTag, select, option } = van.tags;

export interface KrnlDropdownProps {
  label?: string;
  value?: van.State<string> | string;
  options?: van.State<any[]> | any[];
  onChange?: (val: string) => void;
  required?: boolean;
}

export function KrnlDropdown({
  label: labelText,
  value,
  options = [],
  onChange,
  required
}: KrnlDropdownProps) {
  const optionsState = typeof options === 'object' && 'val' in options ? options : van.state(options);
  const valState = typeof value === 'object' && 'val' in value ? value : van.state(value || '');

  const normOptions = () => {
    const raw = optionsState.val || [];
    return (Array.isArray(raw) ? raw : []).map((opt: any) => {
      if (typeof opt === 'string') return { label: opt, value: opt };
      if (typeof opt === 'number') return { label: String(opt), value: String(opt) };
      if (opt && typeof opt === 'object') {
        const v = opt.value !== undefined ? opt.value : (opt.name !== undefined ? opt.name : (opt.id !== undefined ? opt.id : (opt.key !== undefined ? opt.key : JSON.stringify(opt))));
        const l = opt.label !== undefined ? opt.label : (opt.displayName !== undefined ? opt.displayName : (opt.name !== undefined ? opt.name : (opt.id !== undefined ? opt.id : v)));
        return { label: String(l), value: String(v) };
      }
      return { label: String(opt), value: String(opt) };
    });
  };

  van.derive(() => {
    const opts = normOptions();
    if (!valState.val && opts.length > 0 && opts[0].value) {
      valState.val = opts[0].value;
      if (onChange) onChange(opts[0].value);
    }
  });

  return div(
    { className: 'krnl-form-group' },
    labelText ? labelTag({ className: 'krnl-label' }, labelText, required ? ' *' : '') : null,
    select(
      {
        className: 'krnl-input krnl-select',
        value: () => valState.val,
        required,
        onchange: (e: Event) => {
          const newV = (e.target as HTMLSelectElement).value;
          valState.val = newV;
          if (onChange) onChange(newV);
        }
      },
      () => {
        const opts = normOptions();
        if (opts.length === 0) {
          return [option({ value: '', disabled: true, selected: true }, 'Select option...')];
        }
        return opts.map((opt) =>
          option({ value: opt.value, selected: opt.value === valState.val }, opt.label)
        );
      }
    )
  );
}
