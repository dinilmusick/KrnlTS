import React from 'react';
export function KrnlTile({ title, value }: any) {
  return (
    <div className="krnl-tile">
      {title && <div className="krnl-tile-title">{title}</div>}
      <div className="krnl-tile-value">{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</div>
    </div>
  );
}