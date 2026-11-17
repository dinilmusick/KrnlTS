/**
 * ASCII Architecture Flowchart: AppTopToolbar
 *
 *   ┌──────────────────────────────────┐
 *   │      Initialize AppTopToolbar    │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │    Define Tabs & Workspace Bar   │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │      Render TopToolbar           │
 *   └──────────────────────────────────┘
 */

import React from 'react';
import { Sparkles, Key, MessageSquare, Workflow, Database, Sun, Moon, Cpu, Folder, LogOut } from 'lucide-react';
import { TopToolbar, TopToolbarTab } from '@ultrst-armada/floks';
import { BaseButton } from '@ultrst-armada/floks';
import { useBottomStrip } from '@ultrst-armada/floks';
import { ActiveTabType } from '../../types/app.js';
import { SystemDbStatus } from '../../hooks/useAuthWorkspaceEngine.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

interface AppTopToolbarProps {
  activeTab: ActiveTabType;
  onSelectTab: (tab: ActiveTabType) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  totalKeys?: number;
  activeStrategy?: string;
  activeWorkspaceName?: string;
  onOpenWorkspaces?: () => void;
  systemDbStatus?: SystemDbStatus;
  currentUserEmail?: string;
  onLogout?: () => void;
}

// ════ APPTOPTOOLBAR IMPLEMENTATION ═════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const AppTopToolbar: React.FC<AppTopToolbarProps> = ({
  activeTab,
  onSelectTab,
  theme,
  onToggleTheme,
  totalKeys = 0,
  activeStrategy = 'priority',
  activeWorkspaceName = 'Default Vault',
  onOpenWorkspaces,
  systemDbStatus,
  currentUserEmail,
  onLogout,
}) => {
  const { setInspectionText } = useBottomStrip();

  const tabs: TopToolbarTab[] = [
    {
      id: 'spec',
      label: 'Intelligence Spec',
      icon: <Sparkles size={15} className="shrink-0" />,
    },
    {
      id: 'keys',
      label: 'API Keys Pool',
      icon: <Key size={15} className="shrink-0" />,
    },
    {
      id: 'chat',
      label: 'Aiko Chat',
      icon: <MessageSquare size={15} className="shrink-0" />,
    },
    {
      id: 'workflows',
      label: 'Workflows',
      icon: <Workflow size={15} className="shrink-0" />,
    },
  ];

  return (
    <TopToolbar
      logo={
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[var(--skipo-accent)] text-[var(--skipo-accent-fg)] flex items-center justify-center font-black text-xs shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">
            <Cpu size={14} />
          </div>
        </div>
      }
      title={
        <div className="flex items-center gap-2 font-mono">
          <span className="font-black text-xs tracking-wider">AIKO</span>
          {onOpenWorkspaces && (
            <BaseButton
              size="sm"
              variant="secondary"
              onClick={onOpenWorkspaces}
              onMouseEnter={() => setInspectionText(`WORKSPACE: ${activeWorkspaceName.toUpperCase()}`)}
              onMouseLeave={() => setInspectionText(null)}
              onFocus={() => setInspectionText(`WORKSPACE: ${activeWorkspaceName.toUpperCase()}`)}
              onBlur={() => setInspectionText(null)}
              aria-label={`Workspace: ${activeWorkspaceName}`}
              className="px-2 py-0.5"
              icon={<Folder size={12} className="text-amber-400" />}
            />
          )}
        </div>
      }
      tabs={tabs}
      activeTabId={activeTab === 'apidocs' ? 'chat' : activeTab}
      onSelectTab={(id) => onSelectTab(id as ActiveTabType)}
      actions={
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-7 h-7 rounded bg-[var(--skipo-surface)] border border-[var(--skipo-border-color)] text-[var(--skipo-text-muted)] cursor-help"
            onMouseEnter={() => setInspectionText(`SYSTEM DB: ${systemDbStatus?.clusterName || 'CONNECTED'} (${systemDbStatus?.latencyMs || 8}MS)`)}
            onMouseLeave={() => setInspectionText(null)}
          >
            <Database size={13} className={systemDbStatus?.connected !== false ? 'text-emerald-400' : 'text-amber-400'} />
          </div>

          <BaseButton
            size="sm"
            variant="secondary"
            onClick={onToggleTheme}
            onMouseEnter={() => setInspectionText(`TOGGLE THEME (${theme.toUpperCase()} MODE)`)}
            onMouseLeave={() => setInspectionText(null)}
            onFocus={() => setInspectionText(`TOGGLE THEME (${theme.toUpperCase()} MODE)`)}
            onBlur={() => setInspectionText(null)}
            aria-label="Toggle Theme"
            className="px-2"
            icon={theme === 'dark' ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-indigo-400" />}
          />

          {onLogout && (
            <BaseButton
              size="sm"
              variant="ghost"
              onClick={onLogout}
              onMouseEnter={() => setInspectionText(`DISCONNECT: ${currentUserEmail || 'User'}`)}
              onMouseLeave={() => setInspectionText(null)}
              onFocus={() => setInspectionText(`DISCONNECT: ${currentUserEmail || 'User'}`)}
              onBlur={() => setInspectionText(null)}
              aria-label={`Disconnect: ${currentUserEmail || 'User'}`}
              className="px-2"
              icon={<LogOut size={14} />}
            />
          )}
        </div>
      }
    />
  );
};