// src/krnl/tools/ObjectKit.ts
var ObjectKit = class _ObjectKit {
  /**
   * Structurally deep clones an object with circular dependency check.
   */
  static deepClone(obj, seen = /* @__PURE__ */ new Map()) {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }
    if (seen.has(obj)) {
      return seen.get(obj);
    }
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }
    if (obj instanceof RegExp) {
      return new RegExp(obj.source, obj.flags);
    }
    if (Array.isArray(obj)) {
      const cloneArr = [];
      seen.set(obj, cloneArr);
      for (const item of obj) {
        cloneArr.push(_ObjectKit.deepClone(item, seen));
      }
      return cloneArr;
    }
    const cloneObj = Object.create(Object.getPrototypeOf(obj));
    seen.set(obj, cloneObj);
    for (const key of Reflect.ownKeys(obj)) {
      const descriptor = Reflect.getOwnPropertyDescriptor(obj, key);
      if (descriptor) {
        descriptor.value = _ObjectKit.deepClone(descriptor.value, seen);
        Object.defineProperty(cloneObj, key, descriptor);
      }
    }
    return cloneObj;
  }
  /**
   * Recursively deep merges override objects into a base.
   */
  static deepMerge(base, ...overrides) {
    let result = _ObjectKit.deepClone(base);
    for (const override of overrides) {
      if (override === null || typeof override !== "object") {
        continue;
      }
      for (const key of Object.keys(override)) {
        const val = override[key];
        if (val === void 0) {
          delete result[key];
        } else if (val && typeof val === "object" && !Array.isArray(val)) {
          if (result[key] && typeof result[key] === "object" && !Array.isArray(result[key])) {
            result[key] = _ObjectKit.deepMerge(result[key], val);
          } else {
            result[key] = _ObjectKit.deepClone(val);
          }
        } else {
          result[key] = _ObjectKit.deepClone(val);
        }
      }
    }
    return result;
  }
  /**
   * Performs a strict structural equality check.
   */
  static deepEqual(a, b) {
    if (Object.is(a, b)) return true;
    if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) {
      return false;
    }
    if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) {
      return false;
    }
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }
    if (a instanceof RegExp && b instanceof RegExp) {
      return a.toString() === b.toString();
    }
    const keysA = Reflect.ownKeys(a);
    const keysB = Reflect.ownKeys(b);
    if (keysA.length !== keysB.length) return false;
    const setB = new Set(keysB);
    for (const key of keysA) {
      if (!setB.has(key)) return false;
      if (!_ObjectKit.deepEqual(a[key], b[key])) return false;
    }
    return true;
  }
  /**
   * Performs an object diff between before and after states.
   */
  static objectDiff(before, after) {
    const added = {};
    const removed = {};
    const changed = {};
    if (before === null || typeof before !== "object" || after === null || typeof after !== "object") {
      return { added, removed, changed };
    }
    const keysBefore = Object.keys(before);
    const keysAfter = Object.keys(after);
    for (const key of keysAfter) {
      if (!(key in before)) {
        added[key] = _ObjectKit.deepClone(after[key]);
      } else if (!_ObjectKit.deepEqual(before[key], after[key])) {
        if (before[key] && typeof before[key] === "object" && after[key] && typeof after[key] === "object" && !Array.isArray(before[key]) && !Array.isArray(after[key])) {
          const nested = _ObjectKit.objectDiff(before[key], after[key]);
          if (Object.keys(nested.added).length > 0 || Object.keys(nested.removed).length > 0 || Object.keys(nested.changed).length > 0) {
            changed[key] = nested;
          }
        } else {
          changed[key] = { from: _ObjectKit.deepClone(before[key]), to: _ObjectKit.deepClone(after[key]) };
        }
      }
    }
    for (const key of keysBefore) {
      if (!(key in after)) {
        removed[key] = _ObjectKit.deepClone(before[key]);
      }
    }
    return { added, removed, changed };
  }
  /**
   * Accesses an in-memory object by dot-notation.
   */
  static getPath(obj, path6, defaultValue) {
    if (!path6) return obj;
    const parts = path6.split(".");
    let current = obj;
    for (const part of parts) {
      if (current === null || current === void 0) {
        return defaultValue;
      }
      current = current[part];
    }
    return current !== void 0 ? current : defaultValue;
  }
  /**
   * Mutates or sets an in-memory object by dot-notation.
   */
  static setPath(obj, path6, value) {
    if (!path6) return obj;
    const parts = path6.split(".");
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (current[part] === void 0 || current[part] === null) {
        current[part] = {};
      }
      current = current[part];
    }
    current[parts[parts.length - 1]] = value;
    return obj;
  }
};

