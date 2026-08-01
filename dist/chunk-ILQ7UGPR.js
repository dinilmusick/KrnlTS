import {
  subappLocalStorage
} from "./chunk-EI7WXUUV.js";

// src/krnl/core/K_LIB_Krnl_SubApp_Registry.ts
import path from "path";
import { pathToFileURL } from "url";
var KrnlSubAppLoader = class {
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
  static async load(parent, config) {
    const mode = config.executionMode ?? "local";
    const prefix = config.prefix.toLowerCase();
    if (parent._subAppRegistry.has(prefix)) {
      console.log(`[SubAppRegistry] Sub-app '${prefix}' already registered. Skipping.`);
      return;
    }
    let entry;
    if (mode === "local") {
      const appDir = config.entryPath ? path.dirname(config.entryPath) : "";
      let entity;
      if (config.isKrnl === false || !config.ServiceClass) {
        const { KrnlNonKrnlAppAdapter } = await import("./K_LIB_Krnl_System_App_Adapter-HFNRT2XT.js");
        const adapter = new KrnlNonKrnlAppAdapter(config.prefix, config.entryPath || "");
        await adapter.startApp();
        entity = adapter;
      } else {
        const options = { host: "0.0.0.0" };
        if (config.entryPath) options.sourcePath = pathToFileURL(config.entryPath).href;
        entity = await subappLocalStorage.run({ appPath: appDir }, async () => {
          const inst = new config.ServiceClass(-1, options, ...config.constructorArgs ?? []);
          if (inst._magneticLoadPromise) {
            await inst._magneticLoadPromise;
          }
          return inst;
        });
      }
      entity._isSubApp = true;
      if (typeof entity._resolveReady === "function") {
        entity._resolveReady();
      }
      parent.hierarchyManager.addComponentEntityInstance(entity);
      entry = {
        prefix,
        executionMode: "local",
        entity,
        addedAt: Date.now()
      };
      console.log(`[SubAppRegistry] Loaded sub-app '${prefix}' in LOCAL mode (in-process).`);
    } else {
      const { KrnlSubAppWorkerHost } = await import("./K_LIB_Krnl_SubApp_Worker_Host-5M364MTA.js");
      const host = await KrnlSubAppWorkerHost.create(config);
      entry = {
        prefix,
        executionMode: "worker",
        entity: host,
        addedAt: Date.now()
      };
      console.log(`[SubAppRegistry] Loaded sub-app '${prefix}' in WORKER mode (isolated thread).`);
    }
    parent._subAppRegistry.set(prefix, entry);
  }
};

export {
  KrnlSubAppLoader
};
