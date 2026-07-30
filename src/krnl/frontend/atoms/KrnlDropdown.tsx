import React from 'react';

export interface KrnlDropdownProps {
  label?: string;
  value: string;
  options: string[] | { label: string; value: string }[];
  onChange: (value: string) => void;
  required?: boolean;
}

export const KrnlDropdown: React.FC<KrnlDropdownProps> = ({
  label,
  value,
  options,
  onChange,
  required
}) => {
  const normOptions = options.map((opt) =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  return (
    <div className="krnl-form-group">
      {label && <label className="krnl-label">{label}{required && ' *'}</label>}
      <select
        className="krnl-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        <option value="" disabled>Select an option</option>
        {normOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
