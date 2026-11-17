#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════════════════
# SKIPO ARCHITECTURAL STANDARDS VERIFIER: CONTROL PLANE & AUTHENTICATION ISOLATION
# ══════════════════════════════════════════════════════════════════════════════════════════
# Scans TypeScript/JavaScript code for:
# 1. Zero local SQLite or redundant local credential fallbacks (accounts.sqlite).
# 2. Zero hardcoded mock / demo accounts (admin@docustack.vault, demo@docustack.vault).
# 3. Zero demo autofill / quick preset UI buttons in login modals and pages.
# 4. Zero "Return to Workspace" back buttons in Admin Control Plane UI headers.
# 5. Admin UI isolation & back-button strictly navigating to /admin/login or logout.
# 6. Strict separation between Admin infrastructure settings and normal user settings.
# ══════════════════════════════════════════════════════════════════════════════════════════

set -euo pipefail

TARGET_DIR="${1:-.}"
ERRORS=0

echo "🔍 Scanning '$TARGET_DIR' for Control Plane and UI standards compliance..."

# Check 1: Forbidden local SQLite accounts files or code references
echo "→ Checking for forbidden 'accounts.sqlite' in source code..."
SQLITE_MATCHES=$(grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --exclude-dir={node_modules,.git,.next,target,scripts} "accounts\.sqlite" "$TARGET_DIR" || true)

if [ -n "$SQLITE_MATCHES" ]; then
  echo "❌ VIOLATION: Found 'accounts.sqlite' in source code! The Control Plane must be strictly environment-driven."
  echo "$SQLITE_MATCHES"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ PASS: No 'accounts.sqlite' references in source code."
fi

# Check 2: Forbidden mock accounts
echo "→ Checking for forbidden mock / demo account references in source code..."
for forbidden in "admin@docustack.vault" "demo@docustack.vault" "analyst@docustack.vault"; do
  MOCK_MATCHES=$(grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    --exclude-dir={node_modules,.git,.next,target,scripts} "$forbidden" "$TARGET_DIR" || true)
  if [ -n "$MOCK_MATCHES" ]; then
    echo "❌ VIOLATION: Found forbidden mock account '$forbidden' in code!"
    echo "$MOCK_MATCHES"
    ERRORS=$((ERRORS + 1))
  fi
done
if [ "$ERRORS" -eq 0 ]; then
  echo "✅ PASS: No forbidden mock accounts found in source code."
fi

# Check 3: Forbidden UI Demo Autofill Presets
echo "→ Checking for forbidden Demo Autofill / Quick Presets in UI..."
for forbidden_ui in "AUTO-FILL ADMIN" "AUTO-FILL DEMO USER" "QUICK ACCESS PRESETS" "FILL DEMO CREDENTIALS"; do
  UI_MATCHES=$(grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    --exclude-dir={node_modules,.git,.next,target,scripts} "$forbidden_ui" "$TARGET_DIR" || true)
  if [ -n "$UI_MATCHES" ]; then
    echo "❌ VIOLATION: Found forbidden UI preset '$forbidden_ui' in components!"
    echo "$UI_MATCHES"
    ERRORS=$((ERRORS + 1))
  fi
done
if [ "$ERRORS" -eq 0 ]; then
  echo "✅ PASS: No forbidden UI presets found in components."
fi

# Check 4: Forbidden Admin UI Back button returning to workspace root
echo "→ Checking for forbidden Admin UI 'Return to Workspace' back buttons..."
ADMIN_BACK_MATCHES=$(grep -rn --include="*.ts" --include="*.tsx" \
  --exclude-dir={node_modules,.git,.next,target,scripts} -E "href=[\"']\/[\"'].*title=[\"']Return to Workspace[\"']" "$TARGET_DIR" | grep -E "app/admin|components/admin" || true)

if [ -n "$ADMIN_BACK_MATCHES" ]; then
  echo "❌ VIOLATION: Found Admin UI back button navigating to workspace root ('/')! Admin back buttons must return to /admin/login."
  echo "$ADMIN_BACK_MATCHES"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ PASS: No forbidden Admin UI workspace back buttons found."
fi

# Check 5: Admin UI Header Isolation Check (Back button must target /admin/login or handleLogout)
echo "→ Checking that Admin UI pages have isolated back navigation..."
if [ -f "$TARGET_DIR/app/admin/page.tsx" ]; then
  if grep -q "ArrowLeft" "$TARGET_DIR/app/admin/page.tsx"; then
    if grep -q "handleLogout" "$TARGET_DIR/app/admin/page.tsx" || grep -q "/admin/login" "$TARGET_DIR/app/admin/page.tsx"; then
      echo "✅ PASS: Admin UI header back button properly routes to /admin/login or calls logout."
    else
      echo "❌ VIOLATION: Admin UI header back button does not route to /admin/login or call logout!"
      ERRORS=$((ERRORS + 1))
    fi
  fi
fi

# Check 6: Check that user settings modal does not leak admin database cluster controls
echo "→ Checking separation of user settings vs admin infrastructure..."
if [ -f "$TARGET_DIR/components/settings/SettingsModal.tsx" ]; then
  if grep -q "AdminDatabaseClusterTab" "$TARGET_DIR/components/settings/SettingsModal.tsx"; then
    echo "❌ VIOLATION: SettingsModal leaks AdminDatabaseClusterTab! User settings and Admin infrastructure must be completely isolated."
    ERRORS=$((ERRORS + 1))
  else
    echo "✅ PASS: User SettingsModal is cleanly isolated from Admin infrastructure controls."
  fi
