---
name: krnlts-magnetic-loader
description: Directives for KrnlMagneticLoader auto-discovery, subapp execution modes (in-process vs worker), manifest aggregation, and boot order invariants.
---

# KRNLTS MAGNETIC LOADER & SUBAPP ENGINE

## 1. AUTOMATIC FILESYSTEM DISCOVERY (`KrnlMagneticLoader`)
```typescript
import { KrnlMagneticLoader } from "@dinilmusick/krnlts";

// Discovers shared src/functionalities/, protocol_adapters/, and subapps/ for flat entities
await KrnlMagneticLoader.loadAll(entity, import.meta.url);
```

- **Flat Discovery**: Shared functionalities are loaded from `src/functionalities/` and bound to the entity.
- **Entity Registration**: Every entity is registered into `KrnlEntityRegistry` during `loadAll()` to enable cross-entity orchestration.
- **Zero Nested Entities**: Nested `entities/` folders are prohibited; all entities reside directly in `src/` at the same level.

### Critical Boot Order Invariant:
```
RULE: ALL manual addLocal() calls with uiSpec MUST occur BEFORE KrnlMagneticLoader.loadAll().
WHY: loadAll() triggers frontend generation. Any late addLocal() calls are invisible to UI.
```

---

## 2. SUBAPP EXECUTION MODES (`krnl.json`)
Subapps configured in `krnl.json` can run in two distinct execution modes:
1. **`in-process` (Local Mode)**:
   - Runs directly in the host Node.js event loop.
   - Ideal for low-latency, tightly coupled services.
2. **`worker` (Worker Thread Mode)**:
   - Spawns in an isolated Node.js worker thread (`K_LIB_Krnl_SubApp_Worker_Host.js`).
   - Fault-isolated: errors in the subapp do not crash the host entity.

---

## 3. WORKSPACE MANIFEST AGGREGATION
```typescript
const requirements = rootEntity.getWorkspaceRequirements();
// Yields aggregated npm dependencies, build requirements, and conflicts:
// { dependencies: Record<string, string>, conflicts: Array<{ package, versions }> }
```
If `conflicts.length > 0`, workspace materialization halts to prevent dependency corruption.
