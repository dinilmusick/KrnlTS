import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SharedComponentProvider } from './atoms/index.js';


function AppShell() {
  const [activeTab, setActiveTab] = useState<string>('authservice');

  return (
    <SharedComponentProvider>
      <div className="krnl-app-shell">
        <header className="krnl-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ fontSize: '1.5rem' }}>🔷</div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>MyMagneticSystem</h1>
          </div>
        </header>

        <div className="krnl-nav-tabs">
          
          <button className={`krnl-tab-btn ${activeTab === 'authservice' ? 'active' : ''}`} onClick={() => setActiveTab('authservice')}>📦 authservice</button>
        </div>

        <main className="krnl-main-body">
          
          {activeTab === 'authservice' && (
            <iframe
              src="/frontend/subapps/authservice/"
              title="authservice"
              style={{ width: '100%', height: 'calc(100vh - 160px)', border: 'none', borderRadius: '8px' }}
            />
          )}
          
        </main>
      </div>
    </SharedComponentProvider>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<AppShell />);
}
