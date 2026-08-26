// src/tools/ObjectKit.js
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
    if (Object.is(a, b))
      return true;
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
    if (keysA.length !== keysB.length)
      return false;
    const setB = new Set(keysB);
    for (const key of keysA) {
      if (!setB.has(key))
        return false;
      if (!_ObjectKit.deepEqual(a[key], b[key]))
        return false;
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
  static getPath(obj, path2, defaultValue) {
    if (!path2)
      return obj;
    const parts = path2.split(".");
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
  static setPath(obj, path2, value) {
    if (!path2)
      return obj;
    const parts = path2.split(".");
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

// src/tools/KrnlFS.js
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import os from "os";
var FileLock = class _FileLock {
  static locks = /* @__PURE__ */ new Map();
  static async acquire(filePath) {
    const resolvedPath = path.resolve(filePath);
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
    const dir = path.dirname(filePath);
    await _KrnlFS.ensureDir(dir);
    const tempFile = path.join(dir, `.${path.basename(filePath)}.tmp_${Date.now()}_${Math.random().toString(36).substring(7)}`);
    try {
      await fsp.writeFile(tempFile, content);
      await fsp.rename(tempFile, filePath);
    } catch (e) {
      if (fs.existsSync(tempFile)) {
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
      const full = path.join(dirPath, item);
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
      const srcItem = path.join(src, item);
      const destItem = path.join(dest, item);
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
    return path.join(...parts);
  }
  static resolve(...parts) {
    return path.resolve(...parts);
  }
  static relative(from, to) {
    return path.relative(from, to);
  }
  static basename(filePath, ext) {
    return path.basename(filePath, ext);
  }
  static dirname(filePath) {
    return path.dirname(filePath);
  }
  static extname(filePath) {
    return path.extname(filePath);
  }
  static normalize(filePath) {
    return path.normalize(filePath);
  }
  static isSafe(filePath, root) {
    const resolvedPath = path.resolve(filePath);
    const resolvedRoot = path.resolve(root);
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
    return fs.watch(filePath, (event) => {
      if (timer)
        clearTimeout(timer);
      timer = setTimeout(() => handler(event), debounceMs);
    });
  }
  static watchDir(dirPath, handler, debounceMs = 100) {
    let timer = null;
    return fs.watch(dirPath, (event, filename) => {
      if (timer)
        clearTimeout(timer);
      timer = setTimeout(() => handler(event, filename), debounceMs);
    });
  }
  // --- Temp ---
  static createTempFile(prefix = "tmp-") {
    return path.join(os.tmpdir(), `${prefix}${Math.random().toString(36).substring(7)}.tmp`);
  }
  static createTempDir(prefix = "tmp-dir-") {
    const dir = path.join(os.tmpdir(), `${prefix}${Math.random().toString(36).substring(7)}`);
    fs.mkdirSync(dir, { recursive: true });
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

// src/tools/AsyncKit.js
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
      if (timer)
        clearTimeout(timer);
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

// src/tools/KrnlHTTP.js
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
      get: (path2, opts = {}) => _KrnlHTTP.get(`${baseUrl}${path2}`, { ...opts, headers: { ...defaultHeaders, ...opts.headers } }),
      post: (path2, body, opts = {}) => _KrnlHTTP.post(`${baseUrl}${path2}`, body, { ...opts, headers: { ...defaultHeaders, ...opts.headers } }),
      put: (path2, body, opts = {}) => _KrnlHTTP.put(`${baseUrl}${path2}`, body, { ...opts, headers: { ...defaultHeaders, ...opts.headers } }),
      del: (path2, opts = {}) => _KrnlHTTP.del(`${baseUrl}${path2}`, { ...opts, headers: { ...defaultHeaders, ...opts.headers } })
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
        if (done)
          break;
        yield decoder.decode(value, { stream: true });
      }
    } finally {
      reader.releaseLock();
    }
  }
};

export {
  ObjectKit,
  FileLock,
  KrnlFS,
  AsyncKit,
  KrnlHTTP
};
