# KrnlTS & Skipo Modular Prompt Library

This directory contains **task-specific, token-efficient prompt attachments** formalized in math/pseudocode. When prompting any external AI agent that does not have automatic access to the codebase skills, append the matching prompt template from this directory to enforce strict architectural compliance, layer purity, zero regression, bold section partitioning, in-code docblocks with flowcharts, and long descriptive naming conventions.

---

## Universal Coding & Formatting Rules (Mandatory Across All Tasks)

1. **In-Code Utility Documentation & Flowcharts**: Every function, class, and data structure must have a comprehensive docblock explaining utility, parameters, return values, example usage, and an ASCII/text flow chart.
2. **Bold Code Section Partitioning**: Use bold demarcation borders (`// ══════════════════════════════════════════════════════════════════════════════════════════`) to clearly divide file sections (imports, schemas, pure logic, impure IO, functionalities, exports).
3. **Descriptive & Long Naming Conventions**: Use long, expressive, self-documenting names for files, functions, types, and variables (zero cryptic abbreviations).
4. **Mandatory Folder Markdown Explanations**: Every folder in the codebase MUST contain a `README.md` (or `SKILL.md`) describing its architectural role, layer, file manifest, and interactions.

---

## Task Prompt Selection Matrix

| Task Type | Prompt File | Key Enforcements |
| :--- | :--- | :--- |
| **Documentation & Formatting Standards** | [`CODE_DOCUMENTATION_AND_FORMATTING_STANDARDS.md`](./CODE_DOCUMENTATION_AND_FORMATTING_STANDARDS.md) | Universal docblock template, ASCII flow chart rules, bold unicode section demarcation, descriptive long names |
| **New Feature / Capability** | [`TASK_CREATE_FEATURE.md`](./TASK_CREATE_FEATURE.md) | Atomic `krnlLocalFunctionality`, `backend` flag auto-table, L0-L3 layer separation, input/output validation, telemetry |
| **Refactor & Routine Cleanup** | [`TASK_REFACTOR_CLEANUP.md`](./TASK_REFACTOR_CLEANUP.md) | **Zero logic deletion ($\Delta \text{Logic} = 0$)**, pure/impure extraction, deduplication, max line limits (150 lines/file) |
| **Backend, DB & Storage** | [`TASK_BACKEND_STORAGE.md`](./TASK_BACKEND_STORAGE.md) | Control Plane vs Data Plane separation, Mode 1/2/3, `context.table` CRUD engine, credential cascading |
| **Sub-App & Entity Creation** | [`TASK_CREATE_SUBAPP_ENTITY.md`](./TASK_CREATE_SUBAPP_ENTITY.md) | Root vs Child positioning, self-hosting adapters, manifest generation, subapp worker host isolation |
| **UI Components & Frontend** | [`TASK_UI_COMPONENT_FRONTEND.md`](./TASK_UI_COMPONENT_FRONTEND.md) | Central style authority CSS tokens, reactive `state:changed` listeners, Docks, Force Graphs, React Flow nodes |
| **APIs & Protocol Adapters** | [`TASK_API_PROTOCOL_ADAPTER.md`](./TASK_API_PROTOCOL_ADAPTER.md) | REST, WebSocket, MCP, ACP unified port adapters, Zod/Protobuf schema guards, port discovery |
| **Bug Fixing & Verification** | [`TASK_DEBUG_FIX_VERIFY.md`](./TASK_DEBUG_FIX_VERIFY.md) | Invariant verification, regression test scripts, type-safety, contract preservation |
| **System Orchestration & P2P** | [`TASK_SYSTEM_ORCHESTRATION.md`](./TASK_SYSTEM_ORCHESTRATION.md) | Magnetic Loader autoloading, P2P Ingress network, cross-entity event bus cascading |

---

## How to Use

Simply append the contents of the appropriate `TASK_*.md` file to your prompt:

```text
[Your specific instruction here, e.g.: "Add a user activity tracking functionality to the AnalyticsEntity"]

---
[ATTACH_PROMPT: Paste contents of TASK_CREATE_FEATURE.md here]
```