// src/krnl/tools/AsyncKit.ts
var AsyncKit = class _AsyncKit {
  /**
   * Classic sleep/delay.
   */
  static sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  /**
   * Rejects if the task does not finish within ms.
   */
  static withTimeout(promise, ms, label = "Operation") {
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`[KrnlTimeoutError] ${label} timed out after ${ms}ms`));
      }, ms);
    });
    return Promise.race([
      promise.then((val) => {
        clearTimeout(timer);
        return val;
      }),
      timeoutPromise
    ]);
  }
  /**
   * Retries an async execution up to maxAttempts times.
   */
  static async retry(fn, maxAttempts, delayMs = 1e3) {
    let attempts = 0;
    while (attempts < maxAttempts) {
      try {
        return await fn();
      } catch (err) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw err;
        }
        await _AsyncKit.sleep(delayMs);
      }
    }
    throw new Error("Retry failed");
  }
  static async pLimit(tasks, concurrency) {
    const results = [];
    let index = 0;
    const worker = async () => {
      while (index < tasks.length) {
        const i = index++;
        results[i] = await tasks[i]();
      }
    };
    const workers = [];
    for (let i = 0; i < concurrency && i < tasks.length; i++) {
      workers.push(worker());
    }
    await Promise.all(workers);
    return results;
  }
  /**
   * Debounces a function.
   */
  static debounce(fn, ms) {
    let timer = null;
    return (...args) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  }
  /**
   * Throttles a function.
   */
  static throttle(fn, ms) {
    let lastCall = 0;
    return (...args) => {
      const now = Date.now();
      if (now - lastCall >= ms) {
        lastCall = now;
        fn(...args);
      }
    };
  }
  /**
   * Wraps a function to run only once and cache its outcome.
   */
  static once(fn) {
    let run = false;
    let result;
    return (...args) => {
      if (!run) {
        run = true;
        result = fn(...args);
      }
      return result;
    };
  }
  /**
   * computational memoization cache helper.
   */
  static memoize(fn, keyFn) {
    const cache = /* @__PURE__ */ new Map();
    return (...args) => {
      const key = keyFn ? keyFn(...args) : JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const val = fn(...args);
      cache.set(key, val);
      return val;
    };
  }
};

