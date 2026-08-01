import React, { useEffect } from 'react';
export function KrnlDropdown({ label, value, options = [], onChange }: any) {
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
    if (!value && normOptions.length > 0 && normOptions[0].value && onChange) {
      onChange(normOptions[0].value);
    }
  }, [normOptions, value]);

  return (
    <div className="krnl-form-group">
      {label && <label className="krnl-label">{label}</label>}
      <select
        className="krnl-input krnl-select"
        value={value || (normOptions.length > 0 ? normOptions[0].value : '')}
        onChange={(e) => onChange && onChange(e.target.value)}
      >
        {normOptions.length === 0 && <option value="" disabled>Select option...</option>}
        {normOptions.map((opt: any, idx: number) => (
          <option key={`${opt.value}-${idx}`} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}