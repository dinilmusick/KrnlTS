import React, { useEffect } from 'react';

export interface KrnlDropdownProps {
  label?: string;
  value: string;
  options?: any[];
  onChange: (value: string) => void;
  required?: boolean;
  sharedComponentId?: string;
}

export const KrnlDropdown: React.FC<KrnlDropdownProps> = ({
  label,
  value,
  options = [],
  onChange,
  required
}) => {
  const normOptions = (Array.isArray(options) ? options : []).map((opt: any) => {
    if (typeof opt === 'string') return { label: opt, value: opt };
    if (typeof opt === 'number') return { label: String(opt), value: String(opt) };
    if (opt && typeof opt === 'object') {
      const val = opt.value !== undefined ? opt.value : (opt.name !== undefined ? opt.name : (opt.id !== undefined ? opt.id : (opt.key !== undefined ? opt.key : JSON.stringify(opt))));
      const lbl = opt.label !== undefined ? opt.label : (opt.displayName !== undefined ? opt.displayName : (opt.name !== undefined ? opt.name : (opt.id !== undefined ? opt.id : val)));
      return { label: String(lbl), value: String(val) };
    }
    return { label: String(opt), value: String(opt) };
  });

  useEffect(() => {
    if (!value && normOptions.length > 0 && normOptions[0].value) {
      onChange(normOptions[0].value);
    }
  }, [normOptions, value]);

  return (
    <div className="krnl-form-group">
      {label && <label className="krnl-label">{label}{required && ' *'}</label>}
      <select
        className="krnl-select"
        value={value || (normOptions.length > 0 ? normOptions[0].value : '')}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        {normOptions.length === 0 && <option value="" disabled>Select an option</option>}
        {normOptions.map((opt, idx) => (
          <option key={`${opt.value}-${idx}`} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

