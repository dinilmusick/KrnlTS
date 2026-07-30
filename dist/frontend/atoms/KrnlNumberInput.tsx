import React from 'react';

export interface KrnlNumberInputProps {
  label?: string;
  value: number | '';
  onChange: (value: number) => void;
  placeholder?: string;
  step?: number;
  min?: number;
  max?: number;
  required?: boolean;
}

export const KrnlNumberInput: React.FC<KrnlNumberInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  step,
  min,
  max,
  required
}) => {
  return (
    <div className="krnl-form-group">
      {label && <label className="krnl-label">{label}{required && ' *'}</label>}
      <input
        type="number"
        className="krnl-input"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder={placeholder}
        step={step}
        min={min}
        max={max}
        required={required}
      />
    </div>
  );
};
