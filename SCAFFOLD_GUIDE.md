# SKIPO APPLICATION SCAFFOLD GUIDE
## Authoritative Developer & Coding Agent Reference Manual

> **ATTENTION CODING AGENT**: This application is built on top of the **Skipo Architecture Kernel**.
> All core features (Authentication, Neon DB, Cloud Storage, Workspaces, BullMQ Queue, UI Primitives, BottomStrip Hover Inspection, and React Flow Node Graph) are **ALREADY PRE-WIRED AND FULLY SOLVED**.
> **DO NOT RE-INVENT OR RE-IMPLEMENT THESE SYSTEMS USING CUSTOM CODE.**
> Focus 100% of your effort on writing the specific domain features of this application.

---

## 1. Quick Start: Renaming the App

Before writing any new domain code, rename the scaffold template name (`MyApp` / `my-app` / `MY_APP` / `AppBackend`) across all files in a single automated step:

```bash
python3 Skipo/scripts/rename_app.py "YourAppName"
```

This automatically updates `package.json`, `server.ts`, `wrangler.toml`, `index.html`, `metadata.json`, and renames `AppBackend.ts` to `YourAppNameBackend.ts`.

---

## 2. Pre-Wired Systems: What is Already Solved

| Feature / Subsystem | Pre-wired Solution | Where to Find It | How to Use |
|---|---|---|---|
| **UI Primitives & Base Classes** | `@skipo/ui` Barrel | `src/frontend/components/ui/index.ts` | `import { BaseButton, BaseInput, BaseCard, ModalContainer } from './ui';` |
| **Hover Inspection & Bottom Bar** | Canonical BottomStrip | `src/frontend/components/bottom-strip/BottomStrip.tsx` | Add `data-skipo-label="..."` and `data-skipo-desc="..."` to elements |
| **Visual Node Graph Suite** | React Flow Canvas + Full Controls | `src/frontend/components/nodegraph/` | `<NodeGraphView />` (mouse & keyboard controls enabled by default) |
| **Node Graph State & Undo/Redo** | Zustand Node Store | `src/frontend-state/nodeGraphStore.ts` | `useNodeGraphStore()` (undo, redo, clipboard, nodes, edges) |
| **Async Background Job Queue** | BullMQ with In-Memory fallback | `src/backend/queue/commandQueue.ts` | `apiClient.dispatchCommand(type, payload)` |
| **Zod Boundary Validation** | Zod Schemas & Error Formatter | `src/libraries/validation/schemas.ts` | `formatZodError(result.error)`, validate API inputs |
| **API Client Boundary** | Client Gateway | `src/libraries/client/apiClient.ts` | `apiClient.login()`, `apiClient.getWorkspaces()`, `apiClient.dispatchCommand()` |
| **User Authentication** | PBKDF2 / Bcrypt Core | `src/backend/services/core/authCore.ts` | Pre-built UI in `src/frontend/components/auth/UserAuthPage/` |
| **Isomorphic Database** | Neon Serverless Client | `src/backend/services/core/unifiedDb.ts` | `unifiedDb.query(sql, params)` (Node + Cloudflare Workers) |
| **Cloud Storage** | S3 / Backblaze / Supabase | `src/backend/services/core/storageCore.ts` | Pre-wired bucket and storage account operations |
| **Workspace Context** | Workspace Core & Zustand | `src/backend/services/core/workspaceCore.ts` | `useAppStore()` (`activeWorkspace`, `setWorkspaces`) |
| **Backend Facade** | Single Facade Pattern | `src/backend/AppBackend.ts` | `appBackend.services.auth`, `.workspace`, `.storage` |
| **Protocol Adapter** | Dual-Ingress Worker Adapter | `src/backend/adapters/httpsAdapter.ts` | Routes `/api/*` and serves UI via `env.ASSETS.fetch()` |

---

## 3. UI Primitives & Design Rules (DO NOT RE-INVENT)

All UI elements MUST be imported from `src/frontend/components/ui`:

```typescript
import {
  // Base Primitives (NEVER use raw <button>, <input>, <textarea>, <select>)
  BaseButton,
  BaseInput,
  BaseTextarea,
  BaseSelect,
  BaseCard,
  BaseBadge,
  BaseToggle,
  BaseTooltip,
  CredentialField,

  // Containers
  PageContainer,
  PanelContainer,
  SidebarContainer,
  DrawerContainer,
  TabContainer,
  SectionContainer,
  SplitContainer,
  ModalContainer,
  FloatingDetailsPanel,

  // Composite Primitives
  ConfirmDialog,
  IconOnlyButton,
  CopyableErrorAlert,
  StatusIndicator,
  LoadingOverlay,
  SearchInput,
  SearchableList,
  EmptyState,

  // Layout Primitives
  AppShell,
  HeaderBar,
  BreadcrumbNav,
  TopToolbar,

  // Theming
  SkipoThemeProvider,
} from '../ui';
```

### Critical Invariants:
1. **NEVER use raw HTML buttons or inputs**: Always use `<BaseButton>`, `<BaseInput>`, `<BaseSelect>`, etc.
2. **NEVER use hardcoded hex colors (`#...`)**: Always style using Skipo design token CSS variables:
   - Backgrounds: `var(--skipo-bg)`, `var(--skipo-surface)`, `var(--skipo-bg-panel)`
   - Borders: `var(--skipo-border-color)`, `var(--skipo-border-subtle)`
   - Text: `var(--skipo-text)`, `var(--skipo-text-muted)`
   - Accents: `var(--skipo-accent)`, `var(--skipo-accent-contrast)`
   - Status: `var(--skipo-status-online)`, `var(--skipo-status-warning)`, `var(--skipo-status-error)`

