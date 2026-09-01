import {
  krnlSystemEntityBase
} from "./chunk-T2ZVN434.js";

// src/core/K_LIB_Krnl_System_Magnetic_Loader.ts
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { AsyncLocalStorage } from "async_hooks";
var magneticStorage = new AsyncLocalStorage();
if (!globalThis.__krnlSubAppLocalStorage) {
  globalThis.__krnlSubAppLocalStorage = new AsyncLocalStorage();
}
var subappLocalStorage = globalThis.__krnlSubAppLocalStorage;
var KrnlMagneticLoader = class _KrnlMagneticLoader {
  /**
   * Scans and dynamically loads entities, functionalities, and subapps for the given entity or system.
   */
  static async loadAll(entity, baseDir) {
    const entityLabel = entity.entityName || entity.id || "Entity";
    console.log(`[MagneticLoader] loadAll called for entity '${entityLabel}' with baseDir '${baseDir}'`);
    const functionalitiesDir = path.join(baseDir, "functionalities");
    if (fs.existsSync(functionalitiesDir)) {
      const funcDirs = await fs.promises.readdir(functionalitiesDir, { withFileTypes: true });
      for (const dirent of funcDirs) {
        if (dirent.isDirectory()) {
          await this.loadFunctionality(entity, path.join(functionalitiesDir, dirent.name), dirent.name);
        }
      }
    }
    const entitiesDir = path.join(baseDir, "entities");
    if (fs.existsSync(entitiesDir)) {
      const entDirs = await fs.promises.readdir(entitiesDir, { withFileTypes: true });
      for (const dirent of entDirs) {
        if (dirent.isDirectory()) {
          await this.loadEntity(entity, path.join(entitiesDir, dirent.name), dirent.name);
        }
      }
    }
    const subappsDir = path.join(baseDir, "subapps");
    const isSubApp = subappLocalStorage.getStore() || entity._isSubApp || entity._isIngressNetworkMember;
    const krnlJsonPath = path.join(baseDir, "krnl.json");
    let subappMetaMap = {};
    if (fs.existsSync(krnlJsonPath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(krnlJsonPath, "utf-8"));
        subappMetaMap = parsed.subapps || {};
      } catch (_) {
      }
    }
    if (Object.keys(subappMetaMap).length > 0) {
      if (!fs.existsSync(subappsDir)) {
        fs.mkdirSync(subappsDir, { recursive: true });
      }
      for (const [subappName, subMeta] of Object.entries(subappMetaMap)) {
        const gitUrl = subMeta.git || subMeta.repo || subMeta.repository;
        if (gitUrl) {
          const targetAppPath = path.join(subappsDir, subappName);
          if (!fs.existsSync(targetAppPath)) {
            console.log(`[MagneticLoader] Cloning sub-app '${subappName}' from git repository '${gitUrl}'...`);
            try {
              let cloneUrl = gitUrl;
              if (cloneUrl.startsWith("github:")) {
                const parts = cloneUrl.replace("github:", "").split("#");
                const repoPath = parts[0];
                const branch = parts[1];
                cloneUrl = `https://github.com/${repoPath}.git`;
                if (branch) {
                  cloneUrl += ` -b ${branch}`;
                }
              }
              const { exec } = await import("child_process");
              const { promisify } = await import("util");
              const execPromise = promisify(exec);
              await execPromise(`git clone ${cloneUrl} "${targetAppPath}"`);
              console.log(`[MagneticLoader] Sub-app '${subappName}' cloned successfully from '${gitUrl}'.`);
            } catch (cloneErr) {
              console.error(`[MagneticLoader] Failed to clone sub-app '${subappName}' from '${gitUrl}':`, cloneErr.message || cloneErr);
            }
          }
        }
      }
    }
    const candidateSubappDirs = [
      path.join(baseDir, "subapps"),
      path.join(baseDir, "sub-apps"),
      path.join(baseDir, "src", "sub-apps")
    ].filter((d) => fs.existsSync(d));
    const loadedSubAppPaths = /* @__PURE__ */ new Set();
    for (const subappsDir2 of candidateSubappDirs) {
      await this.syncParentSubAppDependencies(baseDir, subappsDir2);
      const apps = await fs.promises.readdir(subappsDir2, { withFileTypes: true });
      const subappConfigs = [];
      for (const dirent of apps) {
        if (dirent.isDirectory()) {
          const appPath = path.join(subappsDir2, dirent.name);
          if (loadedSubAppPaths.has(appPath)) continue;
          loadedSubAppPaths.add(appPath);
          const buildOk = await this.ensureSubAppBuilt(appPath, dirent.name, entity, baseDir);
          if (!buildOk) {
            continue;
          }
          if (typeof entity.loadSubApp === "function") {
            const { KrnlSubAppDiscovery } = await import("./K_LIB_Krnl_SubApp_Engine-7HR5HWW2.js");
            const desc = await KrnlSubAppDiscovery.locateDescriptor(appPath, dirent.name);
            if (desc && (fs.existsSync(path.join(appPath, "subapp.json")) || fs.existsSync(desc.registrationPath))) {
              try {
                const subMeta = subappMetaMap[dirent.name] || subappMetaMap[dirent.name.toLowerCase()];
                const inst = await entity.loadSubApp(desc, subMeta || {});
                if (inst.state === "READY") {
                  console.log(`[MagneticLoader] Loaded sub-app '${dirent.name}' using registration contract on '${entity.entityName || entity.id}'.`);
                  continue;
                }
              } catch (loadErr) {
                console.warn(`[MagneticLoader] SubApp registration contract load warning for '${dirent.name}':`, loadErr.message);
              }
            }
          }
          const config = await this.detectSubApp(appPath, dirent.name);
          if (config) {
            subappConfigs.push(config);
          }
        }
      }
      if (subappConfigs.length > 0 && typeof entity.loadSubApps === "function") {
        for (const cfg of subappConfigs) {
          const subMeta = subappMetaMap[cfg.prefix] || subappMetaMap[Object.keys(subappMetaMap).find((k) => k.toLowerCase() === cfg.prefix) || ""];
          cfg.executionMode = subMeta?.executionMode ?? "local";
        }
        console.log(`[MagneticLoader] Loading ${subappConfigs.length} sub-app(s) on '${entity.entityName}' (no networking).`);
        await entity.loadSubApps(subappConfigs);
      }
    }
    let frontendDir = path.join(baseDir, "frontend");
    const oldFrontendsDir = path.join(baseDir, "frontends");
    if (!fs.existsSync(frontendDir) && fs.existsSync(oldFrontendsDir)) {
      try {
        fs.renameSync(oldFrontendsDir, frontendDir);
        console.log(`[MagneticLoader] Renamed legacy 'frontends/' directory to 'frontend/' on '${entity.entityName}'.`);
      } catch (err) {
        console.warn(`[MagneticLoader] Failed to rename 'frontends/' -> 'frontend/': ${err.message}`);
      }
    }
    if (entity._frontendEnabled && !fs.existsSync(frontendDir)) {
      try {
        fs.mkdirSync(frontendDir, { recursive: true });
      } catch (_) {
      }
    }
    if (fs.existsSync(frontendDir)) {
      if (!isSubApp) {
        entity.enableFrontend({ frontendDir });
      }
      const hasLocalFuncs = entity.localFunctionalities && entity.localFunctionalities.size > 0;
      const indexExists = fs.existsSync(path.join(frontendDir, "src", "index.tsx"));
      if (entity._subAppRegistry) {
        for (const [prefix, entry] of entity._subAppRegistry.entries()) {
          const subAppDir = entry.entity?._entityDataDir || entry.entity?._sourceDir;
          if (subAppDir) {
            const subFrontend = path.join(subAppDir, "frontend");
            if (fs.existsSync(subFrontend) && entity._frontend) {
              entity._frontend.registerSubAppFrontend(prefix, subFrontend);
            }
          }
        }
      }
      if (!isSubApp || hasLocalFuncs || !indexExists) {
        try {
          const { KrnlFrontendGenerator } = await import("./K_LIB_Krnl_Frontend_Generator-UYNRNX2X.js");
          await KrnlFrontendGenerator.generate(entity, frontendDir);
        } catch (err) {
          console.error(`[MagneticLoader] Frontend generator error on '${entity.entityName}':`, err.message || err);
        }
        try {
          const { KrnlFrontendBuilder } = await import("./K_LIB_Krnl_Frontend_Builder-2ZDUH6PF.js");
          await KrnlFrontendBuilder.build(frontendDir);
          if (process.env.NODE_ENV !== "production" && !isSubApp) {
            KrnlFrontendBuilder.watch(frontendDir).catch((err) => {
              console.warn(`[MagneticLoader] esbuild watcher error on '${entity.entityName}':`, err.message || err);
            });
          }
        } catch (err) {
          console.error(`[MagneticLoader] Frontend builder error on '${entity.entityName}':`, err.message || err);
        }
      }
    }
    const adaptersDir = path.join(baseDir, "protocol_adapters");
    if (fs.existsSync(adaptersDir) && typeof entity.attachAdapter === "function") {
      try {
        const adapterFiles = await fs.promises.readdir(adaptersDir);
        for (const file of adapterFiles) {
          if (file.endsWith(".js") || file.endsWith(".ts")) {
            const mod = await import(pathToFileURL(path.join(adaptersDir, file)).href);
            const AdapterClass = mod.default || mod[path.basename(file, path.extname(file))];
            if (AdapterClass && typeof AdapterClass === "function") {
              const adapterInstance = new AdapterClass();
              entity.attachAdapter(adapterInstance);
              console.log(`[MagneticLoader] Attached protocol adapter '${adapterInstance.name || file}' to entity '${entityLabel}'.`);
            }
          }
        }
      } catch (err) {
        console.warn(`[MagneticLoader] Error scanning protocol_adapters in '${baseDir}':`, err.message || err);
      }
    }
    if (entity.localFunctionalities && typeof entity.initializeAiLayer === "function") {
      const hasAiConfig = [...entity.localFunctionalities.values()].some((f) => f.ai?.enabled);
      let hasAiStore = false;
      const storePath = path.join(baseDir, "krnl_runtime_state.db");
      if (fs.existsSync(storePath)) {
        try {
          const storeContent = JSON.parse(fs.readFileSync(storePath, "utf-8"));
          if (storeContent?.endpointAgentProfiles && Object.keys(storeContent.endpointAgentProfiles).length > 0) {
            hasAiStore = true;
          }
        } catch (e) {
        }
      }
      if (hasAiConfig || hasAiStore) {
        console.log(`[MagneticLoader] Automatically initializing AI Layer on '${entityLabel}'...`);
        await entity.initializeAiLayer(baseDir);
        entity.setFlag?.("krnl:ai_layer_ready");
      }
    }
    entity.setFlag?.("krnl:magnetic_load_complete");
  }
  static async loadFunctionality(entity, funcDir, funcName) {
    const descriptorPath = path.join(funcDir, `${funcName}.js`);
    let atom = null;
    if (fs.existsSync(descriptorPath)) {
      const mod = await import(pathToFileURL(descriptorPath).href);
      atom = mod[`${funcName}Atom`] || mod.default || mod.Atom;
    }
    if (!atom) {
      atom = {
        id: funcName,
        visibility: "public",
        emitters: {}
      };
      const statePath = path.join(funcDir, "state_data", "state.js");
      if (fs.existsSync(statePath)) {
        const mod = await import(pathToFileURL(statePath).href);
        atom.initialState = mod[`${funcName.toLowerCase()}InitialState`] || mod.initialState || mod.default;
      }
      const logicPath = path.join(funcDir, "main_function", "logic.js");
      if (fs.existsSync(logicPath)) {
        const mod = await import(pathToFileURL(logicPath).href);
        atom.api = mod.main || mod.default;
      }
      const lifecyclePath = path.join(funcDir, "main_function", "lifecycle.js");
      if (fs.existsSync(lifecyclePath)) {
        const mod = await import(pathToFileURL(lifecyclePath).href);
        atom.onMount = mod.onMount;
        atom.onTeardown = mod.onTeardown;
      }
      const manifestPath = path.join(funcDir, "manifest.json");
      if (fs.existsSync(manifestPath)) {
        try {
          const parsedManifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
          atom.manifest = parsedManifest;
        } catch (e) {
          console.warn(`[MagneticLoader] Error parsing manifest.json in '${funcDir}':`, e.message);
        }
      }
      const eventsDir2 = path.join(funcDir, "events");
      if (fs.existsSync(eventsDir2)) {
        const eventFiles = await fs.promises.readdir(eventsDir2);
        for (const file of eventFiles) {
          if (file.endsWith(".js")) {
            const name = path.basename(file, ".js");
            atom.emitters[name] = {};
          }
        }
      }
    }
    if (atom && !atom.manifest) {
      const manifestPath = path.join(funcDir, "manifest.json");
      if (fs.existsSync(manifestPath)) {
        try {
          atom.manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
        } catch (_) {
        }
      }
    }
    const helpers = {};
    const helpersDir = path.join(funcDir, "helper_functions");
    if (fs.existsSync(helpersDir)) {
      const files = await fs.promises.readdir(helpersDir);
      for (const file of files) {
        if (file.endsWith(".js")) {
          const name = path.basename(file, ".js");
          const mod = await import(pathToFileURL(path.join(helpersDir, file)).href);
          helpers[name] = mod[name] || mod.default || mod;
          this.registerGlobalWrapper(name);
        }
      }
    }
    const events = {};
    const eventsDir = path.join(funcDir, "events");
    if (fs.existsSync(eventsDir)) {
      const files = await fs.promises.readdir(eventsDir);
      for (const file of files) {
        if (file.endsWith(".js")) {
          const name = path.basename(file, ".js");
          const mod = await import(pathToFileURL(path.join(eventsDir, file)).href);
          events[name] = mod[name] || mod.default || mod;
          this.registerGlobalWrapper(name);
        }
      }
    }
    const originalApi = atom.api;
    if (originalApi) {
      atom.api = async (input, context) => {
        return await magneticStorage.run({ helpers, events }, async () => {
          return await originalApi(input, context);
        });
      };
    }
    entity.addLocal(atom);
  }
  static async loadEntity(parent, entDir, entName) {
    let fileToImport = null;
    const candidates = [`${entName}.js`, "assembler.js", "index.js"];
    for (const cand of candidates) {
      const p = path.join(entDir, cand);
      if (fs.existsSync(p)) {
        fileToImport = p;
        break;
      }
    }
    let childInstance = null;
    if (fileToImport) {
      const mod = await import(pathToFileURL(fileToImport).href);
      const ClassToUse = mod[entName] || mod.default || mod.Entity;
      if (ClassToUse && parent.hierarchyManager) {
        childInstance = parent.hierarchyManager.createComponentEntity(entName, ClassToUse);
        console.log(`[MagneticLoader] Magnetically instantiated child entity: ${entName} under ${parent.entityName || parent.id}`);
      }
    }
    if (!childInstance && parent.hierarchyManager) {
      const { Entity } = await import("./K_ENT_Entity-HDSCXC5F.js");
      childInstance = parent.hierarchyManager.createComponentEntity(entName, Entity);
      console.log(`[MagneticLoader] Auto-created child entity container: ${entName} under ${parent.entityName || parent.id}`);
    }
    if (childInstance) {
      await _KrnlMagneticLoader.loadAll(childInstance, entDir);
    }
  }
  static async ensureSubAppBuilt(appPath, appName, entity, parentBaseDir) {
    const packageJsonPath = path.join(appPath, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      return true;
    }
    const subNodeModules = path.join(appPath, "node_modules");
    const candidateParentDirs = [
      parentBaseDir ? path.join(parentBaseDir, "node_modules") : null,
      parentBaseDir ? path.resolve(parentBaseDir, "..", "node_modules") : null,
      path.join(process.cwd(), "node_modules")
    ].filter(Boolean);
    const parentNodeModules = candidateParentDirs.find((d) => fs.existsSync(d));
    if (!fs.existsSync(subNodeModules) && parentNodeModules) {
      try {
        fs.symlinkSync(parentNodeModules, subNodeModules, "junction");
        console.log(`[MagneticLoader] Symlinked sub-app node_modules for '${appName}' -> '${parentNodeModules}'`);
      } catch (symErr) {
        console.warn(`[MagneticLoader] Symlinking node_modules for '${appName}' failed, falling back:`, symErr.message);
      }
    }
    const assemblerPath = path.join(appPath, "assembler.js");
    let distPath = path.join(appPath, "dist", `${appName}.js`);
    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkgJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        if (pkgJson.main) {
          distPath = path.resolve(appPath, pkgJson.main);
        }
      } catch (_) {
      }
    }
    let gitUpdated = false;
    const gitDir = path.join(appPath, ".git");
    if (fs.existsSync(gitDir)) {
      console.log(`[MagneticLoader] Checking for git remote updates for sub-app '${appName}'...`);
      try {
        const { exec } = await import("child_process");
        const { promisify } = await import("util");
        const execPromise = promisify(exec);
        await execPromise("git fetch", { cwd: appPath, timeout: 3e3 });
        const { stdout } = await execPromise("git status -uno", { cwd: appPath, timeout: 3e3 });
        if (stdout.includes("Your branch is behind") || stdout.includes("can be fast-forwarded")) {
          console.log(`[MagneticLoader] Remote updates found for sub-app '${appName}'. Pulling changes...`);
          const pullResult = await execPromise("git pull", { cwd: appPath, timeout: 5e3 });
          console.log(`[MagneticLoader] Git pull result for '${appName}':`, pullResult.stdout);
          gitUpdated = true;
        } else {
          console.log(`[MagneticLoader] Sub-app '${appName}' git repository is up to date.`);
        }
      } catch (err) {
        console.warn(`[MagneticLoader] Warning: git update check failed for '${appName}':`, err.message || err);
      }
    }
    if (!fs.existsSync(assemblerPath) || !fs.existsSync(distPath) || !fs.existsSync(path.join(appPath, "node_modules")) || gitUpdated) {
      console.log(`[MagneticLoader] Sub-app '${appName}' ${gitUpdated ? "was updated via git" : "is missing build artifacts"}. Initiating auto-build...`);
      try {
        const pkgJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        const hasBuildScript = pkgJson.scripts && pkgJson.scripts.build;
        if (!hasBuildScript) {
          throw new Error(`package.json is missing a 'build' script.`);
        }
        const nodeModulesPath = path.join(appPath, "node_modules");
        if (!fs.existsSync(nodeModulesPath)) {
          let installCmd = "npm install --no-audit --no-fund";
          if (fs.existsSync(path.join(appPath, "pnpm-lock.yaml"))) {
            installCmd = "pnpm install";
          } else if (fs.existsSync(path.join(appPath, "yarn.lock"))) {
            installCmd = "yarn install";
          }
          console.log(`[MagneticLoader] Installing dependencies for '${appName}' using '${installCmd}'...`);
          const { exec: exec2 } = await import("child_process");
          const { promisify: promisify2 } = await import("util");
          const execPromise2 = promisify2(exec2);
          await execPromise2(installCmd, { cwd: appPath });
        } else {
          const pkgJson2 = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
          const hasKrnlts = pkgJson2.dependencies && pkgJson2.dependencies.krnlts || pkgJson2.devDependencies && pkgJson2.devDependencies.krnlts;
          if (hasKrnlts) {
            let updateCmd = "npm update krnlts";
            if (fs.existsSync(path.join(appPath, "pnpm-lock.yaml"))) {
              updateCmd = "pnpm update krnlts";
            } else if (fs.existsSync(path.join(appPath, "yarn.lock"))) {
              updateCmd = "yarn upgrade krnlts";
            }
            console.log(`[MagneticLoader] Automatically updating krnlts dependency for '${appName}' using '${updateCmd}'...`);
            try {
              const { exec: exec2 } = await import("child_process");
              const { promisify: promisify2 } = await import("util");
              const execPromise2 = promisify2(exec2);
              await execPromise2(updateCmd, { cwd: appPath });
            } catch (err) {
              console.warn(`[MagneticLoader] Warning: auto-updating krnlts for '${appName}' failed:`, err.message || err);
            }
          }
        }
        let buildCmd = "npm run build";
        if (fs.existsSync(path.join(appPath, "pnpm-lock.yaml"))) {
          buildCmd = "pnpm run build";
        } else if (fs.existsSync(path.join(appPath, "yarn.lock"))) {
          buildCmd = "yarn build";
        }
        console.log(`[MagneticLoader] Building '${appName}' using '${buildCmd}'...`);
        const { exec } = await import("child_process");
        const { promisify } = await import("util");
        const execPromise = promisify(exec);
        await execPromise(buildCmd, { cwd: appPath });
        if (!fs.existsSync(assemblerPath)) {
          console.log(`[MagneticLoader] Automatically generating assembler.js for '${appName}'...`);
          const code = `export { ${appName} as default } from "./dist/${appName}.js";
`;
          fs.writeFileSync(assemblerPath, code, "utf-8");
        }
        console.log(`[MagneticLoader] Sub-app '${appName}' successfully built and prepared.`);
      } catch (err) {
        const errMsg = err.message || String(err);
        console.error(`[MagneticLoader] Failed to build sub-app '${appName}':`, errMsg);
        entity._subappErrors = entity._subappErrors || [];
        entity._subappErrors.push({
          subapp: appName,
          error: errMsg
        });
        return false;
      }
    }
    return true;
  }
  static async detectSubApp(appPath, appName) {
    const assemblerPath = path.join(appPath, "assembler.js");
    if (fs.existsSync(assemblerPath)) {
      const mod = await import(pathToFileURL(assemblerPath).href);
      const ServiceClass = mod[appName] || mod.default;
      if (ServiceClass) {
        const isKrnlSubclass = ServiceClass.prototype && (ServiceClass.prototype instanceof krnlSystemEntityBase || typeof ServiceClass.prototype.boot === "function");
        return {
          ServiceClass,
          prefix: appName.toLowerCase(),
          isKrnl: !!isKrnlSubclass,
          entryPath: isKrnlSubclass ? assemblerPath : appPath
        };
      }
    }
    const packageJsonPath = path.join(appPath, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      if (fs.existsSync(path.join(appPath, "KrnlFrontendModule.ts"))) {
        return null;
      }
      return {
        prefix: appName.toLowerCase(),
        isKrnl: false,
        entryPath: appPath
      };
    }
    return null;
  }
  /**
   * Automatically reconciles parent application package.json when sub-apps are added or removed.
   * - Packages needed by new sub-apps are added to parent package.json.
   * - Packages no longer needed by any sub-app are removed from parent package.json.
   */
  static async syncParentSubAppDependencies(baseDir, subappsDir) {
    try {
      const candidateParentPaths = [
        path.join(baseDir, "package.json"),
        path.resolve(baseDir, "..", "package.json"),
        path.join(process.cwd(), "package.json")
      ];
      const parentPkgPath = candidateParentPaths.find((p) => fs.existsSync(p));
      if (!parentPkgPath) return;
      const parentDir = path.dirname(parentPkgPath);
      const parentKrnlJsonPath = path.join(baseDir, "krnl.json");
      let krnlJson = {};
      if (fs.existsSync(parentKrnlJsonPath)) {
        try {
          krnlJson = JSON.parse(fs.readFileSync(parentKrnlJsonPath, "utf-8"));
        } catch (_) {
        }
      }
      const previousManaged = krnlJson.managedSubAppDependencies || {};
      const activeSubAppDeps = {};
      const subEntries = await fs.promises.readdir(subappsDir, { withFileTypes: true });
      for (const dirent of subEntries) {
        if (dirent.isDirectory()) {
          const subPkgPath = path.join(subappsDir, dirent.name, "package.json");
          if (fs.existsSync(subPkgPath)) {
            try {
              const subPkg = JSON.parse(fs.readFileSync(subPkgPath, "utf-8"));
              const combined = { ...subPkg.dependencies, ...subPkg.devDependencies };
              for (const [pkgName, pkgVer] of Object.entries(combined)) {
                if (pkgName !== "krnlts" && pkgName !== "tsup" && !pkgName.startsWith("@types/")) {
                  activeSubAppDeps[pkgName] = pkgVer;
                }
              }
            } catch (_) {
            }
          }
        }
      }
      const parentPkg = JSON.parse(fs.readFileSync(parentPkgPath, "utf-8"));
      parentPkg.dependencies = parentPkg.dependencies || {};
      let modified = false;
      for (const [pkgName, pkgVer] of Object.entries(activeSubAppDeps)) {
        if (!parentPkg.dependencies[pkgName]) {
          console.log(`[MagneticLoader] Adding new sub-app dependency '${pkgName}@${pkgVer}' to parent package.json...`);
          parentPkg.dependencies[pkgName] = pkgVer;
          previousManaged[pkgName] = pkgVer;
          modified = true;
        }
      }
      for (const [pkgName] of Object.entries(previousManaged)) {
        if (!activeSubAppDeps[pkgName]) {
          console.log(`[MagneticLoader] Removing stale sub-app dependency '${pkgName}' from parent package.json...`);
          delete parentPkg.dependencies[pkgName];
          delete previousManaged[pkgName];
          modified = true;
        }
      }
      if (modified) {
        fs.writeFileSync(parentPkgPath, JSON.stringify(parentPkg, null, 2) + "\n", "utf-8");
        krnlJson.managedSubAppDependencies = previousManaged;
        if (fs.existsSync(parentKrnlJsonPath)) {
          fs.writeFileSync(parentKrnlJsonPath, JSON.stringify(krnlJson, null, 2) + "\n", "utf-8");
        }
        console.log(`[MagneticLoader] Parent package.json dependencies updated. Running npm install...`);
        const { exec } = await import("child_process");
        const { promisify } = await import("util");
        const execPromise = promisify(exec);
        await execPromise("npm install --no-audit --no-fund", { cwd: parentDir });
        console.log(`[MagneticLoader] Parent dependencies synced successfully.`);
      }
    } catch (err) {
      console.warn(`[MagneticLoader] Sub-app dependency reconciliation warning:`, err.message || err);
    }
  }
  static registerGlobalWrapper(name) {
    if (!globalThis[name]) {
      Object.defineProperty(globalThis, name, {
        value: (...args) => {
          const store = magneticStorage.getStore();
          const fn = store?.helpers?.[name] || store?.events?.[name];
          if (!fn) {
            throw new Error(`[MagneticSystem] Dynamic asset '${name}' called outside active functionality context.`);
          }
          return fn(...args);
        },
        configurable: true,
        writable: true
      });
    }
  }
};

export {
  magneticStorage,
  subappLocalStorage,
  KrnlMagneticLoader
};