fi

# Check 7: Forbidden hardcoded admin fallback credentials (todadjp@gmail.com, password123, admin123)
echo "→ Checking for forbidden hardcoded admin credentials / fallbacks in source code..."
for forbidden_cred in "todadjp@gmail.com" "password123" "admin123"; do
  CRED_MATCHES=$(grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    --exclude-dir={node_modules,.git,.next,target,scripts,backups} -i "$forbidden_cred" "$TARGET_DIR" | grep -v "email !== 'todadjp@gmail.com'" || true)
  if [ -n "$CRED_MATCHES" ]; then
    echo "❌ VIOLATION: Found forbidden hardcoded credential '$forbidden_cred' in code!"
    echo "$CRED_MATCHES"
    ERRORS=$((ERRORS + 1))
  fi
done
# Check 8: Canonical Workspace Folder Naming Law & UI Standards
echo "→ Checking canonical workspace folder naming & UI standards..."
if [ -f "$TARGET_DIR/lib/workspaceFS.ts" ] || [ -f "$TARGET_DIR/lib/auth-storage.ts" ]; then
  if grep -q "formatCanonicalWorkspaceFolderName" "$TARGET_DIR/lib/"*.ts; then
    echo "✅ PASS: formatCanonicalWorkspaceFolderName is properly implemented in backend libraries."
  else
    echo "❌ VIOLATION: formatCanonicalWorkspaceFolderName helper missing in lib/! Must enforce ultrst_{app}_{user}_{workspace}."
    ERRORS=$((ERRORS + 1))
  fi
fi

if [ -f "$TARGET_DIR/components/workspace/WorkspaceTilesMenu.tsx" ]; then
  if grep -q "Vault Folder Path" "$TARGET_DIR/components/workspace/WorkspaceTilesMenu.tsx"; then
    echo "❌ VIOLATION: WorkspaceTilesMenu.tsx still has manual 'Vault Folder Path' input! Folder path must be auto-derived."
    ERRORS=$((ERRORS + 1))
  else
    echo "✅ PASS: WorkspaceTilesMenu.tsx does not expose manual folder path inputs."
  fi
fi

# Check 9: Dynamic Storage Options Tiles Check (No hardcoded Local Disk Folder tile in StorageConnectDrawer)
echo "→ Checking for dynamic storage options tiles compliance..."
DRAWER_FILE=""
if [ -f "$TARGET_DIR/components/workspace/StorageConnectDrawer.tsx" ]; then
  DRAWER_FILE="$TARGET_DIR/components/workspace/StorageConnectDrawer.tsx"
elif [ -f "$TARGET_DIR/backend/control-plane/code/components/StorageConnectDrawer.tsx" ]; then
  DRAWER_FILE="$TARGET_DIR/backend/control-plane/code/components/StorageConnectDrawer.tsx"
fi

if [ -n "$DRAWER_FILE" ]; then
  if grep -q "Tile 1: Local Disk Folder" "$DRAWER_FILE"; then
    echo "❌ VIOLATION: $DRAWER_FILE contains hardcoded static Local Disk Folder tile! Storage options must be dynamic from saved connections."
    ERRORS=$((ERRORS + 1))
  else
    echo "✅ PASS: StorageConnectDrawer renders dynamic storage options without static hardcoded tiles."
  fi
fi

# Check 10: Storage connections and workspace preservation in auth-storage.ts
echo "→ Checking storage connections & workspace normalization preservation..."
AUTH_STORAGE_FILE=""
if [ -f "$TARGET_DIR/lib/auth-storage.ts" ]; then
  AUTH_STORAGE_FILE="$TARGET_DIR/lib/auth-storage.ts"
elif [ -f "$TARGET_DIR/backend/control-plane/code/lib/auth-storage.ts" ]; then
  AUTH_STORAGE_FILE="$TARGET_DIR/backend/control-plane/code/lib/auth-storage.ts"
fi

if [ -n "$AUTH_STORAGE_FILE" ]; then
  if grep -q "storage_connections" "$AUTH_STORAGE_FILE"; then
    echo "✅ PASS: $AUTH_STORAGE_FILE preserves user storage_connections across profiles."
  else
    echo "❌ VIOLATION: $AUTH_STORAGE_FILE does not preserve storage_connections!"
    ERRORS=$((ERRORS + 1))
  fi
fi

# Check 11: Backblaze B2 custom endpoint & region resolution support
echo "→ Checking Backblaze B2 endpoint resolution..."
STORAGE_PROV_FILE=""
if [ -f "$TARGET_DIR/lib/storage-providers.ts" ]; then
  STORAGE_PROV_FILE="$TARGET_DIR/lib/storage-providers.ts"
elif [ -f "$TARGET_DIR/backend/control-plane/code/lib/storage-providers.ts" ]; then
  STORAGE_PROV_FILE="$TARGET_DIR/backend/control-plane/code/lib/storage-providers.ts"
fi

if [ -n "$STORAGE_PROV_FILE" ]; then
  if grep -q "b2Endpoint" "$STORAGE_PROV_FILE"; then
    echo "✅ PASS: $STORAGE_PROV_FILE supports custom b2Endpoint configuration."
  else
    echo "❌ VIOLATION: $STORAGE_PROV_FILE lacks b2Endpoint configuration!"
    ERRORS=$((ERRORS + 1))
  fi
fi

