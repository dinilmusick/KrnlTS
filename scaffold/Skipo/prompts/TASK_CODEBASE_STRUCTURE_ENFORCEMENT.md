# TASK: SKIPO_CODEBASE_STRUCTURE_ENFORCEMENT

$$\text{Valid}(\mathcal{P}) \iff \text{Planes}(\mathcal{P}) \wedge \text{FileLimit}(\mathcal{P}) \wedge \text{PurityDAG}(\mathcal{P}) \wedge \text{TokenPurity}(\mathcal{P}) \wedge \text{ExitCode}(\text{Validator}) = 0$$

You are a coding agent operating inside the **Skipo** codebase. Your sole job on this turn is to audit every file in the repository against the structural laws below and remediate every violation you find. Do not stop until `python3 assistant.py validate .` exits with code 0.

> **INVIOLABLE MANDATE: ZERO-TRACE LEGACY PURGE ($\mathbf{L_{21}}$)**:
> Completely eradicate any legacy, bespoke, or competing subsystems encountered during structural refactoring. Zero traces, zero commented-out relics, zero redundant adapters, and zero dead config files may remain. Skipo systems are the exclusive authority.

---

## 0. MANDATORY FIRST STEP — INGEST GOVERNANCE

Before touching any file, run the master validator to see the full violation list:

```bash
python3 assistant.py validate .
```

Then run the purity audit against every sub-directory you will edit:

```bash
python3 code-purity-audit.py <target_dir>
```

Read `AGENTS.md` at the repository root. Every law in that file is binding. The math at the top of this prompt is the validity gate your output must satisfy.

---

## 1. PLANE ISOLATION (Law L1)

**VIOLATION**: Any source file living directly inside `src/` as a flat monolith instead of inside an explicit plane.

**ALLOWED PLANES** (the only valid source containers in a sub-app):
- `src/frontend/`   — React components, pages, hooks, styles
- `src/backend/`    — API routes, orchestration, service suites
- `src/libraries/`  — Synchronized Skipo base assets (`skipo/ui`, `skipo/backend`)
- `src/frontend-state/` — Global state, zustand stores, context providers
- `packages/*/src/` — Library packages in the Skipo monorepo (also valid plane roots)

**REMEDIATION**:
```bash
python3 assistant.py mutate planes <target_dir>
# Then run aspect validator:
python3 assistant.py validate . --aspect aspect_01
```

Then manually verify every import path resolves after the move.

**HARD RULE**: No `.ts` or `.tsx` file may sit directly in `src/`. No app code in `packages/*/src/` may import from another package's internal `src/` without going through that package's public index.

---

## 2. FILE LINE LIMIT — ≤ 200 LINES (Law L9)

**VIOLATION**: Any `.ts` or `.tsx` file with more than 200 lines of code.

**DETECTION**:
```bash
find . -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -rn | head -30
```

**REMEDIATION — exact split strategy**:
1. Run `python3 assistant.py mutate split <file>` to auto-split oversized files.
2. If manual, extract in this priority order:
   - Helper functions → `<Name>Helpers.ts`
   - Sub-components → `<Name>Inner.tsx` or their own dedicated file
   - Type definitions → `<Name>.types.ts`
   - Hooks → `use<Name>.ts`
3. After splitting, every resulting file must itself be ≤ 200 lines.
4. Update all import paths in consumer files.

**INVARIANT**: Exactly **one exported component** per `.tsx` file. Top-level files (`App.tsx`, `page.tsx`, `index.tsx`) must contain only imports and a single root composition — zero local logic.

---

## 3. FILE PURITY DAG (Law L15)

Every file must have a grade suffix that reflects its purity tier, and imports must only flow **down** the DAG (higher tier importing lower tier is forbidden):

