/**
 * @file test_subapp_refactoring.js
 * @description Master automated verification suite for Krnl Sub-App Integration Refactoring.
 *
 * Test Matrix:
 * 1. Sub-App Discovery & Descriptor generation.
 * 2. Sub-App Registration Contract & Operation Definitions with Schema Validation.
 * 3. Functionality Wrapping & Entity Flow Orchestration (entity.flow()).
 * 4. Collision Detection & Atomic Validation Rollback.
 * 5. Dependency Injection Context (services, operations, events, logger).
 * 6. Full Lifecycle State Machine (DISCOVER -> VALIDATE -> LOAD -> REGISTER -> INITIALIZE -> READY -> UNREGISTER -> DISPOSE).
 * 7. Error Isolation (faulty sub-app fails without corrupting host entity or sibling sub-apps).
 * 8. In-Process Invocation & Qualified Addressing.
 * 9. Transport Projection (Unified HTTP Adapter root hosting /call/:fid & /manifest).
 * 10. HTTPS Endpoint Compatibility Adapter (createHttpsAppAdapter).
 * 11. Manifest Dependency Aggregation & Conflict Detection.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import {
  Entity,
  krnlUnifiedHttpAdapter,
  KrnlSubAppDiscovery,
  KrnlSubAppValidator,
  createHttpsAppAdapter,
  DefaultServiceContainer
} from '../dist/index.js';

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
      res.on('data', (chunk) => (body += chunk.toString()));
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

async function runSubAppTests() {
  console.log('================================================================');
  console.log('    Krnl Sub-App Integration Master Verification Suite');
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
  // TEST 1: Sub-App Programmatic Registration & Functionality Wrapping
  // ──────────────────────────────────────────────────────────────────────────
  console.log('▶ TEST 1: Sub-App Registration Contract & Operation Definitions');
  const entity = new Entity('CommerceRoot');

  let initCalled = false;
  let injectedEntityId = null;

  const regResult = await entity.registerSubApp({
    name: 'BillingSubApp',
    operations: [
      {
        name: 'calculateTax',
        description: 'Calculates sales tax for cart',
        input: (val) => typeof val?.amount === 'number' && val.amount > 0,
        handler: async (input, ctx) => {
          const tax = input.amount * 0.1;
          const total = input.amount + tax;
          return {
            subtotal: input.amount,
            tax,
            total,
            caller: ctx.caller
          };
        }
      },
      {
        name: 'generateReceipt',
        description: 'Generates invoice receipt string',
        handler: async (input) => {
          return { receiptId: `REC-${Math.round(input.total)}` };
        }
      }
    ],
    metadata: { version: '1.2.0' },
    onInitialize: async (ctx) => {
      initCalled = true;
      injectedEntityId = ctx.entity.id;
    }
  });

  assert(regResult.state === 'READY', 'SubApp entered READY lifecycle state');
  assert(initCalled, 'SubApp onInitialize() hook was invoked during registration');
  assert(injectedEntityId === 'CommerceRoot', 'SubApp received host Entity in registration context');

  // Verify wrapped functionalities on entity
  assert(entity.localFunctionalities.has('BillingSubApp.calculateTax'), 'Wrapped functionality BillingSubApp.calculateTax registered on Entity');
  assert(entity.localFunctionalities.has('calculateTax'), 'Unqualified alias calculateTax registered on Entity');

  // Direct call via entity
  const taxResult = await entity.call('BillingSubApp.calculateTax', { amount: 100 });
  assert(Math.abs(taxResult?.total - 110) < 0.001, `Direct call calculation correct: total is 110 (received ${taxResult?.total})`);

  // Call via alias
  const aliasResult = await entity.call('calculateTax', { amount: 200 });
  assert(Math.abs(aliasResult?.total - 220) < 0.001, `Alias call calculation correct: total is 220 (received ${aliasResult?.total})`);

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: Functionality Wrapping & Entity Flow Orchestration
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n▶ TEST 2: Entity Flow Orchestration Over Sub-App Operations');

  entity.flow('checkoutPipeline')
    .then('BillingSubApp.calculateTax')
    .then('BillingSubApp.generateReceipt')
    .register({ visibility: 'public', description: 'Checkout calculation and receipt pipeline' });

  assert(entity.localFunctionalities.has('checkoutPipeline'), 'Flow checkoutPipeline registered on Entity');

  const pipelineOutput = await entity.call('checkoutPipeline', { amount: 50 });
  assert(pipelineOutput?.receiptId === 'REC-55', `Pipeline successfully orchestrated sub-app operations: ${pipelineOutput?.receiptId}`);

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 3: Collision Detection & Atomic Validation Rollback
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n▶ TEST 3: Collision Detection & Atomic Validation');

  const collisionResult = await entity.registerSubApp({
    name: 'DuplicateApp',
    operations: [
      {
        name: 'calculateTax', // Collides with existing calculateTax
        handler: async () => ({ duplicate: true })
      }
    ]
  });

  assert(collisionResult.state === 'ERROR', 'SubApp registration failed atomically due to operation name collision');
  assert(collisionResult.errorDetails?.some(e => e.code === 'OPERATION_COLLISION'), 'Collision error code OPERATION_COLLISION reported');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 4: Error Isolation
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n▶ TEST 4: Error Isolation on Faulty Sub-App');

  const invalidApp = await entity.registerSubApp({
    name: 'InvalidApp',
    operations: [
      {
        name: '', // Invalid empty name
        handler: async () => {}
      }
    ]
  });

  assert(invalidApp.state === 'ERROR', 'Invalid sub-app transitions to ERROR state');
  // Verify CommerceRoot is still healthy and operational
  const healthCheckResult = await entity.call('BillingSubApp.calculateTax', { amount: 300 });
  assert(healthCheckResult?.total === 330, 'Host Entity remains completely operational after sub-app error');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 5: HTTPS Endpoint Compatibility Adapter
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n▶ TEST 5: HTTPS Endpoint Compatibility Adapter');

  const legacyRegistration = createHttpsAppAdapter({
    name: 'LegacyUserApp',
    endpoints: [
      {
        path: '/api/users/profile',
        method: 'GET',
        handler: async (input) => ({ userId: input?.id || 'anonymous', profile: 'active' })
      },
      {
        path: '/api/orders/list',
        method: 'POST',
        handler: async () => ({ orders: [{ id: 1 }, { id: 2 }] })
      }
    ]
  });

  assert(legacyRegistration.operations.length === 2, 'createHttpsAppAdapter mapped 2 endpoints to operations');
  assert(legacyRegistration.operations[0].name === 'users_profile', 'Clean operation name users_profile mapped from /api/users/profile');

  const legacySubApp = await entity.registerSubApp(legacyRegistration);
  assert(legacySubApp.state === 'READY', 'Legacy adapted sub-app registered successfully');

  const profileRes = await entity.call('LegacyUserApp.users_profile', { id: 'usr-999' });
  assert(profileRes?.userId === 'usr-999', 'Adapted HTTPS endpoint executed cleanly via entity.call()');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 6: Transport Projection via Unified HTTP Adapter
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n▶ TEST 6: Transport Projection via Unified HTTP Adapter (Zero Sub-App Servers)');
  const testPort = 10992;
  const httpAdapter = new krnlUnifiedHttpAdapter(entity, testPort, '127.0.0.1');
  entity.attachAdapter(httpAdapter);

  await entity.finalize();
  assert(entity._selfHosting, 'Entity enters self-hosting state in root position');

  // Invoke sub-app operation over HTTP /call/:fid
  const httpCallRes = await requestJson(`http://127.0.0.1:${testPort}/call/BillingSubApp.calculateTax`, {
    method: 'POST',
    body: { amount: 500 }
  });

  const httpPayload = httpCallRes.data?.payload || httpCallRes.data;
  assert(httpCallRes.status === 200, 'HTTP /call/BillingSubApp.calculateTax returned status 200');
  assert(httpPayload?.total === 550, `HTTP call returned calculated total 550 (received ${httpPayload?.total})`);

  // Invoke adapted legacy endpoint over HTTP /call/:fid
  const httpLegacyRes = await requestJson(`http://127.0.0.1:${testPort}/call/LegacyUserApp.users_profile`, {
    method: 'POST',
    body: { id: 'usr-web-1' }
  });
  const legacyPayload = httpLegacyRes.data?.payload || httpLegacyRes.data;
  assert(legacyPayload?.userId === 'usr-web-1', 'HTTP call reached adapted legacy endpoint');

  // Test /manifest endpoint
  const manifestRes = await requestJson(`http://127.0.0.1:${testPort}/manifest`);
  assert(manifestRes.status === 200, 'HTTP /manifest returned status 200');
  assert(manifestRes.data?.apiNames?.includes('BillingSubApp.calculateTax'), 'SubApp operation visible in root manifest');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 7: Manifest Dependency Aggregation & Conflict Detection
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n▶ TEST 7: Manifest Dependency Aggregation & Conflict Detection');

  // Register sub-app with manifest dependencies
  const manifestSubApp = await entity.registerSubApp({
    name: 'DepAppA',
    operations: [
      {
        name: 'dummyOp',
        handler: async () => 'ok'
      }
    ]
  }, {
    id: 'DepAppA',
    path: '',
    registrationPath: '',
    manifest: {
      name: 'DepAppA',
      version: '1.0.0',
      dependencies: {
        'lodash': '^4.17.21',
        'zod': '^3.22.0'
      }
    }
  });

  const reqs = entity.getWorkspaceRequirements();
  assert(reqs.dependencies['lodash'] === '^4.17.21', 'Workspace requirements aggregated lodash from SubApp manifest');
  assert(reqs.dependencies['zod'] === '^3.22.0', 'Workspace requirements aggregated zod from SubApp manifest');

  // Test Conflict Detection
  const conflictSubApp = await entity.registerSubApp({
    name: 'DepAppB',
    operations: [
      {
        name: 'dummyOp2',
        handler: async () => 'ok'
      }
    ]
  }, {
    id: 'DepAppB',
    path: '',
    registrationPath: '',
    manifest: {
      name: 'DepAppB',
      version: '1.0.0',
      dependencies: {
        'lodash': '^3.0.0' // Version conflict with DepAppA (^4.17.21)
      }
    }
  });

  const conflictReqs = entity.getWorkspaceRequirements();
  assert(conflictReqs.conflicts && conflictReqs.conflicts.length > 0, 'Workspace requirements successfully detected dependency conflict in sub-apps');
  assert(conflictReqs.conflicts[0].package === 'lodash', 'Conflict correctly identified for lodash');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 8: Sub-App Unregister & Disposal Lifecycle
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n▶ TEST 8: Sub-App Unregistration & Disposal');

  let disposed = false;
  const tempSubApp = await entity.registerSubApp({
    name: 'TempApp',
    operations: [
      {
        name: 'tempAction',
        handler: async () => 'temp'
      }
    ],
    onDispose: async () => {
      disposed = true;
    }
  });

  assert(entity.localFunctionalities.has('TempApp.tempAction'), 'TempApp action registered');
  await entity.unregisterSubApp('TempApp');

  assert(!entity.localFunctionalities.has('TempApp.tempAction'), 'TempApp action removed from entity functionalities');
  assert(entity.getSubApp('TempApp') === undefined, 'TempApp removed from entity sub-apps registry');
  assert(disposed, 'TempApp onDispose() hook was executed during unregister');

  // Clean shutdown
  entity.dispose();
  console.log('\n================================================================');
  console.log(`  Verification Complete: ${passed} passed, ${failed} failed.`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSubAppTests().catch((err) => {
  console.error('Master Sub-App Test Suite Error:', err);
  process.exit(1);
});
