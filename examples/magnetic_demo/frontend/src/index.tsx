import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SharedComponentProvider } from './atoms/index.js';


function AppShell() {
  const [activeTab, setActiveTab] = useState<string>('authservice');

  return (
    <SharedComponentProvider>
      <div className="krnl-app-shell">
        <header className="krnl-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>⬡</span>
            <h1>MyMagneticSystem</h1>
          </div>
        </header>

        <div className="krnl-nav-tabs">
          
          <button className={`krnl-tab-btn ${activeTab === 'authservice' ? 'active' : ''}`} onClick={() => setActiveTab('authservice')} title="authservice"><span>📦</span><span className="krnl-tab-label">authservice</span></button>
          <button className={`krnl-tab-btn ${activeTab === 'nonkrnlapp' ? 'active' : ''}`} onClick={() => setActiveTab('nonkrnlapp')} title="nonkrnlapp"><span>📦</span><span className="krnl-tab-label">nonkrnlapp</span></button>
        </div>

        <main className="krnl-main-body">
          
          {activeTab === 'authservice' && (
            <iframe
              src={'/' + 'authservice' + '/frontend/'}
              title="authservice"
              style={{ width: '100%', height: 'calc(100vh - 160px)', border: 'none', borderRadius: '8px' }}
            />
          )}
          {activeTab === 'nonkrnlapp' && (
            <iframe
              src={'/' + 'nonkrnlapp' + '/frontend/'}
              title="nonkrnlapp"
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
