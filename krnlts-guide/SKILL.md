---
name: krnlts-guide
description: >-
  Guides agents in using the KrnlTS library correctly, detailing structural conventions, import restrictions, local/remote bubbling policies, utility tools, and port-based access control.
---

# KrnlTS Development & Architecture Reference

This guide defines the strict architectural and quality requirements for any project managed by or compatible with KrnlTS/KrnlJS.

## Overview
KrnlTS structures applications around an Atomic Entity Model where logic is isolated, discoverable, and promoted dynamically up the hierarchy. 

## Structural Conventions

### Project Directory Structure
All KrnlTS projects must follow this nested directory layout:
```
ROOT/
├── doc.md -> Root documentation
├── src/ -> Canonical source files (.ts/esm)
├── libraries/ -> Project-local submodules (NO external npm packages allowed here)
├── entities/ -> Child nested orchestrators & component entities
│   └── MyEntity/
│       ├── functionalities/ -> Encapsulated logic atoms
│       │   └── StockUpdate/
│       │       ├── StockUpdateAtom.js -> Configuration/metadata descriptor
│       │       ├── main_function/
│       │       │   └── logic.js -> Core functionality implementation (export const main = ...)
│       │       ├── state_data/
│       │       │   └── state.js -> Initial state configuration (export const initialState = ...)
│       │       └── helpers/ -> Supplemental private helper utilities
│       └── MyEntity.js -> Composition assembler file
└── assembler.js -> System entrypoint extending krnlSystemEntityBase
```

### Import Restrictions
- **Descriptor Files** (`Entity.js`, `Func.js`, `StockUpdateAtom.js`): Strictly declarative configuration only. No library imports.
- **Logic Files** (`logic.js`): May contain helper and library imports.
- **Strict File Extensions**: All internal import extensions **MUST** specify `.js` (never `.ts`) to ensure clean ES resolution.

### Bubbling & Visibility Policies
- Local functionalities bubble up to their owning entity automatically if configured with `visibility = 'public'`. Sibling entities can call these without manual `addRemote` mappings.
- Unified protocols (HTTP, SSE, MCP, and manifest) automatically resolve remote proxies to source metadata.

---

## Krnl-Tools Integration Guide

The foundational primitives are exported under the `krnlts` namespace:
```typescript
import { 
  KrnlFS, 
  KrnlEnv, 
  KrnlShell, 
  AsyncKit, 
  StringKit, 
  ObjectKit, 
  CacheKit, 
  KrnlHTTP, 
  GitManager 
} from "krnlts";
```

### 1. Safe Filesystem (`KrnlFS`)
Provides atomic, corruption-proof filesystem updates and safe configurations.
```typescript
// Atomic write
await KrnlFS.writeFileAtomic("path/file.txt", "data");

// Deep-merge JSON file safely
const updated = await KrnlFS.updateJSON("user.json", { preferences: { dark: true } });

// Coop promise-based file lock mutex
const release = await KrnlFS.acquireFileLock("file.txt");
try {
  // critical section
} finally {
  release();
}
```

### 2. Environment and System Control (`KrnlEnv` & `KrnlShell`)
```typescript
// Type-safe Zod schema validation for environment configuration
KrnlEnv.load(".env");
const config = KrnlEnv.schema(z.object({ PORT: z.coerce.number().default(8080) }));

// Safe shell execution and spawns
const { stdout } = await KrnlShell.exec("git status");
const processHandle = KrnlShell.spawn("node", ["server.js"]);
const actualBin = KrnlShell.which("node");
```

### 3. Flows & Controls (`AsyncKit`)
```typescript
await AsyncKit.sleep(500);
const res = await AsyncKit.withTimeout(fetchData(), 5000, "FetchTask");
const results = await AsyncKit.pLimit([() => task1(), () => task2()], 2); // Limit concurrency
```

### 4. Utilities (`ObjectKit` & `StringKit`)
```typescript
const cloned = ObjectKit.deepClone(obj); // Deep clones, handles Dates, Regexes, circular refs
const merged = ObjectKit.deepMerge(base, override); // Recursive deep merge
const camel = StringKit.toCamelCase("my-entity-name"); // camel, pascal, snake, kebab, slug
const interpolated = StringKit.interpolate("Hello {{name}}", { name: "Dinil" });
```

