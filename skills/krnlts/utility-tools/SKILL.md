---
name: krnlts-utility-tools
description: Directives for KrnlTS utility tools suite including KrnlFS, KrnlEnv, KrnlShell, AsyncKit, ObjectKit, and CacheKit.
---

# KRNLTS UTILITY TOOLS SUITE (`@dinilmusick/krnlts`)

Always leverage built-in Krnl-Tools instead of importing ad-hoc npm packages for standard operations:

---

## 1. `KrnlFS` (Atomic Filesystem & File Locks)
```typescript
import { KrnlFS } from "@dinilmusick/krnlts";

// Safe atomic file read/write
await KrnlFS.writeJsonAtomic("data.json", { counter: 1 });
const data = await KrnlFS.readJson("data.json");

// Mutex-based file lock for concurrency safety
const release = await KrnlFS.acquireFileLock("data.json");
try {
  // critical section
} finally {
  await release();
}
```

---

## 2. `KrnlEnv` (Type-Safe Environment Variables)
```typescript
import { KrnlEnv } from "@dinilmusick/krnlts";
import { z } from "zod";

const config = KrnlEnv.loadAndValidate({
  PORT: z.string().transform(Number).default("8080"),
  API_KEY: z.string().min(1)
});
```

---

## 3. `AsyncKit`, `ObjectKit`, `CacheKit`
- **`AsyncKit.pLimit(concurrency)`**: High-performance concurrency limiter.
- **`AsyncKit.timeout(promise, ms)`**: Task timeout wrapper.
- **`ObjectKit.deepClone(obj)`**: Ultra-fast structured clone.
- **`CacheKit.createTTL(ttlMs)`**: In-memory caching with automatic eviction.
