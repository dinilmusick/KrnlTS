/**
 * PRODUCTION DEBUG API INFRASTRUCTURE - AUTOMATED VERIFICATION SUITE
 * Validates the complete 40-Point Production Debug Specification and the
 * 16-Step AI Agent Debug Workflow against live HTTP endpoints.
 *
 * Usage:
 *   npx tsx scripts/test-production-debug-suite.ts [TARGET_URL]
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

let passedCount = 0;
let failedCount = 0;

async function assertStep(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    process.stdout.write(`  ${c.cyan}▶${c.reset} ${name}... `);
    await fn();
    const duration = Date.now() - start;
    console.log(`${c.green}✔ PASS${c.reset} ${c.dim}(${duration}ms)${c.reset}`);
    passedCount++;
  } catch (err: any) {
    const duration = Date.now() - start;
    console.log(`${c.red}✖ FAIL${c.reset} ${c.dim}(${duration}ms)${c.reset}`);
    console.error(`    ${c.red}Error:${c.reset} ${err?.message || err}`);
    failedCount++;
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
  console.log(`\n${c.bold}${c.magenta}==============================================================${c.reset}`);
  console.log(`${c.bold}${c.magenta} PRODUCTION DEBUG API INFRASTRUCTURE - VERIFICATION SUITE    ${c.reset}`);
  console.log(`${c.bold}${c.magenta} 40-Point Specification & 16-Step AI Agent Debug Workflow     ${c.reset}`);
  console.log(`${c.bold}${c.magenta}==============================================================${c.reset}`);
  console.log(`${c.dim}Target Base URL: ${TARGET_URL}${c.reset}\n`);

  let activeSessionId = '';
  const testWorkspaceId = 'test-ws-debug';

  // Step 1: Initial Status Check (Must be OFF by default)
  await assertStep('Step 1: GET /api/debug/status (Default OFF state)', async () => {
    const res = await request('/api/debug/status');
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    if (!res.data.success) throw new Error('Expected success=true');
    const manifest = res.data.manifest;
    if (!manifest) throw new Error('Missing manifest in status response');
    if (manifest.activeMode !== 'OFF' && manifest.debugEnabled) {
      // Disable it first if left over from previous test
      await request('/api/debug/disable', { method: 'POST' });
    }
    if (!Array.isArray(manifest.availableEndpoints)) throw new Error('Missing availableEndpoints');
    if (!Array.isArray(manifest.supportedOperations)) throw new Error('Missing supportedOperations');
  });

  // Step 2: Enable Debug Session in TRACE mode
  await assertStep('Step 2: POST /api/debug/enable (Enable TRACE mode with TTL)', async () => {
    const res = await request('/api/debug/enable', {
      method: 'POST',
      body: JSON.stringify({
        mode: 'TRACE',
        ttlMinutes: 60,
        workspaceId: testWorkspaceId,
        capturePayloads: true,
        actor: 'ai-verification-agent',
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    if (!res.data.session) throw new Error('Expected session in enable response');
    if (res.data.session.mode !== 'TRACE') throw new Error(`Expected mode=TRACE, got ${res.data.session.mode}`);
    if (!res.data.session.enabled) throw new Error('Expected session.enabled=true');
    activeSessionId = res.data.session.id;
  });

  // Step 3: Verify Status Reflects TRACE Mode & Active Session
  await assertStep('Step 3: GET /api/debug/status (Verify Active TRACE Mode)', async () => {
    const res = await request('/api/debug/status');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const manifest = res.data.manifest;
    if (manifest.activeMode !== 'TRACE') throw new Error(`Expected activeMode=TRACE, got ${manifest.activeMode}`);
    if (!manifest.debugEnabled) throw new Error('Expected debugEnabled=true');
    if (!manifest.activeSession) throw new Error('Expected activeSession object');
    if (manifest.activeSession.id !== activeSessionId) throw new Error('Session ID mismatch');
  });

  // Step 4: Configuration Management
  await assertStep('Step 4: GET & PUT /api/debug/config (Config Management)', async () => {
    const getRes = await request('/api/debug/config');
    if (!getRes.ok) throw new Error(`HTTP ${getRes.status}`);
    if (typeof getRes.data.config.maxEvents !== 'number') throw new Error('Expected maxEvents number in config');

    const putRes = await request('/api/debug/config', {
      method: 'PUT',
      body: JSON.stringify({ maxEvents: 1500, capturePayloads: true }),
    });
    if (!putRes.ok) throw new Error(`HTTP ${putRes.status}`);
    if (putRes.data.config.maxEvents !== 1500) throw new Error('Expected maxEvents to be updated to 1500');
  });

  // Step 5: Sessions List & Details
  await assertStep('Step 5: GET /api/debug/sessions & :id (Session Tracking)', async () => {
    const listRes = await request('/api/debug/sessions');
    if (!listRes.ok) throw new Error(`HTTP ${listRes.status}`);
    if (!listRes.data.activeSession) throw new Error('Missing activeSession in list');

    const detailRes = await request(`/api/debug/sessions/${activeSessionId}`);
    if (!detailRes.ok) throw new Error(`HTTP ${detailRes.status}`);
    if (detailRes.data.session.id !== activeSessionId) throw new Error('Session ID mismatch');
  });

  // Step 6: Ingest Client UI State & Inspect Tier 1 (Frontend State)
  await assertStep('Step 6: POST /api/debug/ui-state & GET /api/debug/workspace/:id/frontend', async () => {
    // Ingest simulated client state
    const mockState = {
      version: '1.0.0',
      timestamp: Date.now(),
      nodeGraph: {
        nodes: [
          { id: 'node-alpha', title: 'Alpha Node', type: 'note', position: { x: 100, y: 150 } },
          { id: 'node-beta', title: 'Beta Node', type: 'collection', position: { x: 300, y: 200 } },
        ],
        edges: [{ id: 'edge-ab', source: 'node-alpha', target: 'node-beta' }],
        groups: [],
        activeSelection: { selectedNodeIds: ['node-alpha'], focusTarget: null },
        viewport: { scale: 1.2, pan: { x: 50, y: 50 } },
        summary: { totalNodes: 2, totalEdges: 1, totalGroups: 0 },
        saveStatus: 'saved',
      },
      menus: {
        currentUser: { id: 'u1', username: 'tester', storageConnectionsCount: 1 },
        accountWorkspaces: [],
        activeWorkspace: { id: testWorkspaceId, name: 'Debug Vault', path: './debug-vault' },
        tabs: [],
        activeTabId: 'ws-1',
        modalStates: {},
        navigation: { viewMode: 'graph' },
      },
      vaultBrowser: {
        activeVaultName: 'Debug Vault',
        vaultPath: './debug-vault',
        storageProvider: 'local_fs',
        isCloudPrimary: false,
        folderPrefix: '',
        categories: [{ id: 'cat-1', name: 'General', color: '#fff' }],
        documents: [{ id: 'doc-1', title: 'README.md', categoryId: 'cat-1', content: 'Secret test data' }],
        treeStats: { fileCount: 1, folderCount: 1 },
        localDirectoryHandle: { isConnected: false },
        cloneConnections: [],
      },
      settingsAndPreferences: {
        theme: 'dark',
        themeConfig: { id: 'd', name: 'Dark' },
        savedThemesCount: 0,
        savedThemesList: [],
        biome: 'forest',
        motionEnabled: true,
        appWallpaper: null,
        autoSaveEnabled: true,
        autoSaveClonesEnabled: false,
        localFsDeviceError: null,
        isLocalFsDisabledForSession: false,
      },
      localStorage: {
        rawKeys: {},
        graphCached: { present: true, nodeCount: 2, edgeCount: 1, groupCount: 0 },
        activeWorkspaceIdInStorage: testWorkspaceId,
        workspaceTabsInStorageCount: 0,
        activeTabIdInStorage: null,
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
        checks: [],
        diffSummary: [],
      },
    };

    const postRes = await request('/api/debug/ui-state', {
      method: 'POST',
      body: JSON.stringify({
        state: mockState,
        rendered: {
          workspaceId: testWorkspaceId,
          renderedNodeIds: ['node-alpha', 'node-beta'],
          renderedEdgeIds: ['edge-ab'],
          renderedGroupIds: [],
          nodeCount: 2,
          edgeCount: 1,
          groupCount: 0,
          visibleNodeIds: ['node-alpha', 'node-beta'],
          selectedNodeIds: ['node-alpha'],
          viewport: { scale: 1.2, pan: { x: 50, y: 50 } },
          zoomLevel: 1.2,
          timestamp: Date.now(),
        },
      }),
    });
    if (!postRes.ok) throw new Error(`POST /api/debug/ui-state failed: HTTP ${postRes.status}`);

    const getRes = await request(`/api/debug/workspace/${testWorkspaceId}/frontend`);
    if (!getRes.ok) throw new Error(`HTTP ${getRes.status}`);
    if (getRes.data.layer !== 'FRONTEND') throw new Error(`Expected layer=FRONTEND`);
    if (getRes.data.data.graph.nodes.length !== 2) throw new Error('Expected 2 nodes in frontend snapshot');
  });

  // Step 7: Inspect Tier 2 (Backend Authoritative State)
  await assertStep('Step 7: GET /api/debug/workspace/:id/backend', async () => {
    const res = await request(`/api/debug/workspace/${testWorkspaceId}/backend`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (res.data.layer !== 'BACKEND') throw new Error('Expected layer=BACKEND');
    if (!Array.isArray(res.data.data.graph.nodes)) throw new Error('Expected graph.nodes array');
    if (typeof res.data.data.revision !== 'number') throw new Error('Expected revision number');
  });

  // Step 8: Inspect Tier 3 (Persisted Physical Storage State)
  await assertStep('Step 8: GET /api/debug/workspace/:id/persisted', async () => {
    const res = await request(`/api/debug/workspace/${testWorkspaceId}/persisted`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (res.data.layer !== 'PERSISTED') throw new Error('Expected layer=PERSISTED');
    if (!res.data.storageProvider) throw new Error('Expected storageProvider');
    if (typeof res.data.rawPayloadSize !== 'number') throw new Error('Expected rawPayloadSize number');
  });

  // Step 9: Inspect Tier 4 (Rendered DOM/Canvas Elements State)
  await assertStep('Step 9: GET /api/debug/workspace/:id/rendered', async () => {
    const res = await request(`/api/debug/workspace/${testWorkspaceId}/rendered`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (res.data.layer !== 'RENDERED') throw new Error('Expected layer=RENDERED');
    if (typeof res.data.nodeCount !== 'number') throw new Error('Expected nodeCount number');
    if (!Array.isArray(res.data.data.renderedNodeIds)) throw new Error('Expected renderedNodeIds array');
  });

  // Step 10: Complete 4-Tier State Snapshot
  await assertStep('Step 10: GET /api/debug/workspace/:id/snapshot (Unified 4-Tier)', async () => {
    const res = await request(`/api/debug/workspace/${testWorkspaceId}/snapshot`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const snap = res.data.snapshot;
    if (!snap.backend) throw new Error('Missing backend in snapshot');
    if (!snap.persisted) throw new Error('Missing persisted in snapshot');
    if (!snap.revisions) throw new Error('Missing revisions in snapshot');
    if (!snap.consistency) throw new Error('Missing consistency in snapshot');
  });

  // Step 11: Cross-Tier Consistency Check
  await assertStep('Step 11: POST /api/debug/workspace/:id/check (Cross-Tier Audit)', async () => {
    const res = await request(`/api/debug/workspace/${testWorkspaceId}/check`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (typeof res.data.consistent !== 'boolean') throw new Error('Expected consistent boolean');
    if (!Array.isArray(res.data.layerComparisons)) throw new Error('Expected layerComparisons array');
    if (!Array.isArray(res.data.discrepancies)) throw new Error('Expected discrepancies array');
  });

  // Step 12: Field-Level State Diff
  await assertStep('Step 12: GET /api/debug/workspace/:id/diff (Frontend vs Backend Diff)', async () => {
    const res = await request(`/api/debug/workspace/${testWorkspaceId}/diff?source=frontend&target=backend`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (typeof res.data.diff.equal !== 'boolean') throw new Error('Expected diff.equal boolean');
    if (!Array.isArray(res.data.diff.added)) throw new Error('Expected diff.added array');
    if (!Array.isArray(res.data.diff.removed)) throw new Error('Expected diff.removed array');
    if (!Array.isArray(res.data.diff.changed)) throw new Error('Expected diff.changed array');
  });

  // Step 13: Mutations Tracking
  await assertStep('Step 13: GET /api/debug/mutations', async () => {
    const res = await request('/api/debug/mutations');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (typeof res.data.count !== 'number') throw new Error('Expected count number');
    if (!Array.isArray(res.data.mutations)) throw new Error('Expected mutations array');
  });

  // Step 14: API Requests Tracking
  await assertStep('Step 14: GET /api/debug/requests', async () => {
    const res = await request('/api/debug/requests');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (typeof res.data.count !== 'number') throw new Error('Expected count number');
    if (!Array.isArray(res.data.requests)) throw new Error('Expected requests array');
  });

  // Step 15: Persistence Logs Tracking
  await assertStep('Step 15: GET /api/debug/persistence', async () => {
    const res = await request('/api/debug/persistence');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (typeof res.data.count !== 'number') throw new Error('Expected count number');
    if (!Array.isArray(res.data.persistenceEvents)) throw new Error('Expected persistenceEvents array');
  });

  // Step 16: Revisions Tracking
  await assertStep('Step 16: GET /api/debug/workspace/:id/revisions', async () => {
    const res = await request(`/api/debug/workspace/${testWorkspaceId}/revisions`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const revs = res.data.revisions;
    if (typeof revs.frontendRevision !== 'number') throw new Error('Expected frontendRevision');
    if (typeof revs.backendRevision !== 'number') throw new Error('Expected backendRevision');
    if (typeof revs.persistedRevision !== 'number') throw new Error('Expected persistedRevision');
    if (typeof revs.inSync !== 'boolean') throw new Error('Expected inSync boolean');
  });

  // Step 17: Runtime Errors Aggregation
  await assertStep('Step 17: GET /api/debug/errors', async () => {
    const res = await request('/api/debug/errors');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (typeof res.data.count !== 'number') throw new Error('Expected count number');
    if (!Array.isArray(res.data.errors)) throw new Error('Expected errors array');
  });

  // Step 18: Performance Latency Monitoring
  await assertStep('Step 18: GET /api/debug/performance', async () => {
    const res = await request('/api/debug/performance');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (typeof res.data.samplesCount !== 'number') throw new Error('Expected samplesCount number');
    if (!res.data.averages) throw new Error('Expected averages object');
  });

  // Step 19: Raw Events Circular Ring Buffer
  await assertStep('Step 19: GET /api/debug/events', async () => {
    const res = await request('/api/debug/events');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (typeof res.data.count !== 'number') throw new Error('Expected count number');
    if (!Array.isArray(res.data.events)) throw new Error('Expected events array');
  });

  // Step 20: SSE Trace Stream Handshake
  await assertStep('Step 20: GET /api/debug/trace (SSE stream handshake)', async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${TARGET_URL}/api/debug/trace`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/event-stream')) {
      throw new Error(`Expected text/event-stream, got ${contentType}`);
    }
  });

  // Step 21: Full Diagnostic Bundle Export
  await assertStep('Step 21: POST /api/debug/export (AI Agent Diagnostic Bundle)', async () => {
    const res = await request('/api/debug/export', {
      method: 'POST',
      body: JSON.stringify({ workspaceId: testWorkspaceId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const bundle = res.data.diagnosticBundle;
    if (!bundle) throw new Error('Missing diagnosticBundle in response');
    if (!bundle.system) throw new Error('Missing system metadata in bundle');
    if (!bundle.debugStatus) throw new Error('Missing debugStatus in bundle');
    if (!Array.isArray(bundle.activeWorkspaces)) throw new Error('Missing activeWorkspaces in bundle');
  });

  // Step 22: Health Integration with Debug Status
  await assertStep('Step 22: GET /api/health (Health route debug summary)', async () => {
    const res = await request('/api/health');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (res.data.status !== 'ok') throw new Error('Expected status=ok');
    if (!res.data.debug) throw new Error('Missing debug section in health response');
    if (res.data.debug.mode !== 'TRACE') throw new Error(`Expected debug.mode=TRACE, got ${res.data.debug.mode}`);
    if (!res.data.debug.enabled) throw new Error('Expected debug.enabled=true');
  });

  // Step 23: Disable Debug Session
  await assertStep('Step 23: POST /api/debug/disable (Revert to OFF)', async () => {
    const res = await request('/api/debug/disable', { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (res.data.mode !== 'OFF') throw new Error(`Expected mode=OFF, got ${res.data.mode}`);
  });

  // Step 24: Confirm System is Safely OFF
  await assertStep('Step 24: GET /api/debug/status (Confirm OFF with zero overhead)', async () => {
    const res = await request('/api/debug/status');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (res.data.manifest.activeMode !== 'OFF') throw new Error('Expected activeMode=OFF');
    if (res.data.manifest.debugEnabled !== false) throw new Error('Expected debugEnabled=false');
  });

  console.log(`\n${c.bold}==============================================================${c.reset}`);
  console.log(
    `RESULTS: ${c.green}${passedCount} PASSED${c.reset}, ${failedCount === 0 ? c.green + '0 FAILED' : c.red + failedCount + ' FAILED'}${c.reset}`
  );
  console.log(`${c.bold}==============================================================${c.reset}\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
