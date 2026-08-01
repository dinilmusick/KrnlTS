import React from 'react';

export interface KrnlToggleProps {
  label?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export const KrnlToggle: React.FC<KrnlToggleProps> = ({
  label,
  value,
  onChange
}) => {
  return (
    <div className="krnl-form-group krnl-toggle-group">
      <label className="krnl-toggle-switch">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="krnl-toggle-slider"></span>
      </label>
      {label && <span className="krnl-label-inline">{label}</span>}
    </div>
  );
};
