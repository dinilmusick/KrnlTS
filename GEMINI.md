// ULTRST & KRNL CONVENTIONS (SUPER COMPRESSED) - v2.0.0
// Target: All KrnlJS/KrnlTS project modules & ecosystem layers

[STRUCTURE]
ROOT/
├── doc.md -> Root documentation
├── src/ -> Canonical source files (.ts/esm)
├── libraries/ -> Project-local submodules (NO npm packages)
├── entities/ -> Child nested orchestrators & component entities
│   └── MyEntity/
│       ├── functionalities/ -> Encapsulated logic atoms
│       └── MyEntity.js -> Composition assembler
└── assembler.js -> System Entrypoint (krnlSystemEntityBase)

[POLICIES]
- ROOT CLEANLINESS: Zero test/scaffold/scratch files in root. All demos inside `examples/`.
- SUBSYSTEMS: Major process-local domains inherit `krnlSubSystemOrchestratorBase`, owned by parent.
- VISIBILITY: Functionalities bubble up to owner by default if `visibility = 'public'`. Avoid manual `addRemote` for local sibling calls.
- BUBBLING RESOLUTION: Unified HTTP, SSE, MCP, & manifest protocols resolve remote proxies to source metadata.

[IMPORT_RESTRICTIONS]
- Descriptors (Entity.js, Func.js) are strictly declarative CONFIG_ONLY. No library imports.
- Logic Files (logic.js) contain helper and library imports.
- All internal import extensions MUST be `.js` (never `.ts` to ensure clean ES resolution).

---

[KRNL-TOOLS INTEGRATION GUIDE]
The new foundational primitives are exported under `krnlts` namespace:
`import { KrnlResult, KrnlFS, KrnlEnv, KrnlShell, AsyncKit, StringKit, ObjectKit, CacheKit, KrnlHTTP, GitManager } from "krnlts";`

1. OPERATIONS ENVELOPE (KrnlResult)
```ts
// Enforces standard success/error structure
const res = KrnlResult.ok({ payload: "value" }); // -> { status: "success", data }
const err = KrnlResult.fail("Something went wrong", 500); // -> { status: "error", message, code }
```

2. SAFE FILESYSTEM (KrnlFS)
```ts
// Atomic writing (corrupt-proof), deep-merge updateJSON, directory operations
await KrnlFS.writeFileAtomic("path/file.txt", "data");
await KrnlFS.ensureDir("nested/path");
const user = await KrnlFS.updateJSON("user.json", { preferences: { dark: true } }); // safe deep-merge
const release = await KrnlFS.acquireFileLock("file.txt"); // Cooperative Promise-based file mutex lock
release();
```

3. SYSTEM CONTROL & ENV (KrnlEnv & KrnlShell)
```ts
// Type-safe Zod schema validation & loading for environment configurations
KrnlEnv.load(".env");
const config = KrnlEnv.schema(z.object({ PORT: z.coerce.number().default(8080) }));
// Execution wrappers
const { stdout } = await KrnlShell.exec("git status");
const handle = KrnlShell.spawn("node", ["server.js"]);
const actualBin = KrnlShell.which("node"); // locates system binaries
```

4. FLOW & PROMISE CONTROLS (AsyncKit)
```ts
// Timings, limiters, debouncing, once
await AsyncKit.sleep(500);
const res = await AsyncKit.withTimeout(fetchData(), 5000, "FetchTask");
const results = await AsyncKit.pLimit([() => task1(), () => task2()], 2); // concurrency limiting
```

5. OBJECT & TEXT FORMATTING (ObjectKit & StringKit)
```ts
const cloned = ObjectKit.deepClone(obj); // handles Dates, Regex, deep refs cleanly
const merged = ObjectKit.deepMerge(base, override); // recursive deep key merge
const camel = StringKit.toCamelCase("my-entity-name"); // camel, pascal, snake, kebab, slug
const uuid = StringKit.generateUUID(); // UUID generator
const interpolated = StringKit.interpolate("Hello {{name}}", { name: "Dinil" });
```

6. CACHING & DYNAMIC CLIENT (CacheKit & KrnlHTTP)
```ts
const cache = new TTLCache(60000); // time-to-live cache
const data = await CacheKit.swr(cache, "key", () => fetchFresh()); // Stale-While-Revalidate
const client = KrnlHTTP.createClient("https://api.example.com", { "Authorization": "Bearer token" });
const sseStream = KrnlHTTP.streamResponse("https://api.example.com/stream"); // yields SSE chunks
```