# Check 12: Per-request serverless context vault resolution check
echo "→ Checking per-request serverless context vault resolution..."
if [ -n "$AUTH_STORAGE_FILE" ]; then
  if grep -q "resolveRequestContextVault" "$AUTH_STORAGE_FILE"; then
    echo "✅ PASS: $AUTH_STORAGE_FILE exports resolveRequestContextVault for serverless requests."
  else
    echo "❌ VIOLATION: $AUTH_STORAGE_FILE missing resolveRequestContextVault helper!"
    ERRORS=$((ERRORS + 1))
  fi
fi

# Check 13: Auto-Save toggle & manual save protocol in Header component
echo "→ Checking Auto-Save toggle & manual save protocol..."
HEADER_FILE=""
if [ -f "$TARGET_DIR/components/Header.tsx" ]; then
  HEADER_FILE="$TARGET_DIR/components/Header.tsx"
elif [ -f "$TARGET_DIR/backend/control-plane/code/components/Header.tsx" ]; then
  HEADER_FILE="$TARGET_DIR/backend/control-plane/code/components/Header.tsx"
fi

if [ -n "$HEADER_FILE" ]; then
  if grep -q "autoSaveEnabled" "$HEADER_FILE"; then
    echo "✅ PASS: $HEADER_FILE implements Auto-Save toggle and save controls."
  else
    echo "❌ VIOLATION: $HEADER_FILE lacks autoSaveEnabled controls!"
    ERRORS=$((ERRORS + 1))
  fi
fi

# Check 14: Cloud-first async loaders and canonical decoupled control plane directory
echo "→ Checking cloud-first async loaders & decoupled control plane directory..."
WS_FS_FILE=""
if [ -f "$TARGET_DIR/lib/workspaceFS.ts" ]; then
  WS_FS_FILE="$TARGET_DIR/lib/workspaceFS.ts"
elif [ -f "$TARGET_DIR/backend/control-plane/code/lib/workspaceFS.ts" ]; then
  WS_FS_FILE="$TARGET_DIR/backend/control-plane/code/lib/workspaceFS.ts"
fi

if [ -n "$WS_FS_FILE" ]; then
  if grep -q "loadGraphFromFSAsync" "$WS_FS_FILE" && grep -q "saveGraphToFSAsync" "$WS_FS_FILE"; then
    echo "✅ PASS: $WS_FS_FILE exports loadGraphFromFSAsync and saveGraphToFSAsync."
  else
    echo "❌ VIOLATION: $WS_FS_FILE missing cloud-first async graph loader/saver!"
    ERRORS=$((ERRORS + 1))
  fi
fi

if [ -n "$AUTH_STORAGE_FILE" ]; then
  if grep -q "getControlPlaneDir" "$AUTH_STORAGE_FILE"; then
    echo "✅ PASS: $AUTH_STORAGE_FILE exports getControlPlaneDir to decouple control plane from active workspace."
  else
    echo "❌ VIOLATION: $AUTH_STORAGE_FILE missing getControlPlaneDir!"
    ERRORS=$((ERRORS + 1))
  fi
fi

# Check 15: Dual-Mode Local Folder Picker & Brave Privacy Guard
echo "→ Checking dual-mode local folder picker & Brave privacy guard..."
DRAWER_FILE=""
if [ -f "$TARGET_DIR/components/workspace/StorageConnectDrawer.tsx" ]; then
  DRAWER_FILE="$TARGET_DIR/components/workspace/StorageConnectDrawer.tsx"
elif [ -f "$TARGET_DIR/backend/control-plane/code/components/workspace/StorageConnectDrawer.tsx" ]; then
  DRAWER_FILE="$TARGET_DIR/backend/control-plane/code/components/workspace/StorageConnectDrawer.tsx"
elif [ -f "$TARGET_DIR/backend/control-plane/code/components/StorageConnectDrawer.tsx" ]; then
  DRAWER_FILE="$TARGET_DIR/backend/control-plane/code/components/StorageConnectDrawer.tsx"
fi

if [ -n "$DRAWER_FILE" ]; then
  if grep -q "isFileSystemAccessSupported" "$DRAWER_FILE" && grep -q "brave://flags/#file-system-access-api" "$DRAWER_FILE"; then
    echo "✅ PASS: $DRAWER_FILE implements dual-mode folder picker with Brave Privacy Guard instructions."
  else
    echo "❌ VIOLATION: $DRAWER_FILE lacks File System Access detection or Brave flag instructions!"
    ERRORS=$((ERRORS + 1))
  fi
fi

# Check 16: Exact 1:1 Cloud-Identical Local Folder Mirroring & Workspace Prefix Subfolder
echo "→ Checking 1:1 cloud-identical local folder mirroring & subfolder encapsulation..."
LOCAL_FS_FILE=""
if [ -f "$TARGET_DIR/lib/local-fs-handle.ts" ]; then
  LOCAL_FS_FILE="$TARGET_DIR/lib/local-fs-handle.ts"
elif [ -f "$TARGET_DIR/backend/control-plane/code/lib/local-fs-handle.ts" ]; then
  LOCAL_FS_FILE="$TARGET_DIR/backend/control-plane/code/lib/local-fs-handle.ts"
fi

if [ -n "$LOCAL_FS_FILE" ]; then
  if grep -q "syncWorkspaceToDirectoryHandle" "$LOCAL_FS_FILE" && grep -q "workspaceSubfolder" "$LOCAL_FS_FILE"; then
    echo "✅ PASS: $LOCAL_FS_FILE exports syncWorkspaceToDirectoryHandle with canonical workspace subfolder encapsulation."
  else
    echo "❌ VIOLATION: $LOCAL_FS_FILE missing syncWorkspaceToDirectoryHandle or workspaceSubfolder resolution!"
    ERRORS=$((ERRORS + 1))
  fi
