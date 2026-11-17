# TASK: ROUTINE_CLEANUP_AND_ASSET_DEDUPLICATION_PROTOCOL

$$\text{Valid}(\mathcal{C}) \iff \text{DeadCodePurged}(\mathcal{C}) \wedge \text{ClonesConsolidated}(\mathcal{C}) \wedge \text{RefsSubstituted}(\mathcal{C}) \wedge \text{ExitCode}(\text{Validator}) = 0$$

> **EXCLUSIVE SCOPE**: This prompt owns **routine codebase cleanup, detection of dead/unimported code assets, multi-dimensional code similarity scanning, and the safe collapsing/consolidation of redundant duplicate functions, interfaces, and data structures**.
>
> **Core Tooling**:
> ```bash
> python3 assistant.py cleanup <target_dir>                    # Full cleanup & similarity audit
> python3 assistant.py cleanup <target_dir> --scan-unused       # Dead / unimported code scan only
> python3 assistant.py cleanup <target_dir> --scan-similar      # Multi-dimensional clone scan only
> python3 assistant.py cleanup <target_dir> --threshold 0.85    # Filter for >=85% similarity
> ```

---

## 0. PURPOSE & ACTIVATION CONTEXT

Activate this prompt whenever you need to perform routine hygiene on a codebase or sub-app to:
1. **Purge Unused Assets**: Detect orphaned `.ts/.tsx` files that are never imported anywhere, and remove dead exported symbols with 0 call sites.
2. **Detect Redundant Assets**: Identify duplicate or nearly identical functions, interfaces, types, and logic structures created across multiple files during fast feature iteration.
3. **Consolidate Redundancies**: Choose or create a single canonical representation, replace all consumer call-sites across the codebase with the canonical reference, and delete the deprecated duplicate.
4. **Purge Competing Legacy Systems ($\mathbf{L_{21}}$)**: Completely eradicate any legacy, bespoke, or competing subsystems discovered during cleanup. Zero trace, zero commented-out code, and zero dead config files may remain.
5. **Preserve Invariants**: Ensure line limits ($\le 200\text{L}$), zero regressions in tests (`pnpm test`), and 100% compliance with Skipo validators (`python3 assistant.py validate .`).

---

## 1. THE 4-PHASE ROUTINE CLEANUP PLAYBOOK

```
[Phase 1: Diagnostic Audit]
  ├── Run: python3 assistant.py cleanup .
  └── Review: 1) Orphaned files, 2) Zero-usage exports, 3) Candidate similarity pairs (>= 80%)

[Phase 2: Dead / Unused Code Purge]
  ├── Verify unimported files are not registered entrypoints or documentation
  ├── Delete truly dead orphaned files
  └── Remove or un-export zero-usage helper symbols

[Phase 3: Redundancy Assessment & Consolidation Decision]
  ├── Inspect candidate pairs with Similarity >= 80%
  ├── Evaluate: Are they functionally equivalent or diverging by design?
  └── Select or author CANONICAL representation (place in canonical plane or library)

[Phase 4: Global Reference Substitution & Verification]
  ├── Update all consumer imports and call-sites to use the canonical asset
  ├── Delete or deprecate the redundant clone
  ├── Run: pnpm test (must pass with 0 regressions)
  └── Run: python3 assistant.py validate . (must exit 0)
```

---

## 2. PHASE 1: EXECUTE THE CLEANUP ENGINE

Execute the Skipo cleanup engine across the target workspace:

```bash
python3 assistant.py cleanup .
```

To get structured machine-readable JSON for automated parsing:
```bash
python3 assistant.py cleanup . --json
```

The engine inspects:
- **Token Vocabulary ($S_{name}$)**: Morphological sub-word analysis (e.g. `calculateVat` $\leftrightarrow$ `computeVatTax`).
- **Signature & Arity ($S_{sig}$)**: Parameter count, argument ordering, and interface property shape.
- **AST / Body Structure ($S_{body}$)**: Normalized statement and control flow similarity.
- **Logic Vocabulary ($S_{idents}$)**: Common API calls, variable operations, and data-flow identifiers.

---

## 3. PHASE 2: PURGING UNUSED CODE ASSETS

1. **Orphaned Files**:
   - Inspect the files listed under `Orphaned Unimported Files`.
   - **Exclusions**: Do NOT delete primary framework roots (`App.tsx`, `index.tsx`, `main.tsx`), unit tests (`*.test.ts(x)`), or explicit standalone entry points.
   - If an orphaned file is an abandoned experiment, obsolete component, or dead helper, delete it.
2. **Unused Exported Symbols**:
   - Inspect exported interfaces, types, and functions with 0 usages across other files.
   - If internal to a module, remove the `export` keyword to reduce the surface area.
   - If completely obsolete, remove the dead symbol entirely.

---

## 4. PHASE 3: MULTI-DIMENSIONAL SIMILARITY & REDUNDANCY ANALYSIS

When the engine flags a candidate pair with **$S \ge 0.80$ (80% similarity)**:

### 4.1 Evaluation Checklist
Ask the following 4 questions before modifying code:
1. **Semantic Equivalence**: Do Asset A and Asset B perform the exact same computation or represent the exact same domain data shape?
2. **Cosmetic Divergence**: Is the difference merely parameter naming, local variable naming, or type vs. interface syntax? (e.g., `NodePosition { x: number; y: number }` vs `HandlePosition { x: number; y: number }`).
3. **Domain Intent**: Are they legitimately distinct domain concepts that happen to share structure? (e.g., `Point2D` vs `ScreenCoordinate` — if they can be unified without violating domain boundaries, unify them).

### 4.2 Canonical Consolidation Rules
- **Rule A (Data Structures & Types)**:
  - If two interfaces/types share identical coordinates or payload fields, extract a shared canonical definition into `src/libraries/` or `types.ts`.
  - Example: Consolidate `HandlePosition` and `NodePosition` into a canonical `Position2D` or keep `Position2D` as the base type.
- **Rule B (Mathematical / Pure Utilities)**:
  - Consolidate identical pure functions into `_Pure.ts` utility files.
  - Re-export the canonical function.
- **Rule C (UI Components / Widgets)**:
  - If two component cards or buttons have duplicate layouts, consolidate them using `@skipo/ui` base primitives and pass differing badges/emblems via props.

---

## 5. PHASE 4: GLOBAL REFERENCE SUBSTITUTION & VERIFICATION

Once a canonical asset is established:

1. **Global Find & Replace**:
   - Update every file that imported or invoked the deprecated clone to import and invoke the canonical asset.
2. **Verify Line Limits**:
   - Ensure the consolidated file remains $\le 200$ lines (Law L9).
3. **Delete Deprecated Duplicate**:
   - Remove the duplicate declaration from its original file.
4. **Mandatory Verification Gate**:
   ```bash
   # 1. Type check
   pnpm typecheck

   # 2. Test regression gate
   pnpm test

   # 3. Full system compliance validator
   python3 assistant.py validate .
   ```

Do NOT declare completion until all 3 verification commands pass with exit code 0.

---

## HOW TO USE THIS PROMPT

Paste the contents of this prompt directly to the coding agent whenever:
- The user requests a routine cleanup or dead-code purge.
- The codebase feels bloated or has duplicate functions across folders.
- Refactoring has introduced multiple similar interfaces or helpers.
