import React from 'react';
export function KrnlJsonInput({ label, onChange }: any) {
  return (
    <div className="krnl-form-group">
      {label && <label className="krnl-label">{label}</label>}
      <textarea
        className="krnl-input krnl-textarea"
        placeholder="{}"
        onChange={(e) => {
          try { onChange && onChange(JSON.parse(e.target.value)); } catch (err) {}
        }}
      />
    </div>
  );
}