---
name: krnlts-runtime-core
description: Directives for generic Entity<TState, TEvents> runtime execution, capability bubbling, flow construction, and state mutations in KrnlTS.
---

# KRNLTS RUNTIME & CORE ENTITY ENGINE

## 1. GENERIC ENTITY CLASS (`Entity<TState, TEvents>`)
```typescript
import { Entity } from "@dinilmusick/krnlts";

interface OrderState {
  orderId: string;
  total: number;
  status: "pending" | "processed";
}

interface OrderEvents {
  "order:processed": { orderId: string; total: number };
}

/** @role skeleton */
export class OrderEntity extends Entity<OrderState, OrderEvents> {
  constructor() {
    super("OrderEntity", null, {
      initialState: { orderId: "", total: 0, status: "pending" }
    });
  }

  processOrder(amount: number) {
    this.setState({ total: amount, status: "processed" });
    this.emitEvent("order:processed", { orderId: this.state.orderId, total: amount });
  }
}
```

---

## 2. CAPABILITY BUBBLING & QUALIFIED RESOLUTION
1. **Bubbling State**: Child entity capabilities automatically bubble up to parent entities (`localFunctionalities` $\to$ `remoteFunctionalities`).
2. **Qualified IDs**: Ingress adapters receive qualified IDs (e.g. `Root.Order.processOrder`) and resolve them via `root.resolveCapability("Root.Order.processOrder")` $\to$ `{ owner: orderEntity, fid: "processOrder" }`.
3. **Execution**: The owner executes `owner.call(fid, input)`.

---

## 3. FIRST-CLASS FLOWS (`KrnlFlowBuilder`)
```typescript
myEntity.flow("checkoutPipeline")
  .then("validateCart")
  .then("calculateTaxes")
  .branch((res) => res.isApproved, "chargeCard", "cancelOrder")
  .register({
    visibility: "public",
    description: "Multi-step checkout pipeline"
  });
```
- Flows are registered as regular functionalities and invoked via `entity.call("checkoutPipeline", payload)`.
