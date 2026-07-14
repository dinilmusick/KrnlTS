---
name: krnlts-utility-tools
description: Reference for the built-in utility kit including KrnlFS, KrnlShell, KrnlEnv, AsyncKit, and KrnlHTTP.
---

# KrnlTS Utility Tools Kit (`krnlts`)

To avoid importing redundant packages (like `fs-extra`, `shelljs`, `dotenv`, or `lodash`) in logic submodules, all downstream systems must leverage the built-in utility classes exported by `krnlts`.

## Discovered Utilities

### 1. Filesystem (`KrnlFS`)
Provides safe, atomic file manipulations and mutual exclusions.
```typescript
import { KrnlFS } from "krnlts";

// Write file atomically (guarantees write completeness)
await KrnlFS.writeFileAtomic("path/to/file.json", JSON.stringify(data));

// Safe deep-merge update of a JSON file
const merged = await KrnlFS.updateJSON("settings.json", { theme: "light" });

// File-locking mutex to protect shared resources
const release = await KrnlFS.acquireFileLock("data.lock");
try {
  // Critical section
} finally {
  release(); // Always release lock in finally block
}
```

### 2. Environment & Shell (`KrnlEnv` & `KrnlShell`)
```typescript
import { KrnlEnv, KrnlShell } from "krnlts";

// Load .env files and extract validated environment objects via Zod
KrnlEnv.load(".env");
const env = KrnlEnv.schema(z.object({
  PORT: z.coerce.number().default(3000),
  DB_PATH: z.string()
}));

// Safe shell command execution
const { stdout } = await KrnlShell.exec("git rev-parse --abrev-ref HEAD");
// Dynamic background process spawn
const handle = KrnlShell.spawn("npm", ["run", "watch"]);
```

### 3. Concurrency (`AsyncKit`)
```typescript
import { AsyncKit } from "krnlts";

// Concurrency-limited execution (like p-limit)
const tasks = [() => download(1), () => download(2)];
const limitResults = await AsyncKit.pLimit(tasks, 2);

// Timeouts
const result = await AsyncKit.withTimeout(fetchData(), 5000, "Fetch timeout");
```

### 4. Interpolation & Merger (`ObjectKit` & `StringKit`)
```typescript
import { ObjectKit, StringKit } from "krnlts";

const cloned = ObjectKit.deepClone(complexObj); // Handles circular refs, Dates, etc.
const merged = ObjectKit.deepMerge(target, source); // Recursive deep merge

const slug = StringKit.toSlug("My Title Here"); // -> "my-title-here"
const text = StringKit.interpolate("Hello {{user}}", { user: "Dinil" });
```

### 5. Caching & HTTP clients (`CacheKit` & `KrnlHTTP`)
```typescript
import { CacheKit, KrnlHTTP } from "krnlts";

const cache = new TTLCache(30000); // 30s TTL
// Stale-While-Revalidate wrapper
const freshData = await CacheKit.swr(cache, "api-key", () => fetchFresh());

const client = KrnlHTTP.createClient("https://api.myapp.com", { "Authorization": "token" });
const sseStream = KrnlHTTP.streamResponse("https://api.myapp.com/sse");
```
