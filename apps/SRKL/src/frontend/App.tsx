import React from 'react';
import { SkipoThemeProvider } from '@skipo/ui';
import { AppShell } from './components/AppShell/AppShell';

export default function App(): React.ReactElement {
  return (
    <SkipoThemeProvider defaultTheme="dark">
      <AppShell />
    </SkipoThemeProvider>
  );
}

