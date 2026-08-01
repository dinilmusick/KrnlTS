import React, { useState, useEffect } from 'react';
import { KrnlButton, KrnlDropdown, KrnlTextInput, KrnlNumberInput, KrnlToggle, KrnlTile, useSharedSlot } from '../../atoms/index.js';

export default function Endpoint_createUser() {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phantomActive, setPhantomActive] = useState(false);

  const slot_nameSelector = useSharedSlot('nameSelector');

  // Subscribe to live SSE events for phantom mirroring
  useEffect(() => {
    const sse = new EventSource('/sse/createUser');
    sse.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === 'frontend:interaction' || msg.input !== undefined) {
          if (msg.input) setFormData((prev) => ({ ...prev, ...msg.input }));
          if (msg.output !== undefined) {
            const payload = msg.output?.payload !== undefined ? msg.output.payload : msg.output;
            setResponse(payload);
          }
          setPhantomActive(true);
          setTimeout(() => setPhantomActive(false), 2000);
        }
      } catch (e) {}
    };
    return () => sse.close();
  }, []);

  

  // Populate output shared components when response arrives
  useEffect(() => {
    if (response === null) return;
    
  }, [response]);

  const handleInputChange = (field: string, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const executeRequest = async (overrideData?: Record<string, any>) => {
    setLoading(true);
    setError(null);
    try {
      const payloadData = overrideData || formData;
      const res = await fetch('api/createUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadData),
      });
      const data = await res.json();
      const payload = data.payload !== undefined ? data.payload : data;
      setResponse(payload);
    } catch (err: any) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeRequest();
  };

  return (
    <div
      className={`krnl-endpoint-card ${phantomActive ? 'krnl-phantom-active' : ''}`}
      style={{
        background: 'var(--krnl-bg-surface)',
        padding: '1.5rem',
        borderRadius: '12px',
        border: phantomActive ? '2px solid var(--krnl-accent)' : '1px solid var(--krnl-border-color)',
        transition: 'all 0.3s ease',
        boxShadow: phantomActive ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none',
        position: 'relative'
      }}
    >
      {phantomActive && (
        <div className="krnl-phantom-badge" style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--krnl-accent)', color: '#000', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
          🤖 Phantom Execution Active
        </div>
      )}
      <h3 style={{ marginBottom: '1rem', color: 'var(--krnl-primary)' }}>Endpoint: createUser</h3>
      <form onSubmit={handleSubmit}>
        <KrnlDropdown label="Select Username" value={formData['username'] !== undefined ? formData['username'] : (slot_nameSelector.value || '')} options={slot_nameSelector.options} onChange={(v) => { slot_nameSelector.setValue(v); handleInputChange('username', v); }} />
        <KrnlTextInput label="Email Address" value={formData['email'] || ''} onChange={(v) => handleInputChange('email', v)} placeholder="" />
        <KrnlNumberInput label="Age" value={formData['age'] || ''} onChange={(v) => handleInputChange('age', v)} placeholder="" />
        <KrnlToggle label="Is Administrator?" value={!!formData['isAdmin']} onChange={(v) => handleInputChange('isAdmin', v)} />
        <KrnlButton type="submit" disabled={loading} label={loading ? 'Executing...' : 'Execute createUser'} icon="⚡" />
      </form>

      {error && <div style={{ color: 'var(--krnl-danger)', marginTop: '1rem' }}>Error: {error}</div>}

      {response !== null && (
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--krnl-border-color)', paddingTop: '1rem' }}>
          <h4 style={{ marginBottom: '0.5rem', color: 'var(--krnl-accent)' }}>Output Response</h4>
          <KrnlTile title="User ID" value={String(response['id'] !== undefined ? response['id'] : response)} />
          <KrnlTile title="Username" value={String(response['username'] !== undefined ? response['username'] : response)} />
        </div>
      )}
    </div>
  );
}