### 5. Caching & Clients (`CacheKit` & `KrnlHTTP`)
```typescript
const cache = new TTLCache(60000);
const data = await CacheKit.swr(cache, "key", () => fetchFresh()); // Stale-While-Revalidate

const client = KrnlHTTP.createClient("https://api.example.com", { "Authorization": "Bearer token" });
const sseStream = KrnlHTTP.streamResponse("https://api.example.com/stream");
```

---

## System Entity Features

### 1. Port Registry
`krnlSystemEntityBase` maintains a registry of services and ports. The standard system port `_krnl_system` represents `commPort` pre-registered at construction.
```typescript
system.registerPort('auth-service', 3001);
system.registerPort('worker-service', 3002);
system.unregisterPort('worker-service');

const ports = system.getRegisteredPorts(); // -> { _krnl_system: 10099, 'auth-service': 3001 }
```

### 2. Endpoint Access Control
Endpoints support port-based access check gates using `KrnlEndpointAccessPolicy`:
- `allow: number[]`: Ports that bypass access checks.
- `allow_with_key: number[]`: Ports requiring header key matching.
- `forbid: number[]`: Ports explicitly blocked.
- `default_connection_behaviour`: Decides policy for unlisted ports (`allow_unlisted`, `ask_key_unlisted`, `forbid_unlisted`).

```typescript
// Internal Endpoint - restricted to registered service ports
system.addInternalEndpoint({
  id: 'internalSync',
  api: async (input) => { /* internal microservice logic */ }
});

// External Endpoint - open (free) or keyed
system.addExternalEndpoint({
  id: 'publicStatus',
  api: async () => ({ status: 'ok' })
}, 'free');

system.addExternalEndpoint({
  id: 'sensitiveData',
  api: async (input) => { /* restricted logic */ }
}, 'keyed', 'my-secret-key');
```

### 3. Ingress Network (Zero-Port Microservices)
The Ingress Network architecture allows multiple system entities to share a single externally-visible OS port hosted by an admin gateway entity. Sub-services (members) run in-process without port conflicts (assigned sentinel port `-1` in the port registry).

#### Ingress Assembler Pattern
Use `startIngressNetwork` on the admin entity to assemble microservices under prefixes:
```typescript
import { AdminSystem } from "./admin.js";
import { AuthService } from "../services/AuthService/AuthService.js";
import { DataService } from "../services/DataService/DataService.js";

export async function assembleNetwork(port = 10099, host = "0.0.0.0") {
    const admin = new AdminSystem(port, { host });
    
    // Map service classes to prefix paths
    await admin.startIngressNetwork([
        { ServiceClass: AuthService, prefix: "auth" },
        { ServiceClass: DataService, prefix: "data" }
    ]);
    
    return admin;
}
```

#### Routing & Aggregation Protocol
1. **REST Endpoints**: Routed automatically via path-prefixes: `http://<admin-host>:<port>/<prefix>/call/<fid>`
2. **Gross Manifest**: GET `/manifest` on the admin port returns dynamic URLs mapping member prefixes to their local manifests.
3. **MCP Aggregation**: Central `/mcp` endpoint namespaces all public member tools as `<prefix>.<toolName>` (e.g. `auth.login`).
4. **WS RPC Routing**: Specify `target` parameter in WebSocket RPC payloads to route requests:
```json
{
  "kind": "rpc-request",
  "requestId": "req-1",
  "method": "call",
  "params": {
    "target": "auth",
    "fid": "heartbeat",
    "data": {}
  }
}
```

---

## Default Frontend System

Every KrnlTS system entity can host a **self-contained, dynamically generated single-page application (SPA)** on the same port, reflecting its registered functionalities and sub-apps.

### 1. Opt-In Folder Convention
- If a `frontend/` directory is present in the root folder of an application, the `KrnlMagneticLoader` automatically calls `entity.enableFrontend(options)`.
- A configuration file `frontend/krnl-frontend.json` can be created to customize the title and theme:
  ```json
  {
    "title": "My Custom Dashboard",
    "theme": "dark"
  }
  ```

### 2. Served HTTP Routes
The frontend UI and APIs are exposed on the system entity's own port:
- `GET /frontend`: Serves the HTML SPA client.
- `GET /frontend/manifest.json`: Serves the functionality metadata and ingress sub-app links.
- `GET /frontend/history`: Serves the list of the last 50 user interactions triggered through the frontend API.
- `GET /frontend/api/{fid}`: Proxy route for GET endpoints (with monitoring).
- `POST /frontend/api/{fid}`: Proxy route for POST endpoints (with monitoring).
- `GET /frontend/sse/{fid}`: SSE bridge to stream events from functionality `state:changed`.

