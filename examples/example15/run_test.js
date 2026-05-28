import { krnlSystemEntityBase } from '../../dist/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function checkPort(port) {
  return new Promise((resolve) => {
    http.get(`http://localhost:${port}`, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));
  });
}

async function run() {
  console.log("--- Example 15: Managed Services Orchestration ---");
  const system = new krnlSystemEntityBase("OrchestratorSystem", null, 15000);
  
  // Register a slow service that takes 2 seconds to start
  system.registerManagedService({
    name: 'slow-service',
    cwd: __dirname,
    command: 'node',
    args: ['mock_server.js'],
    env: { STARTUP_DELAY: '2000' },
    waitForStartup: true
  });

  // Register a fast service that starts almost immediately
  // This should only start AFTER slow-service is ready
  system.registerManagedService({
    name: 'fast-service',
    cwd: __dirname,
    command: 'node',
    args: ['mock_server.js'],
    env: { STARTUP_DELAY: '100' },
    waitForStartup: true
  });

  console.log("\n[1] Starting sequential managed services...");
  const start = Date.now();
  await system.startManagedServices();
  const duration = Date.now() - start;

  console.log(`\n[2] All services started in ${duration}ms.`);
  console.log("Port Registry Snapshot:", JSON.stringify(system.getRegisteredPorts(), null, 2));

  // Verification
  const ports = system.getRegisteredPorts();
  let allOk = true;

  for (const [name, port] of Object.entries(ports)) {
    if (name === '_krnl_system') continue;
    const ok = await checkPort(port);
    console.log(`Verification: ${name} (Port ${port}) -> ${ok ? 'PASSED' : 'FAILED'}`);
    if (!ok) allOk = false;
  }

  if (allOk && duration >= 2000) {
    console.log("\n✅ SUCCESS: Services started sequentially with proper wait times.");
  } else {
    console.error("\n❌ FAILURE: Startup sequence or verification failed.");
    process.exit(1);
  }

  console.log("\n[3] Initiating Graceful Shutdown...");
  await system.gracefulShutdown();
  console.log("Example 15 completed.");
  process.exit(0);
}

run().catch(err => {
    console.error("Test Error:", err);
    process.exit(1);
});
