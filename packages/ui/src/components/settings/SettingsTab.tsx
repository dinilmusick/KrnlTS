'use client';
import React, { useState } from 'react';
import { ThemeSettingsSection } from './ThemeSettingsSection.js';
import { CopyableLogViewer } from '../composite/CopyableLogViewer.js';
import { BaseCard } from '../base/BaseCard.js';
import { BaseButton } from '../base/BaseButton.js';
import { BaseBadge } from '../base/BaseBadge.js';

export interface SettingsTabProps {
  appName?: string;
  version?: string;
  systemLogs?: string[];
  activeWorkspaceName?: string;
  onResetDefaults?: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  appName = 'Skipo Application',
  version = '1.0.0',
  systemLogs = [
    'System initialization verified.',
    'Theme engine loaded default tokens.',
    'Ready for user operations.'
  ],
  activeWorkspaceName = 'Default Workspace',
  onResetDefaults
}) => {
  const [resetStatus, setResetStatus] = useState(false);

  const handleReset = () => {
    if (onResetDefaults) onResetDefaults();
    setResetStatus(true);
    setTimeout(() => setResetStatus(false), 2000);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: '24px',
        maxWidth: '840px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--skipo-border-color, #333)', paddingBottom: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--skipo-text)' }}>
            Application Settings
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--skipo-text-muted)' }}>
            Manage appearance themes, workspace diagnostics, and runtime telemetry.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BaseBadge variant="neutral">v{version}</BaseBadge>
          <BaseButton size="sm" variant={resetStatus ? 'success' : 'secondary'} onClick={handleReset} type="button">
            {resetStatus ? 'Reset Done' : 'Reset Defaults'}
          </BaseButton>
        </div>
      </div>

      {/* Built-in Theme Section */}
      <ThemeSettingsSection />

      {/* Workspace & Runtime Info */}
      <BaseCard
        variant="surface"
        depth="sm"
        style={{
          padding: '16px',
          border: '1px solid var(--skipo-border-color, #333)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--skipo-text)' }}>
            Workspace & Runtime
          </h3>
          <BaseBadge variant="success">ONLINE</BaseBadge>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '11px' }}>
          <div style={{ padding: '8px 10px', backgroundColor: 'var(--skipo-bg, #16181d)', borderRadius: '4px', border: '1px solid var(--skipo-border-color, #333)' }}>
            <span style={{ color: 'var(--skipo-text-muted)', display: 'block', marginBottom: '2px' }}>App Target</span>
            <span style={{ fontWeight: 700, color: 'var(--skipo-text)' }}>{appName}</span>
          </div>
          <div style={{ padding: '8px 10px', backgroundColor: 'var(--skipo-bg, #16181d)', borderRadius: '4px', border: '1px solid var(--skipo-border-color, #333)' }}>
            <span style={{ color: 'var(--skipo-text-muted)', display: 'block', marginBottom: '2px' }}>Active Context</span>
            <span style={{ fontWeight: 700, color: 'var(--skipo-accent, #d4af37)' }}>{activeWorkspaceName}</span>
          </div>
        </div>
      </BaseCard>

      {/* Diagnostics Logs with Top-Right Copy Button */}
      <div>
        <CopyableLogViewer
          title="Runtime Event Logs"
          logs={systemLogs}
          maxHeight="160px"
        />
      </div>
    </div>
  );
};
SettingsTab.displayName = 'SettingsTab';
