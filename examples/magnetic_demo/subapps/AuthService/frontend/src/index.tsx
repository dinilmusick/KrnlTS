import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SharedComponentProvider } from './atoms/index.js';


function AppShell() {
  const [activeTab, setActiveTab] = useState<string>('welcome');

  return (
    <SharedComponentProvider>
      <div className="krnl-app-shell">
        <header className="krnl-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>⬡</span>
            <h1>AuthService</h1>
          </div>
        </header>

        <div className="krnl-nav-tabs">
          
          
        </div>

        <main className="krnl-main-body">
          
          
          <div style={{ textAlign: 'center', color: 'var(--krnl-text-muted)', paddingTop: '4rem' }}>
            <h2>Welcome to AuthService</h2>
            <p style={{ marginTop: '0.5rem' }}>No UI-enabled endpoints or sub-apps registered yet.</p>
          </div>
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
