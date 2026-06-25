import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { AsyncLocalStorage } from 'async_hooks';
import { krnlSystemEntityBase } from './K_ENT_Krnl_System_Entity_Base.js';

export const magneticStorage = new AsyncLocalStorage<{
  helpers: Record<string, any>;
  events: Record<string, any>;
}>();

export interface KrnlSubAppConfig {
  ServiceClass: any;
  prefix: string;
  isKrnl: boolean;
  entryPath: string;
}

export class KrnlMagneticLoader {
  /**
   * Scans and dynamically loads entities, functionalities, and subapps for the given system entity.
   */
  static async loadAll(entity: krnlSystemEntityBase, baseDir: string): Promise<void> {
    // 1. Scan and load functionalities
    const functionalitiesDir = path.join(baseDir, 'functionalities');
    if (fs.existsSync(functionalitiesDir)) {
      const funcDirs = await fs.promises.readdir(functionalitiesDir, { withFileTypes: true });
      for (const dirent of funcDirs) {
        if (dirent.isDirectory()) {
          await this.loadFunctionality(entity, path.join(functionalitiesDir, dirent.name), dirent.name);
        }
      }
    }

    // 2. Scan and load nested entities
    const entitiesDir = path.join(baseDir, 'entities');
    if (fs.existsSync(entitiesDir)) {
      const entDirs = await fs.promises.readdir(entitiesDir, { withFileTypes: true });
      for (const dirent of entDirs) {
        if (dirent.isDirectory()) {
          await this.loadEntity(entity, path.join(entitiesDir, dirent.name), dirent.name);
        }
      }
    }

    // 3. Scan and load subapps for automatic Ingress Network mapping
    const subappsDir = path.join(baseDir, 'subapps');
    if (fs.existsSync(subappsDir)) {
      const apps = await fs.promises.readdir(subappsDir, { withFileTypes: true });
      const subappConfigs: any[] = [];
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

    // 4. Auto-enable frontend if frontend/default folder exists
    const frontendDir = path.join(baseDir, 'frontend', 'default');
    if (fs.existsSync(frontendDir)) {
      const configPath = path.join(frontendDir, 'krnl-frontend.json');
      let frontendOptions: any = { title: entity.entityName, theme: 'dark' };
      if (fs.existsSync(configPath)) {
        try {
          const content = fs.readFileSync(configPath, 'utf-8');
          frontendOptions = { ...frontendOptions, ...JSON.parse(content) };
        } catch (_) {}
      }
      entity.enableFrontend(frontendOptions);
      console.log(`[MagneticLoader] Auto-enabled default frontend for '${entity.entityName}' (found frontend/default folder).`);
    }

    // 5. Scan and load custom frontends under frontend/ (except 'default')
    const generalFrontendDir = path.join(baseDir, 'frontend');
    if (fs.existsSync(generalFrontendDir)) {
      const entries = await fs.promises.readdir(generalFrontendDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== 'default') {
          const appPath = path.join(generalFrontendDir, entry.name);
          if (fs.existsSync(path.join(appPath, 'package.json')) || fs.existsSync(path.join(appPath, 'krnl-frontend.json'))) {
            let options: any = {};
            const configPath = path.join(appPath, 'krnl-frontend.json');
            if (fs.existsSync(configPath)) {
              try {
                options = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
              } catch (_) {}
            }
            console.log(`[MagneticLoader] Detected custom frontend '${entry.name}' at '${appPath}'. Registering...`);
            await entity.startCustomFrontend(entry.name, appPath, options);
          }
        }
      }
    }
  }

