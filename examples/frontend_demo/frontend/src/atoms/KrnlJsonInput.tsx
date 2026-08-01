import React, { useState, useEffect } from 'react';

export type KrnlJsonFieldType = 'text' | 'number' | 'text[]' | 'number[]';

export interface KrnlJsonFieldRow {
  id: string;
  key: string;
  type: KrnlJsonFieldType;
  value: string;
}

export interface KrnlJsonInputProps {
  label?: string;
  schemaHints?: Array<{ field: string; type: KrnlJsonFieldType }>;
  onChange: (payload: Record<string, any>) => void;
}

export const KrnlJsonInput: React.FC<KrnlJsonInputProps> = ({
  label = 'Payload Builder',
  schemaHints = [],
  onChange
}) => {
  const [rows, setRows] = useState<KrnlJsonFieldRow[]>(() => {
    if (schemaHints.length > 0) {
      return schemaHints.map((hint, idx) => ({
        id: `field_${idx}_${Date.now()}`,
        key: hint.field,
        type: hint.type,
        value: ''
      }));
    }
    return [{ id: `field_0_${Date.now()}`, key: '', type: 'text', value: '' }];
  });

  useEffect(() => {
    const packed: Record<string, any> = {};
    rows.forEach((row) => {
      if (!row.key.trim()) return;
      const key = row.key.trim();
      const val = row.value.trim();

      if (row.type === 'text') {
        packed[key] = val;
      } else if (row.type === 'number') {
        packed[key] = val === '' ? 0 : Number(val);
      } else if (row.type === 'text[]') {
        packed[key] = val ? val.split(',').map((s) => s.trim()) : [];
      } else if (row.type === 'number[]') {
        packed[key] = val
          ? val.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n))
          : [];
      }
    });
    onChange(packed);
  }, [rows]);

  const addRow = () => {
    setRows([
      ...rows,
      { id: `field_${rows.length}_${Date.now()}`, key: '', type: 'text', value: '' }
    ]);
  };

  const removeRow = (id: string) => {
    setRows(rows.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, updates: Partial<KrnlJsonFieldRow>) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  return (
    <div className="krnl-form-group krnl-json-input-box">
      {label && <label className="krnl-label">{label}</label>}
      <div className="krnl-json-rows">
        {rows.map((row) => (
          <div key={row.id} className="krnl-json-row">
            <input
              type="text"
              className="krnl-input krnl-json-key"
              placeholder="Field Key"
              value={row.key}
              onChange={(e) => updateRow(row.id, { key: e.target.value })}
            />
            <select
              className="krnl-select krnl-json-type"
              value={row.type}
              onChange={(e) =>
                updateRow(row.id, { type: e.target.value as KrnlJsonFieldType })
              }
            >
              <option value="text">text</option>
              <option value="number">number</option>
              <option value="text[]">text[]</option>
              <option value="number[]">number[]</option>
            </select>
            <input
              type="text"
              className="krnl-input krnl-json-val"
              placeholder={
                row.type.endsWith('[]') ? 'comma-separated values' : 'value'
              }
              value={row.value}
              onChange={(e) => updateRow(row.id, { value: e.target.value })}
            />
            <button
              type="button"
              className="krnl-btn krnl-btn-danger krnl-btn-sm"
              onClick={() => removeRow(row.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="krnl-btn krnl-btn-secondary krnl-btn-sm"
        style={{ marginTop: '0.5rem' }}
        onClick={addRow}
      >
        + Add Field
      </button>
    </div>
  );
};