fi

# Check 17: Interactive Primary Star-Toggle on Every Storage Option Tile
echo "→ Checking interactive primary star-toggle on all storage option tiles..."
if [ -n "$DRAWER_FILE" ]; then
  if grep -q "handleSetPrimaryConnection" "$DRAWER_FILE" && grep -q "SET PRIMARY" "$DRAWER_FILE"; then
    echo "✅ PASS: $DRAWER_FILE implements interactive primary star-toggle on storage option tiles."
  else
    echo "❌ VIOLATION: $DRAWER_FILE missing interactive primary star-toggle on storage tiles!"
    ERRORS=$((ERRORS + 1))
  fi
fi

# Check 18: Safe Clone Sync Merging without Stale Overwrite
echo "→ Checking safe clone sync merging in sync-clones endpoint..."
SYNC_CLONES_FILE=""
if [ -f "$TARGET_DIR/app/api/auth/storage/sync-clones/route.ts" ]; then
  SYNC_CLONES_FILE="$TARGET_DIR/app/api/auth/storage/sync-clones/route.ts"
elif [ -f "$TARGET_DIR/backend/control-plane/code/api/auth/storage/sync-clones/route.ts" ]; then
  SYNC_CLONES_FILE="$TARGET_DIR/backend/control-plane/code/api/auth/storage/sync-clones/route.ts"
fi

if [ -n "$SYNC_CLONES_FILE" ]; then
  if grep -q "findUserByIdAsync" "$SYNC_CLONES_FILE" && grep -q "mergedConnections" "$SYNC_CLONES_FILE"; then
    echo "✅ PASS: $SYNC_CLONES_FILE safely queries fresh user state and merges storage connections."
  else
    echo "❌ VIOLATION: $SYNC_CLONES_FILE missing safe fresh user storage connection merging!"
    ERRORS=$((ERRORS + 1))
  fi
fi

# Check 19: Universal Folder Prefix in /api/workspace
echo "→ Checking universal folderPrefix in /api/workspace endpoint..."
WS_ROUTE_FILE=""
if [ -f "$TARGET_DIR/app/api/workspace/route.ts" ]; then
  WS_ROUTE_FILE="$TARGET_DIR/app/api/workspace/route.ts"
elif [ -f "$TARGET_DIR/backend/control-plane/code/api/workspace/route.ts" ]; then
  WS_ROUTE_FILE="$TARGET_DIR/backend/control-plane/code/api/workspace/route.ts"
fi

if [ -n "$WS_ROUTE_FILE" ]; then
  if grep -q "folderPrefix" "$WS_ROUTE_FILE"; then
    echo "✅ PASS: $WS_ROUTE_FILE includes folderPrefix in workspace responses."
  else
    echo "❌ VIOLATION: $WS_ROUTE_FILE missing folderPrefix in response payload!"
    ERRORS=$((ERRORS + 1))
  fi
fi

# Check 20: Zero-Asterisk Hard Deletion in Backblaze B2
echo "→ Checking zero-asterisk hard deletion in Backblaze B2 (ListObjectVersionsCommand & explicit VersionId)..."
CLOUD_STORAGE_FILE=""
if [ -f "$TARGET_DIR/lib/cloud-storage-service.ts" ]; then
  CLOUD_STORAGE_FILE="$TARGET_DIR/lib/cloud-storage-service.ts"
elif [ -f "$TARGET_DIR/backend/control-plane/code/lib/cloud-storage-service.ts" ]; then
  CLOUD_STORAGE_FILE="$TARGET_DIR/backend/control-plane/code/lib/cloud-storage-service.ts"
fi

if [ -n "$CLOUD_STORAGE_FILE" ]; then
  if grep -q "permanentDeleteS3Folder" "$CLOUD_STORAGE_FILE" && grep -q "ListObjectVersionsCommand" "$CLOUD_STORAGE_FILE" && grep -q "DeleteMarkers" "$CLOUD_STORAGE_FILE"; then
    echo "✅ PASS: $CLOUD_STORAGE_FILE implements permanentDeleteS3Folder with ListObjectVersionsCommand and explicit VersionId deletion."
  else
    echo "❌ VIOLATION: $CLOUD_STORAGE_FILE missing zero-asterisk permanent delete engine!"
    ERRORS=$((ERRORS + 1))
  fi
fi

# Check 21: Hierarchical Nested Path Resolution
echo "→ Checking hierarchical nested path resolution (resolveNodeNestedPath)..."
CANONICAL_FILE=""
if [ -f "$TARGET_DIR/lib/workspace-canonical.ts" ]; then
  CANONICAL_FILE="$TARGET_DIR/lib/workspace-canonical.ts"
elif [ -f "$TARGET_DIR/backend/control-plane/code/lib/workspace-canonical.ts" ]; then
  CANONICAL_FILE="$TARGET_DIR/backend/control-plane/code/lib/workspace-canonical.ts"
fi

if [ -n "$CANONICAL_FILE" ]; then
  if grep -q "resolveNodeNestedPath" "$CANONICAL_FILE"; then
    echo "✅ PASS: $CANONICAL_FILE exports resolveNodeNestedPath for multi-level hierarchical storage."
  else
    echo "❌ VIOLATION: $CANONICAL_FILE missing resolveNodeNestedPath!"
    ERRORS=$((ERRORS + 1))
  fi
