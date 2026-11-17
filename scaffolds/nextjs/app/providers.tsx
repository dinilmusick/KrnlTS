'use client';

import { SkipoThemeProvider } from '@ultrst-armada/floks/ui';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SkipoThemeProvider defaultTheme="dark">{children}</SkipoThemeProvider>;
}
