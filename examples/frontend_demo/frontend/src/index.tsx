import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SharedComponentProvider } from './atoms/index.js';
import Endpoint_createUser from './components/createUser/index.js';
import Endpoint_getNames from './components/getNames/index.js';

function AppShell() {
  const [activeTab, setActiveTab] = useState<string>('createUser');

  return (
    <SharedComponentProvider>
      <div className="krnl-app-shell">
        <header className="krnl-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>⬡</span>
            <h1>MyFrontendSystem</h1>
          </div>
        </header>

        <div className="krnl-nav-tabs">
          <button className={`krnl-tab-btn ${activeTab === 'createUser' ? 'active' : ''}`} onClick={() => setActiveTab('createUser')}>createUser</button>
          <button className={`krnl-tab-btn ${activeTab === 'getNames' ? 'active' : ''}`} onClick={() => setActiveTab('getNames')}>getNames</button>
          
        </div>

        <main className="krnl-main-body">
          {activeTab === 'createUser' && <Endpoint_createUser />}
          {activeTab === 'getNames' && <Endpoint_getNames />}
          
          
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