| Grade | Suffix | Allowed to Import |
|:------|:-------|:------------------|
| P0 — Pure math/utils | `_Pure` | Nothing from the app |
| P1 — Domain types | `_Model` | P0 only |
| P2 — Services/stores | `_Service`, `_Store` | P0, P1 |
| P3 — UI Components | (no suffix needed) | P0, P1, P2 |

**HARD RULE**: The import graph must be a DAG — zero cycles. If `eslint --rule import/no-cycle` reports a cycle, break it immediately by extracting a shared P0/P1 file both modules import.

**DETECTION**:
```bash
python3 code-purity-audit.py <target_dir>
```

---

## 4. ROOT CODE ISOLATION (Law L16)

**VIOLATION**: Any `.ts`/`.tsx` file sitting directly in the repository root or in a directory that is not an allowed plane.

**ALLOWED ROOT FILES** (the only files permitted at root):
- Configuration: `package.json`, `tsconfig*.json`, `turbo.json`, `pnpm-workspace.yaml`, `.gitignore`, `.env*`
- Infrastructure entry points: `next.config.*`, `vite.config.*`, `tailwind.config.*`
- Python tooling: `assistant.py`, `code-purity-audit.py`
- Markdown: `README.md`, `AGENTS.md`, `SKILL.md`

**HARD RULE**: No application logic `.ts`/`.tsx` in root. Move any stray logic files into the correct plane immediately.

---

## 5. DESIGN TOKEN PURITY (Law L6 / L2)

**VIOLATION**: Any hardcoded color value (`#abc`, `rgb(...)`, `rgba(...)`, `hsl(...)`) used in a component style prop or CSS-in-JS.

**DETECTION**:
```bash
grep -rn "#[0-9a-fA-F]\{3,6\}\|rgb(" src/ packages/ --include="*.tsx" --include="*.ts" --include="*.css"
```

Then auto-fix:
```bash
python3 assistant.py mutate tokens <target_dir>
```

**MANDATORY TOKEN MAP** — replace every hardcoded value with the canonical `var(--skipo-*)` equivalent:

```css
/* Backgrounds */
--skipo-bg                  /* page / root background */
--skipo-surface             /* card / panel surfaces */
--skipo-matte-bg            /* matte overlays */
--skipo-matte-bg-hover      /* hovered matte overlays */

/* Text */
--skipo-text                /* primary text */
--skipo-text-muted          /* secondary / caption text */
--skipo-text-inverse        /* text on accent backgrounds */

/* Accents */
--skipo-accent              /* primary brand accent */
--skipo-accent-fg           /* foreground on accent */
--skipo-accent-glow         /* glow/aura around accent elements */

/* Borders */
--skipo-border-color
--skipo-border
--skipo-border-input
--skipo-radius              /* default radius */
--skipo-radius-sm
--skipo-radius-lg

/* Shadows */
--skipo-shadow
--skipo-shadow-hover
--skipo-shadow-btn
--skipo-shadow-btn-hover
--skipo-shadow-btn-active

/* Status */
--skipo-success
--skipo-warning
--skipo-danger
--skipo-info

/* Shell geometry */
--skipo-top-toolbar-height   /* 44px */
--skipo-bottom-strip-height  /* 30px */
```

After running the mutator, manually verify that no hardcoded colors remain.

---

## 6. UI PRIMITIVE PURITY (Laws L2, L14, L18)

**VIOLATIONS**:
- Raw `<button>`, `<input>`, `<select>`, `<textarea>` tags in component files
- Buttons containing both an icon AND a text label (double-icon law)
- UI text labels exceeding 4 words

**REMEDIATION**:

Replace every raw HTML control with the corresponding `@skipo/ui` primitive:

| Raw HTML | Skipo Primitive |
|:---------|:----------------|
| `<button>` | `BaseButton` or `IconOnlyButton` |
| `<input>` | `BaseInput` or `CredentialField` |
| `<select>` | `BaseSelect` |
| `<textarea>` | `BaseTextarea` |
| `<input type="checkbox">` | `BaseToggle` |

