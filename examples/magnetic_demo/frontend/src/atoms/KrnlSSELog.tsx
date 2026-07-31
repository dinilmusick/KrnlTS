import React from 'react';
export function KrnlSSELog({ label }: any) {
  return (
    <div className="krnl-sse-log">
      {label && <div className="krnl-label">{label}</div>}
    </div>
  );
}