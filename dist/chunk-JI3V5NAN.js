import {
  krnlSystemEntityBase
} from "./chunk-OASIVKHZ.js";

// src/krnl/core/K_LIB_Krnl_System_Magnetic_Loader.ts
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { AsyncLocalStorage } from "async_hooks";
var magneticStorage = new AsyncLocalStorage();
if (!globalThis.__krnlSubAppLocalStorage) {
  globalThis.__krnlSubAppLocalStorage = new AsyncLocalStorage();
}
var subappLocalStorage = globalThis.__krnlSubAppLocalStorage;
var KrnlMagneticLoader = class {
  /**
   * Scans and dynamically loads entities, functionalities, and subapps for the given system entity.
   */
  static async loadAll(entity, baseDir) {
    console.log(`[MagneticLoader] loadAll called for entity '${entity.entityName}' with baseDir '${baseDir}'`);
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
    if (fs.existsSync(subappsDir) && !isSubApp) {
      const apps = await fs.promises.readdir(subappsDir, { withFileTypes: true });
      const subappConfigs = [];
      for (const dirent of apps) {
        if (dirent.isDirectory()) {
          const appPath = path.join(subappsDir, dirent.name);
          const buildOk = await this.ensureSubAppBuilt(appPath, dirent.name, entity);
          if (!buildOk) {
            continue;
          }
          const config = await this.detectSubApp(appPath, dirent.name);
          if (config) {
            subappConfigs.push(config);
          }
        }
      }
      if (subappConfigs.length > 0) {
        const krnlJsonPath = path.join(baseDir, "krnl.json");
        let subappModes = {};
        if (fs.existsSync(krnlJsonPath)) {
          try {
            const parsed = JSON.parse(fs.readFileSync(krnlJsonPath, "utf-8"));
            subappModes = parsed.subapps || {};
          } catch (_) {
          }
        }
        for (const cfg of subappConfigs) {
          cfg.executionMode = subappModes[cfg.prefix]?.executionMode ?? "local";
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
    if (fs.existsSync(frontendDir) && !isSubApp) {
      entity.enableFrontend({ frontendDir });
      if (entity._subAppRegistry && entity._frontend) {
        for (const [prefix, entry] of entity._subAppRegistry.entries()) {
          const subAppDir = entry.entity?._entityDataDir;
          if (subAppDir) {
            const subFrontend = path.join(subAppDir, "frontend");
            if (fs.existsSync(subFrontend)) {
              entity._frontend.registerSubAppFrontend(prefix, subFrontend);
            }
          }
        }
      }
      try {
        const { KrnlFrontendGenerator } = await import("./K_LIB_Krnl_Frontend_Generator-YG7RBNPF.js");
        await KrnlFrontendGenerator.generate(entity, frontendDir);
      } catch (err) {
        console.error(`[MagneticLoader] Frontend generator error on '${entity.entityName}':`, err.message || err);
      }
      try {
        const { KrnlFrontendBuilder } = await import("./K_LIB_Krnl_Frontend_Builder-H4O6WUEK.js");
        await KrnlFrontendBuilder.build(frontendDir);
        if (process.env.NODE_ENV !== "production") {
          await KrnlFrontendBuilder.watch(frontendDir);
        }
      } catch (err) {
        console.error(`[MagneticLoader] Frontend builder error on '${entity.entityName}':`, err.message || err);
      }
    }
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
      console.log(`[MagneticLoader] Automatically initializing AI Layer on '${entity.entityName}'...`);
      await entity.initializeAiLayer(baseDir);
    }
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
    const fileToImport = path.join(entDir, `${entName}.js`);
    if (fs.existsSync(fileToImport)) {
      const mod = await import(pathToFileURL(fileToImport).href);
      const ClassToUse = mod[entName] || mod.default;
      if (ClassToUse) {
        parent.hierarchyManager.createComponentEntity(entName, ClassToUse);
        console.log(`[MagneticLoader] Magnetically instantiated child entity: ${entName} under ${parent.entityName}`);
      }
    }
  }
  static async ensureSubAppBuilt(appPath, appName, entity) {
    const packageJsonPath = path.join(appPath, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      return true;
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
