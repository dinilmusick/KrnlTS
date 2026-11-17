/**
 * Canonical Skipo Settings Page for Aiko.
 * Required tabs: Themes and Accounts.
 */
import React, { useState } from 'react';
import { BaseButton, BaseBadge } from '@ultrst-armada/floks';
import { Database, ArrowLeft, Shield } from 'lucide-react';
import { ThemesPage } from './tabs/themes/page.js';
import { AccountsPage } from './tabs/accounts/page.js';

export interface SettingsPageProps {
  theme: string;
  onToggleTheme: () => void;
  currentUserEmail?: string;
  systemDbStatus?: {
    clusterName?: string;
    connected?: boolean;
    latencyMs?: number;
    encryption?: string;
  };
  onLogout: () => void;
  onBack: () => void;
}

export function SettingsPage({
  theme,
  onToggleTheme,
  currentUserEmail,
  systemDbStatus,
  onLogout,
  onBack,
}: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<'themes' | 'accounts'>('themes');
  const status = systemDbStatus;

  return (
    <div className="flex-1 flex flex-col p-6 max-w-4xl mx-auto w-full gap-6 text-[var(--skipo-text,#f8fafc)]">
      <div className="flex items-center justify-between pb-4 border-b border-[var(--skipo-border-color,#252d3d)]">
        <div className="flex items-center gap-3">
          <BaseButton onClick={onBack} size="sm" icon={<ArrowLeft size={14} />}>Back</BaseButton>
          <h1 className="text-xl font-black uppercase tracking-wider">Aiko Settings</h1>
        </div>
        <BaseBadge variant={theme === 'dark' ? 'accent' : 'neutral'}>
          {(theme || 'unknown').toUpperCase()} MODE
        </BaseBadge>
      </div>

      <div className="flex gap-2 border-b border-[var(--skipo-border-color,#252d3d)]">
        <BaseButton variant={activeTab === 'themes' ? 'accent' : 'secondary'} onClick={() => setActiveTab('themes')}>
          Themes
        </BaseButton>
        <BaseButton variant={activeTab === 'accounts' ? 'accent' : 'secondary'} onClick={() => setActiveTab('accounts')}>
          Accounts
        </BaseButton>
      </div>

      {activeTab === 'themes' ? (
        <ThemesPage theme={theme} onToggleTheme={onToggleTheme} />
      ) : (
        <AccountsPage currentUserEmail={currentUserEmail} onLogout={onLogout} />
      )}

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 font-bold uppercase text-sm tracking-wide">
          <Database size={18} />
          System Database
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 border border-[var(--skipo-border-color,#252d3d)] rounded">
            <span className="text-[var(--skipo-text-muted,#94a3b8)] block">CLUSTER</span>
            <span className="font-black">{status?.clusterName || 'Unknown'}</span>
          </div>
          <div className="p-3 border border-[var(--skipo-border-color,#252d3d)] rounded">
            <span className="text-[var(--skipo-text-muted,#94a3b8)] block">STATUS</span>
            <span className="font-black">{status ? (status.connected ? 'ONLINE' : 'DEGRADED') : 'UNKNOWN'}</span>
          </div>
          <div className="p-3 border border-[var(--skipo-border-color,#94a3b8)] rounded">
            <span className="text-[var(--skipo-text-muted,#94a3b8)] block">LATENCY</span>
            <span className="font-black">{typeof status?.latencyMs === 'number' ? status.latencyMs + ' ms' : 'Unknown'}</span>
          </div>
          <div className="p-3 border border-[var(--skipo-border-color,#252d3d)] rounded">
            <span className="text-[var(--skipo-text-muted,#94a3b8)] block">ENCRYPTION</span>
            <span className="font-black flex items-center gap-1">
              <Shield size={12} />
              {status?.encryption || 'Unknown'}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SettingsPage;
