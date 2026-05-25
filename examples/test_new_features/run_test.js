import http from "http";
import path from "path";
import fs from "fs";
import { z } from "zod";
import {
  KrnlResult,
  ObjectKit,
  AsyncKit,
  StringKit,
  LRUCache,
  TTLCache,
  CacheKit,
  FileCache,
  KrnlFS,
  KrnlEnv,
  KrnlShell,
  KrnlHTTP,
  GitManager
} from "../../dist/index.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function testKrnlResult() {
  console.log("-> Testing KrnlResult...");
  const success = KrnlResult.ok({ value: 42 });
  assert(success.status === "success", "Expected success status");
  assert(success.data.value === 42, "Expected success data");
  assert(success.isSuccess() === true, "Expected isSuccess true");
  assert(success.isError() === false, "Expected isError false");

  const failure = KrnlResult.fail("Something went wrong", 400);
  assert(failure.status === "error", "Expected error status");
  assert(failure.message === "Something went wrong", "Expected failure message");
  assert(failure.code === 400, "Expected failure code 400");
  assert(failure.isSuccess() === false, "Expected isSuccess false");
  assert(failure.isError() === true, "Expected isError true");
  console.log("✅ KrnlResult passed.");
}

async function testObjectKit() {
  console.log("-> Testing ObjectKit...");
  // 1. deepClone
  const original = { a: 1, b: { c: [2, 3] }, d: new Date(2026, 4, 26) };
  const cloned = ObjectKit.deepClone(original);
  assert(cloned !== original, "Clone should not be the same reference");
  assert(cloned.b !== original.b, "Nested object should not be the same reference");
  assert(cloned.b.c !== original.b.c, "Nested array should not be the same reference");
  assert(cloned.d.getTime() === original.d.getTime(), "Date values should be equal");

  // 2. deepMerge
  const base = { x: 1, y: { z: 2 } };
  const override = { y: { w: 3 }, u: 4 };
  const merged = ObjectKit.deepMerge(base, override);
  assert(merged.x === 1, "Merged should keep base x");
  assert(merged.y.z === 2, "Merged should keep base y.z");
  assert(merged.y.w === 3, "Merged should add override y.w");
  assert(merged.u === 4, "Merged should add override u");

  // 3. deepEqual
  assert(ObjectKit.deepEqual({ a: 1, b: [2] }, { a: 1, b: [2] }), "Objects should be deep equal");
  assert(!ObjectKit.deepEqual({ a: 1, b: [2] }, { a: 1, b: [3] }), "Objects should not be deep equal");

  // 4. objectDiff
  const diff = ObjectKit.objectDiff({ a: 1, b: 2 }, { a: 1, b: 3, c: 4 });
  assert(diff.changed.b !== undefined, "Expected diff to capture modified key b");
  assert(diff.added.c !== undefined, "Expected diff to capture added key c");

  // 5. getPath & setPath
  const pathObj = { a: { b: { c: 100 } } };
  assert(ObjectKit.getPath(pathObj, "a.b.c") === 100, "Expected getPath to resolve path");
  assert(ObjectKit.getPath(pathObj, "a.x.y", "default") === "default", "Expected default fallback");
  ObjectKit.setPath(pathObj, "a.b.d", 200);
  assert(pathObj.a.b.d === 200, "Expected setPath to set nested value");
  console.log("✅ ObjectKit passed.");
}

async function testAsyncKit() {
  console.log("-> Testing AsyncKit...");
  // 1. sleep
  const start = Date.now();
  await AsyncKit.sleep(50);
  const elapsed = Date.now() - start;
  assert(elapsed >= 45, `Expected sleep to delay execution, took ${elapsed}ms`);

  // 2. withTimeout
  const fastPromise = AsyncKit.sleep(10).then(() => "fast");
  const fastResult = await AsyncKit.withTimeout(fastPromise, 100);
  assert(fastResult === "fast", "Expected fast promise to complete");

  const slowPromise = AsyncKit.sleep(100).then(() => "slow");
  try {
    await AsyncKit.withTimeout(slowPromise, 10);
    assert(false, "Expected timeout error to be thrown");
  } catch (err) {
    assert(err.message.includes("timed out"), "Expected timeout error");
  }

  // 3. retry
  let attempts = 0;
  const flaky = async () => {
    attempts++;
    if (attempts < 3) throw new Error("Flaky error");
    return "success";
  };
  const retryResult = await AsyncKit.retry(flaky, 4, 10);
  assert(retryResult === "success", "Expected retry to succeed");
  assert(attempts === 3, "Expected 3 attempts total");

  // 4. pLimit
  let running = 0;
  let maxConcurrent = 0;
  const makeTask = (id, ms) => async () => {
    running++;
    maxConcurrent = Math.max(maxConcurrent, running);
    await AsyncKit.sleep(ms);
    running--;
    return id;
  };
  const limitResults = await AsyncKit.pLimit([
    makeTask(1, 20),
    makeTask(2, 20),
    makeTask(3, 20),
    makeTask(4, 20)
  ], 2);
  assert(maxConcurrent <= 2, `Expected concurrent tasks to be <= 2, got ${maxConcurrent}`);
  assert(limitResults.length === 4, "Expected 4 results");

  // 5. once
  let count = 0;
  const inc = AsyncKit.once(() => ++count);
  assert(inc() === 1, "First run");
  assert(inc() === 1, "Second run (cached)");
  assert(count === 1, "Wrapped fn only executed once");

  // 6. memoize
  let runs = 0;
  const memo = AsyncKit.memoize((n) => {
    runs++;
    return n * 2;
  });
  assert(memo(5) === 10, "First memo call");
  assert(memo(5) === 10, "Second memo call (cached)");
  assert(runs === 1, "Expected function to run only once for same arg");
  assert(memo(6) === 12, "Memo call with new arg");
  assert(runs === 2, "Expected function to run again for new arg");
  console.log("✅ AsyncKit passed.");
}