### 3. Monitoring-Aware Interaction Bubbling
When a user calls an endpoint through `/frontend/api/{fid}`, the unified adapter executes the functionality and:
1. Emits a `frontend:interaction` event to the functionality's `state:changed` event stream.
2. Appends the event to the in-memory history log.

---

## Common Mistakes & Guidance Rules

> [!CAUTION] **HALT AND ASK RULE**
> If you encounter a situation, routing challenge, or architectural pattern not explicitly covered in this guide (e.g. custom IPC transport configurations, external database hookups), **DO NOT guess**. Halt execution and ask the user for guidance.

- **Missing `.js` imports**: Forgetting to add `.js` at the end of ES modules imports is the most common cause of build/runtime resolution failure.
- **Importing logic in descriptors**: Writing non-declarative functions or importing code libraries in descriptor configuration files (`Atom.js`, `Entity.js`) violates strict ecosystem validation constraints.

### ⚠️ CRITICAL: Main Function Context Destructuring

All KrnlTS `main` functions receive their execution context as the **second argument**. The entity instance is passed under the key `entity`, **not** `system`. Always destructure as `{ state, entity: system }` (aliasing `entity` to `system` for convenience).

```typescript
// ✅ CORRECT — entity is the live KrnlTS entity instance
export const main = async (input: any, { state, entity: system }: any) => {
    const port = system?.commPort; // works
};

// ❌ WRONG — system will be undefined, silently breaking port/context reads
export const main = async (input: any, { state, system }: any) => {
    const port = system?.commPort; // always undefined!
};
```

> [!WARNING] This is a **silent failure** — TypeScript will not warn you. `system` will be `undefined` at runtime and all reads on it return `undefined`, causing fallback to default values.

### ⚠️ Ingress Member Port Identity

When an entity runs as an **ingress network member** (registered via `startIngressNetwork`), its `commPort` equals the **port passed in the ingress config**, NOT the parent admin entity's port. The `hierarchyManager.owner` link is **not set** for ingress members.

```typescript
// In Forge (port 10091), Crucible ingress config: { port: cruciblePort } where cruciblePort = forgePort + 10 = 10101
// Inside Crucible's main function:
export const main = async (input: any, { entity: system }: any) => {
    system.commPort;                              // → 10101 (Crucible's ingress port)
    system.hierarchyManager?.owner?.commPort;     // → undefined (owner not set for ingress members)
};
// Therefore: any registry lookup keyed by "Crucible's port" must use system.commPort (10101),
// not attempt to read the parent Forge's port.
```

---

## The Magnetic System (Dynamic Ingress & Zero-Boilerplate Imports)

KrnlTS incorporates a **Magnetic System** that dynamically scaffolds and imports assets, boots the Ingress Network, and integrates non-KrnlTS sub-apps.

### 1. Zero-Boilerplate Asset Loading (Phase 1)
At startup, `KrnlMagneticLoader` automatically scans:
- `./entities/`: Discovers child entities, instantiates them, and registers them.
- `./functionalities/`: Discovers logic atoms, helpers, and event handlers.
- **Context Scope Isolation**: Helper functions and events are dynamically attached to the thread context using `AsyncLocalStorage`. In logic scripts, they can be called globally (e.g., `format()`, `beginning()`) without writing `import` statements.

### 2. Auto Ingress Network & Non-KrnlTS Adapters (Phase 2)
If a `subapps/` folder is present:
- Ingress Network starts automatically on the host system entity.
- If a sub-app contains `assembler.js`, it is booted as a KrnlTS member.
- If a sub-app does not contain `assembler.js` (e.g., an Express app), `KrnlNonKrnlAppAdapter` dynamically spawns it in the background on a dynamic port and reverse-proxies its HTTP endpoints through the host's prefix path.

### 3. IDE Autocomplete Watcher
To enable editor autocompletion and prevent TypeScript errors for dynamically injected helper/event globals, run the watch binary:
```bash
npx krnlts-watch
```
This utility monitors the project folder and generates/updates `krnl-magnetic.d.ts` at the root, mapping all discovered helpers and events to the global scope.

