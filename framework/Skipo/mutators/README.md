# Skipo Codebase Mutators

This directory contains the **pure Python 3 deterministic codebase mutators** designed to restructure, consolidate, and auto-remediate existing codebases into 100% compliance with the Skipo Inviolable Laws.

---

## Mutator Index

| Aspect | Mutator Script | Transformation |
| :--- | :--- | :--- |
| **01: Plane Restructure** | [`01_plane_restructure_mutator.py`](./01_plane_restructure_mutator.py) | Moves loose files into `src/frontend` and `src/backend`, wraps components in folders, and creates barrel facades. |
| **02: Section Demarcation** | [`02_section_demarcation_mutator.py`](./02_section_demarcation_mutator.py) | Injects standard bold `// ════════` section banners and ASCII flowchart docblocks. |
| **03: Token Theme Normalizer** | [`03_token_theme_mutator.py`](./03_token_theme_mutator.py) | Scans and replaces hardcoded `#hex` / `rgb(...)` colors with `var(--skipo-*)` theme tokens. |
| **04: Monolith Splitter** | [`04_monolith_splitter_mutator.py`](./04_monolith_splitter_mutator.py) | Splits oversized files (>200 lines) into `helpers.ts`, `types.ts`, and primary file behind a barrel facade. |
| **All: Autonomous Pipeline** | [`mutate.py all`](./mutate.py) | Runs all 4 mutators sequentially to auto-remediate an entire project. |

---

## CLI Usage

### List Available Mutators
```bash
python3 mutators/mutate.py --list
# Or via Node:
node mutators/runner.mjs --list
```

### Consolidate Flat Monolith into Strict Planes
```bash
python3 mutators/mutate.py planes src/
```

### Inject ASCII Flowcharts & Section Demarcations
```bash
python3 mutators/mutate.py sections src/
```

### Normalize Hardcoded Colors to Design Tokens
```bash
python3 mutators/mutate.py tokens src/
```

### Split Files Exceeding 200 Lines
```bash
python3 mutators/mutate.py split src/
```

### Auto-Remediate Entire Codebase
```bash
python3 mutators/mutate.py all src/
```
