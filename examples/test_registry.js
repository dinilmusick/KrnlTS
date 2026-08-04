import { krnlSystemEntityBase, KrnlRegistryClient } from "../dist/index.js";

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log("--- Starting KrnlTS Registry and Port Discovery Exhibit Test ---");

  // 1. Start System A on port 10099 (This makes it the Registry Host)
  console.log("\n[TEST 1] Initializing Registry Host (SystemA) on 10099...");
  const systemA = new krnlSystemEntityBase("SystemA", null, 10099);
  await systemA.activateServiceSuite("UNIFIED_HTTP");
  await systemA.boot();
  await systemA.startDiscovery(10111);
  console.log("SystemA is now running on port 10099.");

  // 2. Start System B on a dynamic port (Hint: 10600)
  console.log("\n[TEST 2] Initializing Client App (SystemB) on a dynamic port...");
  const systemB = new krnlSystemEntityBase("SystemB", null, 10600);
  await systemB.activateServiceSuite("UNIFIED_HTTP");
  await systemB.boot();
  await systemB.startDiscovery(10111);
  console.log(`SystemB is now running on finalized port ${systemB.port}.`);

  // Wait briefly for registration request to resolve
  await sleep(1000);

  // 3. Verify registry lookup using KrnlRegistryClient
  console.log("\n[TEST 3] Querying Registry for SystemB...");
  const registryClient = new KrnlRegistryClient(10099);
  const isAlive = await registryClient.isRegistryAlive();
  console.log(`Registry alive status: ${isAlive}`);

  const registration = await registryClient.lookup("SystemB");
  if (registration && registration.port === systemB.port) {
    console.log(`SUCCESS: Found SystemB in Registry! Port: ${registration.port}, PID: ${registration.pid}`);
  } else {
    console.error("FAIL: Could not find SystemB in Registry or port mismatch", registration);
  }

  // 4. Verify listApps
  const allApps = await fetch("http://127.0.0.1:10099/call/listApps", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  }).then(res => res.json());
  console.log("\n[TEST 4] Listing all apps from registry:", JSON.stringify(allApps.payload || allApps, null, 2));

  // 5. Test Graceful Shutdown & Deregistration
  console.log("\n[TEST 5] Shutting down SystemB and checking deregistration...");
  await systemB.shutdown();
  await sleep(1000);

  const registrationAfterShutdown = await registryClient.lookup("SystemB");
  if (!registrationAfterShutdown) {
    console.log("SUCCESS: SystemB successfully deregistered from Registry after shutdown.");
  } else {
    console.error("FAIL: SystemB is still registered after shutdown!", registrationAfterShutdown);
  }

  console.log("\nCleaning up remaining processes...");
  await systemA.shutdown();
  console.log("Exhibit Completed successfully.");
}

run().catch(err => {
  console.error("Error in Exhibit:", err);
  process.exit(1);
});
