import React from 'react';

export interface KrnlTextAreaProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}

export const KrnlTextArea: React.FC<KrnlTextAreaProps> = ({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  required
}) => {
  return (
    <div className="krnl-form-group">
      {label && <label className="krnl-label">{label}{required && ' *'}</label>}
      <textarea
        className="krnl-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        required={required}
      />
    </div>
  );
};
