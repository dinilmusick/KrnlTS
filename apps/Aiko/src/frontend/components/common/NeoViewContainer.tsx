/**
 * ASCII Architecture Flowchart: NeoViewContainer
 *
 *   ┌──────────────────────────────────┐
 *   │   Initialize NeoViewContainer    │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │         NeoViewContainer         │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

interface NeoViewContainerProps {
  titleIcon?: LucideIcon;
  onCloseToGraph?: () => void;
  children: React.ReactNode;
}


// ════ NEOVIEWCONTAINER IMPLEMENTATION ═════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const NeoViewContainer: React.FC<NeoViewContainerProps> = ({
  children
}) => {
  return (
    <div className="absolute inset-0 z-20 flex flex-col p-4 md:p-6 pb-4 bg-[var(--skipo-bg)] text-[var(--skipo-text)] backdrop-blur-md transition-colors overflow-hidden animate-fadeIn">
      {/* Main Full View Content Area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-w-6xl mx-auto w-full">
        {children}
      </div>
    </div>
  );
};