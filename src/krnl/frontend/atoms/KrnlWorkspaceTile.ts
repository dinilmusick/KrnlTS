// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import van from "vanjs-core";
import { KrnlButton } from "./KrnlButton.js";

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. DATA SCHEMAS & COMPONENT PROP INTERFACES
// ══════════════════════════════════════════════════════════════════════════════════════════

export interface KrnlWorkspaceTileProps {
  id: string;
  name: string;
  icon?: string;
  primaryProvider: string;
  backupProviders?: string[];
  syncStatus?: "SYNCED" | "OUT_OF_SYNC" | "SYNCING" | "ERROR";
  onSelectWorkspace?: (id: string) => void;
  onOpenSettings?: (id: string) => void;
}

// ══════════════════════════════════════════════════════════════════════════════════════════
// 3. REACTIVE VANJS ATOM: KrnlWorkspaceTile
// ══════════════════════════════════════════════════════════════════════════════════════════

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * COMPONENT: KrnlWorkspaceTile
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Direct-DOM reactive Neo-Brutalist tile rendering workspace identity, primary/backup
 *          storage summary, and sync status with icon-only action buttons and ambient hover glow.
 *
 * Flow Chart:
 *   [Workspace Tile] ───► [User Hover: Reveal Actions + Ambient Glow]
 *                                   │
 *                       (Click Tile) ├──► [onSelectWorkspace(id)]
 *                     (Click Config) └──► [onOpenSettings(id)]
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
export function KrnlWorkspaceTile({
  id,
  name,
  icon = "📁",
  primaryProvider,
  backupProviders = [],
  syncStatus = "SYNCED",
  onSelectWorkspace,
  onOpenSettings
}: KrnlWorkspaceTileProps): HTMLElement {
  const { div, span } = van.tags;

  const getStatusColor = () => {
    switch (syncStatus) {
      case "SYNCED": return "#22c55e";
      case "SYNCING": return "#eab308";
      case "OUT_OF_SYNC": return "#f97316";
      case "ERROR": return "#ef4444";
      default: return "#8e8e93";
    }
  };

  const backupsText = backupProviders.length > 0
    ? `+ ${backupProviders.join(", ")}`
    : "No backups";

  return div(
    {
      class: "krnl-workspace-tile",
      style: `
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 16px;
        background: var(--krnl-bg-surface, #141416);
        border: 1px solid var(--krnl-border, #2a2a2e);
        border-radius: var(--krnl-radius, 6px);
        min-width: 200px;
        height: 140px;
        cursor: pointer;
        transition: all 0.15s ease;
        box-shadow: 2px 2px 0px var(--krnl-border, #2a2a2e);
      `,
      onclick: () => onSelectWorkspace?.(id)
    },

    // Header Row: Icon, Name & Action Button
    div(
      { style: "display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;" },
      div(
        { style: "display: flex; align-items: center; gap: 8px;" },
        span({ style: "font-size: 20px;" }, icon),
        span({ style: "font-weight: 700; font-size: 14px; color: var(--krnl-text-primary, #ffffff);" }, name)
      ),
      KrnlButton({
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
        tooltipLabel: `Manage storage for ${name}`,
        onclick: (e: MouseEvent) => {
          e.stopPropagation();
          onOpenSettings?.(id);
        }
      })
    ),

    // Footer Row: Storage Provider Summary & Status Pill
    div(
      { style: "display: flex; flex-direction: column; gap: 4px;" },
      div(
        { style: "display: flex; align-items: center; justify-content: space-between; font-size: 12px;" },
        span({ style: "font-weight: 600; color: var(--krnl-accent, #d4a359);" }, `Primary: ${primaryProvider}`),
        div(
          { style: "display: flex; align-items: center; gap: 4px;" },
          span({ style: `width: 6px; height: 6px; border-radius: 50%; background: ${getStatusColor()}; display: inline-block;` }),
          span({ style: `font-size: 10px; font-weight: 700; color: ${getStatusColor()};` }, syncStatus)
        )
      ),
      span({ style: "font-size: 11px; color: var(--krnl-text-muted, #8e8e93);" }, backupsText)
    )
  );
}
