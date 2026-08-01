import React from 'react';

export interface KrnlJsonViewerProps {
  label?: string;
  data: any;
}

export const KrnlJsonViewer: React.FC<KrnlJsonViewerProps> = ({
  label,
  data
}) => {
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  return (
    <div className="krnl-form-group">
      {label && <label className="krnl-label">{label}</label>}
      <pre className="krnl-json-viewer">
        <code>{jsonString}</code>
      </pre>
    </div>
  );
};
