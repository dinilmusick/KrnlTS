# Krnl Framework

> **Krnl**: Backend Service Framework for Skipo — a modular TypeScript framework for authoring, composing, executing, and validating backend services, facades, protocols, and workflows.

---

## 🚀 Overview

In the **Skipo** ecosystem, services are the foundational backend modules. **Krnl** provides the kernel architecture, lifecycle hooks, transport gateways, protocol decoders, and validation engine for building robust, decoupled backend services.

- **Modular Service Architecture**: Define pure, stateful, and protocol-enabled backend service facades.
- **Workflow & Flow Execution**: Compose multi-service pipelines and background execution boundaries.
- **AST Purity & Validation**: Enforce 4-layer function purity, contract standards, and architecture rules via `ts-morph`.
- **Protocol & Network Ingress**: Support REST, WebSocket, RPC, and MCP protocol bindings out of the box.
- **Universal Backend Readiness**: Run seamlessly across Local FS, Local-Hosted, and Serverless environments.

---

## 🚀 Quickstart: Starting a Fresh Workspace

### 1. Scaffold a New Project
Run the official interactive project generator:

```bash
# Using npm
npm create krnl my-service-app

# Using npx
npx create-krnl my-service-app

# Using pnpm
pnpm dlx create-krnl my-service-app
```

This generates a fully configured Krnl backend workspace:
- `krnl.json` (Workspace manifest & provider bindings)
- `package.json` & `tsconfig.json`
- `src/services/` (Backend service definitions & facades)
- `src/libraries/` (Layer 0 pure concept libraries)
- `docs/HISTORY.md` (Project intent & architectural memory)

---

### 2. Run and Validate Services

```bash
cd my-service-app

# Start Krnl service dev server
krnl dev

# Run deep AST 4-layer service purity validation
krnl validate

# Build production bundle
krnl build
```

---

### 3. CLI Commands Reference

```bash
# Start Krnl service dev server & boot service entrypoint
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

- **[`@ultrst-armada/krnl`](packages/core)**: Core runtime engine, Service facades, Protocols, Transports, Registry, Lifecycle, and Execution flows.
- **[`@dinilmusick/krnl-validate`](packages/validate)**: `ts-morph` AST engine enforcing 4-layer function purity, backend contracts, and line limits.
- **[`@dinilmusick/eslint-plugin-krnl`](packages/eslint-plugin)**: ESLint rules with auto-fixers for Krnl backend service standards.
- **[`@dinilmusick/krnl-cli`](packages/cli)**: Unified `krnl` binary for running, building, and validating backend services.
- **[`create-krnl`](packages/create-krnl)**: Interactive project scaffolder for Krnl backend service modules.

---

## 📜 License
MIT © Dinil Palackal
