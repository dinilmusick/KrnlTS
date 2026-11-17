---
name: sub-app-engine-guidelines
description: Directives for authoring self-contained application engines that are 100% drag-and-drop compatible with the KrnlTS Sub-App System.
---

# SUB-APP ENGINE AUTHORING (DENSE)

$$\text{SubApp} = \langle \text{CoreEngine}, \text{Operations}, \text{register.ts}, \text{subapp.json}, \text{UI} \rangle$$
$$\text{ZeroServer}: \text{SubApp} \cap \{\text{http.createServer}, \text{express}, \text{listen}\} = \emptyset$$

## 1. DIRECTORY TOPOLOGY

```
<engine-app>/
├── subapp.json         --> Manifest (name, entry, dependencies, UI route)
├── register.ts         --> Entrypoint: export function register(context): SubAppRegistration
├── engine/CoreEngine.ts--> Pure domain logic & state (zero transport/IO bindings)
├── operations/*.ts     --> Transport-agnostic handlers (Zod input/output schemas)
└── ui/App.tsx          --> Embedded frontend (mounts at routePrefix)
```

## 2. CANONICAL MANIFEST (`subapp.json`)

```json
{
  "name": "DataAnalyticsEngine",
  "version": "1.0.0",
  "registrationEntry": "./register.ts",
  "dependencies": { "zod": "^3.22.4" },
  "ui": { "title": "Analytics", "entryPath": "./ui/index.html", "routePrefix": "/analytics" }
}
```

## 3. REGISTRATION ENTRYPOINT (`register.ts`)

```typescript
import { z } from "zod";
import type { SubAppRegistrationContext, SubAppRegistration } from "@ultrst-armada/krnl";
import { CoreEngine } from "./engine/CoreEngine.js";

export function register(context: SubAppRegistrationContext): SubAppRegistration {
  const engine = new CoreEngine();
  return {
    name: "DataAnalyticsEngine",
    operations: [
      {
        name: "calculate",
        input: z.object({ value: z.number() }),
        output: z.object({ result: z.number() }),
        handler: async ({ input }) => ({ result: engine.compute(input.value) })
      }
    ]
  };
}
```

## 4. CHECKLIST GATE
`python3 checklists/01_structure_governance.py .` && `python3 checklists/06_anti_stub_asset_depth.py .`
