/**
 * DocuStack-Engine Programmatic API Test & Automation Suite
 * Validates the entire headless API surface:
 * - Authentication (Login/Register)
 * - Workspace isolation & creation (x-workspace-id)
 * - Kanban Categories (Stacks)
 * - Documents Lifecycle & Wink NLP Analysis/Chat
 * - Force Graph Topology Mutations (Nodes/Edges/Layout)
 * - Biome & Theme Configuration
 * - Real-Time Event Stream Mirroring (SSE/Polling)
 * - Physical & Cloud Workspace Vault Explorer
 *
 * Usage:
 *   npx tsx scripts/test-api-suite.ts [TARGET_URL]
 * Examples:
 *   npx tsx scripts/test-api-suite.ts http://localhost:3000
 *   npx tsx scripts/test-api-suite.ts https://your-deployment.vercel.app
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

async function request(path: string, options: RequestInit = {}, token?: string, workspaceId?: string) {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (workspaceId) headers.set('x-workspace-id', workspaceId);

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

  return { status: res.status, ok: res.ok, data: json };
}

async function runSuite() {
  console.log(`\n${c.bold}${c.magenta}╔══════════════════════════════════════════════════════════════════╗${c.reset}`);
  console.log(`${c.bold}${c.magenta}║       DOCUSTACK HEADLESS API SUITE & REAL-TIME VERIFICATION      ║${c.reset}`);
  console.log(`${c.bold}${c.magenta}╚══════════════════════════════════════════════════════════════════╝${c.reset}`);
  console.log(`${c.dim}Target Endpoint:${c.reset} ${c.bold}${TARGET_URL}${c.reset}\n`);

  let authToken = '';
  let currentUserId = '';
  let testWorkspaceId = '';
  let testCategoryId = '';
  let testDocId = '';

  // 1. Health & Server Telemetry Check
  await assertStep('GET /api/telemetry (Server Liveness)', async () => {
    const res = await request('/api/telemetry');
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    if (res.data.status?.toLowerCase() !== 'online') throw new Error(`Unexpected status: ${res.data.status}`);
  });

  // 2. User Authentication (Login or Register)
  await assertStep('POST /api/auth/login or /api/auth/register', async () => {
    const testEmail = 'api_runner@docustack.io';
    const testPass = 'AutomationSecret123!';

    // First attempt login
    let loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail, password: testPass }),
    });

    if (!loginRes.ok) {
      // Register new user if not yet registered
      const regRes = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: testEmail,
          password: testPass,
          name: 'Programmatic API Bot',
          username: 'api_bot',
          role: 'pro',
        }),
      });

      if (!regRes.ok) {
        throw new Error(`Failed to register or login: ${JSON.stringify(regRes.data)}`);
      }
      authToken = regRes.data.token;
      currentUserId = regRes.data.user?.id;
    } else {
      authToken = loginRes.data.token;
      currentUserId = loginRes.data.user?.id;
    }

    if (!authToken) throw new Error('Auth token missing from response payload');
  });

  // 3. Current User Profile Verification
  await assertStep('GET /api/auth/me (Profile Verification)', async () => {
    const res = await request('/api/auth/me', {}, authToken);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    if (!res.data.user || !res.data.user.email) throw new Error('User record missing in /api/auth/me');
  });

  // 4. Multi-Workspace Management
  await assertStep('GET /api/auth/workspaces (List Workspaces)', async () => {
    const res = await request('/api/auth/workspaces', {}, authToken);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    if (!Array.isArray(res.data.workspaces)) throw new Error('Expected workspaces array in response');
  });

  await assertStep('POST /api/auth/workspaces (Create Dedicated Workspace)', async () => {
    const res = await request('/api/auth/workspaces', {
      method: 'POST',
      body: JSON.stringify({
        name: `API Suite Workspace ${Date.now().toString().slice(-4)}`,
        engine: 'local_fs',
        description: 'Auto-generated workspace for programmatic testing',
        icon: 'terminal',
      }),
    }, authToken);

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    testWorkspaceId = res.data.workspace?.id;
    if (!testWorkspaceId) throw new Error('Failed to obtain new workspace ID');
  });

  await assertStep('PUT /api/auth/workspaces (Switch Active Workspace)', async () => {
    const res = await request('/api/auth/workspaces', {
      method: 'PUT',
      body: JSON.stringify({
        action: 'switch',
        workspaceId: testWorkspaceId,
      }),
    }, authToken);

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    if (!res.data.success) throw new Error('Workspace switch unsuccessful');
  });

  // 5. Kanban Category (Stack) Operations
  await assertStep('POST /api/categories (Create Stack)', async () => {
    const res = await request('/api/categories', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Cloud Automation Tasks',
        glyph: 'Zap',
        color: '#3B82F6',
        description: 'Programmatically created category stack',
      }),
    }, authToken, testWorkspaceId);

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    testCategoryId = res.data.category?.id;
    if (!testCategoryId) throw new Error('Missing category ID in response');
  });

  await assertStep('GET /api/categories (List Stacks)', async () => {
    const res = await request('/api/categories', {}, authToken, testWorkspaceId);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    const found = res.data.categories?.some((c: any) => c.id === testCategoryId);
    if (!found) throw new Error('Newly created stack not found in category listing');
  });

  await assertStep('PUT /api/categories (Update Stack)', async () => {
    const res = await request('/api/categories', {
      method: 'PUT',
      body: JSON.stringify({
        id: testCategoryId,
        title: 'Cloud Automation Tasks [Active]',
        color: '#10B981',
      }),
    }, authToken, testWorkspaceId);

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    if (res.data.category?.title !== 'Cloud Automation Tasks [Active]') {
      throw new Error(`Category title did not update: ${res.data.category?.title}`);
    }
  });

  // 6. Document Lifecycle Operations
  await assertStep('POST /api/documents (Create Document)', async () => {
    const res = await request('/api/documents', {
      method: 'POST',
      body: JSON.stringify({
        title: 'API_Architecture_Spec.md',
        description: 'System specifications for programmatic endpoints',
        content: '# DocuStack Engine\nHeadless API architecture and real-time live synchronization engine.',
        categoryId: testCategoryId,
        tags: ['API', 'HEADLESS', 'VERCEL'],
      }),
    }, authToken, testWorkspaceId);

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    testDocId = res.data.document?.id;
    if (!testDocId) throw new Error('Document ID missing in response');
  });

  await assertStep('GET /api/documents?id=... (Fetch Single Document)', async () => {
    const res = await request(`/api/documents?id=${encodeURIComponent(testDocId)}`, {}, authToken, testWorkspaceId);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    if (res.data.document?.id !== testDocId) throw new Error('Fetched document ID mismatch');
  });

  await assertStep('PUT /api/documents (Update Document Content)', async () => {
    const res = await request('/api/documents', {
      method: 'PUT',
      body: JSON.stringify({
        id: testDocId,
        content: '# DocuStack Engine [UPDATED]\nAutomated verification completed successfully.',
      }),
    }, authToken, testWorkspaceId);

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    if (!res.data.document?.content.includes('[UPDATED]')) {
      throw new Error('Document content did not update properly');
    }
  });

  // 7. Wink NLP Document Analysis & Chat
  await assertStep('POST /api/analyze-doc (Wink NLP Analysis)', async () => {
    const res = await request('/api/analyze-doc', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Neural Architecture Overview',
        content: 'This document describes high-concurrency microservices, real-time event streaming, and cloud database replication.',
        fileType: 'markdown',
      }),
    }, authToken, testWorkspaceId);

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    if (!Array.isArray(res.data.tags) || res.data.tags.length === 0) {
      throw new Error('NLP failed to extract semantic tags');
    }
  });

  await assertStep('POST /api/chat-doc (Wink NLP Doc Chat)', async () => {
    const res = await request('/api/chat-doc', {
      method: 'POST',
      body: JSON.stringify({
        documentTitle: 'Neural Architecture Overview',
        documentContent: 'DocuStack provides zero-latency document management and real-time visualization.',
        messages: [{ text: 'What does DocuStack provide?' }],
      }),
    }, authToken, testWorkspaceId);

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    if (!res.data.text) throw new Error('NLP chat returned empty text response');
  });

  // 8. Force Graph Topology Mutations
  await assertStep('POST /api/graph (ADD_NODE & UPDATE_NODE)', async () => {
    const addRes = await request('/api/graph', {
      method: 'POST',
      body: JSON.stringify({
        action: 'ADD_NODE',
        node: {
          id: `node-${Date.now()}`,
          title: 'Automated Microservice Node',
          type: 'document',
          x: 480,
          y: 290,
          color: '#8B5CF6',
          tags: ['SERVICE', 'AUTOMATION'],
        },
      }),
    }, authToken, testWorkspaceId);

    if (!addRes.ok) throw new Error(`HTTP ${addRes.status}: ${JSON.stringify(addRes.data)}`);
    const nodeId = addRes.data.node?.id;

    const updateRes = await request('/api/graph', {
      method: 'POST',
      body: JSON.stringify({
        action: 'UPDATE_NODE',
        node: {
          id: nodeId,
          title: 'Automated Microservice Node [Online]',
        },
      }),
    }, authToken, testWorkspaceId);

    if (!updateRes.ok) throw new Error(`HTTP ${updateRes.status}: ${JSON.stringify(updateRes.data)}`);
  });

  // 8b. Container Renaming & Physical Folder Deduplication
  await assertStep('POST /api/graph (Container Rename & Deduplication Protocol)', async () => {
    const kanbanId = `kanban-${Date.now()}`;
    const addRes = await request('/api/graph', {
      method: 'POST',
      body: JSON.stringify({
        action: 'ADD_NODE',
        node: {
          id: kanbanId,
          title: 'Initial Kanban Test',
          type: 'collection',
          glyph: 'Kanban',
          x: 300,
          y: 300,
        },
      }),
    }, authToken, testWorkspaceId);

    if (!addRes.ok) throw new Error(`HTTP ${addRes.status}: ${JSON.stringify(addRes.data)}`);

    const renameRes = await request('/api/graph', {
      method: 'POST',
      body: JSON.stringify({
        action: 'UPDATE_NODE',
        node: {
          id: kanbanId,
          title: 'Renamed Kanban Test',
        },
      }),
    }, authToken, testWorkspaceId);

    if (!renameRes.ok) throw new Error(`HTTP ${renameRes.status}: ${JSON.stringify(renameRes.data)}`);
    if (!renameRes.data.renamedFrom || !renameRes.data.renamedTo) {
      throw new Error(`Expected renamedFrom and renamedTo in response, got: ${JSON.stringify(renameRes.data)}`);
    }

    // Clean up test node
    await request('/api/graph', {
      method: 'POST',
      body: JSON.stringify({
        action: 'DELETE_NODE',
        id: kanbanId,
      }),
    }, authToken, testWorkspaceId);
  });

  await assertStep('GET /api/graph (Retrieve Topology Graph)', async () => {
    const res = await request('/api/graph', {}, authToken, testWorkspaceId);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    if (!Array.isArray(res.data.nodes) || !Array.isArray(res.data.edges)) {
      throw new Error('Invalid graph payload returned');
    }
  });

  // 9. Biome & Theme Configuration
  await assertStep('POST /api/biome (Set Theme & Biome)', async () => {
    const res = await request('/api/biome', {
      method: 'POST',
      body: JSON.stringify({ theme: 'dark', biome: 'cyber' }),
    }, authToken, testWorkspaceId);

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    if (res.data.biome !== 'cyber') throw new Error(`Biome update failed: ${res.data.biome}`);
  });

  await assertStep('GET /api/biome (Verify Active Theme)', async () => {
    const res = await request('/api/biome', {}, authToken, testWorkspaceId);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    if (res.data.biome !== 'cyber') throw new Error(`Unexpected biome: ${res.data.biome}`);
  });

  // 10. Workspace Vault Physical / Cloud Tree Verification
  await assertStep('POST /api/workspace (Write File to Vault)', async () => {
    const res = await request('/api/workspace', {
      method: 'POST',
      body: JSON.stringify({
        relativePath: 'api_verification_log.txt',
        content: `Executed at ${new Date().toISOString()} on target ${TARGET_URL}`,
      }),
    }, authToken, testWorkspaceId);

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
  });

  await assertStep('GET /api/workspace (Fetch Workspace File Tree)', async () => {
    const res = await request('/api/workspace', {}, authToken, testWorkspaceId);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    if (!res.data.tree) throw new Error('Workspace file tree missing in response');
  });

  // 11. Real-Time Event Stream Mirroring Check
  await assertStep('GET /api/events (Verify Real-Time Event Bus Buffer)', async () => {
    const res = await request('/api/events?since=0', {}, authToken, testWorkspaceId);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    if (!Array.isArray(res.data.events) || res.data.events.length === 0) {
      throw new Error('Event bus buffer contains zero events');
    }
    const hasDocCreated = res.data.events.some((e: any) => e.action === 'DOCUMENT_CREATED');
    if (!hasDocCreated) throw new Error('Expected DOCUMENT_CREATED event was not found in event stream');
  });

  // 12. Frontend UI State & Sync Audit Inspection APIs
  await assertStep('GET /api/debug/ui-state (Inspect Complete Frontend UI State)', async () => {
    const res = await request('/api/debug/ui-state', {}, authToken, testWorkspaceId);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    if (!res.data.success) throw new Error('Debug UI state endpoint did not return success');
    if (!res.data.data?.nodeGraph) throw new Error('Missing nodeGraph in debug UI state payload');
    if (!res.data.data?.menus) throw new Error('Missing menus in debug UI state payload');
    if (!res.data.data?.vaultBrowser) throw new Error('Missing vaultBrowser in debug UI state payload');
    if (!res.data.data?.settingsAndPreferences) throw new Error('Missing settings in debug UI state payload');
  });

  await assertStep('GET /api/debug/ui-state?section=nodegraph (Inspect Granular Node Graph JSON)', async () => {
    const res = await request('/api/debug/ui-state?section=nodegraph', {}, authToken, testWorkspaceId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (!Array.isArray(res.data.data?.nodes)) throw new Error('Expected nodes array in nodegraph slice');
  });

  await assertStep('GET /api/debug/sync-audit (Verify 3-Tier Synchronization Audit Engine)', async () => {
    const res = await request('/api/debug/sync-audit', {}, authToken, testWorkspaceId);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    if (typeof res.data.syncScorePercent !== 'number') throw new Error('Missing syncScorePercent in audit');
    if (!res.data.auditDetails) throw new Error('Missing auditDetails');
  });

  // Final Summary
  console.log(`\n${c.bold}══════════════════════════════════════════════════════════════════${c.reset}`);
  if (failedSteps === 0) {
    console.log(`${c.green}${c.bold}✔ ALL ${passedSteps} API ENDPOINTS VERIFIED AND PASSING SUCCESSFULLY!${c.reset}`);
  } else {
    console.log(`${c.yellow}${c.bold}⚠ SUITE FINISHED: ${passedSteps} PASSED, ${c.red}${failedSteps} FAILED${c.reset}`);
  }
  console.log(`${c.bold}══════════════════════════════════════════════════════════════════${c.reset}\n`);

  console.log(`${c.bold}HOW TO WATCH LIVE REAL-TIME UI MIRRORING:${c.reset}`);
  console.log(`1. Open ${c.cyan}${TARGET_URL}${c.reset} in your browser (headful mode).`);
  console.log(`2. Re-run this test script: ${c.green}npm run test:api -- ${TARGET_URL}${c.reset}`);
  console.log(`3. Watch the browser screen: new documents, stacks, and graph nodes will appear live,`);
  console.log(`   accompanied by discrete toast notifications and ActivityMonitor telemetry logs!\n`);
}

runSuite().catch((err) => {
  console.error('\nFatal suite execution error:', err);
  process.exit(1);
});