fi

# Check 22: Post-Order Bottom-Up Deletion Sequence in Graph Deletion
echo "→ Checking post-order bottom-up deletion sequence in graph deletion..."
GRAPH_ROUTE_FILE=""
if [ -f "$TARGET_DIR/app/api/graph/route.ts" ]; then
  GRAPH_ROUTE_FILE="$TARGET_DIR/app/api/graph/route.ts"
elif [ -f "$TARGET_DIR/backend/control-plane/code/api/graph/route.ts" ]; then
  GRAPH_ROUTE_FILE="$TARGET_DIR/backend/control-plane/code/api/graph/route.ts"
fi

if [ -n "$GRAPH_ROUTE_FILE" ]; then
  if grep -q "getNodeDepth" "$GRAPH_ROUTE_FILE" && grep -q "orderedNodeIds" "$GRAPH_ROUTE_FILE"; then
    echo "✅ PASS: $GRAPH_ROUTE_FILE implements post-order depth-sorted bottom-up node deletion."
  else
    echo "❌ VIOLATION: $GRAPH_ROUTE_FILE missing topological depth-sorted deletion sequence!"
    ERRORS=$((ERRORS + 1))
  fi
fi

# Check 23: Event-Driven Persistence & Mutation Saves
echo "→ Checking pure event-driven persistence..."
PERSISTENCE_FILE=""
if [ -f "$TARGET_DIR/hooks/useWorkspacePersistence.ts" ]; then
  PERSISTENCE_FILE="$TARGET_DIR/hooks/useWorkspacePersistence.ts"
elif [ -f "$TARGET_DIR/backend/control-plane/code/hooks/useWorkspacePersistence.ts" ]; then
  PERSISTENCE_FILE="$TARGET_DIR/backend/control-plane/code/hooks/useWorkspacePersistence.ts"
fi

if [ -n "$PERSISTENCE_FILE" ]; then
  if grep -q "triggerWorkspaceMutationSave" "$PERSISTENCE_FILE"; then
    echo "✅ PASS: $PERSISTENCE_FILE exports triggerWorkspaceMutationSave for pure event-driven persistence."
  else
    echo "❌ VIOLATION: $PERSISTENCE_FILE missing triggerWorkspaceMutationSave!"
    ERRORS=$((ERRORS + 1))
  fi
fi

# Check 24: Container Renaming & Physical Folder Deduplication
echo "→ Checking container renaming & physical folder deduplication engine..."
GRAPH_FS_FILE=""
if [ -f "$TARGET_DIR/lib/workspace-fs-graph.ts" ]; then
  GRAPH_FS_FILE="$TARGET_DIR/lib/workspace-fs-graph.ts"
elif [ -f "$TARGET_DIR/backend/control-plane/code/lib/workspace-fs-graph.ts" ]; then
  GRAPH_FS_FILE="$TARGET_DIR/backend/control-plane/code/lib/workspace-fs-graph.ts"
fi

if [ -n "$GRAPH_FS_FILE" ]; then
  if grep -q "renameNodeOnDisk" "$GRAPH_FS_FILE" && grep -q "renameNodeStorageAsync" "$GRAPH_FS_FILE" && grep -q "moveDirectoryRecursive" "$GRAPH_FS_FILE"; then
    echo "✅ PASS: $GRAPH_FS_FILE implements renameNodeOnDisk and renameNodeStorageAsync."
  else
    echo "❌ VIOLATION: $GRAPH_FS_FILE missing renameNodeOnDisk or renameNodeStorageAsync!"
    ERRORS=$((ERRORS + 1))
  fi
fi

# Check 25: Cloud Directory Marker Pruning & Sweeping
echo "→ Checking cloud directory marker pruning & sweeping engine..."
if [ -n "$CLOUD_STORAGE_FILE" ]; then
  if grep -q "renameCloudWorkspaceFolder" "$CLOUD_STORAGE_FILE" && grep -q "validDirPrefixes" "$CLOUD_STORAGE_FILE"; then
    echo "✅ PASS: $CLOUD_STORAGE_FILE implements renameCloudWorkspaceFolder and validDirPrefixes sweeping."
  else
    echo "❌ VIOLATION: $CLOUD_STORAGE_FILE missing renameCloudWorkspaceFolder or validDirPrefixes sweeping!"
    ERRORS=$((ERRORS + 1))
  fi
fi

# Check 26: Graph API Renaming Protocol & Client Handles Purge
echo "→ Checking graph API renaming protocol & client handles purge..."
if [ -n "$GRAPH_ROUTE_FILE" ]; then
  if grep -q "renameNodeStorageAsync" "$GRAPH_ROUTE_FILE" && grep -q "renamedFrom" "$GRAPH_ROUTE_FILE"; then
    echo "✅ PASS: $GRAPH_ROUTE_FILE invokes renameNodeStorageAsync and returns renamedFrom/renamedTo."
  else
    echo "❌ VIOLATION: $GRAPH_ROUTE_FILE missing container rename handling in UPDATE_NODE!"
    ERRORS=$((ERRORS + 1))
  fi
fi

# Check 27: Primary Storage Elevation & Clean Canonical Vault Paths
echo "→ Checking primary storage elevation & clean canonical vault paths..."
AUTH_STORAGE_FILE=""
if [ -f "$TARGET_DIR/lib/auth-storage.ts" ]; then
  AUTH_STORAGE_FILE="$TARGET_DIR/lib/auth-storage.ts"
