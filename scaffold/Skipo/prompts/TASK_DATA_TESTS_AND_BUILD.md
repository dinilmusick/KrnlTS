# TASK: DATA_TESTS_AND_BUILD_ENFORCEMENT

$$\text{Valid}(\mathcal{P}) \iff \text{ZeroMock}(\mathcal{P}) \wedge \text{TestParity}(\mathcal{P}) \wedge \text{AppArchSpec}(\mathcal{P}) \wedge \text{MultiTargetBuild}(\mathcal{P}) \wedge \text{ServerlessBudget}(\mathcal{P}) \wedge \text{ExitCode}(\text{Validator}) = 0$$

> **EXCLUSIVE SCOPE**: This prompt owns **real-data enforcement (Aspect 05), test coverage (Aspect 09), 4-plane app architecture spec (Aspect 10), multi-target build spec (Aspect 11), and serverless size limits (Aspect 12)**. UI, structure planes, and auth are handled by their own domain prompts.
>
> **Validators**:
> ```bash
> python3 assistant.py validate . --aspect aspect_05   # Real data
> python3 assistant.py validate . --aspect aspect_09   # Tests
> python3 assistant.py validate . --aspect aspect_10   # App architecture spec
> python3 assistant.py validate . --aspect aspect_11   # Multi-target build
> python3 assistant.py validate . --aspect aspect_12   # Serverless limits
> ```
>
> **INVIOLABLE MANDATE: ZERO-TRACE LEGACY PURGE ($\mathbf{L_{21}}$)**:
> Completely purge any competing legacy build scripts, mock data generators/fixtures (`fixtures/mockData.ts`), ad-hoc test helpers that produce fake data, or legacy packaging pipelines. Leave zero trace behind. Applications must exclusively consume real data/empty states, canonical test suites, and Skipo multi-target build specifications.

---

## 0. MANDATORY FIRST STEP — INGEST & AUDIT

Run all five validators to see the full current violation list:

```bash
python3 assistant.py validate . --aspect aspect_05
python3 assistant.py validate . --aspect aspect_09
python3 assistant.py validate . --aspect aspect_10
python3 assistant.py validate . --aspect aspect_11
python3 assistant.py validate . --aspect aspect_12
```

Then read the relevant architecture specs:
```
architecture/app-architecture-spec/SKILL.md
architecture/multi-target-build-spec/SKILL.md
```

---

## 1. REAL DATA & ANTI-MOCK (Aspect 05)

**VIOLATION PATTERNS** — grep for these and eliminate every occurrence:

```bash
grep -rn '"placeholder"\|"lorem ipsum"\|"mock"\|"dummy"\|"sample item"\|"test user"' \
  src/ packages/ --include="*.ts" --include="*.tsx"
```

**BANNED** (any of these in production code is a hard failure):
- Hardcoded fake arrays: `[{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }]`
- String tokens: `"placeholder"`, `"lorem ipsum"`, `"mock data"`, `"dummy"`, `"sample"`
- Fake telemetry: `Math.random() * 100` fed to charts or dashboards
- Static fake user lists masquerading as real data

**MANDATORY REPLACEMENT PATTERN**:

```tsx
// ❌ BANNED — fake data
const items = [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }];

// ✅ CORRECT — real backend call with EmptyState fallback
const { data: items, isLoading } = useWorkspaceItems(workspaceId);
if (!items || items.length === 0) return <EmptyState message="No items yet" action="Create your first item" />;
```

**Rule**: When real data is unavailable at runtime (unconfigured env, empty workspace), render `<EmptyState>` from `@skipo/ui` with a configuration action — NEVER synthesize fake entries.

**Validator**:
```bash
python3 assistant.py validate . --aspect aspect_05
```

---

## 2. TEST COVERAGE INTEGRITY (Aspect 09)

Every feature module must have a companion test file. The test must contain real assertions.

### 2.1 Coverage Invariant

Every file matching `src/**/*.service.ts`, `src/**/*.store.ts`, `src/**/*Service.ts`, `packages/*/src/**/*.ts` MUST have a corresponding `*.test.ts` or `*.test.tsx` file in the same directory or in `__tests__/`.

**Detection** — list modules missing tests:
```bash
python3 assistant.py validate . --aspect aspect_09 --verbose
```

**Generation** — scaffold companion test suite:
```bash
python3 assistant.py generate test <target_dir> --name <ModuleName>
```

### 2.2 Anti-Test-Stub Rule

**BANNED test patterns**:
```ts
expect(true).toBe(true);          // ❌ trivial no-op
it('should work', () => {});      // ❌ empty body
expect(component).toBeTruthy();   // ❌ vacuous assertion
```

**MANDATORY test pattern**:
```ts
import { describe, it, expect, vi } from 'vitest';
import { WorkspaceFileStorageAdapter } from '../WorkspaceFileStorageAdapter_Pure';

describe('WorkspaceFileStorageAdapter', () => {
  it('writes and reads a file round-trip', async () => {
    const adapter = new WorkspaceFileStorageAdapter({ root: '/tmp/test' });
    await adapter.write('doc.json', JSON.stringify({ title: 'Test' }));
    const content = await adapter.read('doc.json');
    expect(JSON.parse(content).title).toBe('Test');
  });
});
```

Rules:
- Every test file: minimum 2 `it()` blocks with real non-trivial assertions.
- Use `vi.fn()` mocks only for external I/O (network, fs), never to avoid testing logic.
- All test files must pass: `pnpm test`

**Validator**:
```bash
python3 assistant.py validate . --aspect aspect_09
pnpm test
```

