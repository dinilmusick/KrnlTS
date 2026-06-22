import React, { useEffect, useState } from 'react';

export default function Home() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/manifest')
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => setData({ error: err.message }));
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', background: '#111', color: '#fff', minHeight: '100vh' }}>
      <h1>Custom Next.js Frontend Dashboard</h1>
      <p>This is a custom frontend served via KrnlTS Ingress Network under <code>/frontend/dashboard/</code>.</p>
      <h2>Host Manifest Data:</h2>
      {data ? (
        <pre style={{ background: '#222', padding: '1rem', borderRadius: '4px', overflowX: 'auto' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <p>Loading manifest...</p>
      )}
    </div>
  );
}