elif [ -f "$TARGET_DIR/backend/control-plane/code/lib/auth-storage.ts" ]; then
  AUTH_STORAGE_FILE="$TARGET_DIR/backend/control-plane/code/lib/auth-storage.ts"
fi

if [ -n "$AUTH_STORAGE_FILE" ]; then
  if grep -q "role === 'primary'" "$AUTH_STORAGE_FILE" && grep -q "extractCanonicalFolderPrefix" "$AUTH_STORAGE_FILE"; then
    echo "✅ PASS: $AUTH_STORAGE_FILE derives primary cloud connections and extracts canonical folder prefixes."
  else
    echo "❌ VIOLATION: $AUTH_STORAGE_FILE missing primary storage derivation or canonical prefix extraction!"
    ERRORS=$((ERRORS + 1))
  fi
fi

# Check 28: UI State Introspection API Route (/api/debug/ui-state)
echo "→ Checking UI State Introspection endpoint (/api/debug/ui-state)..."
DEBUG_UI_FILE=""
if [ -f "$TARGET_DIR/app/api/debug/ui-state/route.ts" ]; then
  DEBUG_UI_FILE="$TARGET_DIR/app/api/debug/ui-state/route.ts"
elif [ -f "$TARGET_DIR/backend/control-plane/code/api/debug/ui-state/route.ts" ]; then
  DEBUG_UI_FILE="$TARGET_DIR/backend/control-plane/code/api/debug/ui-state/route.ts"
fi

if [ -n "$DEBUG_UI_FILE" ]; then
  if grep -q "filterDebugStateSection" "$DEBUG_UI_FILE" && grep -q "POST" "$DEBUG_UI_FILE"; then
    echo "✅ PASS: $DEBUG_UI_FILE implements GET (with section filtering) and POST state relay."
  else
    echo "❌ VIOLATION: $DEBUG_UI_FILE missing filterDebugStateSection or POST handler!"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "❌ VIOLATION: Missing /api/debug/ui-state route! UI state introspection is required."
  ERRORS=$((ERRORS + 1))
fi

# Check 29: 3-Tier Synchronization Audit Engine Route (/api/debug/sync-audit)
echo "→ Checking 3-Tier Synchronization Audit endpoint (/api/debug/sync-audit)..."
SYNC_AUDIT_FILE=""
if [ -f "$TARGET_DIR/app/api/debug/sync-audit/route.ts" ]; then
  SYNC_AUDIT_FILE="$TARGET_DIR/app/api/debug/sync-audit/route.ts"
elif [ -f "$TARGET_DIR/backend/control-plane/code/api/debug/sync-audit/route.ts" ]; then
  SYNC_AUDIT_FILE="$TARGET_DIR/backend/control-plane/code/api/debug/sync-audit/route.ts"
fi

if [ -n "$SYNC_AUDIT_FILE" ]; then
  if grep -q "syncScorePercent" "$SYNC_AUDIT_FILE" && grep -q "auditDetails" "$SYNC_AUDIT_FILE"; then
    echo "✅ PASS: $SYNC_AUDIT_FILE implements 3-tier sync comparison audit."
  else
    echo "❌ VIOLATION: $SYNC_AUDIT_FILE missing syncScorePercent or auditDetails calculation!"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "❌ VIOLATION: Missing /api/debug/sync-audit route! Cross-tier sync audit is required."
  ERRORS=$((ERRORS + 1))
fi

# Check 30: Reactive UI State Debugger Hook & LocalStorage Mirror (useUiStateDebugger.ts)
echo "→ Checking reactive UI State Debugger hook & LocalStorage mirror..."
DEBUGGER_HOOK_FILE=""
if [ -f "$TARGET_DIR/hooks/useUiStateDebugger.ts" ]; then
  DEBUGGER_HOOK_FILE="$TARGET_DIR/hooks/useUiStateDebugger.ts"
elif [ -f "$TARGET_DIR/backend/control-plane/code/hooks/useUiStateDebugger.ts" ]; then
  DEBUGGER_HOOK_FILE="$TARGET_DIR/backend/control-plane/code/hooks/useUiStateDebugger.ts"
fi

if [ -n "$DEBUGGER_HOOK_FILE" ]; then
  if grep -q "window.DocuStackDebug" "$DEBUGGER_HOOK_FILE" && grep -q "docustack_workspace_graph_" "$DEBUGGER_HOOK_FILE"; then
    echo "✅ PASS: $DEBUGGER_HOOK_FILE registers window.DocuStackDebug and mirrors graph to LocalStorage."
  else
    echo "❌ VIOLATION: $DEBUGGER_HOOK_FILE missing window.DocuStackDebug registration or LocalStorage mirroring!"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "❌ VIOLATION: Missing hooks/useUiStateDebugger.ts! Reactive UI state debugging hook is required."
  ERRORS=$((ERRORS + 1))
fi

# Check 31: Core Debug State Schemas & Sync Audit Functions (lib/debug-ui-state.ts)
echo "→ Checking Core Debug State Schemas & Sync Audit Functions..."
DEBUG_LIB_FILE=""
if [ -f "$TARGET_DIR/lib/debug-ui-state.ts" ]; then
  DEBUG_LIB_FILE="$TARGET_DIR/lib/debug-ui-state.ts"
elif [ -f "$TARGET_DIR/backend/control-plane/code/lib/debug-ui-state.ts" ]; then
  DEBUG_LIB_FILE="$TARGET_DIR/backend/control-plane/code/lib/debug-ui-state.ts"
fi

