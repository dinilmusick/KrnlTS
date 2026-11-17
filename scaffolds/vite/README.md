# MyApp (Skipo Fullstack Vite Scaffold)

> **FOR DEVELOPERS & AI CODING AGENTS**:
> Read [**`SCAFFOLD_GUIDE.md`**](./SCAFFOLD_GUIDE.md) before writing code.
> Authentication, Neon Database, Cloud Storage, p-queue scheduling, UI Primitives, BottomStrip Hover Inspection, and React Flow Node Graph are **ALREADY SOLVED AND WIRED**. Do not re-invent them.

---

## 1. First Step: Rename This Application

Run the automated renaming engine to customize all identifiers (`MyApp`, `my-app`, `MY_APP`, `AppBackend`) across the repository in one command:

```bash
python3 Skipo/scripts/rename_app.py "YourAppName"
```

---

## 2. What Is Pre-Wired & Ready To Use

- **UI Primitives (`src/frontend/components/ui/index.ts`)**:
  `BaseButton`, `BaseInput`, `BaseSelect`, `BaseToggle`, `BaseBadge`, `BaseCard`, `ModalContainer`, `PanelContainer`, `PageContainer`, `ConfirmDialog`, `StatusIndicator`, `LoadingOverlay`, etc.
  *(NEVER write raw `<button>` or `<input>`, and never use hardcoded hex colors).*
- **Dynamic BottomStrip (`src/frontend/components/bottom-strip/BottomStrip.tsx`)**:
  Pre-mounted at the bottom. Add `data-skipo-label="..."` (max 4 words) and `data-skipo-desc="..."` (revealed on holding **`D`** key) to any interactive element.
- **NodeGraph Suite (`src/frontend/components/nodegraph/`)**:
  Full React Flow canvas with wheel zoom, middle-click pan, Space-drag, marquee box selection, and full hotkey matrix (`Del`, `Cmd+Z`, `Cmd+Y`, `Cmd+C`, `Cmd+V`, `Cmd+A`, `0` origin).
- **Background Execution Queue (`src/backend/queue/commandQueue.ts`)**:
  In-process p-queue scheduler with bounded concurrency and retry handling; queue state is volatile and process-local. Dispatched via `apiClient.dispatchCommand(type, payload)`.
- **Zod Validation (`src/libraries/validation/schemas.ts`)**:
  Boundary validation and formatted error responses (`formatZodError`).
- **Unified Neon Database (`src/backend/services/core/unifiedDb.ts`)**:
  Isomorphic serverless HTTP driver running identically on Node.js and Cloudflare Workers (Law L23).
- **Universal Cloud Storage (`src/backend/services/core/storageCore.ts`)**:
  S3, Backblaze B2, and Supabase storage connection management.
- **Authentication Core (`src/backend/services/core/authCore.ts`)**:
  Pre-built login/register UI in `src/frontend/components/auth/UserAuthPage/`.

---

## 3. Running & Building the App

```bash
# 1. Install dependencies
npm install

# 2. Start local development
npm run dev

# 3. Build the shared Fetch application and provider adapters
npm run build

# 4. Start the generated Node.js deployment
npm start
```

The canonical application handler is `src/app.ts`. Cloudflare, Vercel Edge, and Node adapters delegate to that same handler. Configure provider secrets in the hosting platform; do not add credentials to the generated manifest.

Run `python3 checklists/full_system_validator.py .` for architectural validation.
