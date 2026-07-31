import React from 'react';
export function KrnlDropdown({ label, value, options = [], onChange }: any) {
  return (
    <div className="krnl-form-group">
      {label && <label className="krnl-label">{label}</label>}
      <select className="krnl-input" value={value || ''} onChange={(e) => onChange && onChange(e.target.value)}>
        <option value="">Select option...</option>
        {options.map((opt: any, idx: number) => (
          <option key={idx} value={typeof opt === 'string' ? opt : opt.value}>
            {typeof opt === 'string' ? opt : opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}