import React, { useEffect, useState } from 'react';

export interface KrnlSSELogProps {
  label?: string;
  endpointId: string;
}

export const KrnlSSELog: React.FC<KrnlSSELogProps> = ({
  label = 'Live Event Stream',
  endpointId
}) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    if (!listening || !endpointId) return;

    const sseUrl = `/sse/${endpointId}`;
    const source = new EventSource(sseUrl);

    source.onmessage = (event) => {
      const timestamp = new Date().toLocaleTimeString();
      setLogs((prev) => [...prev, `[${timestamp}] ${event.data}`]);
    };

    source.onerror = () => {
      setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] SSE Connection Error`]);
      source.close();
      setListening(false);
    };

    return () => {
      source.close();
    };
  }, [listening, endpointId]);

  return (
    <div className="krnl-form-group krnl-sse-panel">
      <div className="krnl-sse-header">
        <span className="krnl-label">{label}</span>
        <button
          type="button"
          className={`krnl-btn krnl-btn-sm ${listening ? 'krnl-btn-danger' : 'krnl-btn-secondary'}`}
          onClick={() => setListening(!listening)}
        >
          {listening ? '🔴 Stop Listening' : '🟢 Listen'}
        </button>
      </div>
      <div className="krnl-sse-log-box">
        {logs.length === 0 ? (
          <span style={{ color: 'var(--krnl-text-muted)' }}>
            {listening ? 'Listening for events...' : 'Click Listen to connect to event stream.'}
          </span>
        ) : (
          logs.map((log, idx) => <div key={idx}>{log}</div>)
        )}
      </div>
    </div>
  );
};