---

## 4. BottomStrip Hover Inspection (Laws L9, L18, L19)

`<BottomStrip />` is mounted at the bottom of the viewport and monitors user hover globally.

### How to wire any UI element into the BottomStrip:
Simply add `data-skipo-label` and `data-skipo-desc` attributes:

```tsx
<BaseButton
  variant="primary"
  onClick={handleDeploy}
  data-skipo-label="Deploy Service"
  data-skipo-desc="Trigger Cloudflare Worker and Vercel build pipelines simultaneously"
>
  Deploy
</BaseButton>
```

- **Law L18**: `data-skipo-label` MUST be $\le 4$ words.
- **Law L19**: When the user hovers, the short label is displayed in the center. When the user holds the **`D`** key, the center dynamically switches to `data-skipo-desc` in thin/small typography with a `[D-INSPECT]` badge.
- **DO NOT build custom tooltip systems or bottom bars.**

---

## 5. React Flow NodeGraph Suite

The NodeGraph suite (`src/frontend/components/nodegraph/`) provides a full visual node graph with **ALL mouse and keyboard controls implemented out of the box**:

### Available Component:
```tsx
import { NodeGraphView } from './components/nodegraph';

export function CanvasPage() {
  return (
    <div className="w-full h-full">
      <NodeGraphView />
    </div>
  );
}
```

### Pre-Configured Mouse Navigation:
- **Zoom**: Mouse wheel (smooth zoom centered on cursor coordinates).
- **Pan**: Middle mouse button drag, or Space + Left-click drag.
- **Marquee Box Selection**: Shift + Left-click drag on canvas background.
- **Node Drag**: Left-click drag on nodes with automatic 16px grid snap.

### Pre-Configured Keyboard Matrix:
- **`Delete` / `Backspace`**: Removes selected nodes and connected edges.
- **`Cmd+Z` / `Ctrl+Z`**: Reverts last topology change (full undo stack).
- **`Cmd+Y` / `Ctrl+Y` / `Cmd+Shift+Z`**: Reapplies reverted topology change (redo stack).
- **`Cmd+C` / `Ctrl+C`**: Copies selected nodes and edges to clipboard.
- **`Cmd+V` / `Ctrl+V`**: Pastes copied nodes with offset at the current cursor coordinates.
- **`Cmd+A` / `Ctrl+A`**: Selects all nodes on the canvas.
- **`Escape`**: Clears active selection.
- **`0`**: Focuses and centers viewport to origin `(400, 200)`.

### State Access:
```typescript
import { useNodeGraphStore } from '@/frontend-state/nodeGraphStore';

const { nodes, edges, addNode, deleteSelection, undo, redo } = useNodeGraphStore();
```

---

## 6. BullMQ Background Execution Queue

Async tasks and heavy operations MUST be queued rather than executed in blocking request handlers:

### Dispatching from Frontend:
```typescript
import { apiClient } from '@/libraries/client/apiClient';

// Dispatches command and tracks in-flight API status for the BottomStrip
const res = await apiClient.dispatchCommand('WORKSPACE_SYNC', { workspaceId: 'ws-123' }, 'HIGH');
if (res.success) {
  console.log('Enqueued job ID:', res.jobId);
}
```

### Checking Status:
```typescript
const statusRes = await apiClient.getCommandStatus(res.jobId);
console.log('Current status:', statusRes.status); // QUEUED, RUNNING, COMPLETED, FAILED
```

### Registering New Command Handlers:
Edit `src/backend/queue/commandQueue.ts`:
```typescript
const COMMAND_HANDLERS: Record<string, (payload: any) => Promise<any>> = {
  MY_CUSTOM_JOB: async (payload) => {
    // Perform processing here...
    return { success: true, processedItems: payload.items.length };
  },
};
```
BullMQ automatically detects Redis (`REDIS_HOST`); if no Redis server is present, it transparently executes in-memory.

---

## 7. Zod Boundary Validation

Validate all incoming data shapes using Zod before mutating state or processing API requests:

```typescript
import {
  GraphNodeSchema,
  DispatchCommandSchema,
  formatZodError
} from '@/libraries/validation/schemas';

const result = DispatchCommandSchema.safeParse(req.body);
if (!result.success) {
  return res.status(400).json(formatZodError(result.error));
}
```

---

## 8. Inviolable Governance Laws (AGENT CHECKLIST)

Before declaring any work complete, ensure your code complies with the following laws:

- **$L_2$ Anti-Stub**: Every function must have real logic (at least 2 statements). No empty functions or `TODO` stubs.
- **$L_9$ 200-Line File Limit**: Every `.ts`, `.tsx`, `.js` file MUST be $\le 200$ lines. Break large files into focused sub-modules.
- **$L_9/L_{18}/L_{19}$ BottomStrip Exclusivity**: Bottom bar center is reserved for dynamic hover text ($\le 4$ words), with extended description revealed on 'D' key.
- **$L_{12}$ Theme Tokens**: No hardcoded hex colors (`#...`). Use `var(--skipo-*)`.
- **$L_{13}$ API Boundary**: No direct `fetch()` in React components. Route all network calls through `apiClient.ts`.
- **$L_{23}$ Zero-Drift Core**: Keep backend services isomorphic in `src/backend/services/core/` to run identically in Node.js and Cloudflare Workers.

Run the validator to guarantee 100% compliance:
```bash
python3 checklists/full_system_validator.py .
```