---

## 3. APP ARCHITECTURE SPEC — 4-PLANE STRUCTURE (Aspect 10)

Every sub-application in the workspace must conform to the canonical 4-plane directory structure.

### 3.1 Canonical 4-Plane Layout

```
<AppName>/
├── src/
│   ├── frontend/          ← React components, pages, layout shell
│   │   ├── components/
│   │   ├── pages/
│   │   └── shell/
│   ├── backend/           ← API routes, services, orchestrations
│   │   ├── api/
│   │   ├── services/
│   │   └── adapters/
│   ├── libraries/         ← Synchronized Skipo base assets (read-only)
│   │   └── skipo/
│   └── frontend-state/    ← Zustand stores, React contexts
│       └── stores/
├── <AppName>.ts           ← Single facade entrypoint (re-exports only)
└── package.json
```

**Scaffold** a missing 4-plane structure:
```bash
python3 assistant.py generate app-structure <path> --name <AppName>
```

### 3.2 Single Facade Entrypoint

Every app must expose one clean facade file `<AppName>.ts` at its root that re-exports the public API — zero business logic inside it. Any logic inside the facade is a violation.

### 3.3 Root Preservation

The app root directory itself must not be deleted or restructured. Only its `src/` contents are in scope for plane reorganization.

**Validator**:
```bash
python3 assistant.py validate . --aspect aspect_10
```

---

## 4. MULTI-TARGET BUILD SPEC (Aspect 11)

Every app that exposes API routes must support two build targets: `fullstack` and `api`.

### 4.1 Required Files

```
src/backend/adapters/httpsAdapter.ts    ← Protocol adapter (REQUIRED)
fullstack.json                          ← Fullstack build manifest
api.json                                ← API-only build manifest
```

### 4.2 `httpsAdapter.ts` Contract

The HTTPS adapter must implement the `ProtocolAdapter` interface and be the sole file that handles the mapping from HTTP request → backend handler → HTTP response. Zero framework-specific code may leak into service layer files.

```ts
// src/backend/adapters/httpsAdapter.ts
import type { ProtocolAdapter } from '@skipo/backend/adapters';

export const httpsAdapter: ProtocolAdapter = {
  async handle(request, handler) {
    const result = await handler(request);
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { 'Content-Type': 'application/json', ...result.headers },
    });
  },
};
```

### 4.3 Build Manifests

```json
// fullstack.json
{
  "target": "fullstack",
  "entrypoints": ["src/frontend/pages/index.tsx", "src/backend/api/**/*.ts"],
  "output": "dist/fullstack"
}

// api.json
{
  "target": "api",
  "entrypoints": ["src/backend/api/**/*.ts"],
  "output": "dist/api"
}
```

**Scaffold** multi-target build files:
```bash
python3 assistant.py generate build <path> --name <AppName>
```

**Validator**:
```bash
python3 assistant.py validate . --aspect aspect_11
```

---

## 5. SERVERLESS DEPLOYMENT SIZE LIMITS (Aspect 12)

Every Next.js application must stay inside the serverless budget.

### 5.1 Required `next.config` Setting

```js
// next.config.mjs
const nextConfig = {
  output: 'standalone',    // ← REQUIRED — enables serverless-compatible build
};
export default nextConfig;
```

**HARD RULE**: `output: 'standalone'` must be present. Missing it is a blocking validator error.

### 5.2 Bundle Size Limits

| Tier | Max Bundle Size |
|:-----|:----------------|
| Vercel Hobby | 50 MB per serverless function |
| Vercel Pro | 250 MB per serverless function |

**Detection** — measure current bundle:
```bash
pnpm build
du -sh .next/standalone/
```

### 5.3 Media in API Routes — BANNED

API routes (`/api/**`) must NEVER serve, proxy, or buffer media files (images, video, audio). All media must be served via direct CDN/presigned URLs from the storage layer.

**Detection**:
```bash
grep -rn "readFileSync\|createReadStream\|Buffer.from\|pipe(" src/app/api/ src/pages/api/ --include="*.ts"
```

Any hit that involves a media buffer is a violation.

### 5.4 devDependencies Isolation

Build tooling (`typescript`, `@types/*`, `eslint`, `vitest`, `tsup`) must be in `devDependencies`, never in `dependencies`. Bundling dev tools into the serverless function bloats the bundle.

**Detection**:
```bash
python3 assistant.py validate . --aspect aspect_12 --verbose
```

---

## 6. EXIT GATE — MANDATORY BEFORE DECLARING DONE

All five aspects must pass before you declare this task complete:

```bash
# Run all five aspects
python3 assistant.py validate . --aspect aspect_05
python3 assistant.py validate . --aspect aspect_09
python3 assistant.py validate . --aspect aspect_10
python3 assistant.py validate . --aspect aspect_11
python3 assistant.py validate . --aspect aspect_12

# Or run the full validator (all 12 aspects at once)
python3 assistant.py validate .

# Tests must pass
pnpm test

# TypeScript must be clean
pnpm typecheck
```

Output the scorecard and test results as evidence. If any aspect fails, fix the violations in that section and re-run.

---

## HOW TO USE THIS PROMPT

Paste the full contents of this file as the opening message to any coding agent working on the Skipo codebase. The agent should:

1. Run all five aspect validators listed in Section 0 and read the violation report.
2. Work through Sections 1–5 in order, fixing each violation class.
3. Re-run the targeted aspect validator after completing each section.
4. Finish only when all five aspects pass and `pnpm test` exits 0.
