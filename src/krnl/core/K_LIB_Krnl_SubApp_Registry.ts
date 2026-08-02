//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_SubApp_Registry.ts
 *
 * @description Sub-app registry and loader for the KrnlTS internal sub-app execution model.
 *
 * Sub-apps are normal KrnlTS applications that can run either standalone (with full networking)
 * or embedded inside a parent application (with no networking). The parent's krnl.json declares
 * the execution mode for each sub-app; the sub-app code itself never changes.
 *
 * Two execution modes:
 *   'local'  — sub-app entity lives in the parent process; calls are direct method invocations.
 *   'worker' — sub-app entity lives in a worker_thread; calls transit via MessagePort IPC.
 *
 * NO networking (HTTP / WebSocket / TCP) is used in either mode.
 *
 * @see K_LIB_Krnl_SubApp_Worker_Host.ts  — Worker-mode parent-side proxy.
 * @see K_LIB_Krnl_SubApp_Worker_Runtime.ts — Worker-side bootstrap loaded inside the thread.
 */

import path from 'path';
import { pathToFileURL } from 'url';
import { KrnlSubAppConfig, KrnlSubAppEntry } from './types.js';
import { subappLocalStorage } from './K_LIB_Krnl_System_Magnetic_Loader.js';
import type { krnlSystemEntityBase } from './K_ENT_Krnl_System_Entity_Base.js';

export class KrnlSubAppLoader {
  /**
   * Loads a single sub-app into the parent entity's _subAppRegistry.
   *
   * For 'local' mode the sub-app class is instantiated directly in the parent process.
   * Networking is suppressed automatically because the entity is constructed inside the
   * subappLocalStorage async context (sets _isSubApp = true) and _startSharedServer()
   * returns early for sub-app entities.
   *
   * For 'worker' mode a worker_thread is spawned and a KrnlSubAppWorkerHost proxy is
   * registered in its place. All calls transit via MessagePort — no TCP/HTTP involved.
   */
  static async load(
    parent: krnlSystemEntityBase,
    config: KrnlSubAppConfig
  ): Promise<void> {
    const mode = config.executionMode ?? 'local';
    const prefix = config.prefix.toLowerCase();

    if (parent._subAppRegistry.has(prefix)) {
      console.log(`[SubAppRegistry] Sub-app '${prefix}' already registered. Skipping.`);
      return;
    }

    let entry: KrnlSubAppEntry;

    if (mode === 'local') {
      // ── Local mode: in-process instantiation ──────────────────────────────
      const appDir = config.entryPath ? path.dirname(config.entryPath) : '';
      let entity: any;

      if (config.isKrnl === false || !config.ServiceClass) {
        const { KrnlNonKrnlAppAdapter } = await import('./K_LIB_Krnl_System_App_Adapter.js');
        const adapter = new KrnlNonKrnlAppAdapter(config.prefix, config.entryPath || '');
        await adapter.startApp();
        entity = adapter;
      } else {
        const options: any = { host: '0.0.0.0' };
        if (config.entryPath) options.sourcePath = pathToFileURL(config.entryPath).href;
        entity = await subappLocalStorage.run({ appPath: appDir }, async () => {
          const inst = new config.ServiceClass!(-1, options, ...(config.constructorArgs ?? []));
          if (inst._magneticLoadPromise) {
            await inst._magneticLoadPromise;
          }
          return inst;
        });
      }

      // Ensure _isSubApp is set (it should be via subappLocalStorage, but set defensively)
      entity._isSubApp = true;

      // Automatically boot the sub-app so its endpoints & frontend generation complete
      if (typeof entity.boot === 'function') {
        try {
          await entity.boot();
        } catch (bootErr: any) {
          console.warn(`[SubAppRegistry] Auto-boot warning on sub-app '${prefix}':`, bootErr.message || bootErr);
        }
      }

      // Resolve the ready-promise so consumers can await whenReady() without blocking
      // on _startSharedServer (which is suppressed for sub-apps).
      if (typeof entity._resolveReady === 'function') {
        entity._resolveReady();
      }

      // Register in parent's component hierarchy for lifecycle management (shutdown, etc.)
      parent.hierarchyManager.addComponentEntityInstance(entity);

      entry = {
        prefix,
        executionMode: 'local',
        entity,
        addedAt: Date.now(),
      };

      console.log(`[SubAppRegistry] Loaded sub-app '${prefix}' in LOCAL mode (in-process).`);

    } else {
      // ── Worker mode: isolated worker_thread ────────────────────────────────
      const { KrnlSubAppWorkerHost } = await import('./K_LIB_Krnl_SubApp_Worker_Host.js');
      const host = await KrnlSubAppWorkerHost.create(config);

      entry = {
        prefix,
        executionMode: 'worker',
        entity: host,
        addedAt: Date.now(),
      };

      console.log(`[SubAppRegistry] Loaded sub-app '${prefix}' in WORKER mode (isolated thread).`);
    }

    parent._subAppRegistry.set(prefix, entry);
  }
}
