# Krnl Framework

> **Krnl**: High-Performance Full-Stack TypeScript Framework with Direct-DOM VanJS Reactivity, ts-morph AST Purity Gates, Autonomous Code Evolution, and the **Krnl Studio Visual Node IDE**.

---

## 🚀 Quickstart: Starting a Fresh Workspace

### 1. Scaffold a New Project
Run the official interactive project generator:

```bash
# Using npm
npm create krnl my-app

# Using npx
npx create-krnl my-app

# Using pnpm
pnpm dlx create-krnl my-app
```

This generates a fully configured Krnl workspace:
- `krnl.json` (Workspace manifest & provider bindings)
- `package.json` & `tsconfig.json`
- `src/entities/App/` (Root entity with magnetic auto-discovery)
- `src/entities/App/functionalities/Hello/` (Sample Quad-Unit functionality)
- `src/libraries/AppConcepts.ts` (Layer 0 pure concept library)
- `docs/HISTORY.md` (Project intent & architectural memory)

---

### 2. Launch Krnl Studio (Visual Node IDE)

```bash
cd my-app
krnl dev
```
Open **`http://localhost:8080`** in your browser (Brave, Chrome, Safari).

Krnl Studio provides three visual canvases switchable via the bottom dock:
- **🏗️ Architecture Canvas**: Node graph for visually adding Entities, Quad-Unit Functionalities, and Concept Libraries (surgically writing `.ts` code to disk).
- **🎨 UI Composer Canvas**: Drag-and-drop palette of KrnlUI atoms (`KrnlButton`, `KrnlTextInput`, `KrnlDropdown`, `KrnlTile`, `KrnlDock`) with real-time **Monaco TypeScript** code generation.
- **🧪 Live Test Console**: Sandboxed per-function execution in isolated worker threads with **Monaco JSON Editor** inputs and latency benchmarking.

---

### 3. CLI Commands Reference

```bash
# Start Visual Node IDE and dev server
krnl dev

# Run deep AST 4-layer function purity audit
krnl validate

# Validate and build production bundle into dist/
krnl build

# Generate ambient TypeScript declarations for auto-discovery
krnl watch

# Scaffold architectural primitives via CLI
krnl generate entity UserSystem
krnl generate functionality UserSystem CreateProfile
krnl generate library BillingConcepts
krnl generate subapp OrderEngine
```

---

## 🏛️ Monorepo Framework Packages

- **[`@dinilmusick/krnl-core`](packages/core)**: Entity hierarchy, Flow builder, MagneticLoader, Universal Backend suite.
- **[`@dinilmusick/krnl-ui`](packages/ui)**: Direct-DOM VanJS reactive atoms with Neo-Brutalist 2.5D theme and Monaco editor.
- **[`@dinilmusick/krnl-validate`](packages/validate)**: `ts-morph` AST engine enforcing 4-layer function purity and 200-line limits.
- **[`@dinilmusick/eslint-plugin-krnl`](packages/eslint-plugin)**: 6 ESLint rules with auto-fixers for Krnl paradigms.
- **[`@dinilmusick/krnl-studio`](packages/studio)**: Visual Node IDE, UI Composer, and Live Test Console.
- **[`@dinilmusick/krnl-cli`](packages/cli)**: Unified `krnl` binary.
- **[`create-krnl`](packages/create-krnl)**: Interactive project scaffolder.

---

## 📜 License
MIT © Dinil Palackal
