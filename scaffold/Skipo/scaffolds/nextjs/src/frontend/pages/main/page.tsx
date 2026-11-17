import React, { useState } from 'react';
import { ModuleUIHost } from '../../components/module-ui/ModuleUIHost.js';

export function MainPage({ children, isGuest }: { children?: React.ReactNode; isGuest?: boolean }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <div data-skipo-main-page="true" style={{ minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'flex-end', padding: 12 }}>
        <button type="button" onClick={() => setSettingsOpen(value => !value)}>Settings</button>
      </header>
      <main>{settingsOpen ? <div>Settings</div> : children}</main>
          <ModuleUIHost />
</div>
  );
}

export default MainPage;
