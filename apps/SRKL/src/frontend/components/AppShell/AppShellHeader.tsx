/**
 * @file AppShellHeader.tsx
 * @description Top header for SRKL (Service Hub).
 * Adheres to Skipo code limits (<200 lines) and BaseIconButton inheritance.
 * Fully connected to Skipo dynamic theme tokens.
 */

import React from 'react';
import { CircleDot, RefreshCw, ShieldCheck, LogOut, Sun, Moon } from 'lucide-react';
import { useSkipoTheme, BaseButton } from '@skipo/ui';
import { useHub } from '../../context/HubContext';
import { BaseIconButton } from '../common/BaseIconButton';
import { AppShellDock } from './AppShellDock';

interface AppShellHeaderProps {
  onOpenAdminPanel?: () => void;
}

export function AppShellHeader({ onOpenAdminPanel }: AppShellHeaderProps): React.ReactElement {
  const { refreshAllSurveillance, currentUser, logout, updateSettings, activeWorkspace, switchWorkspace } = useHub();
  const { theme, toggleTheme } = useSkipoTheme();

  const handleToggleTheme = () => {
    toggleTheme();
    updateSettings({
      theme: theme === 'dark' ? 'coffee_theme' : 'black_and_gold',
    });
  };

  const activeWsName = activeWorkspace?.name || currentUser?.appProfiles?.srkl?.workspaceName || 'Workspace';

  return (
    <header
      id="srkl-header"
      className="border-b px-4 sm:px-6 py-2 flex items-center justify-between gap-4 sticky top-0 z-30 transition-colors"
      style={{
        backgroundColor: 'var(--skipo-surface)',
        borderColor: 'var(--skipo-border-color)',
        backdropFilter: 'var(--skipo-matte-blur)',
        WebkitBackdropFilter: 'var(--skipo-matte-blur)',
      }}
    >
      <div className="flex items-center gap-3 shrink-0">
        <div
          className="w-8 h-8 flex items-center justify-center border transition-transform duration-200 hover:scale-105"
          style={{
            backgroundColor: 'var(--skipo-matte-bg)',
            borderColor: 'var(--skipo-accent)',
            color: 'var(--skipo-accent)',
            boxShadow: 'var(--skipo-shadow-btn)',
            borderRadius: 'var(--skipo-radius-sm)',
          }}
        >
          <CircleDot className="w-4 h-4 animate-pulse" />
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <h1
              id="srkl-brand-title"
              className="text-base font-black tracking-wider font-mono uppercase"
              style={{ color: 'var(--skipo-text)' }}
            >
              SRKL
            </h1>
          </div>
          <p
            className="text-[10px] tracking-wide font-mono uppercase font-semibold"
            style={{ color: 'var(--skipo-text-muted)' }}
          >
            SERVICE MATRIX
          </p>
        </div>
      </div>

      {/* Stationary Top Toolbar Main Navigation Switcher */}
      <div className="flex items-center justify-center">
        <AppShellDock />
      </div>

      <div className="flex items-center gap-2 font-mono shrink-0">
        <BaseButton
          size="sm"
          variant="secondary"
          onClick={() => switchWorkspace('')}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase transition-all"
          title="Return to Isolated Workspaces Menu"
        >
          <span className="max-w-[100px] truncate">{activeWsName}</span>
        </BaseButton>

        {currentUser?.role === 'admin' && onOpenAdminPanel && (
          <BaseIconButton
            tooltip="Open Administrative Control Plane"
            icon={<ShieldCheck className="w-4 h-4" />}
            variant="primary"
            size="sm"
            onClick={onOpenAdminPanel}
            tooltipPosition="bottom"
          />
        )}

        {/* Dynamic Skipo Theme Switcher */}
        <BaseIconButton
          tooltip={theme === 'dark' ? 'Switch to Coffee Light Theme' : 'Switch to Neo Dark Theme'}
          icon={theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          variant="secondary"
          size="sm"
          onClick={handleToggleTheme}
          tooltipPosition="bottom"
        />

        <BaseIconButton
          tooltip="Refresh all service surveillance"
          icon={<RefreshCw className="w-3.5 h-3.5" />}
          variant="secondary"
          size="sm"
          onClick={() => refreshAllSurveillance()}
          tooltipPosition="bottom"
        />

        <BaseIconButton
          tooltip="Disconnect Vault Session"
          icon={<LogOut className="w-3.5 h-3.5" />}
          variant="danger"
          size="sm"
          onClick={logout}
          tooltipPosition="bottom"
        />
      </div>
    </header>
  );
}
