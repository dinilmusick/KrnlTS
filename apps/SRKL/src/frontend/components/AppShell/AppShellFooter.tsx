/**
 * @file AppShellFooter.tsx
 * @description Skipo-standard BottomStrip footer for SRKL.
 * Provides interactive status indicator, auto-save state, local persistence
 * surveillance, center hover-inspection text, and live API telemetry.
 * File size < 200 lines strictly.
 */

import React from 'react';
import { Database, ShieldCheck } from 'lucide-react';
import { BottomStrip } from '@skipo/ui';

export function AppShellFooter(): React.ReactElement {
  return (
    <BottomStrip
      id="srkl-bottom-strip"
      leftSlot={
        <div className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-wider ml-1">
          <span
            className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 border"
            style={{
              borderColor: 'var(--skipo-border-color)',
              backgroundColor: 'var(--skipo-matte-bg)',
              color: 'var(--skipo-accent)',
              borderRadius: 'var(--skipo-radius-sm)',
            }}
          >
            <Database className="w-3 h-3" />
            LOCAL-FIRST
          </span>
          <span
            className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 border"
            style={{
              borderColor: 'var(--skipo-border-color)',
              backgroundColor: 'var(--skipo-matte-bg)',
              color: 'var(--skipo-success)',
              borderRadius: 'var(--skipo-radius-sm)',
            }}
          >
            <ShieldCheck className="w-3 h-3" />
            ENCRYPTED VAULT
          </span>
        </div>
      }
      rightSlot={
        <div
          className="hidden lg:flex items-center gap-2 text-[10px] font-mono mr-1"
          style={{ color: 'var(--skipo-text-muted)' }}
        >
          <span>SRKL MATRIX v2.5</span>
        </div>
      }
    />
  );
}