if [ -n "$DEBUG_LIB_FILE" ]; then
  if grep -q "auditFrontendSync" "$DEBUG_LIB_FILE" && grep -q "extractLocalStorageSnapshot" "$DEBUG_LIB_FILE"; then
    echo "✅ PASS: $DEBUG_LIB_FILE implements auditFrontendSync and extractLocalStorageSnapshot."
  else
    echo "❌ VIOLATION: $DEBUG_LIB_FILE missing auditFrontendSync or extractLocalStorageSnapshot!"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "❌ VIOLATION: Missing lib/debug-ui-state.ts! Core debug state library is required."
  ERRORS=$((ERRORS + 1))
fi

# Check 32: Headless Production Debug API Infrastructure (40-Point Suite)
echo "→ Checking Headless Production Debug API Infrastructure (40-Point Suite)..."
DEBUG_TYPES_FILE=""
DEBUG_MGR_FILE=""
if [ -f "$TARGET_DIR/lib/debug-types.ts" ]; then
  DEBUG_TYPES_FILE="$TARGET_DIR/lib/debug-types.ts"
elif [ -f "$TARGET_DIR/backend/control-plane/code/lib/debug-types.ts" ]; then
  DEBUG_TYPES_FILE="$TARGET_DIR/backend/control-plane/code/lib/debug-types.ts"
fi

if [ -f "$TARGET_DIR/lib/debug-manager.ts" ]; then
  DEBUG_MGR_FILE="$TARGET_DIR/lib/debug-manager.ts"
elif [ -f "$TARGET_DIR/backend/control-plane/code/lib/debug-manager.ts" ]; then
  DEBUG_MGR_FILE="$TARGET_DIR/backend/control-plane/code/lib/debug-manager.ts"
fi

# 1. Verify debug types & manager exist
if [ -n "$DEBUG_TYPES_FILE" ] && [ -n "$DEBUG_MGR_FILE" ]; then
  if grep -q "DebugSession" "$DEBUG_TYPES_FILE" && grep -q "enableSession" "$DEBUG_MGR_FILE" && grep -q "runConsistencyCheck" "$DEBUG_MGR_FILE"; then
    echo "✅ PASS: $DEBUG_TYPES_FILE and $DEBUG_MGR_FILE implement production debug engine & consistency checks."
  else
    echo "❌ VIOLATION: Debug engine missing required session management or consistency checks!"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "❌ VIOLATION: Missing lib/debug-types.ts or lib/debug-manager.ts!"
  ERRORS=$((ERRORS + 1))
fi

# 2. Verify Headless Compliance (NO DEBUG UI)
if [ -f "$TARGET_DIR/components/debug/DebugStateModal.tsx" ] || [ -f "$TARGET_DIR/backend/control-plane/code/components/debug/DebugStateModal.tsx" ]; then
  echo "❌ VIOLATION: Found DebugStateModal.tsx! Specification mandates NO internal debug UI."
  ERRORS=$((ERRORS + 1))
else
  echo "✅ PASS: Zero internal debug UI (Headless compliance verified)."
fi

# 3. Verify Production Debug REST Routes
DEBUG_ROUTES_BASE="$TARGET_DIR/app/api/debug"
if [ ! -d "$DEBUG_ROUTES_BASE" ] && [ -d "$TARGET_DIR/backend/control-plane/code/api/debug" ]; then
  DEBUG_ROUTES_BASE="$TARGET_DIR/backend/control-plane/code/api/debug"
fi

REQUIRED_DEBUG_ROUTES=("status" "enable" "disable" "config" "mutations" "requests" "persistence" "trace" "export")
MISSING_ROUTES=0
for r in "${REQUIRED_DEBUG_ROUTES[@]}"; do
  if [ ! -f "$DEBUG_ROUTES_BASE/$r/route.ts" ]; then
    echo "❌ VIOLATION: Missing debug route /api/debug/$r/route.ts!"
    MISSING_ROUTES=$((MISSING_ROUTES + 1))
  fi
done

if [ "$MISSING_ROUTES" -eq 0 ]; then
  echo "✅ PASS: All required production debug REST routes present in $DEBUG_ROUTES_BASE."
else
  ERRORS=$((ERRORS + MISSING_ROUTES))
fi

# Check 33: API Security & Resource Governance Compliance (Canonical 8-Gate Pipeline)
echo "→ Checking API Security & Resource Governance Compliance (8-Gate Pipeline)..."
API_GOV_DIR="$TARGET_DIR/lib/api-governance"
if [ ! -d "$API_GOV_DIR" ] && [ -d "$TARGET_DIR/backend/control-plane/code/lib/api-governance" ]; then
  API_GOV_DIR="$TARGET_DIR/backend/control-plane/code/lib/api-governance"
fi

if [ -d "$API_GOV_DIR" ]; then
  REQUIRED_GOV_FILES=("create-secure-route.ts" "abuse-detector.ts" "rate-limiter.ts" "resource-budget.ts" "security-headers.ts" "error-handler.ts" "observability.ts" "types.ts" "index.ts")
  MISSING_GOV=0
  for gf in "${REQUIRED_GOV_FILES[@]}"; do
    if [ ! -f "$API_GOV_DIR/$gf" ]; then
      echo "❌ VIOLATION: Missing api-governance module file: $API_GOV_DIR/$gf!"
      MISSING_GOV=$((MISSING_GOV + 1))
    fi
  done
  if [ "$MISSING_GOV" -eq 0 ]; then
    echo "✅ PASS: Complete API Governance framework module present in $API_GOV_DIR."
  else
    ERRORS=$((ERRORS + MISSING_GOV))
  fi
