import fs from 'fs';
import path from 'path';
import { KrnlFrontendAdapter } from './K_LIB_Krnl_System_Frontend_Adapter.js';
export class KrnlBlockContainerAdapter extends KrnlFrontendAdapter {
    blocksDir;
    discoveredBlocks = new Map();
    blockWatcher = null;
    constructor(name, containerRoot, options = {}) {
        // Under the new architecture, the container's Next.js app is in containerRoot / 'app' or containerRoot directly.
        const appPath = fs.existsSync(path.join(containerRoot, 'app'))
            ? path.join(containerRoot, 'app')
            : containerRoot;
        super(name, appPath, options);
        this.blocksDir = path.join(containerRoot, 'nextjs-blocks');
        // Wrap the handler to support Uniform APIs
        const parentHandleRequest = this.unifiedHttpAdapter._handleRequest.bind(this.unifiedHttpAdapter);
        this.unifiedHttpAdapter._handleRequest = async (req, res) => {
            const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
            const pathname = url.pathname;
            if (pathname === '/api/blocks' && req.method === 'GET') {
                res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                res.end(JSON.stringify(this.getBlocksManifest()));
                return;
            }
            if (pathname.startsWith('/api/blocks/') && req.method === 'GET') {
                const parts = pathname.split('/');
                const blockId = parts[3];
                const block = this.discoveredBlocks.get(blockId);
                if (!block) {
                    res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                    res.end(JSON.stringify({ status: 'error', message: `Block ${blockId} not found` }));
                    return;
                }
                if (parts[4] === 'routes') {
                    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                    res.end(JSON.stringify(block.routes));
                    return;
                }
                if (parts[4] === 'apis') {
                    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                    res.end(JSON.stringify(block.apis));
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                res.end(JSON.stringify(block));
                return;
            }
            if (pathname === '/api/routes' && req.method === 'GET') {
                const allRoutes = this.getBlocksManifest().flatMap(b => b.routes.map(r => ({ ...r, blockId: b.id })));
                res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                res.end(JSON.stringify(allRoutes));
                return;
            }
            if (pathname === '/api/apis' && req.method === 'GET') {
                const allApis = this.getBlocksManifest().flatMap(b => b.apis.map(a => ({ ...a, blockId: b.id })));
                res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                res.end(JSON.stringify(allApis));
                return;
            }
            if (pathname === '/api/manifests' && req.method === 'GET') {
                res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                res.end(JSON.stringify({
                    containerName: this.entityName,
                    blocks: this.getBlocksManifest()
                }));
                return;
            }
            // Delegate to parent/super handler (for __krnl/config, bridge.js, proxying, etc.)
            await parentHandleRequest(req, res);
        };
    }
    async startApp() {
        await this.loadBlocks();
        this.setupBlockWatcher();
        await super.startApp();
    }
    async loadBlocks() {
        if (!fs.existsSync(this.blocksDir)) {
            fs.mkdirSync(this.blocksDir, { recursive: true });
        }
        const entries = fs.readdirSync(this.blocksDir, { withFileTypes: true });
        const newDiscovered = new Map();
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const blockId = entry.name;
                const blockPath = path.join(this.blocksDir, blockId);
                try {
                    const desc = await this.scanBlock(blockId, blockPath);
                    newDiscovered.set(blockId, desc);
                }
                catch (err) {
                    console.error(`[KrnlBlockContainerAdapter:${this.entityName}] Failed to scan block ${blockId}:`, err.message);
                }
            }
        }
        this.discoveredBlocks = newDiscovered;
        console.log(`[KrnlBlockContainerAdapter:${this.entityName}] Discovered ${this.discoveredBlocks.size} blocks.`);
    }
    setupBlockWatcher() {
        if (this.options.mode === 'prod')
            return;
        try {
            this.blockWatcher = fs.watch(this.blocksDir, { recursive: false }, () => {
                this.loadBlocks().catch(console.error);
            });
        }
        catch (err) {
            console.warn(`[KrnlBlockContainerAdapter:${this.entityName}] Failed to start block directory watcher:`, err.message);
        }
    }
    async scanBlock(blockId, blockPath) {
        let name = blockId;
        let version = '1.0.0';
        // 1. Try reading package.json for basic metadata
        const pkgPath = path.join(blockPath, 'package.json');
        if (fs.existsSync(pkgPath)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
                name = pkg.displayName || pkg.name || blockId;
                version = pkg.version || '1.0.0';
            }
            catch (_) { }
        }
        // 2. Try loading block.ts if it exists for extra metadata
        const blockTsPath = path.join(blockPath, 'block.ts');
        const blockJsPath = path.join(blockPath, 'block.js');
        if (fs.existsSync(blockTsPath) || fs.existsSync(blockJsPath)) {
            try {
                const imported = await import(fs.existsSync(blockTsPath) ? blockTsPath : blockJsPath);
                if (imported.block) {
                    name = imported.block.name || name;
                    version = imported.block.version || version;
                }
            }
            catch (_) { }
        }
        const routes = [];
        const apis = [];
        // Scan routes
        const pagesDir = path.join(blockPath, 'pages');
        const appDir = path.join(blockPath, 'app');
        if (fs.existsSync(pagesDir)) {
            this._findPagesRoutesRecursive(pagesDir, pagesDir, routes, apis);
        }
        if (fs.existsSync(appDir)) {
            this._findAppRoutesRecursive(appDir, appDir, routes, apis);
        }
        return {
            id: blockId,
            name,
            version,
            routes,
            apis
        };
    }
    _findPagesRoutesRecursive(dir, baseDir, routes, apis) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                this._findPagesRoutesRecursive(fullPath, baseDir, routes, apis);
            }
            else if (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.jsx')) {
                const rel = path.relative(baseDir, fullPath);
                const withoutExt = rel.substring(0, rel.lastIndexOf('.'));
                const routePath = withoutExt.replace(/\\/g, '/');
                if (file.startsWith('_app.') || file.startsWith('_document.') || file.startsWith('_error.')) {
                    continue;
                }
                if (routePath.startsWith('api/')) {
                    apis.push({
                        path: `/${routePath}`,
                        methods: ['GET', 'POST', 'PUT', 'DELETE']
                    });
                    routes.push({
                        path: `/${routePath}`,
                        type: 'api'
                    });
                }
                else {
                    routes.push({
                        path: routePath === 'index' ? '/' : `/${routePath}`,
                        type: 'page'
                    });
                }
            }
        }
    }
    _findAppRoutesRecursive(dir, baseDir, routes, apis) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                this._findAppRoutesRecursive(fullPath, baseDir, routes, apis);
            }
            else if (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.jsx')) {
                const isRouteFile = file === 'route.ts' || file === 'route.js';
                const isPageFile = file === 'page.tsx' || file === 'page.ts' || file === 'page.js';
                const isLayoutFile = file === 'layout.tsx' || file === 'layout.ts' || file === 'layout.js';
                if (isRouteFile || isPageFile || isLayoutFile) {
                    const dirIndex = dir.indexOf('app');
                    let routePath = dir.substring(dirIndex + 3).replace(/\\/g, '/');
                    if (!routePath.startsWith('/')) {
                        routePath = '/' + routePath;
                    }
                    if (routePath === '')
                        routePath = '/';
                    if (isRouteFile) {
                        apis.push({
                            path: routePath,
                            methods: ['GET', 'POST', 'PUT', 'DELETE']
                        });
                        routes.push({
                            path: routePath,
                            type: 'api'
                        });
                    }
                    else if (isPageFile) {
                        routes.push({
                            path: routePath,
                            type: 'page'
                        });
                    }
                    else if (isLayoutFile) {
                        routes.push({
                            path: routePath,
                            type: 'layout'
                        });
                    }
                }
            }
        }
    }
    getBlocksManifest() {
        return Array.from(this.discoveredBlocks.values());
    }
    dispose() {
        if (this.blockWatcher) {
            this.blockWatcher.close();
            this.blockWatcher = null;
        }
        super.dispose();
    }
}
//# sourceMappingURL=K_LIB_Krnl_Block_Container_Adapter.js.map