'use client';

import { useState } from 'react';
import { BaseButton, SkipoThemeProvider } from '@ultrst-armada/floks/ui';
import { LuthAuthPage } from '@ultrst-armada/floks/auth';
import MainPage from './pages/main/page.js';
import { getSkipoApplicationId, luthAuthClient } from '../libraries/client/luthAuthClient.js';

const routes: Record<string, typeof MainPage> = { '/': MainPage, '/home': MainPage };

export function App() {
  const Page = routes[window.location.pathname] ?? MainPage;
  const applicationId = getSkipoApplicationId();
  const [isGuest, setIsGuest] = useState(false);

  if (isGuest) {
    return (
      <SkipoThemeProvider defaultTheme="dark">
        <Page isGuest />
      </SkipoThemeProvider>
    );
  }

  return (
    <SkipoThemeProvider defaultTheme="dark">
      <LuthAuthPage
        ecosystemId="ultrst-armada"
        applicationId={applicationId}
        appName="SKIPO APP"
        onContinueAsGuest={() => setIsGuest(true)}
        authenticatedContent={
          <>
            <header style={{ display: 'flex', justifyContent: 'flex-end', padding: 12 }}>
              <BaseButton
                size="sm"
                variant="secondary"
                onClick={() => {
                  void luthAuthClient.signOut().then(() => window.location.assign('/login'));
                }}
              >
                Sign out
              </BaseButton>
            </header>
            <Page />
          </>
        }
      />
    </SkipoThemeProvider>
  );
}

export default App;
