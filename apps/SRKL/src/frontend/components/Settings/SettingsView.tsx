'use client';

/**
 * @file SettingsView.tsx
 * @description Settings and Hub preferences view for SRKL.
 * Conforms strictly to Skipo code limits (<200 lines) and theme system.
 */

import React, { useState } from 'react';
import { Settings, CheckCircle2, RotateCcw, Database, X } from 'lucide-react';
import { useHub } from '../../context/HubContext';
import { DockPosition } from '@/libraries/types/srkl';
import { BaseIconButton } from '../common/BaseIconButton';
import { BaseInput } from '@skipo/ui';
import { WorkspaceStorageSection } from './WorkspaceStorageSection';
import { ThemeAppearanceSection } from './ThemeAppearanceSection';
import { DockErgonomicsSection } from './DockErgonomicsSection';

export function SettingsView(): React.ReactElement {
  const { settings, updateSettings, setActiveTab } = useHub();
  const [saved, setSaved] = useState(false);

  const notifySaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePositionChange = (pos: DockPosition) => {
    updateSettings({ dockPosition: pos });
    notifySaved();
  };

  const handleAutoHideToggle = (autoHide: boolean) => {
    updateSettings({ autoHideDock: autoHide });
    notifySaved();
  };

  const handleSyncIntervalChange = (val: number) => {
    updateSettings({ autoSyncIntervalSec: val });
    notifySaved();
  };

  const handleResetStorage = () => {
    if (window.confirm('Reset local SRKL preferences and reload? Service accounts stored in the workspace vault will not be changed.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div id="srkl-settings-view" className="space-y-6 max-w-4xl mx-auto w-full font-mono text-xs pb-16 animate-fade-in select-none">
      <div
        className="pb-3 flex justify-between items-center border-b-2"
        style={{ borderColor: 'var(--skipo-border-color)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 border-2 flex items-center justify-center shadow-sm"
            style={{
              borderColor: 'var(--skipo-accent)',
              backgroundColor: 'var(--skipo-matte-bg)',
              color: 'var(--skipo-accent)',
              borderRadius: 'var(--skipo-radius-sm)',
            }}
          >
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1
              className="text-sm font-black tracking-wider uppercase"
              style={{ color: 'var(--skipo-text)' }}
            >
              HUB CONFIGURATION
            </h1>
            <span
              className="text-[10px] uppercase tracking-wide"
              style={{ color: 'var(--skipo-text-muted)' }}
            >
              THEME, PERSISTENCE & ERGONOMICS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: 'var(--skipo-success)' }}>
              <CheckCircle2 className="w-3.5 h-3.5" /> SAVED
            </span>
          )}
          <BaseIconButton
            tooltip="Close Settings (Back to Services)"
            icon={<X className="w-4 h-4" />}
            variant="secondary"
            size="sm"
            onClick={() => setActiveTab('SERVICES')}
          />
        </div>
      </div>

      <div className="space-y-4">
        {/* Theme & Visual Pack Selector */}
        <ThemeAppearanceSection
          onThemeChanged={(themeKey) => {
            updateSettings({ theme: themeKey });
            notifySaved();
          }}
        />

        {/* Workspace Storage & Cloud Bucket Section */}
        <WorkspaceStorageSection />

        {/* Dock Ergonomics */}
        <DockErgonomicsSection
          dockPosition={settings.dockPosition}
          autoHideDock={settings.autoHideDock}
          onPositionChange={handlePositionChange}
          onAutoHideToggle={handleAutoHideToggle}
        />

        {/* Surveillance Cadence */}
        <div
          className="p-4 border-2 space-y-2"
          style={{
            backgroundColor: 'var(--skipo-surface)',
            borderColor: 'var(--skipo-border-color)',
            boxShadow: 'var(--skipo-shadow)',
            borderRadius: 'var(--skipo-radius)',
          }}
        >
          <span className="text-xs font-bold uppercase block" style={{ color: 'var(--skipo-text)' }}>
            Surveillance Telemetry Cadence
          </span>
          <div>
            <label className="block mb-1 text-[10px] uppercase font-bold" style={{ color: 'var(--skipo-text-muted)' }}>
              Auto-Sync Interval (seconds)
            </label>
            <BaseInput
              type="number"
              min={10}
              max={600}
              value={settings.autoSyncIntervalSec}
              onChange={(e) => handleSyncIntervalChange(Number(e.target.value))}
              className="w-32 px-2.5 py-1.5 outline-none font-mono text-xs border"
            />
          </div>
        </div>

        {/* Storage Reset */}
        <div
          className="p-4 border-2 space-y-2"
          style={{
            backgroundColor: 'var(--skipo-surface)',
            borderColor: 'var(--skipo-border-color)',
            boxShadow: 'var(--skipo-shadow)',
            borderRadius: 'var(--skipo-radius)',
          }}
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase" style={{ color: 'var(--skipo-danger)' }}>
            <Database className="w-4 h-4" />
            <span>Local Storage Vault Reset</span>
          </div>
          <p className="text-[10px]" style={{ color: 'var(--skipo-text-muted)' }}>
            Purges cached telemetry, custom definitions, and restarts SRKL from defaults.
          </p>
          <div className="pt-1">
            <BaseIconButton
              tooltip="Purge All Local Storage Vaults"
              icon={<RotateCcw className="w-4 h-4" />}
              variant="danger"
              size="md"
              onClick={handleResetStorage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
