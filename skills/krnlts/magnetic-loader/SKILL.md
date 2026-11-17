---
name: krnlts-magnetic-loader
description: Directives for KrnlTS magnetic filesystem scanning, manifest reconciliation, and ambient declaration generation.
---

# KRNLTS MAGNETIC DECLARATION & DISCOVERY

## 1. AMBIENT DECLARATION GENERATION (`krnl watch` / `krnl build`)
The magnetic declaration engine scans `krnl/backend/functionalities/` and `krnl/backend/libraries/` to produce ambient TypeScript declarations (`krnl-magnetic.d.ts`), enabling zero-boilerplate type inference for helper functions and events.

```bash
# Generate ambient declarations and watch for changes
krnl watch

# Automated execution during build
krnl build
```

---

## 2. MANIFEST RECONCILIATION (`KrnlPackageReconciler`)
Every functionality and concept library defines a local `manifest.json`. The package reconciler aggregates these into the root `package.json` to prevent dependency drift:

```typescript
import { KrnlPackageReconciler } from "@ultrst-armada/krnl-core";

KrnlPackageReconciler.reconcile(projectRoot, true);
```