**Icon-Only Buttons** must contain exactly one SVG glyph and zero text. Any descriptive copy goes to `BottomStripContext` via `setInspectionText` on `onMouseEnter`.

**4-Word Label Cap**: Any UI label exceeding 4 words must be shortened to ≤ 4 words. Full descriptions appear only in the bottom strip on hover (Law L19 — D+Hover mode).

---

## 7. NAMING CONVENTIONS & SECTION BANNERS (Law L4)

Every file must open with a bold ASCII section banner, then follow the canonical 4-section structure:

```ts
// ═══════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// 2. DATA SCHEMAS & INTERFACES
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// 3. IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// 4. EXPORTS
// ═══════════════════════════════════════════════════════════════════
```

Auto-inject banners:
```bash
python3 assistant.py mutate naming <target_dir>
```

**Naming Invariants**:
- No single-letter variable names except loop indices (`i`, `j`, `k`)
- No cryptic abbreviations (`mgr`, `srv`, `ctrl`) — use full words
- Files: `PascalCase.tsx` for components, `camelCase.ts` for modules
- Boolean variables/props: always prefixed with `is`, `has`, or `should`

---

## 8. ANTI-STUB & REAL DRIVER MANDATE (Laws L2, L3, L6)

**VIOLATIONS**:
- Empty function bodies: `function foo() {}`
- TODO/FIXME comments standing in for real implementation
- Trivial no-op returns: `return null;` as a complete component
- Mock data arrays: `[{ id: 1, name: 'Item 1' }]`

**HARD RULE**: Every function must have ≥ 2 meaningful statements. Every service must invoke at least one real driver from: `@aws-sdk`, `sqlite3`, `pg`, `fetch`, `@skipo/backend`, or `crypto`.

**REMEDIATION**: Replace stubs with real implementations. If the real data is absent at runtime, render `<EmptyState>` from `@skipo/ui` — never synthesize fake data to simulate completeness.

---

## 9. SKIPO LIBRARY ISOLATION (Law L20)

**VIOLATION**: Any application file importing directly from the root `Skipo/` directory:
```ts
import { X } from "../../Skipo/packages/ui";       // ❌ BANNED
import { X } from "@/Skipo/components/Button";      // ❌ BANNED
```

**MANDATORY IMPORT PATH**:
```ts
import { X } from "@/libraries/skipo";              // ✅ CORRECT
import { X } from "@/libraries";                    // ✅ CORRECT
```

If `src/libraries/skipo/` does not exist or is stale, run:
```bash
python3 assistant.py sync-libraries . --auto-fix
```

---

## 10. GITIGNORE ANCHORING (Law L4 / L10)

Verify `.gitignore` at the repo root contains **anchored** build output patterns:

```gitignore
/dist/       ← anchored (correct)
/.next/      ← anchored (correct)
/out/        ← anchored (correct)
```

Not the unanchored form `dist/` which silently strips pre-bundled monorepo sub-packages.

---

## 11. EXIT GATE — MANDATORY BEFORE DECLARING DONE

Run the full system validator. You MUST NOT declare this task complete unless exit code is 0:

```bash
python3 assistant.py validate .
```

If any aspect fails, run the targeted mutator for that aspect and re-validate:

```bash
python3 assistant.py mutate all <target_dir>
python3 assistant.py validate .
```

Then run the test suite:

```bash
pnpm test          # all tests must pass
pnpm typecheck     # 0 TypeScript errors
```

Output the final validator scorecard as evidence.

---

## HOW TO USE THIS PROMPT

Paste the full contents of this file as the opening message to any coding agent working on the Skipo codebase. The agent should:

1. Run `python3 assistant.py validate .` and read the violation report.
2. Work through Sections 1–10 sequentially, remediating each violation class.
3. Re-run `python3 assistant.py validate .` after every section.
4. Finish only when exit code is 0 and `pnpm test` passes.
