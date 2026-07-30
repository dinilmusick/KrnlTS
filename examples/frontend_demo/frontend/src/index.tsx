import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';


function AppShell() {
  const [activeTab, setActiveTab] = useState<string>('welcome');

  return (
    <div className="krnl-app-shell">
      <header className="krnl-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '1.5rem' }}>🔷</div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>MyFrontendSystem</h1>
        </div>
      </header>

      <div className="krnl-nav-tabs">
        
        
      </div>

      <main className="krnl-main-body">
        
        
        <div style={{ textAlign: 'center', color: 'var(--krnl-text-muted)', paddingTop: '4rem' }}>
          <h2>Welcome to MyFrontendSystem</h2>
          <p style={{ marginTop: '0.5rem' }}>No UI-enabled endpoints or sub-apps registered yet.</p>
        </div>
      </main>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<AppShell />);
}
