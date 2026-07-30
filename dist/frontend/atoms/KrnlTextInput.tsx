import React from 'react';

export interface KrnlTextInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export const KrnlTextInput: React.FC<KrnlTextInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  required
}) => {
  return (
    <div className="krnl-form-group">
      {label && <label className="krnl-label">{label}{required && ' *'}</label>}
      <input
        type="text"
        className="krnl-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
};
