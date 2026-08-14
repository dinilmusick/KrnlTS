# KrnlTS Framework

KrnlTS is the core protocol library for building atomic distributed entity systems, unified HTTP/WS/MCP/ACP servers, flows, and agentic orchestration endpoints.

---

## 🏛️ Architecture Overview

> **The Entity tree IS the kernel. UI aggregation, capability exposure, manifests, protocols, and flows are projections or behaviors of that tree — not parallel systems.**

### Four Core Rules

1.  **Filesystem is composition**:
    *   `functionalities/` → Atomic logic units
    *   `entities/` → Recursive child entities
    *   `protocol_adapters/` → Potential root server adapters
2.  **Functionality is the atomic unit**:
    *   Owns logic, state, helpers, events, UI spec, AI capability spec, and manifest.
    *   UI is authored strictly at the Functionality level.
3.  **Entity is composition + orchestration**:
    *   Owns local functionalities and child entities, controls bubbling, constructs Flows, and can occupy root position.
4.  **Root is a runtime position, not a type**:
    *   `Entity + no parent + adapters` → **ROOT** (adapters active, self-hosts servers).
    *   `Entity + parent` → **CHILD** (adapters dormant, capabilities bubble upward).

---

## 🚀 Quick Start

### 1. Build Framework
```bash
npm run build
```

### 2. Run Comprehensive Architecture Suite
```bash
node examples/test_gross_architecture.js
```

### 3. Run Master Example Suite
```bash
node examples/test_all_examples.js
```

---

## 💡 Code Example: Entity & Flows

```typescript
import { Entity, krnlUnifiedHttpAdapter } from "@dinilmusick/krnlts";

// 1. Instantiate Entity
const app = new Entity("MyApp");

// 2. Add Functionalities
app.addLocal({
  id: "validateUser",
  visibility: "public",
  api: async (user) => ({ valid: Boolean(user.name), user })
});

app.addLocal({
  id: "grantAccess",
  visibility: "public",
  api: async ({ user }) => ({ token: "jwt_abc_123", user })
});

app.addLocal({
  id: "denyAccess",
  visibility: "public",
  api: async () => ({ error: "Access Denied" })
});

// 3. Compose a Flow as a Functionality
app.flow("loginFlow")
  .then("validateUser")
  .branch((res) => res.valid, "grantAccess", "denyAccess")
  .register({
    visibility: "public",
    description: "User authentication and token issuance pipeline"
  });

// 4. Attach Protocol Adapter
app.attachAdapter(new krnlUnifiedHttpAdapter(app, 8080));

// 5. Finalize (activates server if root)
await app.finalize();
```
