/**
 * @file page.tsx
 * @description Canonical Skipo Main Page for Aiko.
 * Conforms to L6 (Workspace Isolation Gate) and L9 (Lines <= 200).
 */

import React from 'react';
import { AppTopToolbar } from '../../components/layout/AppTopToolbar.js';
import { ErrorBoundary } from '../../components/common/ErrorBoundary.js';
import { BottomStripProvider, BottomStrip } from '@ultrst-armada/floks';
import { KeyManagerTab } from './tabs/keys/KeyManagerTab.js';
import { DirectChatTab } from './tabs/chat/DirectChatTab.js';
import { IntelligenceSpecTab } from './tabs/intelligence/IntelligenceSpecTab.js';
import { WorkflowsTab } from './tabs/workflows/WorkflowsTab.js';
import { MetricsTab } from './tabs/metrics/MetricsTab.js';
import { SettingsPage } from '../settings/page.js';

export interface MainPageProps {
  engine: any;
  authWs: any;
}

export function MainPage({ engine, authWs }: MainPageProps) {
  const { appState, setAppState } = engine;
  const isSettings = appState.activeTab === 'settings';

  return (
    <BottomStripProvider>
      <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-[var(--skipo-bg,#0a0e17)] text-[var(--skipo-text,#f8fafc)]">
        <AppTopToolbar
          activeTab={appState.activeTab}
          onSelectTab={(tab) => setAppState((s: any) => ({ ...s, activeTab: tab }))}
          theme={appState.theme}
          onToggleTheme={engine.toggleTheme}
          totalKeys={appState.keys.length}
          activeStrategy={appState.strategy}
          activeWorkspaceName={authWs.activeWorkspace?.name || (authWs.guestSession ? 'Guest Workspace' : 'Default Vault')}
          onOpenWorkspaces={authWs.guestSession ? undefined : () => authWs.setIsWorkspacesMenuOpen(true)}
          systemDbStatus={authWs.systemDbStatus}
          currentUserEmail={authWs.currentUser?.email || (authWs.guestSession ? 'guest' : undefined)}
          onLogout={authWs.guestSession ? authWs.handleGuestLogout : authWs.handleLogout}
        />

        <div className="flex-1 relative overflow-hidden">
          <ErrorBoundary tabName={appState.activeTab} onReset={engine.loadAllData}>
            {isSettings && (
              <SettingsPage
                theme={appState.theme}
                onToggleTheme={engine.toggleTheme}
                currentUserEmail={authWs.currentUser?.email || (authWs.guestSession ? 'guest' : undefined)}
                systemDbStatus={authWs.systemDbStatus}
                onLogout={authWs.guestSession ? authWs.handleGuestLogout : authWs.handleLogout}
                onBack={engine.navigateToDefault}
              />
            )}

            {appState.activeTab === 'keys' && (
              <KeyManagerTab
                workspaceId={authWs.activeWorkspaceId}
                onCloseToGraph={engine.navigateToDefault}
                keys={appState.keys}
                usageStats={appState.usageStats}
                strategy={appState.strategy}
                initialProviderId={engine.targetKeyProvider}
                targetKeyId={engine.targetKeyId}
                highlightNonce={engine.keyManagerNonce}
                onAddKey={engine.handleAddKey}
                onVerifyKey={engine.handleVerifyKey}
                onDeleteKey={engine.handleDeleteKey}
                onUpdateKeyLabel={engine.handleUpdateKeyLabel}
                onSetStrategy={engine.handleSetStrategy}
                onRefreshKeys={engine.loadAllData}
              />
            )}

            {appState.activeTab === 'spec' && (
              <IntelligenceSpecTab
                onClose={engine.navigateToDefault}
                catalog={appState.catalog}
                presets={engine.presets}
                activePresetId={engine.activePresetId}
                onSelectPreset={(p: any) => engine.setActivePresetId(p.id)}
                onPresetsUpdated={(p: any[]) => engine.setPresets(p)}
                onSavePreset={engine.handleSavePreset}
                onDeletePreset={engine.handleDeletePreset}
                preferencesPresets={engine.preferencesPresets}
                activePreferencesPresetId={engine.activePreferencesPresetId}
                onSelectPreferencesPreset={(p: any) => engine.setActivePreferencesPresetId(p.id)}
                onPreferencesPresetsUpdated={(p: any[]) => engine.setPreferencesPresets(p)}
              />
            )}

            {(appState.activeTab === 'chat' || appState.activeTab === 'apidocs') && (
              <DirectChatTab
                onCloseToGraph={engine.navigateToDefault}
                catalog={appState.catalog}
                keys={appState.keys}
                presets={engine.presets}
                activePresetId={engine.activePresetId}
                onSelectPreset={(p: any) => engine.setActivePresetId(p.id)}
                preferencesPresets={engine.preferencesPresets}
                activePreferencesPresetId={engine.activePreferencesPresetId}
                onSelectPreferencesPreset={(p: any) => engine.setActivePreferencesPresetId(p.id)}
                onOpenSpecWindow={engine.openSpecWindow}
                onOpenKeyManager={engine.handleOpenKeyManager}
                strategy={appState.strategy}
                initialModelId={engine.selectedChatModel}
                initialProviderId={engine.selectedChatProvider}
                onRefresh={engine.loadAllData}
                onSetStrategy={engine.handleSetStrategy}
                onAddKey={engine.handleAddKey}
                activeWorkspace={authWs.activeWorkspaceId}
                activeWorkspaceName={authWs.activeWorkspace?.name || (authWs.guestSession ? 'Guest Workspace' : undefined)}
              />
            )}

            {appState.activeTab === 'workflows' && (
              <WorkflowsTab
                activeWorkspace={authWs.activeWorkspaceId}
                activeWorkspaceName={authWs.activeWorkspace?.name || (authWs.guestSession ? 'Guest Workspace' : undefined)}
                onNavigateToChat={() => setAppState((s: any) => ({ ...s, activeTab: 'chat' }))}
              />
            )}

            {appState.activeTab === 'metrics' && (
              <MetricsTab
                onCloseToGraph={engine.navigateToDefault}
                logs={appState.logs}
                summary={appState.metricsSummary}
                usageStats={appState.usageStats}
              />
            )}
          </ErrorBoundary>
        </div>

        <BottomStrip />
      </div>
    </BottomStripProvider>
  );
}

export default MainPage;
