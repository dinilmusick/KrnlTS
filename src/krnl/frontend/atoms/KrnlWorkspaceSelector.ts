// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import van from "vanjs-core";
import { KrnlButton } from "./KrnlButton.js";
import { KrnlWorkspaceTile } from "./KrnlWorkspaceTile.js";

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. DATA SCHEMAS & COMPONENT PROP INTERFACES
// ══════════════════════════════════════════════════════════════════════════════════════════

export interface WorkspaceStorageSummary {
  id: string;
  name: string;
  icon?: string;
  primaryStorage: {
    id: string;
    provider: string;
    syncState?: "SYNCED" | "OUT_OF_SYNC" | "SYNCING" | "ERROR";
  };
  backupStorages?: Array<{
    id: string;
    provider: string;
    syncState?: string;
  }>;
}

export interface KrnlWorkspaceSelectorProps {
  workspaces: WorkspaceStorageSummary[];
  workspaceOrder?: string[];
  onSelectWorkspace?: (id: string) => void;
  onOpenSettings?: (id: string) => void;
  onCreateWorkspace?: () => void;
  onReorderWorkspaces?: (newOrder: string[]) => void;
}

// ══════════════════════════════════════════════════════════════════════════════════════════
// 3. REACTIVE VANJS COMPONENT: KrnlWorkspaceSelector
// ══════════════════════════════════════════════════════════════════════════════════════════

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * COMPONENT: KrnlWorkspaceSelector
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Post-login workspace selector screen rendering reorderable workspace tiles,
 *          storage summaries, sync indicators, and action for creating new workspaces.
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
export function KrnlWorkspaceSelector({
  workspaces = [],
  workspaceOrder = [],
  onSelectWorkspace,
  onOpenSettings,
  onCreateWorkspace
}: KrnlWorkspaceSelectorProps): HTMLElement {
  const { div, h2, span } = van.tags;

  // Order workspaces according to preferences.workspaceOrder
  const sortedWorkspaces = [...workspaces].sort((a, b) => {
    const idxA = workspaceOrder.indexOf(a.id);
    const idxB = workspaceOrder.indexOf(b.id);
    if (idxA === -1 && idxB === -1) return 0;
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  return div(
    {
      class: "krnl-workspace-selector",
      style: `
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 24px;
        background: var(--krnl-bg-primary, #0c0c0e);
        min-height: 100%;
      `
    },

    // Header Toolbar
    div(
      { style: "display: flex; align-items: center; justify-content: space-between;" },
      h2({ style: "margin: 0; font-size: 18px; font-weight: 700; color: var(--krnl-text-primary, #ffffff);" }, "WORKSPACES"),
      KrnlButton({
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
        tooltipLabel: "Create new workspace",
        onclick: () => onCreateWorkspace?.()
      })
    ),

    // Grid Container
    div(
      {
        style: `
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
        `
      },
      ...sortedWorkspaces.map(w =>
        KrnlWorkspaceTile({
          id: w.id,
          name: w.name,
          icon: w.icon || "📁",
          primaryProvider: w.primaryStorage.provider,
          backupProviders: (w.backupStorages || []).map((b: { provider: string }) => b.provider),
          syncStatus: w.primaryStorage.syncState || "SYNCED",
          onSelectWorkspace,
          onOpenSettings
        })
      ),

      // + New Workspace Card
      div(
        {
          class: "krnl-new-workspace-card",
          style: `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 16px;
            background: var(--krnl-bg-surface, #141416);
            border: 1px dashed var(--krnl-border, #2a2a2e);
            border-radius: var(--krnl-radius, 6px);
            min-width: 200px;
            height: 140px;
            cursor: pointer;
            transition: all 0.15s ease;
          `,
          onclick: () => onCreateWorkspace?.()
        },
        KrnlButton({
          icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
          tooltipLabel: "Add new project workspace",
          onclick: () => onCreateWorkspace?.()
        }),
        span({ style: "font-weight: 600; font-size: 13px; color: var(--krnl-text-muted, #8e8e93);" }, "+ NEW WORKSPACE")
      )
    )
  );
}
