---
name: sub-app-engine-guidelines
description: Directives for authoring self-contained application engines that are 100% drag-and-drop compatible with the KrnlTS Sub-App System.
---

# KRNLTS DRAG-AND-DROP SUB-APP ENGINE AUTHORING GUIDELINES

This skill guides agents in crafting standalone applications and domain engines that are **100% drag-and-drop compatible** with the KrnlTS sub-app system.

When an application is authored according to these conventions, dropping its folder into any KrnlTS project's `subapps/` directory immediately mounts it as a first-class engine without writing any glue code.

---

## 1. CORE ARCHITECTURAL INVARIANTS

$$\text{SubApp Engine} = \{\text{Domain Core Logic}, \text{Declarative Operations}, \text{Self-Contained UI}, \text{Manifest}\}$$
$$\text{KrnlTS Host} = \{\text{Discovery}, \text{Port Gateway}, \text{Lifecycle}, \text{Flow Orchestration}, \text{MCP Bridge}\}$$

1. **Zero-Server Rule**: Sub-apps **NEVER** call `http.createServer()`, `express()`, `app.listen()`, or bind OS ports. The KrnlTS host entity provides unified HTTP (`/call/{fid}`), WebSocket RPC, and MCP tool gateways.
2. **Standard Registration Entrypoint**: The root of the sub-app contains a `register.ts` (or `src/register.ts`) exporting `register(context)`.
3. **Pure Operations (`OperationDefinition`)**: All exposed capabilities are transport-independent functions with explicit schemas and handlers.
4. **Standalone Engine Decoupling**: Core business logic resides in an isolated engine class/module (`EngineCore`), allowing the engine to be tested and executed standalone or wrapped inside KrnlTS.
5. **Dependency Declaration (`subapp.json`)**: All external npm dependencies are declared in `subapp.json` for deterministic host workspace aggregation.

---

## 2. DRAG-AND-DROP COMPATIBLE DIRECTORY LAYOUT

```
<my-engine-app>/
├── subapp.json                     → KrnlTS sub-app manifest (name, version, entry, UI spec)
├── package.json                    → Standalone npm package metadata & scripts
├── tsconfig.json                   → TypeScript configuration
├── register.ts                     → Registration entrypoint (exports register(context))
├── engine/                         → Pure business logic & state (transport-agnostic)
│   ├── CoreEngine.ts               → Main engine class / state manager
│   └── models/                     → Data structures and types
├── operations/                     → Transport-agnostic operation handlers
│   ├── calculateMetric.ts          → Individual operation with Zod schema & handler
│   └── processData.ts
├── ui/                             → Self-contained UI components (React/Vite/HTML)
│   ├── App.tsx
│   └── index.html
└── libraries/                      → Universal concept helpers ({Domain}Concepts.ts)
```

---

## 3. SUB-APP MANIFEST (`subapp.json`)

```json
{
  "name": "DataAnalyticsEngine",
  "version": "1.0.0",
  "description": "High-performance data analytics and computation engine",
  "registrationEntry": "./register.ts",
  "dependencies": {
    "zod": "^3.22.4"
  },
  "ui": {
    "title": "Data Analytics",
    "entryPath": "./ui/index.html",
    "icon": "analytics_icon.svg",
    "routePrefix": "/analytics"
  }
}
```

---

## 4. REGISTRATION ENTRYPOINT (`register.ts`)

```typescript
import { z } from "zod";
import type {
  SubAppRegistrationContext,
  SubAppRegistration,
  OperationDefinition
} from "@dinilmusick/krnlts";
import { CoreEngine } from "./engine/CoreEngine.js";

export function register(context: SubAppRegistrationContext): SubAppRegistration {
  context.logger?.log(`[SubApp] Initializing DataAnalyticsEngine on entity: ${context.entity?.id}`);

  // 1. Instantiate the pure standalone engine
  const engine = new CoreEngine();

  // 2. Define operations with explicit Zod schemas and handlers
  const operations: OperationDefinition[] = [
    {
      name: "processData",
      description: "Processes raw telemetry batch and computes statistical metrics",
      input: z.object({
        datasetId: z.string(),
        values: z.array(z.number())
      }),
      output: z.object({
        count: z.number(),
        mean: z.number(),
        variance: z.number()
      }),
      handler: async (input, ctx) => {
        return engine.computeStats(input.datasetId, input.values);
      },
      metadata: { category: "Analytics" }
    }
  ];

  // 3. Return the registration contract
  return {
    name: "DataAnalyticsEngine",
    operations,
    ui: {
      title: "Data Analytics",
      entryPath: "./ui/index.html"
    },
    onInitialize: async (ctx) => {
      // Access injected host services (e.g. runtime store or event bus)
      ctx.events.emit("analytics:ready", { timestamp: Date.now() });
    },
    onDispose: async () => {
      engine.cleanup();
    }
  };
}

export default register;
```

---

## 5. DRAG-AND-DROP MOUNTING IN KRNLTS APPS

When this app folder is dropped into a KrnlTS project:
```bash
# Simply drop or clone the app into subapps/
cp -R my-engine-app /path/to/krnl-app/subapps/DataAnalyticsEngine
```

At runtime:
1. `KrnlMagneticLoader.loadAll(rootEntity)` or `rootEntity.discoverSubApps()` discovers `subapps/DataAnalyticsEngine/subapp.json`.
2. Automatically wraps operations as qualified capabilities on the host entity:
   - `DataAnalyticsEngine.processData`
3. Automatically exposes HTTP REST endpoint: `POST /call/DataAnalyticsEngine.processData`.
4. Automatically exposes WebSocket RPC and MCP bridge tool.
5. Emits and subscribes to events through the unified host event bus without port collisions.