async function testStringKit() {
  console.log("-> Testing StringKit...");
  assert(StringKit.toCamelCase("my-cool-feature") === "myCoolFeature", "CamelCase conversion");
  assert(StringKit.toPascalCase("my-cool-feature") === "MyCoolFeature", "PascalCase conversion");
  assert(StringKit.toSnakeCase("myCoolFeature") === "my_cool_feature", "SnakeCase conversion");
  assert(StringKit.toKebabCase("my_cool_feature") === "my-cool-feature", "KebabCase conversion");

  const uuid = StringKit.generateUUID();
  assert(uuid.length === 36, "UUID should be 36 characters");

  const shortId = StringKit.generateShortId();
  assert(shortId.length >= 7, "Short ID should be robust");

  const interp = StringKit.interpolate("Hello {{name}}! Welcome to {{place}}.", { name: "Dinil", place: "KrnlTS" });
  assert(interp === "Hello Dinil! Welcome to KrnlTS.", "Interpolation template matching");
  console.log("✅ StringKit passed.");
}

async function testCacheKit() {
  console.log("-> Testing CacheKit...");
  // 1. LRUCache
  const lru = new LRUCache(2);
  lru.set("a", 1);
  lru.set("b", 2);
  assert(lru.get("a") === 1, "Retrieve key from LRU");
  lru.set("c", 3); // evicts "b" because "a" was accessed
  assert(lru.get("b") === undefined, "LRU evicted 'b'");
  assert(lru.get("c") === 3, "LRU contains 'c'");

  // 2. TTLCache & swr
  const ttl = new TTLCache(50);
  ttl.set("k", 100);
  assert(ttl.get("k") === 100, "TTL Cache fetch within window");
  await AsyncKit.sleep(60);
  assert(ttl.get("k") === null, "TTL Cache key should expire");

  // swr
  let fetchCount = 0;
  const slowFetch = async () => {
    fetchCount++;
    return "fresh";
  };
  const cacheForSWR = new TTLCache(100);
  const val1 = await CacheKit.swr(cacheForSWR, "key", slowFetch);
  assert(val1 === "fresh", "SWR initial fetch");
  assert(fetchCount === 1, "Initial call counts");

  const val2 = await CacheKit.swr(cacheForSWR, "key", slowFetch);
  assert(val2 === "fresh", "SWR cached fetch");
  assert(fetchCount === 1, "Should serve from cache, background revalidation scheduled");

  // 3. FileCache
  await KrnlFS.withTempDir(async (tempDir) => {
    const fileCache = new FileCache(tempDir);
    fileCache.set("user1", { name: "Dinil" });
    const cached = fileCache.get("user1");
    assert(cached.name === "Dinil", "FileCache should retrieve object");
    fileCache.delete("user1");
    assert(fileCache.get("user1") === null, "FileCache key should be deleted");
  });
  console.log("✅ CacheKit passed.");
}

