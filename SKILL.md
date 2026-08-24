---
name: krnlts-guide
description: Master router guiding agents through the unified Skipo Base Skills (architecture, UI, API, data, database, docs, features) with KrnlTS runtime library extensions.
---

# KRNLTS & SKIPO UNIFIED AGENT ROUTER

KrnlTS incorporates the **Skipo Skill System** as its primary base layer of architectural conventions, file/folder layouts, and UI directives.

When working on any KrnlTS codebase or downstream application, the AI agent **always reads the Skipo skills first**. When the agent identifies that the project is using `@dinilmusick/krnlts`, it seamlessly activates the **KrnlTS Runtime Extension Sub-Skills** (`skills/krnlts/`).

---

## 1. MANDATORY PRE-ACTION ROUTING PROTOCOL
```
∀ task ∈ Agent_Actions:
  1. Inspect workspace for KrnlTS Runtime usage:
     if (has_dependency("@dinilmusick/krnlts") ∨ file_exists("krnl.json") ∨ has_import("@dinilmusick/krnlts")):
         load_skill("./skills/krnlts/SKILL.md")  # Activate KrnlTS Runtime Subsystem Extensions
  2. Classify task intent(s) into Domain(s).
  3. Consult corresponding leaf SKILL.md in skills/ before proposing or writing code.
  4. If task spans multiple domains, load all relevant skills in dependency order:
     [ Backend / Database -> Architecture -> KrnlTS -> Data -> API -> UI -> Features -> Docs ]
  5. Abide strictly by the loaded skill constraints.
```

---

## 2. UNIFIED DOMAIN DISPATCH MATRIX

| Task Domain | Target Skill File | Directives & Scope |
| :--- | :--- | :--- |
| **Universal Backend & Storage** | [`skills/backend/SKILL.md`](./skills/backend/SKILL.md) | Control vs Data plane separation, Local FS / Local-Hosted / Remote modes, decoupled Data/Storage providers, Admin authorization, Vercel/Desktop readiness |
| **Architecture Base** | [`skills/architecture/SKILL.md`](./skills/architecture/SKILL.md) | Quad-units, 4-layer function purity, `{Domain}Concepts.ts`, line limits, anti-polling |
| **KrnlTS Runtime Extensions** | [`skills/krnlts/SKILL.md`](./skills/krnlts/SKILL.md) | `Entity<TState, TEvents>`, `loadAll()`, Flows, port gateway, `KrnlFS`, `krnlts-validate` |
| **UI & Styling** | [`skills/ui/SKILL.md`](./skills/ui/SKILL.md) | Neo-Brutalism 2.5D biome, `@dnd-kit` tiled menus, top-edge downward tooltips, reactive wiring |
| **API & Ingress** | [`skills/api/SKILL.md`](./skills/api/SKILL.md) | Endpoint parity, external triggers, WebSocket RPC, MCP bridges |
| **Data & Zero-Mock** | [`skills/data/SKILL.md`](./skills/data/SKILL.md) | Zero mock data, real backend responses, explicit error handling |
| **Database** | [`skills/database/SKILL.md`](./skills/database/SKILL.md) | SQLite WAL, PostgreSQL/Supabase, latency ping tests |
| **Feature Lifecycle** | [`skills/features/SKILL.md`](./skills/features/SKILL.md) | Incremental evolution (anti-nuke), absolute 100% zero-trace purge (no zombie code) |
| **Project History & Docs** | [`skills/docs/SKILL.md`](./skills/docs/SKILL.md) | `docs/HISTORY.md` intent tracking, pre-refactor memory refresh protocol |

---

## 3. KRNLTS RUNTIME EXTENSIONS (WHEN USING `@dinilmusick/krnlts`)
When `@dinilmusick/krnlts` is detected, consult the concrete runtime sub-skills:
- **Core Runtime & Flows**: [`skills/krnlts/runtime/SKILL.md`](./skills/krnlts/runtime/SKILL.md)
- **Magnetic Auto-Discovery**: [`skills/krnlts/magnetic-loader/SKILL.md`](./skills/krnlts/magnetic-loader/SKILL.md)
- **Utility Tools Suite (`KrnlFS`, `KrnlEnv`, `AsyncKit`)**: [`skills/krnlts/utility-tools/SKILL.md`](./skills/krnlts/utility-tools/SKILL.md)
- **Unified Port Ingress**: [`skills/krnlts/network-ingress/SKILL.md`](./skills/krnlts/network-ingress/SKILL.md)
- **AST Validator CLI (`krnlts-validate`)**: [`skills/krnlts/validation-cli/SKILL.md`](./skills/krnlts/validation-cli/SKILL.md)
