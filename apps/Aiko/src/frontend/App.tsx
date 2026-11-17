/**
 * @file App.tsx
 * @description Master Skipo Application Entrypoint & Gate Orchestrator.
 * Gate 1 (AuthPage) -> Gate 2 (WorkspacesPage) -> Shell & Tabs (MainPage).
 * Conforms to L6 (Workspace Isolation Gate), L7 (App Architecture Spec), and L9 (Lines <= 200).
 */

import React from 'react';
import { SkipoThemeProvider } from '@ultrst-armada/floks/ui';
import { useAppEngine } from './hooks/useAppEngine.js';
import { useAuthWorkspaceEngine } from './hooks/useAuthWorkspaceEngine.js';
import { AuthPage } from './pages/auth/page.js';
import { WorkspacesPage } from './pages/menus/workspaces/page.js';
import { MainPage } from './pages/main/page.js';

export default function App() {
  const authWs = useAuthWorkspaceEngine();
  const engine = useAppEngine(Boolean(authWs.currentUser || authWs.guestSession));

  let content: React.ReactNode;
  if (!authWs.authChecked) {
    content = (
      <div
        onWheel={(e) => e.stopPropagation()}
        className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--skipo-bg,#0a0e17)] text-[var(--skipo-text,#f8fafc)] font-mono text-sm font-black select-none overscroll-contain"
      >
        <div className="flex flex-col items-center gap-3 p-6 border border-[var(--skipo-border-color,#252d3d)] bg-[var(--skipo-surface,#121722)] shadow-2xl overscroll-contain">
          <div className="w-8 h-8 border-3 border-[var(--skipo-accent,#6366f1)] border-t-transparent animate-spin rounded-full" />
          <div className="tracking-wider uppercase text-xs">INITIALIZING SYSTEM KERNEL...</div>
        </div>
      </div>
    );
  } else if (!authWs.currentUser && !authWs.guestSession) {
    content = (
      <AuthPage
        onLogin={authWs.handleLogin}
        onRegister={authWs.handleRegister}
        onGoogleSignIn={authWs.handleGoogleLogin}
        systemDbStatus={authWs.systemDbStatus}
        guestAvailable={authWs.guestAvailable}
        onContinueAsGuest={authWs.handleGuestLogin}
      />
    );
  } else if (!authWs.guestSession && (!authWs.activeWorkspaceId || authWs.isWorkspacesMenuOpen)) {
    content = (
      <WorkspacesPage
        currentUser={authWs.currentUser}
        workspaces={authWs.workspaces}
        activeWorkspaceId={authWs.activeWorkspaceId}
        systemDbStatus={authWs.systemDbStatus}
        onSelectWorkspace={authWs.handleSelectWorkspace}
        onCreateWorkspace={authWs.handleCreateWorkspace}
        onDeleteWorkspace={authWs.handleDeleteWorkspace}
        onLogout={authWs.handleLogout}
        onClose={() => authWs.setIsWorkspacesMenuOpen(false)}
        canClose={Boolean(authWs.activeWorkspaceId)}
      />
    );
  } else {
    content = <MainPage engine={engine} authWs={authWs} />;
  }

  return <SkipoThemeProvider defaultTheme="dark">{content}</SkipoThemeProvider>;
}