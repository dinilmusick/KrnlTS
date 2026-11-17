/**
 * Automated Verification Script for Frontend UI State Debugging APIs & Sync Engine
 *
 * Validates:
 * 1. GET /api/debug/ui-state (Full UI State JSON)
 * 2. GET /api/debug/ui-state?section=nodegraph (Node Graph JSON)
 * 3. GET /api/debug/ui-state?section=menus (Workspaces & Account Menus JSON)
 * 4. GET /api/debug/ui-state?section=vault (Physical Vault Structure JSON)
 * 5. GET /api/debug/ui-state?section=settings (Settings & Preferences JSON)
 * 6. GET /api/debug/ui-state?section=localstorage (LocalStorage Snapshot JSON)
 * 7. POST /api/debug/ui-state (Live Browser State Relay Push)
 * 8. GET /api/debug/sync-audit (3-Tier Synchronization Audit Engine)
 *
 * Usage:
 *   npx tsx scripts/test-debug-ui-state.ts [TARGET_URL]
 */

export {};

const TARGET_URL = (process.argv[2] || process.env.API_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  dim: '\x1b[2m',
};

let passedSteps = 0;
let failedSteps = 0;

async function assertStep(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    process.stdout.write(`  ${c.cyan}▶${c.reset} ${name}... `);
    await fn();
    const duration = Date.now() - start;
    console.log(`${c.green}✔ PASS${c.reset} ${c.dim}(${duration}ms)${c.reset}`);
    passedSteps++;
  } catch (err: any) {
    const duration = Date.now() - start;
    console.log(`${c.red}✖ FAIL${c.reset} ${c.dim}(${duration}ms)${c.reset}`);
    console.error(`    ${c.red}Error:${c.reset} ${err?.message || err}`);
    failedSteps++;
  }
}

async function request(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${TARGET_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { rawText: text };
  }

  return { status: res.status, ok: res.ok, headers: res.headers, data: json };
}

