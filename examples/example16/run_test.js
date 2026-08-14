/**
 * @file run_test.js
 * @description Example 16 Verification: Sub-App Discovery, Functionality Wrapping, Flow Orchestration, and HTTP Projection.
 */

import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Entity, krnlUnifiedHttpAdapter } from '../../dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function run() {
  console.log('================================================================');
  console.log('  Example 16: Krnl Sub-App Integration & Orchestration Demo');
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

  // 1. Instantiate Root Entity
  const rootEntity = new Entity('ShopKernel');

  // 2. Discover and Load Sub-Apps
  console.log('▶ STEP 1: Discovering and Loading Sub-Apps from filesystem...');
  const subappsDir = path.join(__dirname, 'subapps');
  const descriptors = await rootEntity.discoverSubApps(subappsDir);

  assert(descriptors.length === 2, `Discovered 2 sub-apps (found ${descriptors.length})`);

  for (const desc of descriptors) {
    const instance = await rootEntity.loadSubApp(desc);
    assert(instance.state === 'READY', `Sub-App '${instance.id}' loaded and entered READY state`);
  }

  // 3. Verify Functionality Wrapping on Root Entity
  console.log('\n▶ STEP 2: Verifying Functionality Wrapping...');
  assert(rootEntity.localFunctionalities.has('StorefrontApp.calculateCart'), 'StorefrontApp.calculateCart wrapped as local functionality');
  assert(rootEntity.localFunctionalities.has('PaymentApp.chargeCard'), 'PaymentApp.chargeCard wrapped as local functionality');

  // 4. Compose Flow Orchestration across Sub-Apps
  console.log('\n▶ STEP 3: Registering Cross-Sub-App Orchestration Flow...');
  rootEntity.flow('completeCheckout')
    .then('StorefrontApp.calculateCart')
    .then('PaymentApp.chargeCard')
    .then('StorefrontApp.placeOrder')
    .register({
      visibility: 'public',
      description: 'End-to-end checkout flow orchestrating StorefrontApp and PaymentApp'
    });

  assert(rootEntity.localFunctionalities.has('completeCheckout'), 'Flow completeCheckout registered on Root Entity');

  // 5. Attach Unified HTTP Protocol Adapter and Finalize
  console.log('\n▶ STEP 4: Projecting Transports via Unified HTTP Adapter...');
  const httpPort = 10995;
  const adapter = new krnlUnifiedHttpAdapter(rootEntity, httpPort, '127.0.0.1');
  rootEntity.attachAdapter(adapter);

  await rootEntity.finalize();
  assert(rootEntity._selfHosting, 'Root Entity is self-hosting on HTTP');

  // 6. Test Single Sub-App Operation via HTTP
  console.log('\n▶ STEP 5: Invoking Sub-App Operation via HTTP...');
  const cartInput = {
    items: [
      { name: 'Mechanical Keyboard', price: 120, quantity: 1 },
      { name: 'Gaming Mouse', price: 60, quantity: 2 }
    ],
    couponCode: 'SAVE20'
  };

  const cartRes = await requestJson(`http://127.0.0.1:${httpPort}/call/StorefrontApp.calculateCart`, {
    method: 'POST',
    body: cartInput
  });

  const cartData = cartRes.data?.payload || cartRes.data;
  assert(cartRes.status === 200, 'HTTP /call/StorefrontApp.calculateCart returned status 200');
  assert(cartData.subtotal === 240, `Cart subtotal calculated correctly: $240 (received ${cartData.subtotal})`);
  assert(cartData.discount === 48, `SAVE20 discount calculated correctly: $48 (received ${cartData.discount})`);
  assert(cartData.total === 207.36, `Total with 8% tax calculated correctly: $207.36 (received ${cartData.total})`);

  // 7. Test Cross-Sub-App Flow Orchestration via HTTP
  console.log('\n▶ STEP 6: Invoking Cross-Sub-App Pipeline via HTTP...');
  const checkoutRes = await requestJson(`http://127.0.0.1:${httpPort}/call/completeCheckout`, {
    method: 'POST',
    body: {
      ...cartInput,
      customerId: 'user_alex99'
    }
  });

  const checkoutData = checkoutRes.data?.payload || checkoutRes.data;
  assert(checkoutRes.status === 200, 'HTTP /call/completeCheckout returned status 200');
  assert(checkoutData.status === 'PLACED', 'Order placed successfully through end-to-end pipeline');
  assert(checkoutData.customerId === 'user_alex99', `Order customer ID matched: ${checkoutData.customerId}`);
  assert(checkoutData.orderId?.startsWith('ORD-'), `Generated order ID: ${checkoutData.orderId}`);

  // 8. Test Manifest Aggregation
  console.log('\n▶ STEP 7: Testing Workspace Manifest & UI Aggregation...');
  const reqs = rootEntity.getWorkspaceRequirements();
  assert(reqs.dependencies['zod'] === '^3.22.4', 'Aggregated dependency zod from StorefrontApp');
  assert(reqs.dependencies['jsonwebtoken'] === '^9.0.2', 'Aggregated dependency jsonwebtoken from PaymentApp');

  const uiList = rootEntity.aggregateUI();
  assert(uiList.some(u => u.qualifiedId === 'ShopKernel.StorefrontApp'), 'StorefrontApp UI registered in aggregateUI');
  assert(uiList.some(u => u.qualifiedId === 'ShopKernel.PaymentApp'), 'PaymentApp UI registered in aggregateUI');

  // 9. Teardown
  rootEntity.dispose();
  console.log('\n================================================================');
  console.log(`  Example 16 Completed: ${passed} passed, ${failed} failed.`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Example 16 Error:', err);
  process.exit(1);
});
