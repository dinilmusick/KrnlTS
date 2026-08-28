// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import van from "vanjs-core";
import { KrnlButton } from "./KrnlButton.js";

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. DATA SCHEMAS & COMPONENT PROP INTERFACES
// ══════════════════════════════════════════════════════════════════════════════════════════

export interface WorkspaceStorageSettingsDescriptor {
  id: string;
  name: string;
  primaryStorage: {
    id: string;
    provider: string;
    status?: string;
    syncState?: string;
  };
  backupStorages: Array<{
    id: string;
    provider: string;
    status?: string;
    syncState?: string;
  }>;
  sync?: {
    mode: string;
    conflictStrategy: string;
    enabled: boolean;
  };
}

export interface KrnlWorkspaceStorageSettingsProps {
  workspace: WorkspaceStorageSettingsDescriptor;
  onTestConnection?: (endpointId: string) => Promise<{ ok: boolean; latencyMs: number }>;
  onChangePrimary?: (newPrimaryId: string) => void;
  onAddBackup?: (endpoint: any) => void;
  onDetachStorage?: (endpointId: string) => void;
  onUpdateSyncConfig?: (config: any) => void;
}

// ══════════════════════════════════════════════════════════════════════════════════════════
// 3. REACTIVE VANJS COMPONENT: KrnlWorkspaceStorageSettings
// ══════════════════════════════════════════════════════════════════════════════════════════

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * COMPONENT: KrnlWorkspaceStorageSettings
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Dedicated workspace storage and sync configuration panel located under
 *          General Settings -> Workspace -> Storage.
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
export function KrnlWorkspaceStorageSettings({
  workspace,
  onTestConnection,
  onChangePrimary,
  onDetachStorage
}: KrnlWorkspaceStorageSettingsProps): HTMLElement {
  const { div, h3, h4, span } = van.tags;

  const latency = van.state<number>(0);
  const isProbing = van.state<boolean>(false);

  const handleProbe = async (endpointId: string) => {
    isProbing.val = true;
    try {
      if (onTestConnection) {
        const res = await onTestConnection(endpointId);
        latency.val = res.latencyMs;
      } else {
        setTimeout(() => {
          latency.val = 16;
          isProbing.val = false;
        }, 300);
      }
    } finally {
      isProbing.val = false;
    }
  };

  return div(
    {
      class: "krnl-workspace-storage-settings",
      style: `
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 20px;
        background: var(--krnl-bg-surface, #141416);
        border: 1px solid var(--krnl-border, #2a2a2e);
        border-radius: var(--krnl-radius, 6px);
      `
    },

    // Header
    div(
      { style: "display: flex; align-items: center; justify-content: space-between;" },
      h3({ style: "margin: 0; font-size: 16px; font-weight: 700;" }, `STORAGE SETTINGS: ${workspace.name.toUpperCase()}`),
      div(
        { style: "display: flex; align-items: center; gap: 8px;" },
        span({ style: "display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #22c55e;" }),
        span({ style: "font-size: 12px; font-weight: 600; color: #22c55e;" }, "ACTIVE")
      )
    ),

    // Primary Storage Section
    div(
      { style: "display: flex; flex-direction: column; gap: 10px;" },
      h4({ style: "margin: 0; font-size: 13px; color: var(--krnl-text-muted, #8e8e93);" }, "PRIMARY STORAGE (CANONICAL)"),
      div(
        {
          style: `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px;
            background: var(--krnl-bg-primary, #0c0c0e);
            border: 1px solid var(--krnl-border, #2a2a2e);
            border-radius: var(--krnl-radius, 6px);
          `
        },
        div(
          { style: "display: flex; flex-direction: column; gap: 4px;" },
          span({ style: "font-weight: 700; font-size: 14px;" }, workspace.primaryStorage.provider.toUpperCase()),
          span({ style: "font-size: 11px; color: var(--krnl-text-muted, #8e8e93);" }, `Endpoint ID: ${workspace.primaryStorage.id}`)
        ),
        div(
          { style: "display: flex; align-items: center; gap: 8px;" },
          () => latency.val > 0
            ? span({ style: "font-size: 12px; color: #22c55e; font-weight: 600;" }, `${latency.val}ms`)
            : span(),
          KrnlButton({
            icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>`,
            tooltipLabel: "Test connection probe",
            onclick: () => handleProbe(workspace.primaryStorage.id)
          })
        )
      )
    ),

    // Backup Storages Section
    div(
      { style: "display: flex; flex-direction: column; gap: 10px;" },
      div(
        { style: "display: flex; align-items: center; justify-content: space-between;" },
        h4({ style: "margin: 0; font-size: 13px; color: var(--krnl-text-muted, #8e8e93);" }, "BACKUP STORAGES (REPLICAS)"),
        span({ style: "font-size: 11px; color: var(--krnl-text-muted, #8e8e93);" }, `${workspace.backupStorages.length} active backup(s)`)
      ),
      ...workspace.backupStorages.map(b =>
        div(
          {
            style: `
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 12px;
              background: var(--krnl-bg-primary, #0c0c0e);
              border: 1px solid var(--krnl-border, #2a2a2e);
              border-radius: var(--krnl-radius, 6px);
            `
          },
          div(
            { style: "display: flex; align-items: center; gap: 8px;" },
            span({ style: "font-size: 12px; font-weight: 600;" }, `☑ ${b.provider.toUpperCase()}`),
            span({ style: "font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #1a1a1e; color: #22c55e;" }, b.syncState || "SYNCED")
          ),
          div(
            { style: "display: flex; align-items: center; gap: 6px;" },
            KrnlButton({
              icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`,
              tooltipLabel: `Promote ${b.provider} to Primary Storage`,
              onclick: () => onChangePrimary?.(b.id)
            }),
            KrnlButton({
              icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10"/></svg>`,
              tooltipLabel: `Detach ${b.provider} (preserves remote data)`,
              onclick: () => onDetachStorage?.(b.id)
            })
          )
        )
      )
    ),

    // Sync Configuration Info Pill
    div(
      {
        style: `
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: var(--krnl-bg-primary, #0c0c0e);
          border: 1px solid var(--krnl-border, #2a2a2e);
          border-radius: var(--krnl-radius, 6px);
          font-size: 12px;
        `
      },
      span({ style: "color: var(--krnl-text-muted, #8e8e93);" }, "Sync Strategy:"),
      span({ style: "font-weight: 600; color: var(--krnl-accent, #d4a359);" }, `${workspace.sync?.mode ? workspace.sync.mode.toUpperCase() : "ON_WRITE"} (${workspace.sync?.conflictStrategy || "primary_wins"})`)
    )
  );
}
