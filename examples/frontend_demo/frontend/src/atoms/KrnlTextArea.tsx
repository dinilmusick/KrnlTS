import React from 'react';
export function KrnlTextArea({ label, value, onChange, placeholder, rows = 4 }: any) {
  return (
    <div className="krnl-form-group">
      {label && <label className="krnl-label">{label}</label>}
      <textarea
        className="krnl-input krnl-textarea"
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
    </div>
  );
}