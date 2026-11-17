/**
 * @file AppShell.tsx
 * @description Master AppShell for SRKL (Service Hub).
 * Wraps HubProvider and AppLayout.
 * Adheres to Skipo code limits (<200 lines) and One-Component-Per-File invariant.
 */

import React from 'react';
import { BottomStripProvider } from '@skipo/ui';
import { HubProvider } from '../../context/HubContext';
import { AppLayout } from './AppLayout';

export function AppShell(): React.ReactElement {
  return (
    <BottomStripProvider>
      <HubProvider>
        <AppLayout />
      </HubProvider>
    </BottomStripProvider>
  );
}