async function testKrnlFS() {
  console.log("-> Testing KrnlFS...");
  await KrnlFS.withTempDir(async (tempDir) => {
    const testFile = path.join(tempDir, "test.json");

    // 1. writeFileAtomic & fileExists
    await KrnlFS.writeFileAtomic(testFile, '{"ok": true}');
    assert(await KrnlFS.fileExists(testFile), "File should exist after atomic write");

    // 2. readJSON
    const json = await KrnlFS.readJSON(testFile);
    assert(json.ok === true, "JSON should match written content");

    // 3. updateJSON (with lock)
    const updated = await KrnlFS.updateJSON(testFile, { added: "field" });
    assert(updated.ok === true && updated.added === "field", "updateJSON deep merge");

    const readAgain = await KrnlFS.readJSON(testFile);
    assert(readAgain.added === "field", "Read matches after updateJSON");

    // 4. walkDir
    await KrnlFS.writeFileAtomic(path.join(tempDir, "sub", "subfile.txt"), "hello");
    const walker = KrnlFS.walkDir(tempDir);
    const files = [];
    for await (const file of walker) {
      files.push(path.basename(file));
    }
    assert(files.includes("test.json") && files.includes("subfile.txt"), "walkDir should traverse directory recursively");
  });
  console.log("✅ KrnlFS passed.");
}

async function testKrnlEnv() {
  console.log("-> Testing KrnlEnv...");
  // Create a temporary .env content in process.env
  process.env["TEST_PORT"] = "9090";
  process.env["TEST_ENABLED"] = "true";
  process.env["TEST_STR"] = "HelloEnv";

  const port = KrnlEnv.get("TEST_PORT", 8080);
  assert(port === 9090, "KrnlEnv.get integer coercion");

  const enabled = KrnlEnv.get("TEST_ENABLED", false);
  assert(enabled === true, "KrnlEnv.get boolean coercion");

  const str = KrnlEnv.require("TEST_STR");
  assert(str === "HelloEnv", "KrnlEnv.require matches value");

  const validated = KrnlEnv.schema(
    z.object({
      TEST_PORT: z.coerce.number(),
      TEST_ENABLED: z.coerce.boolean(),
      TEST_STR: z.string()
    })
  );
  assert(validated.TEST_PORT === 9090, "Zod env parsing Port");
  assert(validated.TEST_ENABLED === true, "Zod env parsing Enabled");
  assert(validated.TEST_STR === "HelloEnv", "Zod env parsing String");
  console.log("✅ KrnlEnv passed.");
}

async function testKrnlShell() {
  console.log("-> Testing KrnlShell...");
  const { stdout } = await KrnlShell.exec("node -v");
  assert(stdout.startsWith("v"), "Expected node version format starting with v");

  const nodeBin = KrnlShell.which("node");
  assert(nodeBin !== null && nodeBin.includes("node"), "Expected which to find node binary path");
  console.log("✅ KrnlShell passed.");
}

async function testKrnlHTTP() {
  console.log("-> Testing KrnlHTTP...");
  // Start a local HTTP server
  const server = http.createServer((req, res) => {
    if (req.url === "/api/test" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, message: "got-it" }));
    } else if (req.url === "/api/test" && req.method === "POST") {
      let body = "";
      req.on("data", chunk => body += chunk);
      req.on("end", () => {
        const data = JSON.parse(body);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, echo: data }));
      });
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  const port = 12948;
  await new Promise(resolve => server.listen(port, resolve));

  try {
    const client = KrnlHTTP.createClient(`http://localhost:${port}`);
    // GET test
    const getRes = await client.get("/api/test");
    assert(getRes.isSuccess() === true, "Expected successful GET request");
    assert(getRes.data.message === "got-it", "GET response message check");

    // POST test
    const postRes = await client.post("/api/test", { greeting: "hello" });
    assert(postRes.isSuccess() === true, "Expected successful POST request");
    assert(postRes.data.echo.greeting === "hello", "POST echo message check");
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
  console.log("✅ KrnlHTTP passed.");
}

async function testGitManager() {
  console.log("-> Testing GitManager...");
  await KrnlFS.withTempDir(async (tempDir) => {
    assert(GitManager.isRepo(tempDir) === false, "Temp dir should not be a git repo initially");
    await GitManager.init(tempDir);
    assert(GitManager.isRepo(tempDir) === true, "Temp dir should be a git repo after init");
  });
  console.log("✅ GitManager passed.");
}

async function runAll() {
  console.log("==========================================");
  console.log("   KRNL-TOOLS NEW FEATURES TEST SUITE     ");
  console.log("==========================================");
  
  await testKrnlResult();
  await testObjectKit();
  await testAsyncKit();
  await testStringKit();
  await testCacheKit();
  await testKrnlFS();
  await testKrnlEnv();
  await testKrnlShell();
  await testKrnlHTTP();
  await testGitManager();

  console.log("\n==========================================");
  console.log("🎉 ALL NEW FEATURES TESTED & PASSED SUCCESSFULLY! 🎉");
  console.log("==========================================");
}

runAll().catch(err => {
  console.error("\n❌ TEST SUITE FAILED:", err);
  process.exit(1);
});
