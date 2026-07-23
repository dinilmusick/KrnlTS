import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { AsyncLocalStorage } from 'async_hooks';
import { krnlSystemEntityBase } from './K_ENT_Krnl_System_Entity_Base.js';
export const magneticStorage = new AsyncLocalStorage();
if (!globalThis.__krnlSubAppLocalStorage) {
    globalThis.__krnlSubAppLocalStorage = new AsyncLocalStorage();
}
export const subappLocalStorage = globalThis.__krnlSubAppLocalStorage;
export class KrnlMagneticLoader {
    /**
     * Scans and dynamically loads entities, functionalities, and subapps for the given system entity.
     */
    static async loadAll(entity, baseDir) {
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
        // 3. Scan and load subapps for automatic Ingress Network mapping
        const subappsDir = path.join(baseDir, 'subapps');
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
                console.log(`[MagneticLoader] Automatically enabling Ingress Network on '${entity.entityName}' with ${subappConfigs.length} sub-apps.`);
                await entity.startIngressNetwork(subappConfigs);
            }
        }
        // 4. Auto-enable frontend if frontend/default folder exists
        const frontendDir = path.join(baseDir, 'frontend', 'default');
        if (fs.existsSync(frontendDir) && !isSubApp) {
            const configPath = path.join(frontendDir, 'krnl-frontend.json');
            let frontendOptions = { title: entity.entityName, theme: 'dark' };
            if (fs.existsSync(configPath)) {
                try {
                    const content = fs.readFileSync(configPath, 'utf-8');
                    frontendOptions = { ...frontendOptions, ...JSON.parse(content) };
                }
                catch (_) { }
            }
            entity.enableFrontend(frontendOptions);
            console.log(`[MagneticLoader] Auto-enabled default frontend for '${entity.entityName}' (found frontend/default folder).`);
        }
        // 5. Scan and load custom frontends under frontend/ or frontends/ (except 'default')
        let generalFrontendDir = path.join(baseDir, 'frontend');
        if (!fs.existsSync(generalFrontendDir)) {
            generalFrontendDir = path.join(baseDir, 'frontends');
        }
        if (fs.existsSync(generalFrontendDir) && !isSubApp) {
            const entries = await fs.promises.readdir(generalFrontendDir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory() && entry.name !== 'default') {
                    const appPath = path.join(generalFrontendDir, entry.name);
                    if (fs.existsSync(path.join(appPath, 'package.json')) || fs.existsSync(path.join(appPath, 'krnl-frontend.json'))) {
                        let options = {};
                        const configPath = path.join(appPath, 'krnl-frontend.json');
                        if (fs.existsSync(configPath)) {
                            try {
                                options = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
                            }
                            catch (_) { }
                        }
                        console.log(`[MagneticLoader] Detected custom frontend '${entry.name}' at '${appPath}'. Registering...`);
                        await entity.startCustomFrontend(entry.name, appPath, options);
                    }
                }
            }
        }
        // AI dynamic setup bootstrap hook
        const hasAiConfig = [...entity.localFunctionalities.values()].some(f => f.ai?.enabled);
        // Check local store config even if no functionalities have programmatic ai configs yet
        let hasAiStore = false;
        const storePath = path.join(baseDir, "krnl_runtime_state.db");
        if (fs.existsSync(storePath)) {
            try {
                const storeContent = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
                if (storeContent?.endpointAgentProfiles && Object.keys(storeContent.endpointAgentProfiles).length > 0) {
                    hasAiStore = true;
                }
            }
            catch (e) { }
        }
        if (hasAiConfig || hasAiStore) {
            console.log(`[MagneticLoader] Automatically initializing AI Layer on '${entity.entityName}'...`);
            await entity.initializeAiLayer(baseDir);
        }
    }
    static async loadFunctionality(entity, funcDir, funcName) {
        // Look for explicit descriptor first (e.g. StockUpdate.js)
        const descriptorPath = path.join(funcDir, `${funcName}.js`);
        let atom = null;
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
        const helpers = {};
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
        const events = {};
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
            atom.api = async (input, context) => {
                return await magneticStorage.run({ helpers, events }, async () => {
                    return await originalApi(input, context);
                });
            };
        }
        entity.addLocal(atom);
    }
    static async loadEntity(parent, entDir, entName) {
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
    static async ensureSubAppBuilt(appPath, appName, entity) {
        const packageJsonPath = path.join(appPath, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            return true;
        }
        const assemblerPath = path.join(appPath, 'assembler.js');
        let distPath = path.join(appPath, 'dist', `${appName}.js`);
        if (fs.existsSync(packageJsonPath)) {
            try {
                const pkgJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
                if (pkgJson.main) {
                    distPath = path.resolve(appPath, pkgJson.main);
                }
            }
            catch (_) { }
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
                await execPromise('git fetch', { cwd: appPath });
                // Check if local branch is behind remote
                const { stdout } = await execPromise('git status -uno', { cwd: appPath });
                if (stdout.includes('Your branch is behind') || stdout.includes('can be fast-forwarded')) {
                    console.log(`[MagneticLoader] Remote updates found for sub-app '${appName}'. Pulling changes...`);
                    const pullResult = await execPromise('git pull', { cwd: appPath });
                    console.log(`[MagneticLoader] Git pull result for '${appName}':`, pullResult.stdout);
                    gitUpdated = true;
                }
                else {
                    console.log(`[MagneticLoader] Sub-app '${appName}' git repository is up to date.`);
                }
            }
            catch (err) {
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
                    }
                    else if (fs.existsSync(path.join(appPath, 'yarn.lock'))) {
                        installCmd = 'yarn install';
                    }
                    console.log(`[MagneticLoader] Installing dependencies for '${appName}' using '${installCmd}'...`);
                    const { exec } = await import('child_process');
                    const { promisify } = await import('util');
                    const execPromise = promisify(exec);
                    await execPromise(installCmd, { cwd: appPath });
                }
                else {
                    // If node_modules already exists, check if we need to update krnlts
                    const pkgJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
                    const hasKrnlts = (pkgJson.dependencies && pkgJson.dependencies.krnlts) ||
                        (pkgJson.devDependencies && pkgJson.devDependencies.krnlts);
                    if (hasKrnlts) {
                        let updateCmd = 'npm update krnlts';
                        if (fs.existsSync(path.join(appPath, 'pnpm-lock.yaml'))) {
                            updateCmd = 'pnpm update krnlts';
                        }
                        else if (fs.existsSync(path.join(appPath, 'yarn.lock'))) {
                            updateCmd = 'yarn upgrade krnlts';
                        }
                        console.log(`[MagneticLoader] Automatically updating krnlts dependency for '${appName}' using '${updateCmd}'...`);
                        try {
                            const { exec } = await import('child_process');
                            const { promisify } = await import('util');
                            const execPromise = promisify(exec);
                            await execPromise(updateCmd, { cwd: appPath });
                        }
                        catch (err) {
                            console.warn(`[MagneticLoader] Warning: auto-updating krnlts for '${appName}' failed:`, err.message || err);
                        }
                    }
                }
                let buildCmd = 'npm run build';
                if (fs.existsSync(path.join(appPath, 'pnpm-lock.yaml'))) {
                    buildCmd = 'pnpm run build';
                }
                else if (fs.existsSync(path.join(appPath, 'yarn.lock'))) {
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
            }
            catch (err) {
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
                const isKrnlSubclass = ServiceClass.prototype && (ServiceClass.prototype instanceof krnlSystemEntityBase ||
                    typeof ServiceClass.prototype.boot === 'function');
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
}
//# sourceMappingURL=K_LIB_Krnl_System_Magnetic_Loader.js.map