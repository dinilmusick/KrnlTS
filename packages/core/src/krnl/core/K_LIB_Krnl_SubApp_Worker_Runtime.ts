//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_SubApp_Worker_Runtime.ts
 *
 * @description Worker-thread bootstrap for worker-mode sub-apps.
 *
 * This module is loaded by Node.js worker_threads when a sub-app is configured with
 * executionMode = 'worker'. It instantiates the sub-app class inside the worker context
 * and handles all message-based dispatch from the parent process.
 *
 * The sub-app is instantiated with networking suppressed (it runs as _isSubApp = true).
 * All communication with the parent is via parentPort MessagePort only.
 * No HTTP · No WebSocket · No TCP.
 *
 * Wire protocol (see K_LIB_Krnl_SubApp_Worker_Host.ts for the full spec):
 *
 *   Received from parent:
 *     { type: 'call',     requestId, fid, input }
 *     { type: 'shutdown'                        }
 *
 *   Sent to parent:
 *     { type: 'manifest', manifest }   // sent once after sub-app is ready
 *     { type: 'result',   requestId, ok, result?, error? }
 */

import { workerData, parentPort, isMainThread } from 'worker_threads';
import { pathToFileURL } from 'url';
import { AsyncLocalStorage } from 'async_hooks';

// Guard: this file must only run inside a worker thread
if (isMainThread) {
  throw new Error('[SubAppWorkerRuntime] This module must only be loaded inside a worker_thread, never from the main thread.');
}

if (!parentPort) {
  throw new Error('[SubAppWorkerRuntime] parentPort is null — cannot communicate with host.');
}

const { entryPath, prefix, constructorArgs = [] } = workerData as {
  entryPath:       string;
  prefix:          string;
  constructorArgs: any[];
};

// Set up the subapp async-local-storage context so the entity's constructor
// detects it is running as a sub-app and suppresses networking startup.
if (!(globalThis as any).__krnlSubAppLocalStorage) {
  (globalThis as any).__krnlSubAppLocalStorage = new AsyncLocalStorage<boolean>();
}
const subappStorage = (globalThis as any).__krnlSubAppLocalStorage as AsyncLocalStorage<any>;

async function bootstrap() {
  console.log(`[SubAppWorkerRuntime:${prefix}] Bootstrapping worker sub-app from: ${entryPath}`);

  let entity: any;

  await subappStorage.run({ appPath: entryPath ? require('path').dirname(entryPath) : '' }, async () => {
    const mod = await import(pathToFileURL(entryPath).href);
    const ServiceClass = mod[prefix] ?? mod.default;
    if (!ServiceClass) {
      throw new Error(`[SubAppWorkerRuntime:${prefix}] Could not find exported class '${prefix}' or default export from '${entryPath}'.`);
    }
    // Instantiate sub-app; -1 signals no port allocation (networking suppressed)
    entity = new ServiceClass(-1, ...constructorArgs);
    if (entity._magneticLoadPromise) {
      await entity._magneticLoadPromise;
    }
    // Ensure ready-promise resolves (no _startSharedServer will run in a sub-app)
    if (typeof entity._resolveReady === 'function') {
      entity._resolveReady();
    }
  });

  console.log(`[SubAppWorkerRuntime:${prefix}] Sub-app ready. Sending manifest to host.`);

  // Send the manifest to the parent host — this is the "ready" signal
  parentPort!.postMessage({ type: 'manifest', manifest: entity.getManifest?.() ?? null });

  // Handle incoming messages from the parent process
  parentPort!.on('message', async (msg: any) => {
    if (msg.type === 'shutdown') {
      console.log(`[SubAppWorkerRuntime:${prefix}] Shutdown requested. Cleaning up.`);
      try {
        if (typeof entity.gracefulShutdown === 'function') {
          await entity.gracefulShutdown({ timeoutMs: 5000 });
        } else if (typeof entity.dispose === 'function') {
          entity.dispose();
        }
      } catch (_) {}
      process.exit(0);
    }

    if (msg.type === 'call') {
      const { requestId, fid, input } = msg;
      try {
        const result = await entity.call(fid, input);
        parentPort!.postMessage({ type: 'result', requestId, ok: true, result });
      } catch (err: any) {
        parentPort!.postMessage({
          type:      'result',
          requestId,
          ok:        false,
          error:     err.message || String(err),
        });
      }
    }
  });
}

bootstrap().catch((err) => {
  console.error(`[SubAppWorkerRuntime:${prefix}] Fatal bootstrap error:`, err.message || err);
  process.exit(1);
});