else
  echo "❌ VIOLATION: Missing lib/api-governance framework directory!"
  ERRORS=$((ERRORS + 1))
fi

# Verify Edge Middleware
MIDDLEWARE_FILE="$TARGET_DIR/middleware.ts"
if [ ! -f "$MIDDLEWARE_FILE" ] && [ -f "$TARGET_DIR/backend/control-plane/code/middleware.ts" ]; then
  MIDDLEWARE_FILE="$TARGET_DIR/backend/control-plane/code/middleware.ts"
fi

if [ -f "$MIDDLEWARE_FILE" ]; then
  if grep -q "isIpBlocked" "$MIDDLEWARE_FILE" && grep -q "SECURITY_HEADERS" "$MIDDLEWARE_FILE"; then
    echo "✅ PASS: Edge security middleware active with IP blocklist and security headers."
  else
    echo "❌ VIOLATION: $MIDDLEWARE_FILE lacks isIpBlocked or SECURITY_HEADERS enforcement!"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "❌ VIOLATION: Missing middleware.ts! Edge bot filtering is required."
  ERRORS=$((ERRORS + 1))
fi

# Verify 100% of API routes use createSecureRoute
API_DIR="$TARGET_DIR/app/api"
if [ ! -d "$API_DIR" ] && [ -d "$TARGET_DIR/backend/control-plane/code/api" ]; then
  API_DIR="$TARGET_DIR/backend/control-plane/code/api"
fi

if [ -d "$API_DIR" ]; then
  UNWRAPPED_ROUTES=$(find "$API_DIR" -type f -name "route.ts" -exec grep -L "createSecureRoute" {} + || true)
  if [ -n "$UNWRAPPED_ROUTES" ]; then
    echo "❌ VIOLATION: Found unwrapped API routes without createSecureRoute! Raw exports violate Law 3."
    echo "$UNWRAPPED_ROUTES"
  else
    TOTAL_ROUTES=$(find "$API_DIR" -type f -name "route.ts" | wc -l | tr -d ' ')
    echo "✅ PASS: 100% of API routes ($TOTAL_ROUTES routes) strictly wrapped with createSecureRoute."
  fi
fi

# Check 34: Multi-Session, Refresh Token Rotation, and Progressive Trust Compliance
echo "→ Checking Session, Refresh Token Rotation, and Progressive Trust Standards..."
SESSION_MODULES=("session-manager.ts" "email-verification.ts" "trust-engine.ts" "security-events.ts")
MISSING_SESSION_MOD=0
for sm in "${SESSION_MODULES[@]}"; do
  if [ ! -f "$API_GOV_DIR/$sm" ]; then
    echo "❌ VIOLATION: Missing session/trust governance file: $API_GOV_DIR/$sm!"
    MISSING_SESSION_MOD=$((MISSING_SESSION_MOD + 1))
  fi
done
if [ "$MISSING_SESSION_MOD" -eq 0 ]; then
  echo "✅ PASS: All session and progressive trust governance modules present."
else
  ERRORS=$((ERRORS + MISSING_SESSION_MOD))
fi

# Verify auth endpoints for refresh, verify-email, resend-verification
AUTH_ENDPOINTS=("refresh/route.ts" "verify-email/route.ts" "resend-verification/route.ts")
MISSING_AUTH_ENDPOINTS=0
for ae in "${AUTH_ENDPOINTS[@]}"; do
  if [ ! -f "$API_DIR/auth/$ae" ]; then
    echo "❌ VIOLATION: Missing auth route: $API_DIR/auth/$ae!"
    MISSING_AUTH_ENDPOINTS=$((MISSING_AUTH_ENDPOINTS + 1))
  fi
done
if [ "$MISSING_AUTH_ENDPOINTS" -eq 0 ]; then
  echo "✅ PASS: Refresh token, verify-email, and resend-verification API routes present."
else
  ERRORS=$((ERRORS + MISSING_AUTH_ENDPOINTS))
fi

# Verify Invariant: Refresh token reuse detection in session-manager
if [ -f "$API_GOV_DIR/session-manager.ts" ]; then
  if grep -q "REFRESH_TOKEN_REUSE" "$API_GOV_DIR/session-manager.ts"; then
    echo "✅ PASS: Refresh token reuse theft detection implemented in session-manager."
  else
    echo "❌ VIOLATION: session-manager.ts lacks REFRESH_TOKEN_REUSE theft detection!"
    ERRORS=$((ERRORS + 1))
  fi
fi

# Verify Invariant: Progressive trust and email verification gating in createSecureRoute
if [ -f "$API_GOV_DIR/create-secure-route.ts" ]; then
  if grep -q "minimumTrustLevel" "$API_GOV_DIR/create-secure-route.ts" && grep -q "emailVerificationRequired" "$API_GOV_DIR/create-secure-route.ts"; then
    echo "✅ PASS: Progressive trust and email verification gating enforced in createSecureRoute."
  else
    echo "❌ VIOLATION: create-secure-route.ts lacks progressive trust or email verification gating!"
    ERRORS=$((ERRORS + 1))
  fi
fi

# Summary
echo "══════════════════════════════════════════════════════════════════════════════════════════"
if [ "$ERRORS" -gt 0 ]; then
  echo "❌ AUDIT FAILED: $ERRORS compliance violations detected."
  exit 1
else
  echo "🎉 AUDIT SUCCESS: All Control Plane, Auth, and UI standards strictly satisfied!"
  exit 0
fi

