import {
  KrnlHTTP
} from "./chunk-MLVWARD4.js";

// src/tools/StringKit.js
var StringKit = class _StringKit {
  static toCamelCase(str) {
    return str.replace(/[-_]+/g, " ").replace(/[^\w\s]/g, "").replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => index === 0 ? word.toLowerCase() : word.toUpperCase()).replace(/\s+/g, "");
  }
  static toPascalCase(str) {
    const camel = _StringKit.toCamelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  }
  static toSnakeCase(str) {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/[-_\s]+/g, "_").replace(/^[_\s]+|[_\s]+$/g, "").toLowerCase();
  }
  static toKebabCase(str) {
    return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`).replace(/[-_\s]+/g, "-").replace(/^[-_\s]+|[-_\s]+$/g, "").toLowerCase();
  }
  static toScreamingSnake(str) {
    return _StringKit.toSnakeCase(str).toUpperCase();
  }
  static toSlug(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s-_]/g, "").replace(/[\s-_]+/g, "-").replace(/^-+|-+$/g, "");
  }
  static generateUUID() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === "x" ? r : r & 3 | 8;
      return v.toString(16);
    });
  }
  static generateShortId(length = 8) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.random() * chars.length | 0);
    }
    return result;
  }
  static generatePrefixedId(prefix, length = 8) {
    return `${prefix}-${_StringKit.generateShortId(length)}`;
  }
  static interpolate(tmpl, data) {
    return tmpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
      return data[key] !== void 0 ? String(data[key]) : `{{${key}}}`;
    });
  }
};

// src/tools/CacheKit.js
import fs from "fs";
import path from "path";
var LRUCache = class {
  maxSize;
  cache;
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.cache = /* @__PURE__ */ new Map();
  }
  get(key) {
    if (!this.cache.has(key))
      return void 0;
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }
  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== void 0)
        this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
  delete(key) {
    return this.cache.delete(key);
  }
  clear() {
    this.cache.clear();
  }
  size() {
    return this.cache.size;
  }
};
var TTLCache = class {
  ttlMs;
  cache;
  constructor(ttlMs) {
    this.ttlMs = ttlMs;
    this.cache = /* @__PURE__ */ new Map();
  }
  get(key) {
    const entry = this.cache.get(key);
    if (!entry)
      return null;
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }
  set(key, value) {
    this.cache.set(key, {
      value,
      expires: Date.now() + this.ttlMs
    });
  }
  delete(key) {
    return this.cache.delete(key);
  }
  clear() {
    this.cache.clear();
  }
};
var CacheKit = class {
  /**
   * Stale-While-Revalidate utility.
   */
  static swr(cache, key, fetchFn) {
    const cached = cache.get(key);
    if (cached !== null) {
      setTimeout(() => {
        fetchFn().then((fresh) => cache.set(key, fresh)).catch(() => {
        });
      }, 0);
      return Promise.resolve(cached);
    }
    return fetchFn().then((fresh) => {
      cache.set(key, fresh);
      return fresh;
    });
  }
};
var FileCache = class {
  cacheDir;
  constructor(cacheDir) {
    this.cacheDir = cacheDir;
    try {
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
    } catch (e) {
    }
  }
  getFilePath(key) {
    return path.join(this.cacheDir, `${encodeURIComponent(key)}.json`);
  }
  get(key) {
    const file = this.getFilePath(key);
    if (!fs.existsSync(file))
      return null;
    try {
      const content = fs.readFileSync(file, "utf8");
      return JSON.parse(content);
    } catch (e) {
      return null;
    }
  }
  set(key, value) {
    const file = this.getFilePath(key);
    try {
      fs.writeFileSync(file, JSON.stringify(value, null, 2), "utf8");
    } catch (e) {
    }
  }
  delete(key) {
    const file = this.getFilePath(key);
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
      } catch (e) {
      }
    }
  }
  clear() {
    try {
      const files = fs.readdirSync(this.cacheDir);
      for (const file of files) {
        fs.unlinkSync(path.join(this.cacheDir, file));
      }
    } catch (e) {
    }
  }
};

// src/tools/KrnlEnv.js
import fs2 from "fs";
import path2 from "path";
var KrnlEnv = class {
  /**
   * Reads a process environment variable with type coercion and defaults.
   */
  static get(key, defaultValue) {
    const val = process.env[key];
    if (val === void 0) {
      if (defaultValue !== void 0)
        return defaultValue;
      throw new Error(`[KrnlEnvError] Missing required environment variable: ${key}`);
    }
    if (typeof defaultValue === "number") {
      const num = Number(val);
      if (isNaN(num)) {
        throw new Error(`[KrnlEnvError] Expected number for ${key}, received: ${val}`);
      }
      return num;
    }
    if (typeof defaultValue === "boolean") {
      return val === "true" || val === "1";
    }
    try {
      if (defaultValue && typeof defaultValue === "object") {
        return JSON.parse(val);
      }
    } catch (e) {
    }
    return val;
  }
  /**
   * Asserts environment variable is set and returns its string value.
   */
  static require(key) {
    const val = process.env[key];
    if (val === void 0) {
      throw new Error(`[KrnlEnvError] Missing required environment variable: ${key}`);
    }
    return val;
  }
  /**
   * Loads a .env file and injects variables into process.env.
   */
  static load(filePath) {
    const file = filePath || path2.join(process.cwd(), ".env");
    if (!fs2.existsSync(file))
      return;
    try {
      const content = fs2.readFileSync(file, "utf8");
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#"))
          continue;
        const equalsIndex = trimmed.indexOf("=");
        if (equalsIndex === -1)
          continue;
        const key = trimmed.slice(0, equalsIndex).trim();
        let value = trimmed.slice(equalsIndex + 1).trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }
        if (process.env[key] === void 0) {
          process.env[key] = value;
        }
      }
    } catch (e) {
    }
  }
  /**
   * Validates the entire config using a Zod schema.
   */
  static schema(zodSchema) {
    try {
      return zodSchema.parse(process.env);
    } catch (err) {
      throw new Error(`[KrnlEnvError] Environment validation failed: ${err.message || String(err)}`);
    }
  }
};

// src/tools/KrnlShell.js
import { exec, spawn } from "child_process";
import path3 from "path";
import fs3 from "fs";
var KrnlShell = class {
  /**
   * Promisified command execution.
   */
  static exec(cmd, opts = {}) {
    const timeout = opts.timeout || 3e4;
    return new Promise((resolve, reject) => {
      exec(cmd, { ...opts, timeout }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`[KrnlShellError] Command failed: ${cmd}
Exit Code: ${error.code}
Stderr: ${String(stderr)}`));
        } else {
          resolve({ stdout: String(stdout), stderr: String(stderr) });
        }
      });
    });
  }
  /**
   * Streaming command execution.
   */
  static spawn(cmd, args, opts = {}) {
    const child = spawn(cmd, args, opts);
    const promise = new Promise((resolve, reject) => {
      child.on("close", (code, signal) => {
        resolve({ code, signal });
      });
      child.on("error", (err) => {
        reject(err);
      });
    });
    return {
      pid: child.pid,
      kill: (signal) => child.kill(signal),
      promise
    };
  }
  /**
   * Defines posix vs win32 specific commands.
   */
  static platform(routing) {
    return process.platform === "win32" ? routing.win32 : routing.posix;
  }
  /**
   * Resolves the full path of a binary.
   */
  static which(cmd) {
    const envPath = process.env.PATH || "";
    const paths = envPath.split(path3.delimiter);
    const extensions = process.platform === "win32" ? [".exe", ".cmd", ".bat", ""] : [""];
    for (const p of paths) {
      for (const ext of extensions) {
        const fullPath = path3.join(p, `${cmd}${ext}`);
        try {
          if (fs3.existsSync(fullPath) && fs3.statSync(fullPath).isFile()) {
            return fullPath;
          }
        } catch (e) {
        }
      }
    }
    return null;
  }
};

// src/tools/GitManager.js
import fs4 from "fs";
import path4 from "path";
var GitManager = class _GitManager {
  static isRepo(dirPath) {
    return fs4.existsSync(path4.join(dirPath, ".git"));
  }
  static async init(dirPath) {
    if (_GitManager.isRepo(dirPath))
      return;
    await KrnlShell.exec("git init", { cwd: dirPath });
  }
  static async clone(repoUrl, destPath) {
    const parentDir = path4.dirname(destPath);
    if (!fs4.existsSync(parentDir)) {
      fs4.mkdirSync(parentDir, { recursive: true });
    }
    await KrnlShell.exec(`git clone ${repoUrl} ${path4.basename(destPath)}`, { cwd: parentDir });
  }
  static async commit(dirPath, message) {
    if (!_GitManager.isRepo(dirPath)) {
      throw new Error(`[GitManagerError] Directory ${dirPath} is not a git repository.`);
    }
    const { stdout: status } = await KrnlShell.exec("git status --porcelain", { cwd: dirPath });
    if (!status.trim()) {
      return false;
    }
    await KrnlShell.exec("git add -A", { cwd: dirPath });
    await KrnlShell.exec(`git commit -m "${message.replace(/"/g, '\\"')}"`, { cwd: dirPath });
    return true;
  }
  static async push(dirPath, remote = "origin", branch = "main") {
    if (!_GitManager.isRepo(dirPath)) {
      throw new Error(`[GitManagerError] Directory ${dirPath} is not a git repository.`);
    }
    await KrnlShell.exec(`git push ${remote} ${branch}`, { cwd: dirPath });
  }
};

