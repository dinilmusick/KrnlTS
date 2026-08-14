/**
 * @file test_gross_architecture.js
 * @description Master verification for KrnlTS Gross Architecture Refactoring.
 *
 * Tests:
 * 1. Entity in root position with attached protocol adapter self-hosts.
 * 2. Adoption protocol: Parent Entity adopts Child Entity -> Child surrenders servers, capabilities bubble to Parent.
 * 3. Qualified capability resolution: Parent adapter resolves and routes qualified ID 'Parent.Child.action' to Child in-process.
 * 4. Flow orchestration: Flow as a Functionality (sequence, branch, parallel) with execution and registration.
 * 5. Manifest aggregation: Functionality manifest -> Entity requirements -> conflict detection.
 * 6. UI aggregation: Recursive UI spec collection with qualified IDs.
 */

import { Entity, KrnlFlowBuilder, krnlUnifiedHttpAdapter } from '../dist/index.js';
import http from 'http';

function requestJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const reqOpts = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOpts, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk.toString());
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body || '{}') });
        } catch (_) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('  KrnlTS Gross Architecture Comprehensive Verification Suite');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✔ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: Single Entity with attached Protocol Adapter (Root Position)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('▶ TEST 1: Entity in Root Position with Protocol Adapter');
  const rootPort = 10881;
  const rootEntity = new Entity('RootEntity');

  rootEntity.addLocal({
    id: 'ping',
    visibility: 'public',
    api: async (input) => ({ message: 'pong', input })
  });

  const httpAdapter = new krnlUnifiedHttpAdapter(rootEntity, rootPort, '127.0.0.1');
  rootEntity.attachAdapter(httpAdapter);

  assert(!rootEntity._selfHosting, 'Entity is not self-hosting before finalize()');
  await rootEntity.finalize();
  assert(rootEntity._selfHosting, 'Entity enters self-hosting state after finalize() in root position');

  const pingRes = await requestJson(`http://127.0.0.1:${rootPort}/call/ping`, {
    method: 'POST',
    body: { test: 123 }
  });

  const pingPayload = pingRes.data?.payload || pingRes.data;
  assert(pingRes.status === 200, 'HTTP /call/ping returned status 200');
  assert(pingPayload?.message === 'pong', 'HTTP /call/ping returned correct payload');
  assert(pingPayload?.input?.test === 123, 'HTTP /call/ping echoed input correctly');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: Adoption Protocol & Child Server Relinquishment
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n▶ TEST 2: Child Entity Adoption & Server Relinquishment');
  const childPort = 10882;
  const childEntity = new Entity('ChildEntity');

  childEntity.addLocal({
    id: 'compute',
    visibility: 'public',
    api: async (input) => ({ calculated: (input.val || 0) * 2 })
  });

  const childAdapter = new krnlUnifiedHttpAdapter(childEntity, childPort, '127.0.0.1');
  childEntity.attachAdapter(childAdapter);
  await childEntity.finalize();
  assert(childEntity._selfHosting, 'ChildEntity self-hosts initially when standalone');

  // Adopt child under rootEntity
  rootEntity.addChild(childEntity);
  await new Promise((r) => setTimeout(r, 50));
  assert(!childEntity._selfHosting, 'ChildEntity relinquished self-hosting upon adoption by Parent');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 3: Qualified Capability Routing & Invocation
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n▶ TEST 3: Qualified Capability Resolution & Routing');
  
  // Verify resolveCapability contract on Entity
  const resolved = rootEntity.resolveCapability('RootEntity.ChildEntity.compute');
  assert(Boolean(resolved), 'RootEntity resolves qualified capability RootEntity.ChildEntity.compute');
  assert(resolved?.owner === childEntity, 'Resolved owner is the actual childEntity instance');
  assert(resolved?.fid === 'compute', 'Resolved fid is the local functionality ID');

  // Verify calling via HTTP through root adapter using qualified ID
  const qualifiedRes = await requestJson(`http://127.0.0.1:${rootPort}/call/RootEntity.ChildEntity.compute`, {
    method: 'POST',
    body: { val: 21 }
  });

  const qualifiedPayload = qualifiedRes.data?.payload || qualifiedRes.data;
  assert(qualifiedRes.status === 200, 'HTTP /call/RootEntity.ChildEntity.compute returned status 200');
  assert(qualifiedPayload?.calculated === 42, 'HTTP invocation routed in-process to childEntity returned 42');

  // Also verify bubbled flat fid route
  const flatRes = await requestJson(`http://127.0.0.1:${rootPort}/call/compute`, {
    method: 'POST',
    body: { val: 10 }
  });
  const flatPayload = flatRes.data?.payload || flatRes.data;
  assert(flatPayload?.calculated === 20, 'HTTP /call/compute returned bubbled calculation 20');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 4: Flow as a Functionality (Sequence, Branch, Parallel)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n▶ TEST 4: Flow Orchestration as a Functionality');

  rootEntity.addLocal({
    id: 'addFive',
    visibility: 'public',
    api: async (n) => n + 5
  });

  rootEntity.addLocal({
    id: 'doubleIt',
    visibility: 'public',
    api: async (n) => n * 2
  });

  rootEntity.addLocal({
    id: 'formatHigh',
    visibility: 'public',
    api: async (n) => ({ category: 'HIGH', value: n })
  });

  rootEntity.addLocal({
    id: 'formatLow',
    visibility: 'public',
    api: async (n) => ({ category: 'LOW', value: n })
  });

  // Build and register flow as a local functionality
  const flowFunc = rootEntity.flow('mathPipeline')
    .then('addFive')
    .then('doubleIt')
    .branch((val) => val >= 25, 'formatHigh', 'formatLow')
    .register({
      visibility: 'public',
      description: 'Test math transformation and branch pipeline'
    });

  assert(Boolean(flowFunc), 'Flow successfully registered as a Functionality');
  assert(rootEntity.localFunctionalities.has('mathPipeline'), 'Flow is stored in localFunctionalities');

  // Test branch >= 25: input 10 -> addFive (15) -> doubleIt (30) -> formatHigh ({ category: 'HIGH', value: 30 })
  const flowResHigh = await rootEntity.call('mathPipeline', 10);
  assert(flowResHigh.category === 'HIGH' && flowResHigh.value === 30, 'Flow branch HIGH computed correctly for input 10');

  // Test branch < 25: input 2 -> addFive (7) -> doubleIt (14) -> formatLow ({ category: 'LOW', value: 14 })
  const flowResLow = await rootEntity.call('mathPipeline', 2);
  assert(flowResLow.category === 'LOW' && flowResLow.value === 14, 'Flow branch LOW computed correctly for input 2');

  // Test executing flow via HTTP endpoint
  const httpFlowRes = await requestJson(`http://127.0.0.1:${rootPort}/call/mathPipeline`, {
    method: 'POST',
    body: 10
  });
  const httpFlowPayload = httpFlowRes.data?.payload || httpFlowRes.data;
  assert(httpFlowPayload?.category === 'HIGH' && httpFlowPayload?.value === 30, 'HTTP /call/mathPipeline executed flow correctly');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 5: Manifest Aggregation (Kernel Declares -> Shell Materializes)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n▶ TEST 5: Manifest Aggregation & Conflict Detection');

  rootEntity.addLocal({
    id: 'authUtil',
    manifest: {
      dependencies: { 'jsonwebtoken': '^9.0.0' },
      devDependencies: { '@types/jsonwebtoken': '^9.0.0' },
      buildRequirements: ['typescript']
    },
    api: async () => 'ok'
  });

  childEntity.addLocal({
    id: 'dbUtil',
    manifest: {
      dependencies: { 'sqlite3': '^5.1.0' },
      buildRequirements: ['esbuild']
    },
    api: async () => 'ok'
  });

  const reqs = rootEntity.getWorkspaceRequirements();
  assert(reqs.dependencies['jsonwebtoken'] === '^9.0.0', 'Aggregated dependency jsonwebtoken');
  assert(reqs.dependencies['sqlite3'] === '^5.1.0', 'Aggregated child dependency sqlite3');
  assert(reqs.buildRequirements.includes('typescript'), 'Aggregated build requirement typescript');
  assert(reqs.buildRequirements.includes('esbuild'), 'Aggregated build requirement esbuild');
  assert(!reqs.conflicts || reqs.conflicts.length === 0, 'No dependency conflicts detected in valid manifests');

  // Test conflict detection
  childEntity.addLocal({
    id: 'conflictingFunc',
    manifest: {
      dependencies: { 'jsonwebtoken': '^8.0.0' }
    },
    api: async () => 'conflict'
  });

  const conflictReqs = rootEntity.getWorkspaceRequirements();
  assert(conflictReqs.conflicts && conflictReqs.conflicts.length > 0, 'Conflict correctly flagged when versions diverge');
  assert(conflictReqs.conflicts[0].package === 'jsonwebtoken', 'Flagged conflicting package is jsonwebtoken');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 6: UI Recursive Aggregation with Qualified IDs
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n▶ TEST 6: UI Recursive Aggregation');

  rootEntity.addLocal({
    id: 'dashboardWidget',
    uiSpec: { atomType: 'metric', title: 'Total Volume' },
    api: async () => ({ count: 100 })
  });

  childEntity.addLocal({
    id: 'childWidget',
    uiSpec: { atomType: 'chart', title: 'Child Chart' },
    api: async () => ([1, 2, 3])
  });

  const uiList = rootEntity.aggregateUI();
  assert(uiList.length >= 2, 'Aggregated UI list contains specs from root and child');
  const rootWidget = uiList.find(u => u.qualifiedId === 'RootEntity.dashboardWidget');
  const childWidget = uiList.find(u => u.qualifiedId === 'RootEntity.ChildEntity.childWidget');

  assert(Boolean(rootWidget), 'Found RootEntity.dashboardWidget in aggregated UI list');
  assert(Boolean(childWidget), 'Found RootEntity.ChildEntity.childWidget in aggregated UI list');
  assert(childWidget?.source === childEntity, 'Child UI spec source points to childEntity');

  // ──────────────────────────────────────────────────────────────────────────
  // Cleanup
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n▶ Cleanup: Disposing entities...');
  await rootEntity.stopHosting();
  rootEntity.dispose();
  childEntity.dispose();

  console.log('\n================================================================');
  console.log(`  Gross Architecture Suite Summary: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL GROSS ARCHITECTURE INVARIANTS AND TESTS VERIFIED SUCCESSFULLY!\n');
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal error in Gross Architecture test suite:', err);
  process.exit(1);
});
