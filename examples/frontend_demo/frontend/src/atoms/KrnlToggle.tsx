import React from 'react';
export function KrnlToggle({ label, value, onChange }: any) {
  return (
    <div className="krnl-form-group krnl-toggle-group">
      {label && <label className="krnl-label">{label}</label>}
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange && onChange(e.target.checked)}
      />
    </div>
  );
}