// src/core/K_LIB_Krnl_Aiko_Client.ts
var KrnlAikoClient = class _KrnlAikoClient {
  baseUrl;
  lastUsedModelId = null;
  constructor(aikoPort, aikoHost = "localhost") {
    this.baseUrl = `http://${aikoHost}:${aikoPort}`;
  }
  static discover(system) {
    const aikoPeer = system.peers?.get("Aiko");
    if (aikoPeer && aikoPeer.address) {
      let addr = aikoPeer.address;
      if (!addr.startsWith("http")) {
        addr = `http://${addr}`;
      }
      try {
        const url = new URL(addr);
        return new _KrnlAikoClient(Number(url.port || 10095), url.hostname);
      } catch (e) {
        console.error("[KrnlAikoClient] Failed to parse discovered Aiko address:", addr, e);
      }
    }
    return null;
  }
  async infer(intelligenceSpec, systemPrompt, userPrompt) {
    const client = KrnlHTTP.createClient(this.baseUrl);
    const result = await client.post("/call/infer", {
      intelligenceSpec,
      systemPrompt,
      userPrompt
    });
    if (result && result.status === "success" && result.data && result.data.status === "success" && result.data.payload && result.data.payload.status === "success" && result.data.payload.response) {
      this.lastUsedModelId = result.data.payload.modelId || null;
      return result.data.payload.response;
    }
    const errMsg = result.status === "success" ? result.data?.payload?.message || result.data?.message : result.message;
    throw new Error(errMsg || "Invalid or empty response from Aiko infer endpoint");
  }
  async downrankModel(modelId) {
    try {
      const client = KrnlHTTP.createClient(this.baseUrl);
      await client.post("/call/downrankModel", { modelId });
    } catch (e) {
      console.error("[KrnlAikoClient] Failed to send downrank request to Aiko:", e.message);
    }
  }
  async fetchCatalog() {
    const client = KrnlHTTP.createClient(this.baseUrl);
    const result = await client.post("/call/SessionManager/AgentProfileManager", {
      action: "list"
    });
    if (result && result.status === "success" && result.data && result.data.status === "success" && result.data.profiles) {
      return result.data.profiles;
    }
    return {
      "endpoint-grade-1": { description: "Nano \u2014 simple CRUD" },
      "endpoint-grade-2": { description: "Mini \u2014 standard ops" },
      "endpoint-grade-3": { description: "Standard \u2014 moderate logic" },
      "endpoint-grade-4": { description: "Large \u2014 complex reasoning" },
      "endpoint-grade-5": { description: "Expert \u2014 escalation handler" },
      "orchestrator-standard": { description: "Standard routing" },
      "orchestrator-pro": { description: "Complex routing + escalation" }
    };
  }
  async isAlive() {
    try {
      const client = KrnlHTTP.createClient(this.baseUrl);
      const result = await client.post("/call/heartbeat", {});
      return result && result.status === "success";
    } catch (e) {
      return false;
    }
  }
  static getNotRunningMessage() {
    return "Aiko is not running. Please start it with: cd ~/Projects/Javascript/Aiko && node src/Aiko.js";
  }
};

export {
  StringKit,
  LRUCache,
  TTLCache,
  CacheKit,
  FileCache,
  KrnlEnv,
  KrnlShell,
  GitManager,
  KrnlAikoClient
};