// src/krnl/tools/StringKit.ts
var StringKit = class _StringKit {
  static toCamelCase(str) {
    return str.replace(/[-_]+/g, " ").replace(/[^\w\s]/g, "").replace(
      /(?:^\w|[A-Z]|\b\w)/g,
      (word, index) => index === 0 ? word.toLowerCase() : word.toUpperCase()
    ).replace(/\s+/g, "");
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

// src/krnl/tools/CacheKit.ts
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
    if (!this.cache.has(key)) return void 0;
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
      if (firstKey !== void 0) this.cache.delete(firstKey);
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
    if (!entry) return null;
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
    if (!fs.existsSync(file)) return null;
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

// src/krnl/tools/KrnlFS.ts
import fs2 from "fs";
import fsp from "fs/promises";
import path2 from "path";
import os from "os";
var FileLock = class _FileLock {
  static locks = /* @__PURE__ */ new Map();
  static async acquire(filePath) {
    const resolvedPath = path2.resolve(filePath);
    const existing = _FileLock.locks.get(resolvedPath) || Promise.resolve();
    let release = () => {
    };
    const nextLock = new Promise((resolve) => {
      release = () => {
        _FileLock.locks.delete(resolvedPath);
        resolve();
      };
    });
    _FileLock.locks.set(resolvedPath, nextLock);
    await existing;
    return release;
  }
};
var KrnlFS = class _KrnlFS {
  // --- File primitives ---
  static async readFile(filePath, encoding = "utf8") {
    return await fsp.readFile(filePath, encoding);
  }
  static async writeFile(filePath, content) {
    await fsp.writeFile(filePath, content);
  }
  /**
   * Atomic file writing via temp files.
   */
  static async writeFileAtomic(filePath, content) {
    const dir = path2.dirname(filePath);
    await _KrnlFS.ensureDir(dir);
    const tempFile = path2.join(dir, `.${path2.basename(filePath)}.tmp_${Date.now()}_${Math.random().toString(36).substring(7)}`);
    try {
      await fsp.writeFile(tempFile, content);
      await fsp.rename(tempFile, filePath);
    } catch (e) {
      if (fs2.existsSync(tempFile)) {
        await fsp.unlink(tempFile).catch(() => {
        });
      }
      throw e;
    }
  }
  static async appendFile(filePath, content) {
    await fsp.appendFile(filePath, content);
  }
  static async deleteFile(filePath) {
    await fsp.unlink(filePath);
  }
  static async fileExists(filePath) {
    try {
      const stat = await fsp.stat(filePath);
      return stat.isFile();
    } catch (e) {
      return false;
    }
  }
  static async getFileStat(filePath) {
    const stat = await fsp.stat(filePath);
    return {
      size: stat.size,
      createdAt: stat.birthtime,
      modifiedAt: stat.mtime,
      isDir: stat.isDirectory()
    };
  }
  // --- JSON convenience ---
  static async readJSON(filePath) {
    try {
      const content = await _KrnlFS.readFile(filePath, "utf8");
      return JSON.parse(content);
    } catch (e) {
      return null;
    }
  }
  static async writeJSON(filePath, data, indent = 2) {
    const content = JSON.stringify(data, null, indent);
    await _KrnlFS.writeFileAtomic(filePath, content);
  }
  static async updateJSON(filePath, patch) {
    const release = await FileLock.acquire(filePath);
    try {
      let existing = await _KrnlFS.readJSON(filePath);
      if (!existing) {
        existing = {};
      }
      const updated = ObjectKit.deepMerge(existing, patch);
      await _KrnlFS.writeJSON(filePath, updated);
      return updated;
    } finally {
      release();
    }
  }
  // --- Directory primitives ---
  static async ensureDir(dirPath) {
    await fsp.mkdir(dirPath, { recursive: true });
  }
  static async deleteDir(dirPath, recursive = true) {
    await fsp.rm(dirPath, { recursive, force: true });
  }
  static async listDir(dirPath) {
    return await fsp.readdir(dirPath);
  }
  static async *walkDir(dirPath, filter) {
    const list = await _KrnlFS.listDir(dirPath);
    for (const item of list) {
      const full = path2.join(dirPath, item);
      const stat = await _KrnlFS.getFileStat(full);
      if (stat.isDir) {
        yield* _KrnlFS.walkDir(full, filter);
      } else {
        if (!filter || filter(full)) {
          yield full;
        }
      }
    }
  }
  static async dirExists(dirPath) {
    try {
      const stat = await fsp.stat(dirPath);
      return stat.isDirectory();
    } catch (e) {
      return false;
    }
  }
  static async copyDir(src, dest) {
    await _KrnlFS.ensureDir(dest);
    const list = await _KrnlFS.listDir(src);
    for (const item of list) {
      const srcItem = path2.join(src, item);
      const destItem = path2.join(dest, item);
      const stat = await _KrnlFS.getFileStat(srcItem);
      if (stat.isDir) {
        await _KrnlFS.copyDir(srcItem, destItem);
      } else {
        await fsp.copyFile(srcItem, destItem);
      }
    }
  }
  // --- Path utilities ---
  static join(...parts) {
    return path2.join(...parts);
  }
  static resolve(...parts) {
    return path2.resolve(...parts);
  }
  static relative(from, to) {
    return path2.relative(from, to);
  }
  static basename(filePath, ext) {
    return path2.basename(filePath, ext);
  }
  static dirname(filePath) {
    return path2.dirname(filePath);
  }
  static extname(filePath) {
    return path2.extname(filePath);
  }
  static normalize(filePath) {
    return path2.normalize(filePath);
  }
  static isSafe(filePath, root) {
    const resolvedPath = path2.resolve(filePath);
    const resolvedRoot = path2.resolve(root);
    return resolvedPath.startsWith(resolvedRoot);
  }
  // --- Candidate resolution ---
  static async firstExisting(candidates) {
    for (const cand of candidates) {
      if (await _KrnlFS.fileExists(cand)) {
        return cand;
      }
    }
    return null;
  }
  // --- Watching ---
  static watchFile(filePath, handler, debounceMs = 100) {
    let timer = null;
    return fs2.watch(filePath, (event) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => handler(event), debounceMs);
    });
  }
  static watchDir(dirPath, handler, debounceMs = 100) {
    let timer = null;
    return fs2.watch(dirPath, (event, filename) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => handler(event, filename), debounceMs);
    });
  }
  // --- Temp ---
  static createTempFile(prefix = "tmp-") {
    return path2.join(os.tmpdir(), `${prefix}${Math.random().toString(36).substring(7)}.tmp`);
  }
  static createTempDir(prefix = "tmp-dir-") {
    const dir = path2.join(os.tmpdir(), `${prefix}${Math.random().toString(36).substring(7)}`);
    fs2.mkdirSync(dir, { recursive: true });
    return dir;
  }
  static async withTempDir(fn, prefix = "tmp-") {
    const tempDir = _KrnlFS.createTempDir(prefix);
    try {
      return await fn(tempDir);
    } finally {
      await _KrnlFS.deleteDir(tempDir, true).catch(() => {
      });
    }
  }
};

