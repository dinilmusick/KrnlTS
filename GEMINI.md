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

---

[SYSTEM_ENTITY_FEATURES]

7. PORT REGISTRY
// krnlSystemEntityBase maintains portRegistry: Map<serviceName, port>
// '_krnl_system' → commPort is pre-registered at construction.
// P_local = { p ∈ ℕ | portRegistry.has(p) }

system.registerPort('auth-service',    3001);
system.registerPort('worker-service',  3002);
system.unregisterPort('worker-service');

const ports = system.getRegisteredPorts();
// -> { _krnl_system: 10099, 'auth-service': 3001 }

// Query via HTTP endpoint:
// GET /call/getUsedPorts  -> { entity, ports: number[], registry: Record<string,number> }
// POST /call/findFreePorts { count, rangeStart?, rangeEnd? }
//   -> { freePorts, queriedPeers, totalUsedCount, usedByPeer }
//   Queries all live peers, unions port sets, returns k free ports in range.

8. ENDPOINT ACCESS CONTROL
// Endpoints on krnlSystemEntityBase support port-based access policies.
// Access check: f(callerPort, key) → PASS | REJECT

// Policy shape (KrnlEndpointAccessPolicy):
//   allow:                      number[]   // P_allow  — unconditional pass
//   allow_with_key:             number[]   // P_key    — pass with valid key
//   forbid:                     number[]   // P_forbid — hard block
//   default_connection_behaviour:          // governs unlisted ports:
//     'allow_unlisted'                     //   open (pass through)
//     'ask_key_unlisted'                   //   need key
//     'forbid_unlisted'                    //   blocked

// Decision function (short-circuit priority):
//   p ∈ P_forbid          → REJECT  "Port p is explicitly forbidden."
//   p ∈ P_allow           → PASS
//   p ∈ P_key             → key === accessKey ? PASS : REJECT  "Access key required."
//   unlisted              → default_connection_behaviour(p, key)

// callerPort injected automatically from req.socket.remotePort on HTTP calls.
// key read from request header: x-krnl-access-key

// ENDPOINT CATEGORIES:

// internal_endpoint — only registered service ports may call this.
// allow = [...portRegistry values], default = forbid_unlisted
system.addInternalEndpoint({
  id: 'internalSync',
  api: async (input) => { /* microservice-only logic */ }
});

// external_endpoint (free) — open to all callers, no key required.
system.addExternalEndpoint({
  id: 'publicStatus',
  api: async () => ({ status: 'ok' })
}, 'free');

// external_endpoint (keyed) — all callers must supply x-krnl-access-key header.
system.addExternalEndpoint({
  id: 'sensitiveData',
  api: async (input) => { /* restricted logic */ }
}, 'keyed', 'my-secret-key');

// Manual policy (granular control):
system.addLocal({
  id: 'mixedEndpoint',
  accessPolicy: {
    allow:                      [3001, 3002],   // internal services: free pass
    allow_with_key:             [4000],          // partner service: needs key
    forbid:                     [9999],          // explicitly blocked port
    default_connection_behaviour: 'forbid_unlisted',
  },
  accessKey: 'partner-secret',
  api: async (input) => { /* ... */ }
});

---

[UPDATES]

// v2.1.0 — PORT REGISTRY (2026-05-28)
// Added portRegistry: Map<serviceName, port> to krnlSystemEntityBase.
// '_krnl_system' → commPort pre-registered at construction.
// Files changed:
//   K_ENT_Krnl_System_Entity_Base.ts  → portRegistry field, registerPort(), unregisterPort(), getRegisteredPorts()
//   K_LIB_Krnl_System_Base_Functionality_APIs.ts → getUsedPortsApi(), findFreePortsApi()
//   K_ENT_Krnl_System_Entity_Base.ts._setupBaseFunctionalities() → addLocal getUsedPorts, findFreePorts

// v2.2.0 — ENDPOINT ACCESS CONTROL (2026-05-28)
// Added port-based access policy to krnlLocalFunctionality and krnlSystemEntityBase.
// Files changed:
//   types.ts                           → +DefaultConnectionBehaviour, +KrnlEndpointAccessPolicy, +EndpointCategory
//   K_LIB_Krnl_Base_Concepts.ts        → +defaultConnectionBehaviour enum (allow_unlisted|ask_key_unlisted|forbid_unlisted)
//   K_LIB_Krnl_Functionality_Types.ts  → +accessPolicy field, +accessKey field, +checkAccess(), execute() gate block
//   K_ENT_Krnl_System_Entity_Base.ts   → +addInternalEndpoint(), +addExternalEndpoint()
//   K_LIB_Krnl_System_Unified_Http_Adapter.ts → callerPort+accessKey injected into call opts from HTTP request
//   index.ts                           → +export * from "./types.js"
// Behaviour:
//   checkAccess(p, k):
//     p ∈ forbid          → REJECT "explicitly forbidden"
//     p ∈ allow           → PASS
//     p ∈ allow_with_key  → key match ? PASS : REJECT "key required"
//     unlisted            → default_connection_behaviour(p, k)
//   callerPort = req.socket.remotePort  (HTTP); absent on in-memory calls → gate skipped (trusted path)
//   accessKey  = req.headers['x-krnl-access-key']

// v2.3.0 — PORT SNAPSHOT FILE + GRACEFUL SHUTDOWN (2026-05-29)
// Added persistent port snapshot file, startup port audit, and graceful shutdown sequence.
// Files changed:
//   K_ENT_Krnl_System_Entity_Base.ts:
//     + import fs, path, fileURLToPath
//     + options.sourcePath constructor param → resolves _entityDataDir (default: process.cwd())
//     + _shuttingDown: boolean field (re-entry guard)
//     + _getPortsFilePath()  → {_entityDataDir}/{entityName}.ports.json
//     + _writePortsFile()    → fire-and-forget JSON write; shape: { entity, timestamp, ports }
//                              called on: registerPort(), unregisterPort(), _startSharedServer() listen
//     + _deletePortsFile()   → unlink on shutdown
//     + gracefulShutdown({ timeoutMs=10000 }):
//         1. _shuttingDown guard
//         2. getAllOwnedComponentEntities() → gracefulShutdown() | dispose() in parallel
//         3. Promise.race(allSettled, timeout)
//         4. _deletePortsFile()
//         5. dispose()
//         6. process.exit(0) after 100ms
//     + _startSharedServer: after listen → log port registry + _writePortsFile()
//     + _setupBaseFunctionalities: +shutdown endpoint (shutdownApi)
//     + bindProcessSignals: SIGINT/SIGTERM/uncaughtException/unhandledRejection → gracefulShutdown()
//   K_LIB_Krnl_System_Base_Functionality_APIs.ts:
//     + shutdownApi(entity) → responds immediately, fires gracefulShutdown after 200ms

// Port snapshot file usage:
//   Pass options.sourcePath = import.meta.url in the assembler:
//     const system = new MySystem('AppName', null, 10099, '0.0.0.0', { sourcePath: import.meta.url });
//   Written to: {assembler_directory}/AppName.ports.json
//   Shape: { entity: string, timestamp: ISO8601, ports: Record<serviceName, port> }
//   Deleted on: gracefulShutdown() completion

// Shutdown endpoint usage:
//   POST /call/shutdown  { timeoutMs?: number }
//   → { status: 'acknowledged', message, entity, timeoutMs }
//   Server shuts down 200ms after response.