  static async loadFunctionality(entity: krnlSystemEntityBase, funcDir: string, funcName: string): Promise<void> {
    // Look for explicit descriptor first (e.g. StockUpdate.js)
    const descriptorPath = path.join(funcDir, `${funcName}.js`);
    let atom: any = null;

    if (fs.existsSync(descriptorPath)) {
      const mod = await import(pathToFileURL(descriptorPath).href);
      atom = mod[`${funcName}Atom`] || mod.default || mod.Atom;
    }

    // If no explicit descriptor, build one magnetically
    if (!atom) {
      atom = {
        id: funcName,
        visibility: 'public',
        emitters: {}
      };

      // Load initial state
      const statePath = path.join(funcDir, 'state_data', 'state.js');
      if (fs.existsSync(statePath)) {
        const mod = await import(pathToFileURL(statePath).href);
        atom.initialState = mod[`${funcName.toLowerCase()}InitialState`] || mod.initialState || mod.default;
      }

      // Load API logic function
      const logicPath = path.join(funcDir, 'main_function', 'logic.js');
      if (fs.existsSync(logicPath)) {
        const mod = await import(pathToFileURL(logicPath).href);
        atom.api = mod.main || mod.default;
      }

      // Load lifecycle mount/teardown
      const lifecyclePath = path.join(funcDir, 'main_function', 'lifecycle.js');
      if (fs.existsSync(lifecyclePath)) {
        const mod = await import(pathToFileURL(lifecyclePath).href);
        atom.onMount = mod.onMount;
        atom.onTeardown = mod.onTeardown;
      }

      // Automatically register any event emitters based on event file names
      const eventsDir = path.join(funcDir, 'events');
      if (fs.existsSync(eventsDir)) {
        const eventFiles = await fs.promises.readdir(eventsDir);
        for (const file of eventFiles) {
          if (file.endsWith('.js')) {
            const name = path.basename(file, '.js');
            atom.emitters[name] = {};
          }
        }
      }
    }

    // Read helper functions dynamically
    const helpers: Record<string, any> = {};
    const helpersDir = path.join(funcDir, 'helper_functions');
    if (fs.existsSync(helpersDir)) {
      const files = await fs.promises.readdir(helpersDir);
      for (const file of files) {
        if (file.endsWith('.js')) {
          const name = path.basename(file, '.js');
          const mod = await import(pathToFileURL(path.join(helpersDir, file)).href);
          helpers[name] = mod[name] || mod.default || mod;

          // Expose helper on globalThis dynamically inside async execution context
          this.registerGlobalWrapper(name);
        }
      }
    }

    // Read events dynamically
    const events: Record<string, any> = {};
    const eventsDir = path.join(funcDir, 'events');
    if (fs.existsSync(eventsDir)) {
      const files = await fs.promises.readdir(eventsDir);
      for (const file of files) {
        if (file.endsWith('.js')) {
          const name = path.basename(file, '.js');
          const mod = await import(pathToFileURL(path.join(eventsDir, file)).href);
          events[name] = mod[name] || mod.default || mod;

          // Expose event on globalThis dynamically inside async execution context
          this.registerGlobalWrapper(name);
        }
      }
    }

    // Wrap the functionality API to bind local helpers and events inside AsyncLocalStorage
    const originalApi = atom.api;
    if (originalApi) {
      atom.api = async (input: any, context: any) => {
        return await magneticStorage.run({ helpers, events }, async () => {
          return await originalApi(input, context);
        });
      };
    }

    entity.addLocal(atom);
  }

  static async loadEntity(parent: krnlSystemEntityBase, entDir: string, entName: string): Promise<void> {
    // Look for composition assembler file (e.g. MyEntity.js)
    const fileToImport = path.join(entDir, `${entName}.js`);
    if (fs.existsSync(fileToImport)) {
      const mod = await import(pathToFileURL(fileToImport).href);
      const ClassToUse = mod[entName] || mod.default;
      if (ClassToUse) {
        // Instantiate and add to parent hierarchy
        parent.hierarchyManager.createComponentEntity(entName, ClassToUse);
        console.log(`[MagneticLoader] Magnetically instantiated child entity: ${entName} under ${parent.entityName}`);
      }
    }
  }

  static async detectSubApp(appPath: string, appName: string): Promise<any | null> {
    // Standard KrnlTS sub-app detection (has an assembler file)
    const assemblerPath = path.join(appPath, 'assembler.js');
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

    // Non-KrnlTS sub-app detection (e.g., standard Node app)
    const packageJsonPath = path.join(appPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      if (fs.existsSync(path.join(appPath, 'KrnlFrontendModule.ts'))) {
        // Exclude wrapped frontend modules from sub-app detection
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

  private static registerGlobalWrapper(name: string): void {
    if (!(globalThis as any)[name]) {
      Object.defineProperty(globalThis, name, {
        value: (...args: any[]) => {
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
}
