// src/krnl/core/K_LIB_Krnl_System_Magnetic_Loader.ts
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { AsyncLocalStorage } from "async_hooks";
var magneticStorage = new AsyncLocalStorage();
var KrnlMagneticLoader = class {
  /**
   * Scans and dynamically loads entities, functionalities, and subapps for the given system entity.
   */
  static async loadAll(entity, baseDir) {
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
    if (fs.existsSync(subappsDir)) {
      const apps = await fs.promises.readdir(subappsDir, { withFileTypes: true });
      const subappConfigs = [];
      for (const dirent of apps) {
        if (dirent.isDirectory()) {
          const appPath = path.join(subappsDir, dirent.name);
          const config = await this.detectSubApp(appPath, dirent.name);
          if (config) {
            subappConfigs.push(config);
          }
        }
      }
      if (subappConfigs.length > 0) {
        console.log(`[MagneticLoader] Automatically enabling Ingress Network on '${entity.entityName}' with ${subappConfigs.length} sub-apps.`);
        await entity.startIngressNetwork(subappConfigs);
      }
    }
    const frontendDir = path.join(baseDir, "frontend", "default");
    if (fs.existsSync(frontendDir)) {
      const configPath = path.join(frontendDir, "krnl-frontend.json");
      let frontendOptions = { title: entity.entityName, theme: "dark" };
      if (fs.existsSync(configPath)) {
        try {
          const content = fs.readFileSync(configPath, "utf-8");
          frontendOptions = { ...frontendOptions, ...JSON.parse(content) };
        } catch (_) {
        }
      }
      entity.enableFrontend(frontendOptions);
      console.log(`[MagneticLoader] Auto-enabled default frontend for '${entity.entityName}' (found frontend/default folder).`);
    }
    const generalFrontendDir = path.join(baseDir, "frontend");
    if (fs.existsSync(generalFrontendDir)) {
      const entries = await fs.promises.readdir(generalFrontendDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== "default") {
          const appPath = path.join(generalFrontendDir, entry.name);
          if (fs.existsSync(path.join(appPath, "package.json")) || fs.existsSync(path.join(appPath, "krnl-frontend.json"))) {
            let options = {};
            const configPath = path.join(appPath, "krnl-frontend.json");
            if (fs.existsSync(configPath)) {
              try {
                options = JSON.parse(fs.readFileSync(configPath, "utf-8"));
              } catch (_) {
              }
            }
            console.log(`[MagneticLoader] Detected custom frontend '${entry.name}' at '${appPath}'. Registering...`);
            await entity.startCustomFrontend(entry.name, appPath, options);
          }
        }
      }
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
  static async detectSubApp(appPath, appName) {
    const assemblerPath = path.join(appPath, "assembler.js");
    if (fs.existsSync(assemblerPath)) {
      const mod = await import(pathToFileURL(assemblerPath).href);
      const ServiceClass = mod[appName] || mod.default;
      if (ServiceClass) {
        return {
          ServiceClass,
          prefix: appName.toLowerCase(),
          isKrnl: true,
          entryPath: assemblerPath
        };
      }
    }
    const packageJsonPath = path.join(appPath, "package.json");
    if (fs.existsSync(packageJsonPath)) {
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
  KrnlMagneticLoader
};
