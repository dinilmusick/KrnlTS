'use client';


import { LuthAuthPage } from '@ultrst-armada/floks/auth';
import { SkipoThemeProvider } from '@ultrst-armada/floks/ui';
import MainPage from './pages/main/page.js';
import { getSkipoApplicationId } from '../libraries/client/luthAuthClient.js';

const routes: Record<string, typeof MainPage> = { '/': MainPage, '/home': MainPage };

export function App() {
  const Page = routes[window.location.pathname] ?? MainPage;
  const applicationId = getSkipoApplicationId();

  return (
    <SkipoThemeProvider defaultTheme="dark">
      <LuthAuthPage
        ecosystemId="ultrst-armada"
        applicationId={applicationId}
        appName="KONE"
        authenticatedContent={(auth) => (
          <Page onLogout={() => void auth.signOut()} />
        )}
      />
    </SkipoThemeProvider>
  );
}

export default App;
