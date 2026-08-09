import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { AsyncLocalStorage } from 'async_hooks';
import { krnlSystemEntityBase } from './K_ENT_Krnl_System_Entity_Base.js';
import type { KrnlSubAppConfig } from './types.js';

export const magneticStorage = new AsyncLocalStorage<{
  helpers: Record<string, any>;
  events: Record<string, any>;
}>();

if (!(globalThis as any).__krnlSubAppLocalStorage) {
  (globalThis as any).__krnlSubAppLocalStorage = new AsyncLocalStorage<boolean>();
}
export const subappLocalStorage = (globalThis as any).__krnlSubAppLocalStorage;

export class KrnlMagneticLoader {
  /**
   * Scans and dynamically loads entities, functionalities, and subapps for the given system entity.
   */
  static async loadAll(entity: krnlSystemEntityBase, baseDir: string): Promise<void> {
    console.log(`[MagneticLoader] loadAll called for entity '${entity.entityName}' with baseDir '${baseDir}'`);
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

    // 3. Scan and load sub-apps.
    //    Sub-apps are normal KrnlTS applications embedded inside this parent entity.
    //    They run without any networking stack (no HTTP, no WebSocket, no TCP).
    //    The execution mode (local | worker) is read from the parent's krnl.json.
    const subappsDir = path.join(baseDir, 'subapps');
    const isSubApp = subappLocalStorage.getStore() || (entity as any)._isSubApp || (entity as any)._isIngressNetworkMember;
    
    // Read subapp definitions from parent's krnl.json
    const krnlJsonPath = path.join(baseDir, 'krnl.json');
    let subappMetaMap: Record<string, { executionMode?: string; git?: string; repo?: string; repository?: string }> = {};
    if (fs.existsSync(krnlJsonPath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(krnlJsonPath, 'utf-8'));
        subappMetaMap = parsed.subapps || {};
      } catch (_) {}
    }

