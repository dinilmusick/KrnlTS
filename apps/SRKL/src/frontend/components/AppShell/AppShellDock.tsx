/**
 * @file AppShellDock.tsx
 * @description Stationary Main Window Switcher Navigation Dock for SRKL.
 * Placed in top header toolbar.
 * Adheres strictly to Skipo code limits (<200 lines) and theme tokens.
 */

import React from 'react';
import {
  Server,
  Wrench,
  Activity,
  Settings,
} from 'lucide-react';
import { useHub } from '../../context/HubContext';
import { TabType } from '@/libraries/types/srkl';
import { BaseButton } from '@skipo/ui';
import { Tooltip } from '../common/Tooltip';

interface DockItem {
  id: TabType;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DOCK_ITEMS: DockItem[] = [
  { id: 'SERVICES', title: 'Services Hub', icon: Server },
  { id: 'SERVICE_BUILDER', title: 'Service Definition Builder', icon: Wrench },
  { id: 'ACTIVITY', title: 'Surveillance & Activity Logs', icon: Activity },
  { id: 'SETTINGS', title: 'Hub Configuration & Settings', icon: Settings },
];

export function AppShellDock(): React.ReactElement {
  const { activeTab, setActiveTab } = useHub();

  return (
    <nav
      id="srkl-dock-nav"
      aria-label="Main Navigation"
      className="flex items-center gap-1 p-1 border font-mono select-none"
      style={{
        backgroundColor: 'var(--skipo-matte-bg)',
        borderColor: 'var(--skipo-border-color)',
        borderRadius: 'var(--skipo-radius-sm)',
        boxShadow: 'var(--skipo-shadow-btn)',
      }}
    >
      {DOCK_ITEMS.map((item) => {
        const IconComponent = item.icon;
        const isActive = activeTab === item.id;
        return (
          <Tooltip
            key={item.id}
            content={`SWITCH VIEW: ${item.title.toUpperCase()}`}
            position="bottom"
          >
            <BaseButton
              id={`dock-btn-${item.id.toLowerCase()}`}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab(item.id)}
              aria-label={item.title}
              className="relative px-2.5 py-1.5 transition-all duration-150 flex items-center justify-center cursor-pointer select-none border-0"
              style={{
                borderRadius: 'var(--skipo-radius-sm)',
                backgroundColor: isActive ? 'var(--skipo-accent)' : 'transparent',
                color: isActive ? 'var(--skipo-accent-fg)' : 'var(--skipo-text-muted)',
                boxShadow: isActive ? 'var(--skipo-shadow-btn-active)' : 'none',
              }}
            >
              <IconComponent className="w-4 h-4" />
              {isActive && (
                <span
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ backgroundColor: 'var(--skipo-accent-fg)' }}
                />
              )}
            </BaseButton>
          </Tooltip>
        );
      })}
    </nav>
  );
}

