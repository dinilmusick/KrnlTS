---
name: krnlts-runtime-core
description: Directives for ServiceFacade, pure declarative Orchestration, operation dispatch, and state store in KrnlTS.
---

# KRNLTS RUNTIME: SERVICE FACADE & ORCHESTRATION

## 1. SERVICE FACADE (`ServiceFacade`)
A `ServiceFacade` establishes the public semantic boundary of a KrnlTS service. It aggregates functionalities, orchestrations, operations, lifecycle, reactive state, and events.

```typescript
import { ServiceFacade } from "@ultrst-armada/krnl-core";

export const billingServiceFacade = new ServiceFacade({
  id: "BillingService",
  version: "1.0.0",
  functionalities: ["calculateTax", "recordPayment"],
  orchestrations: ["checkoutPipeline"],
  operations: {
    customAction: async (payload, context) => {
      return { ok: true, payload };
    }
  }
});
```

---

## 2. PURE DECLARATIVE ORCHESTRATION (`Orchestration`)
An `Orchestration` is purely a declarative composition of steps sequencing functionalities and peer orchestrations.

```typescript
import { Orchestration } from "@ultrst-armada/krnl-core";

export const checkoutPipeline = new Orchestration("checkoutPipeline")
  .thenFunctionality("validateCart")
  .thenFunctionality("calculateTax")
  .thenOrchestration("paymentConfirmation");
```

### Invariants:
1. **Zero Direct Library Calls**: Orchestrations sequence functionalities and peer orchestrations. Direct calls to Layer 0 libraries from an orchestration are forbidden (`krnl/orchestration-no-libraries`).
2. **Zero Application Leakage**: No `AppDefinition`, UI specifications, or protocol listeners reside inside Orchestrations.
3. **Execution via Facade**: The service boundary invokes orchestrations and operations via `facade.call(name, payload)`.