    // Auto-clone sub-apps configured with git repos if missing in subappsDir
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
              if (cloneUrl.startsWith('github:')) {
                const parts = cloneUrl.replace('github:', '').split('#');
                const repoPath = parts[0];
                const branch = parts[1];
                cloneUrl = `https://github.com/${repoPath}.git`;
                if (branch) {
                  cloneUrl += ` -b ${branch}`;
                }
              }
              const { exec } = await import('child_process');
              const { promisify } = await import('util');
              const execPromise = promisify(exec);
              await execPromise(`git clone ${cloneUrl} "${targetAppPath}"`);
              console.log(`[MagneticLoader] Sub-app '${subappName}' cloned successfully from '${gitUrl}'.`);
            } catch (cloneErr: any) {
              console.error(`[MagneticLoader] Failed to clone sub-app '${subappName}' from '${gitUrl}':`, cloneErr.message || cloneErr);
            }
          }
        }
      }
    }

    if (fs.existsSync(subappsDir)) {
      await this.syncParentSubAppDependencies(baseDir, subappsDir);

      const apps = await fs.promises.readdir(subappsDir, { withFileTypes: true });
      const subappConfigs: KrnlSubAppConfig[] = [];
      for (const dirent of apps) {
        if (dirent.isDirectory()) {
          const appPath = path.join(subappsDir, dirent.name);
          const buildOk = await this.ensureSubAppBuilt(appPath, dirent.name, entity, baseDir);
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
        // Inject execution mode into each config
        for (const cfg of subappConfigs) {
          const subMeta = subappMetaMap[cfg.prefix] || subappMetaMap[Object.keys(subappMetaMap).find(k => k.toLowerCase() === cfg.prefix) || ''];
          cfg.executionMode = (subMeta?.executionMode as any) ?? 'local';
        }

        console.log(`[MagneticLoader] Loading ${subappConfigs.length} sub-app(s) on '${entity.entityName}' (no networking).`);
        await entity.loadSubApps(subappConfigs as any);
      }
    }

    // 4. Handle unified frontend folder & sub-app frontend aggregation
    let frontendDir = path.join(baseDir, 'frontend');
    const oldFrontendsDir = path.join(baseDir, 'frontends');

    // Auto-rename legacy 'frontends' directory to 'frontend' if present
    if (!fs.existsSync(frontendDir) && fs.existsSync(oldFrontendsDir)) {
      try {
        fs.renameSync(oldFrontendsDir, frontendDir);
        console.log(`[MagneticLoader] Renamed legacy 'frontends/' directory to 'frontend/' on '${entity.entityName}'.`);
      } catch (err: any) {
        console.warn(`[MagneticLoader] Failed to rename 'frontends/' -> 'frontend/': ${err.message}`);
      }
    }

    if ((entity as any)._frontendEnabled && !fs.existsSync(frontendDir)) {
      try {
        fs.mkdirSync(frontendDir, { recursive: true });
      } catch (_) {}
    }

    if (fs.existsSync(frontendDir)) {
      if (!isSubApp) {
        entity.enableFrontend({ frontendDir });
      }

      // If entity is a sub-app and already has generated components, preserve them instead of running blank generation
      const hasLocalFuncs = entity.localFunctionalities && entity.localFunctionalities.size > 0;
      const indexExists = fs.existsSync(path.join(frontendDir, 'src', 'index.tsx'));

      // Always register sub-app frontends with parent frontend if entity has a frontend manager
      if (entity._subAppRegistry) {
        for (const [prefix, entry] of entity._subAppRegistry.entries()) {
          const subAppDir = (entry.entity as any)?._entityDataDir || (entry.entity as any)?._sourceDir;
          if (subAppDir) {
            const subFrontend = path.join(subAppDir, 'frontend');
            if (fs.existsSync(subFrontend) && entity._frontend) {
              entity._frontend.registerSubAppFrontend(prefix, subFrontend);
            }
          }
        }
      }

      if (!isSubApp || hasLocalFuncs || !indexExists) {
        // Generate React component code programmatically based on endpoint uiSpecs
        try {
          const { KrnlFrontendGenerator } = await import('./K_LIB_Krnl_Frontend_Generator.js');
          await KrnlFrontendGenerator.generate(entity, frontendDir);
        } catch (err: any) {
          console.error(`[MagneticLoader] Frontend generator error on '${entity.entityName}':`, err.message || err);
        }

        // Build bundle in-process using esbuild
        try {
          const { KrnlFrontendBuilder } = await import('./K_LIB_Krnl_Frontend_Builder.js');
          await KrnlFrontendBuilder.build(frontendDir);
          // Start esbuild watcher in background (fire-and-forget) — it should not block boot
          if (process.env.NODE_ENV !== 'production' && !isSubApp) {
            KrnlFrontendBuilder.watch(frontendDir).catch((err: any) => {
              console.warn(`[MagneticLoader] esbuild watcher error on '${entity.entityName}':`, err.message || err);
            });
          }
        } catch (err: any) {
          console.error(`[MagneticLoader] Frontend builder error on '${entity.entityName}':`, err.message || err);
        }
      }
    }

    // AI dynamic setup bootstrap hook
    const hasAiConfig = [...entity.localFunctionalities.values()].some(f => (f as any).ai?.enabled);
    
    // Check local store config even if no functionalities have programmatic ai configs yet
    let hasAiStore = false;
    const storePath = path.join(baseDir, "krnl_runtime_state.db");
    if (fs.existsSync(storePath)) {
      try {
        const storeContent = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
        if (storeContent?.endpointAgentProfiles && Object.keys(storeContent.endpointAgentProfiles).length > 0) {
          hasAiStore = true;
        }
      } catch (e) {}
    }

    if (hasAiConfig || hasAiStore) {
      console.log(`[MagneticLoader] Automatically initializing AI Layer on '${entity.entityName}'...`);
      await entity.initializeAiLayer(baseDir);
      (entity as any).setFlag?.('krnl:ai_layer_ready');
    }

    (entity as any).setFlag?.('krnl:magnetic_load_complete');
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

  static async ensureSubAppBuilt(appPath: string, appName: string, entity: any, parentBaseDir?: string): Promise<boolean> {
    const packageJsonPath = path.join(appPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return true;
    }

    // Shared node_modules setup: link sub-app node_modules to parent's node_modules if missing
    const subNodeModules = path.join(appPath, 'node_modules');
    const candidateParentDirs = [
      parentBaseDir ? path.join(parentBaseDir, 'node_modules') : null,
      parentBaseDir ? path.resolve(parentBaseDir, '..', 'node_modules') : null,
      path.join(process.cwd(), 'node_modules')
    ].filter(Boolean) as string[];

    const parentNodeModules = candidateParentDirs.find(d => fs.existsSync(d));

    if (!fs.existsSync(subNodeModules) && parentNodeModules) {
      try {
        fs.symlinkSync(parentNodeModules, subNodeModules, 'junction');
        console.log(`[MagneticLoader] Symlinked sub-app node_modules for '${appName}' -> '${parentNodeModules}'`);
      } catch (symErr: any) {
        console.warn(`[MagneticLoader] Symlinking node_modules for '${appName}' failed, falling back:`, symErr.message);
      }
    }

    const assemblerPath = path.join(appPath, 'assembler.js');
    let distPath = path.join(appPath, 'dist', `${appName}.js`);
    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkgJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        if (pkgJson.main) {
          distPath = path.resolve(appPath, pkgJson.main);
        }
      } catch (_) {}
    }

    let gitUpdated = false;
    const gitDir = path.join(appPath, '.git');
    if (fs.existsSync(gitDir)) {
      console.log(`[MagneticLoader] Checking for git remote updates for sub-app '${appName}'...`);
      try {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execPromise = promisify(exec);
        
        // Fetch remote updates
        await execPromise('git fetch', { cwd: appPath, timeout: 3000 });
        // Check if local branch is behind remote
        const { stdout } = await execPromise('git status -uno', { cwd: appPath, timeout: 3000 });
        if (stdout.includes('Your branch is behind') || stdout.includes('can be fast-forwarded')) {
          console.log(`[MagneticLoader] Remote updates found for sub-app '${appName}'. Pulling changes...`);
          const pullResult = await execPromise('git pull', { cwd: appPath, timeout: 5000 });
          console.log(`[MagneticLoader] Git pull result for '${appName}':`, pullResult.stdout);
          gitUpdated = true;
        } else {
          console.log(`[MagneticLoader] Sub-app '${appName}' git repository is up to date.`);
        }
      } catch (err: any) {
        console.warn(`[MagneticLoader] Warning: git update check failed for '${appName}':`, err.message || err);
      }
    }

    if (!fs.existsSync(assemblerPath) || !fs.existsSync(distPath) || !fs.existsSync(path.join(appPath, 'node_modules')) || gitUpdated) {
      console.log(`[MagneticLoader] Sub-app '${appName}' ${gitUpdated ? 'was updated via git' : 'is missing build artifacts'}. Initiating auto-build...`);
      try {
        const pkgJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const hasBuildScript = pkgJson.scripts && pkgJson.scripts.build;
        if (!hasBuildScript) {
          throw new Error(`package.json is missing a 'build' script.`);
        }

        const nodeModulesPath = path.join(appPath, 'node_modules');
        if (!fs.existsSync(nodeModulesPath)) {
          let installCmd = 'npm install --no-audit --no-fund';
          if (fs.existsSync(path.join(appPath, 'pnpm-lock.yaml'))) {
            installCmd = 'pnpm install';
          } else if (fs.existsSync(path.join(appPath, 'yarn.lock'))) {
            installCmd = 'yarn install';
          }
          console.log(`[MagneticLoader] Installing dependencies for '${appName}' using '${installCmd}'...`);
          const { exec } = await import('child_process');
          const { promisify } = await import('util');
          const execPromise = promisify(exec);
          await execPromise(installCmd, { cwd: appPath });
        } else {
          // If node_modules already exists, check if we need to update krnlts
          const pkgJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
          const hasKrnlts = (pkgJson.dependencies && pkgJson.dependencies.krnlts) || 
                            (pkgJson.devDependencies && pkgJson.devDependencies.krnlts);
          if (hasKrnlts) {
            let updateCmd = 'npm update krnlts';
            if (fs.existsSync(path.join(appPath, 'pnpm-lock.yaml'))) {
              updateCmd = 'pnpm update krnlts';
            } else if (fs.existsSync(path.join(appPath, 'yarn.lock'))) {
              updateCmd = 'yarn upgrade krnlts';
            }
            console.log(`[MagneticLoader] Automatically updating krnlts dependency for '${appName}' using '${updateCmd}'...`);
            try {
              const { exec } = await import('child_process');
              const { promisify } = await import('util');
              const execPromise = promisify(exec);
              await execPromise(updateCmd, { cwd: appPath });
            } catch (err: any) {
              console.warn(`[MagneticLoader] Warning: auto-updating krnlts for '${appName}' failed:`, err.message || err);
            }
          }
        }

        let buildCmd = 'npm run build';
        if (fs.existsSync(path.join(appPath, 'pnpm-lock.yaml'))) {
          buildCmd = 'pnpm run build';
        } else if (fs.existsSync(path.join(appPath, 'yarn.lock'))) {
          buildCmd = 'yarn build';
        }
        console.log(`[MagneticLoader] Building '${appName}' using '${buildCmd}'...`);
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execPromise = promisify(exec);
        await execPromise(buildCmd, { cwd: appPath });

        if (!fs.existsSync(assemblerPath)) {
          console.log(`[MagneticLoader] Automatically generating assembler.js for '${appName}'...`);
          const code = `export { ${appName} as default } from "./dist/${appName}.js";\n`;
          fs.writeFileSync(assemblerPath, code, 'utf-8');
        }
        console.log(`[MagneticLoader] Sub-app '${appName}' successfully built and prepared.`);
      } catch (err: any) {
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

  static async detectSubApp(appPath: string, appName: string): Promise<any | null> {
    const assemblerPath = path.join(appPath, "assembler.js");
    if (fs.existsSync(assemblerPath)) {
      const mod = await import(pathToFileURL(assemblerPath).href);
      const ServiceClass = mod[appName] || mod.default;
      if (ServiceClass) {
        const isKrnlSubclass = ServiceClass.prototype && (
          ServiceClass.prototype instanceof krnlSystemEntityBase ||
          typeof ServiceClass.prototype.boot === 'function'
        );
        return {
          ServiceClass,
          prefix: appName.toLowerCase(),
          isKrnl: !!isKrnlSubclass,
          entryPath: isKrnlSubclass ? assemblerPath : appPath
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

  /**
   * Automatically reconciles parent application package.json when sub-apps are added or removed.
   * - Packages needed by new sub-apps are added to parent package.json.
   * - Packages no longer needed by any sub-app are removed from parent package.json.
   */
  static async syncParentSubAppDependencies(baseDir: string, subappsDir: string): Promise<void> {
    try {
      const candidateParentPaths = [
        path.join(baseDir, 'package.json'),
        path.resolve(baseDir, '..', 'package.json'),
        path.join(process.cwd(), 'package.json')
      ];
      const parentPkgPath = candidateParentPaths.find(p => fs.existsSync(p));
      if (!parentPkgPath) return;

      const parentDir = path.dirname(parentPkgPath);
      const parentKrnlJsonPath = path.join(baseDir, 'krnl.json');
      
      let krnlJson: any = {};
      if (fs.existsSync(parentKrnlJsonPath)) {
        try { krnlJson = JSON.parse(fs.readFileSync(parentKrnlJsonPath, 'utf-8')); } catch (_) {}
      }
      
      const previousManaged: Record<string, string> = krnlJson.managedSubAppDependencies || {};
      const activeSubAppDeps: Record<string, string> = {};

      const subEntries = await fs.promises.readdir(subappsDir, { withFileTypes: true });
      for (const dirent of subEntries) {
        if (dirent.isDirectory()) {
          const subPkgPath = path.join(subappsDir, dirent.name, 'package.json');
          if (fs.existsSync(subPkgPath)) {
            try {
              const subPkg = JSON.parse(fs.readFileSync(subPkgPath, 'utf-8'));
              const combined = { ...subPkg.dependencies, ...subPkg.devDependencies };
              for (const [pkgName, pkgVer] of Object.entries(combined)) {
                if (pkgName !== 'krnlts' && pkgName !== 'tsup' && !pkgName.startsWith('@types/')) {
                  activeSubAppDeps[pkgName] = pkgVer as string;
                }
              }
            } catch (_) {}
          }
        }
      }

      const parentPkg = JSON.parse(fs.readFileSync(parentPkgPath, 'utf-8'));
      parentPkg.dependencies = parentPkg.dependencies || {};

      let modified = false;

      // 1. Add missing sub-app dependencies to parent
      for (const [pkgName, pkgVer] of Object.entries(activeSubAppDeps)) {
        if (!parentPkg.dependencies[pkgName]) {
          console.log(`[MagneticLoader] Adding new sub-app dependency '${pkgName}@${pkgVer}' to parent package.json...`);
          parentPkg.dependencies[pkgName] = pkgVer;
          previousManaged[pkgName] = pkgVer;
          modified = true;
        }
      }

      // 2. Remove sub-app dependencies no longer required by any active sub-app
      for (const [pkgName] of Object.entries(previousManaged)) {
        if (!activeSubAppDeps[pkgName]) {
          console.log(`[MagneticLoader] Removing stale sub-app dependency '${pkgName}' from parent package.json...`);
          delete parentPkg.dependencies[pkgName];
          delete previousManaged[pkgName];
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(parentPkgPath, JSON.stringify(parentPkg, null, 2) + '\n', 'utf-8');
        krnlJson.managedSubAppDependencies = previousManaged;
        if (fs.existsSync(parentKrnlJsonPath)) {
          fs.writeFileSync(parentKrnlJsonPath, JSON.stringify(krnlJson, null, 2) + '\n', 'utf-8');
        }
        console.log(`[MagneticLoader] Parent package.json dependencies updated. Running npm install...`);
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execPromise = promisify(exec);
        await execPromise('npm install --no-audit --no-fund', { cwd: parentDir });
        console.log(`[MagneticLoader] Parent dependencies synced successfully.`);
      }
    } catch (err: any) {
      console.warn(`[MagneticLoader] Sub-app dependency reconciliation warning:`, err.message || err);
    }
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

