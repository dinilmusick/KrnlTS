import React from 'react';
export function KrnlJsonViewer({ data, label }: any) {
  return (
    <div className="krnl-json-viewer">
      {label && <div className="krnl-label">{label}</div>}
      <pre className="krnl-json-code">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}