async function main() {
  console.log(`\n${c.bold}${c.magenta}=== DOCUSTACK UI STATE & SYNC API VERIFICATION ===${c.reset}`);
  console.log(`${c.dim}Target Endpoint: ${TARGET_URL}${c.reset}\n`);

  // Step 1: Query Full UI State
  await assertStep('GET /api/debug/ui-state (Full UI State JSON)', async () => {
    const res = await request('/api/debug/ui-state');
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    if (!res.data.success) throw new Error('Response success flag is false');
    if (!res.data.data) throw new Error('Missing data payload in response');
    const state = res.data.data;
    if (!state.nodeGraph) throw new Error('Missing nodeGraph section in full state');
    if (!state.menus) throw new Error('Missing menus section in full state');
    if (!state.vaultBrowser) throw new Error('Missing vaultBrowser section in full state');
    if (!state.settingsAndPreferences) throw new Error('Missing settingsAndPreferences section in full state');
    if (!state.localStorage) throw new Error('Missing localStorage section in full state');
    if (!state.syncAudit) throw new Error('Missing syncAudit section in full state');
  });

  // Step 2: Query Node Graph Section
  await assertStep('GET /api/debug/ui-state?section=nodegraph (Node Graph JSON)', async () => {
    const res = await request('/api/debug/ui-state?section=nodegraph');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const graph = res.data.data;
    if (!Array.isArray(graph.nodes)) throw new Error('Expected nodes array in nodegraph section');
    if (!Array.isArray(graph.edges)) throw new Error('Expected edges array in nodegraph section');
    if (!graph.summary) throw new Error('Expected summary object in nodegraph section');
    if (typeof graph.summary.totalNodes !== 'number') throw new Error('Expected totalNodes count');
  });

  // Step 3: Query Workspaces & Menus Section
  await assertStep('GET /api/debug/ui-state?section=menus (Workspaces & Menus JSON)', async () => {
    const res = await request('/api/debug/ui-state?section=menus');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const menus = res.data.data;
    if (!menus.activeWorkspace) throw new Error('Expected activeWorkspace object');
    if (!Array.isArray(menus.tabs)) throw new Error('Expected tabs array');
    if (!menus.modalStates) throw new Error('Expected modalStates object');
  });

  // Step 4: Query Physical Vault Browser Section
  await assertStep('GET /api/debug/ui-state?section=vault (Physical Vault Structure JSON)', async () => {
    const res = await request('/api/debug/ui-state?section=vault');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const vault = res.data.data;
    if (!vault.activeVaultName) throw new Error('Expected activeVaultName string');
    if (!Array.isArray(vault.categories)) throw new Error('Expected categories array');
    if (!Array.isArray(vault.documents)) throw new Error('Expected documents array');
    if (!vault.treeStats) throw new Error('Expected treeStats object');
  });

  // Step 5: Query Settings & Preferences Section
  await assertStep('GET /api/debug/ui-state?section=settings (Settings & Preferences JSON)', async () => {
    const res = await request('/api/debug/ui-state?section=settings');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const settings = res.data.data;
    if (!settings.theme) throw new Error('Expected theme string');
    if (!settings.themeConfig) throw new Error('Expected themeConfig object');
    if (typeof settings.autoSaveEnabled !== 'boolean') throw new Error('Expected autoSaveEnabled boolean');
  });

  // Step 6: Query LocalStorage Snapshot Section
  await assertStep('GET /api/debug/ui-state?section=localstorage (LocalStorage Snapshot JSON)', async () => {
    const res = await request('/api/debug/ui-state?section=localstorage');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const storage = res.data.data;
    if (typeof storage.rawKeys !== 'object') throw new Error('Expected rawKeys dictionary');
    if (!storage.graphCached) throw new Error('Expected graphCached object');
  });

  // Step 7: Push Live UI State (Browser Relay Simulation)
  await assertStep('POST /api/debug/ui-state (Live Browser State Relay Push)', async () => {
    const mockState = {
      version: '1.0.0-test',
      timestamp: Date.now(),
      nodeGraph: {
        nodes: [
          {
            id: 'test-node-1',
            type: 'folder',
            title: 'DEBUG_TEST_VAULT',
            x: 200,
            y: 200,
            tags: ['TEST', 'DEBUG'],
            isWorkspaceRoot: true,
          },
          {
            id: 'test-node-2',
            type: 'collection',
            title: 'KANBAN_TEST_COLLECTION',
            x: 450,
            y: 200,
            tags: ['KANBAN'],
          },
        ],
        edges: [
          {
            id: 'edge-test-1',
            source: 'test-node-1',
            target: 'test-node-2',
          },
        ],
        groups: [],
        activeSelection: { selectedNodeIds: ['test-node-1'], focusTarget: null },
        viewport: { scale: 1.2, pan: { x: 50, y: 50 } },
        summary: {
          totalNodes: 2,
          totalEdges: 1,
          totalGroups: 0,
          rootNodeId: 'test-node-1',
          folderNodesCount: 1,
          collectionNodesCount: 1,
          stickyNodesCount: 0,
          orphanNodesCount: 0,
        },
        saveStatus: 'saved',
      },
      menus: {
        currentUser: { id: 'usr-test', username: 'tester', email: 'test@example.com', role: 'admin', storageConnectionsCount: 1 },
        accountWorkspaces: [{ id: 'ws-test-1', name: 'TEST_WORKSPACE', workspacePath: './test-vault', createdAt: Date.now() }],
        activeWorkspace: { id: 'ws-test-1', name: 'TEST_WORKSPACE', path: './test-vault' },
        tabs: [{ id: 'tab-1', name: 'MAIN DESK', tiles: [], createdAt: Date.now() }],
        activeTabId: 'tab-1',
        modalStates: {
          isWorkspacesMenuOpen: false,
          isWorkspaceFolderSelectorOpen: false,
          isMediaVaultOpen: false,
          isAdminPanelOpen: false,
          isSettingsOpen: false,
          isVaultExplorerOpen: false,
          isLoginOpen: false,
          isDebugModalOpen: true,
        },
        navigation: { viewMode: 'graph', activeCollectionId: 'c1', activeCollectionTitle: 'Test' },
      },
      vaultBrowser: {
        activeVaultName: 'TEST_WORKSPACE',
        vaultPath: './test-vault',
        storageProvider: 'local_fs',
        isCloudPrimary: false,
        folderPrefix: 'test-vault',
        categories: [],
        documents: [],
        treeStats: { fileCount: 0, folderCount: 0 },
        localDirectoryHandle: { isConnected: true, name: 'LocalVaultFolder' },
        cloneConnections: [],
      },
      settingsAndPreferences: {
        theme: 'dark',
        themeConfig: {
          id: 'test-theme',
          name: 'Brutalist Gold',
          accent: '#D4AF37',
          accentSecondary: '#FF851B',
          base: '#1E1E24',
          surface: '#2B2B36',
          surfaceSubtle: '#24242E',
          text: '#F3EDE0',
          textMuted: '#A09D95',
          border: '#000000',
          headingFont: 'monospace',
          bodyFont: 'monospace',
          overlayColor: '#000000',
          overlayOpacity: 0.7,
          columnWallpaperOpacity: 0.15,
          columnOverlayColor: '#000000',
          columnOverlayOpacity: 0.5,
        },
        savedThemesCount: 1,
        savedThemesList: [{ id: 'test-theme', name: 'Brutalist Gold' }],
        biome: 'forest',
        motionEnabled: true,
        appWallpaper: null,
        autoSaveEnabled: true,
        autoSaveClonesEnabled: false,
        localFsDeviceError: null,
        isLocalFsDisabledForSession: false,
      },
      localStorage: {
        rawKeys: { docustack_active_workspace_id: 'ws-test-1', docustack_auto_save: true },
        graphCached: { present: true, nodeCount: 2, edgeCount: 1, groupCount: 0, updatedAt: Date.now() },
        activeWorkspaceIdInStorage: 'ws-test-1',
        workspaceTabsInStorageCount: 1,
        activeTabIdInStorage: 'tab-1',
        autoSaveInStorage: true,
        autoSaveClonesInStorage: false,
      },
      syncAudit: {
        isSynced: true,
        syncScorePercent: 100,
        totalChecks: 7,
        passedChecks: 7,
        failedChecks: 0,
        timestamp: Date.now(),
        checks: [
          { name: 'Node Graph: Node Count Equivalence', passed: true, uiValue: 2, storageValue: 2 },
          { name: 'Node Graph: Edge Count Equivalence', passed: true, uiValue: 1, storageValue: 1 },
          { name: 'Workspaces: Active Workspace ID Sync', passed: true, uiValue: 'ws-test-1', storageValue: 'ws-test-1' },
          { name: 'Settings: Auto-Save Preference Match', passed: true, uiValue: true, storageValue: true },
        ],
        diffSummary: [],
      },
    };

    const res = await request('/api/debug/ui-state', {
      method: 'POST',
      body: JSON.stringify({
        state: mockState,
        clientMeta: {
          url: 'http://localhost:3000',
          userAgent: 'DocuStackTestRunner/1.0',
        },
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    if (res.data.message !== 'UI_STATE_RECEIVED') throw new Error(`Unexpected message: ${res.data.message}`);

    // Verify GET immediately returns the relayed state
    const verifyRes = await request('/api/debug/ui-state?section=nodegraph');
    if (!verifyRes.ok) throw new Error(`Verification HTTP ${verifyRes.status}`);
    if (verifyRes.data.data.nodes.length !== 2) {
      throw new Error(`Expected 2 nodes after relay, got ${verifyRes.data.data.nodes.length}`);
    }
  });

  // Step 8: Query 3-Tier Synchronization Audit
  await assertStep('GET /api/debug/sync-audit (3-Tier Synchronization Audit Engine)', async () => {
    const res = await request('/api/debug/sync-audit');
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    if (!res.data.success) throw new Error('Response success flag is false');
    if (typeof res.data.syncScorePercent !== 'number') throw new Error('Missing syncScorePercent');
    if (!res.data.auditDetails) throw new Error('Missing auditDetails');
    if (!res.data.auditDetails.nodeGraph) throw new Error('Missing auditDetails.nodeGraph');
  });

  console.log(`\n${c.bold}SUMMARY:${c.reset} ${c.green}${passedSteps} Passed${c.reset}, ${failedSteps > 0 ? c.red : c.dim}${failedSteps} Failed${c.reset}\n`);

  if (failedSteps > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error in test runner:', err);
  process.exit(1);
});