// src/krnl/tools/KrnlEnv.ts
import fs3 from "fs";
import path3 from "path";
var KrnlEnv = class {
  /**
   * Reads a process environment variable with type coercion and defaults.
   */
  static get(key, defaultValue) {
    const val = process.env[key];
    if (val === void 0) {
      if (defaultValue !== void 0) return defaultValue;
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
    const file = filePath || path3.join(process.cwd(), ".env");
    if (!fs3.existsSync(file)) return;
    try {
      const content = fs3.readFileSync(file, "utf8");
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const equalsIndex = trimmed.indexOf("=");
        if (equalsIndex === -1) continue;
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

// src/krnl/tools/KrnlShell.ts
import { exec, spawn } from "child_process";
import path4 from "path";
import fs4 from "fs";
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
    const paths = envPath.split(path4.delimiter);
    const extensions = process.platform === "win32" ? [".exe", ".cmd", ".bat", ""] : [""];
    for (const p of paths) {
      for (const ext of extensions) {
        const fullPath = path4.join(p, `${cmd}${ext}`);
        try {
          if (fs4.existsSync(fullPath) && fs4.statSync(fullPath).isFile()) {
            return fullPath;
          }
        } catch (e) {
        }
      }
    }
    return null;
  }
};

// src/krnl/tools/KrnlHTTP.ts
var KrnlHTTP = class _KrnlHTTP {
  /**
   * Helper to perform fetch with timeout and retries.
   */
  static async requestRaw(url, opts = {}) {
    const timeout = opts.timeout || 6e4;
    const retries = opts.retries || 0;
    const perform = async () => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetch(url, {
          ...opts,
          signal: controller.signal
        });
        clearTimeout(id);
        return response;
      } catch (e) {
        clearTimeout(id);
        throw e;
      }
    };
    return await AsyncKit.retry(perform, retries + 1, 1e3);
  }
  static async request(url, opts = {}) {
    try {
      const res = await _KrnlHTTP.requestRaw(url, opts);
      if (!res.ok) {
        return { status: "error", message: `HTTP Error ${res.status}: ${res.statusText}`, code: res.status };
      }
      const data = await res.json();
      return { status: "success", data };
    } catch (e) {
      return { status: "error", message: e.message || String(e) };
    }
  }
  static async get(url, opts = {}) {
    return await _KrnlHTTP.request(url, { ...opts, method: "GET" });
  }
  static async post(url, body, opts = {}) {
    return await _KrnlHTTP.request(url, {
      ...opts,
      method: "POST",
      headers: { "Content-Type": "application/json", ...opts.headers },
      body: JSON.stringify(body)
    });
  }
  static async put(url, body, opts = {}) {
    return await _KrnlHTTP.request(url, {
      ...opts,
      method: "PUT",
      headers: { "Content-Type": "application/json", ...opts.headers },
      body: JSON.stringify(body)
    });
  }
  static async del(url, opts = {}) {
    return await _KrnlHTTP.request(url, { ...opts, method: "DELETE" });
  }
  /**
   * Creates a client instance.
   */
  static createClient(baseUrl, defaultHeaders = {}) {
    return {
      get: (path6, opts = {}) => _KrnlHTTP.get(`${baseUrl}${path6}`, { ...opts, headers: { ...defaultHeaders, ...opts.headers } }),
      post: (path6, body, opts = {}) => _KrnlHTTP.post(`${baseUrl}${path6}`, body, { ...opts, headers: { ...defaultHeaders, ...opts.headers } }),
      put: (path6, body, opts = {}) => _KrnlHTTP.put(`${baseUrl}${path6}`, body, { ...opts, headers: { ...defaultHeaders, ...opts.headers } }),
      del: (path6, opts = {}) => _KrnlHTTP.del(`${baseUrl}${path6}`, { ...opts, headers: { ...defaultHeaders, ...opts.headers } })
    };
  }
  /**
   * Streaming SSE / Chunk response.
   */
  static async *streamResponse(url, opts = {}) {
    const res = await _KrnlHTTP.requestRaw(url, opts);
    if (!res.ok || !res.body) {
      throw new Error(`Failed to initialize stream: HTTP ${res.status}`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield decoder.decode(value, { stream: true });
      }
    } finally {
      reader.releaseLock();
    }
  }
};

// src/krnl/tools/GitManager.ts
import fs5 from "fs";
import path5 from "path";
var GitManager = class _GitManager {
  static isRepo(dirPath) {
    return fs5.existsSync(path5.join(dirPath, ".git"));
  }
  static async init(dirPath) {
    if (_GitManager.isRepo(dirPath)) return;
    await KrnlShell.exec("git init", { cwd: dirPath });
  }
  static async clone(repoUrl, destPath) {
    const parentDir = path5.dirname(destPath);
    if (!fs5.existsSync(parentDir)) {
      fs5.mkdirSync(parentDir, { recursive: true });
    }
    await KrnlShell.exec(`git clone ${repoUrl} ${path5.basename(destPath)}`, { cwd: parentDir });
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

// src/krnl/core/K_LIB_Krnl_Aiko_Client.ts
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
  ObjectKit,
  AsyncKit,
  StringKit,
  LRUCache,
  TTLCache,
  CacheKit,
  FileCache,
  FileLock,
  KrnlFS,
  KrnlEnv,
  KrnlShell,
  KrnlHTTP,
  GitManager,
  KrnlAikoClient
};
