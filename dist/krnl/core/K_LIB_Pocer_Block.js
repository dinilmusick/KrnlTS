import http from "node:http";
import net from "node:net";
import { execSync, exec, spawn } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";
import { krnlSystemEntityBase } from "./K_ENT_Krnl_System_Entity_Base.js";
const execAsync = promisify(exec);
export class PocerBlock extends krnlSystemEntityBase {
    blockConfig;
    _containerReady = false;
    _startedByUs = false;
    _dockerProvider = null;
    constructor(name, blockConfig) {
        super(name, null, -1, "127.0.0.1", { Singleton: true, _skipMagneticLoading: true });
        this.blockConfig = blockConfig;
        this._isIngressNetworkMember = true;
        this.unifiedHttpAdapter._handleRequest = async (req, res) => {
            await this.proxyRequest(req, res, req.url || "/");
        };
    }
    async startApp() {
        const { containerName, image, hostPort, containerPort, environment } = this.blockConfig;
        console.log(`[PocerBlock:${this.entityName}] Booting container '${containerName}'...`);
        // 1. Ensure Docker runtime is active (Colima or Docker Desktop)
        await this.ensureDockerEngine();
        // 2. Load cached image if present inside block/images/ directory
        await this.loadLocalImageArchive(image);
        // 3. Manage Container Lifecycle
        const isAlreadyRunning = await this._isContainerRunning(containerName);
        if (isAlreadyRunning) {
            console.log(`[PocerBlock:${this.entityName}] Container '${containerName}' is already running.`);
        }
        else {
            const exists = await this._containerExists(containerName);
            if (exists) {
                console.log(`[PocerBlock:${this.entityName}] Container '${containerName}' exists but is stopped. Starting...`);
                await execAsync(`docker start ${containerName}`);
            }
            else {
                console.log(`[PocerBlock:${this.entityName}] Creating and starting container '${containerName}'...`);
                const envArgs = Object.entries(environment ?? {})
                    .map(([k, v]) => `-e "${k}=${v}"`)
                    .join(" ");
                const cmd = [
                    "docker run -d",
                    `--name ${containerName}`,
                    `-p ${hostPort}:${containerPort}`,
                    envArgs,
                    image,
                ]
                    .filter(Boolean)
                    .join(" ");
                await execAsync(cmd);
            }
        }
        // 4. Poll until the container port accepts connections
        await this._waitForPort(hostPort, 20000);
        this._containerReady = true;
        console.log(`[PocerBlock:${this.entityName}] Container '${containerName}' is ready on host port ${hostPort}.`);
    }
    async proxyRequest(req, res, subPath) {
        if (!this._containerReady || this.blockConfig.hostPort === -1) {
            res.writeHead(533, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: "error", message: `[PocerBlock:${this.entityName}] Container not ready.` }));
            return;
        }
        const options = {
            hostname: "127.0.0.1",
            port: this.blockConfig.hostPort,
            path: subPath,
            method: req.method,
            headers: {
                ...req.headers,
                host: `127.0.0.1:${this.blockConfig.hostPort}`,
            },
        };
        const proxyReq = http.request(options, (proxyRes) => {
            res.writeHead(proxyRes.statusCode ?? 500, proxyRes.headers);
            proxyRes.pipe(res, { end: true });
        });
        proxyReq.on("error", (err) => {
            res.writeHead(502, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: "error", message: `[PocerBlock:${this.entityName}] Bad Gateway: ${err.message}` }));
        });
        req.pipe(proxyReq, { end: true });
    }
    getManifest() {
        const base = super.getManifest();
        return {
            ...base,
            pocerBlock: {
                image: this.blockConfig.image,
                containerName: this.blockConfig.containerName,
                hostPort: this.blockConfig.hostPort,
                containerPort: this.blockConfig.containerPort,
                protocol: this.blockConfig.protocol,
                ready: this._containerReady,
            },
        };
    }
    dispose() {
        if (this.blockConfig.stopOnDispose) {
            try {
                console.log(`[PocerBlock:${this.entityName}] Stopping container '${this.blockConfig.containerName}'...`);
                execSync(`docker stop ${this.blockConfig.containerName}`, { stdio: "ignore" });
            }
            catch (_) { }
        }
        // Stop Docker provider VM if it was spun up by this block instance
        if (this._startedByUs) {
            try {
                if (this._dockerProvider === "colima") {
                    console.log(`[PocerBlock:${this.entityName}] Stopping block-initiated Colima VM...`);
                    execSync("colima stop", { stdio: "ignore" });
                }
                else if (this._dockerProvider === "docker-desktop") {
                    console.log(`[PocerBlock:${this.entityName}] Stopping block-initiated Docker Desktop...`);
                    execSync("osascript -e 'quit app \"Docker\"'", { stdio: "ignore" });
                }
            }
            catch (_) { }
        }
        super.dispose();
    }
    // ─── Self-Containing Infrastructure (VM & Docker Engine Setup) ─────────────
    async ensureDockerEngine() {
        try {
            await execAsync("docker ps");
            return; // Already running and context is responsive
        }
        catch (_) { }
        console.log(`[PocerBlock:${this.entityName}] Docker not running. Attempting to start virtualization engine...`);
        // Determine engine candidate
        const colimaPath = await this._locateBinary("colima");
        if (colimaPath) {
            console.log(`[PocerBlock:${this.entityName}] Found Colima binary. Starting VM...`);
            const proc = spawn("colima", ["start", "--runtime", "docker"], { stdio: "ignore", detached: true });
            proc.unref();
            this._dockerProvider = "colima";
            this._startedByUs = true;
        }
        else {
            console.log(`[PocerBlock:${this.entityName}] Colima not found. Attempting to launch Docker Desktop...`);
            const proc = spawn("open", ["-g", "-a", "Docker"], { stdio: "ignore", detached: true });
            proc.unref();
            this._dockerProvider = "docker-desktop";
            this._startedByUs = true;
        }
        // Wait loop for engine readiness
        const deadline = Date.now() + 60000;
        while (Date.now() < deadline) {
            try {
                const { stdout } = await execAsync("docker ps");
                if (stdout.includes("CONTAINER ID")) {
                    console.log(`[PocerBlock:${this.entityName}] Virtualization engine online.`);
                    return;
                }
            }
            catch (_) { }
            await new Promise((r) => setTimeout(r, 2000));
        }
        throw new Error(`[PocerBlock:${this.entityName}] Failed to start or connect to virtualization engine.`);
    }
    async loadLocalImageArchive(image) {
        // Look inside a local "images/" folder relative to this class instance file
        // Assembler.js output path has its own image archive
        const localImagesDir = path.join(process.cwd(), "subapps", this.entityName, "images");
        const safeImageName = image.replace(/[^a-zA-Z0-9]/g, "_");
        const archivePath = path.join(localImagesDir, `${safeImageName}.tar`);
        if (fs.existsSync(archivePath)) {
            // Check if image is already loaded in Docker daemon first
            try {
                const { stdout } = await execAsync(`docker images -q ${image}`);
                if (stdout.trim().length > 0) {
                    console.log(`[PocerBlock:${this.entityName}] Image '${image}' already cached in Docker daemon.`);
                    return;
                }
            }
            catch (_) { }
            console.log(`[PocerBlock:${this.entityName}] Loading image archive from local block repository: ${archivePath}`);
            await execAsync(`docker load -i "${archivePath}"`);
        }
        else {
            console.log(`[PocerBlock:${this.entityName}] No local image archive found at: ${archivePath}. Pulling from remote registry...`);
            await execAsync(`docker pull ${image}`);
        }
    }
    // ─── Private Helpers ───────────────────────────────────────────────────────
    async _locateBinary(name) {
        try {
            const { stdout } = await execAsync(`which ${name}`);
            return stdout.trim();
        }
        catch {
            return null;
        }
    }
    async _isContainerRunning(name) {
        try {
            const { stdout } = await execAsync(`docker inspect --format "{{.State.Running}}" ${name} 2>/dev/null`);
            return stdout.trim() === "true";
        }
        catch {
            return false;
        }
    }
    async _containerExists(name) {
        try {
            await execAsync(`docker inspect --format "{{.State.Status}}" ${name} 2>/dev/null`);
            return true;
        }
        catch {
            return false;
        }
    }
    async _waitForPort(port, timeoutMs) {
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            const open = await new Promise((resolve) => {
                const socket = net.connect(port, "127.0.0.1");
                socket.on("connect", () => {
                    socket.destroy();
                    resolve(true);
                });
                socket.on("error", () => resolve(false));
            });
            if (open)
                return;
            await new Promise((r) => setTimeout(r, 250));
        }
        throw new Error(`[PocerBlock:${this.entityName}] Timed out waiting for container port ${port} after ${timeoutMs}ms.`);
    }
}
//# sourceMappingURL=K_LIB_Pocer_Block.js.map