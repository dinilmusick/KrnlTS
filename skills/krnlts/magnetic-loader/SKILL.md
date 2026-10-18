---
name: krnlts-magnetic-loader
description: Directives for KrnlMagneticLoader auto-discovery, manifest aggregation, and boot order invariants.
---

# KRNLTS MAGNETIC LOADER

## 1. AUTOMATIC FILESYSTEM DISCOVERY (`KrnlMagneticLoader`)
```typescript
import { KrnlMagneticLoader } from "@ultrst-armada/krnl";

// Discovers shared src/functionalities/ and protocol_adapters/ for flat entities
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

## 3. WORKSPACE MANIFEST AGGREGATION
```typescript
const requirements = rootEntity.getWorkspaceRequirements();
// Yields aggregated npm dependencies, build requirements, and conflicts:
// { dependencies: Record<string, string>, conflicts: Array<{ package, versions }> }
```
If `conflicts.length > 0`, workspace materialization halts to prevent dependency corruption.
