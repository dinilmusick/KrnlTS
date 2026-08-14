---
name: krnl-subapp-authoring
description: Standard authoring guide and conventions for building self-contained React full-stack sub-apps for the Krnl ecosystem.
---

# Krnl Sub-App Authoring Guide

Authoring standard for self-contained React full-stack sub-apps compatible with the Krnl ecosystem.

---

## 1. Core Architectural Rules

$$\text{SubApp} = \{\text{UI}, \text{Business Logic}, \text{Operations}, \text{Dependencies}\}$$
$$\text{Krnl} = \{\text{Discovery}, \text{Registration}, \text{Lifecycle}, \text{Transports}, \text{Services}, \text{Flow Orchestration}\}$$

*   **Rule 1 — Zero Server Rule**: Sub-apps **NEVER** start HTTP/WebSocket servers (`http.createServer`, `app.listen`, etc.). Krnl provides all network exposure.
*   **Rule 2 — Single Registration Entry**: Sub-app exposes one well-known `register(context)` function.
*   **Rule 3 — Pure Operations**: Endpoints are defined as transport-independent `OperationDefinition`s (identity, schemas, handler, metadata).
*   **Rule 4 — Direct Functionality Wrapping**: Krnl wraps every registered operation into a first-class `krnlLocalFunctionality` on the parent `Entity`, enabling immediate `entity.flow(...)` orchestration.
*   **Rule 5 — Shared Workspace**: No separate `node_modules` in production. Krnl aggregates sub-app dependencies via `subapp.json`.

---

## 2. Sub-App Directory Layout

```
my-react-subapp/
├── subapp.json             → Sub-app manifest
├── package.json            → App dependencies & build scripts
├── tsconfig.json           → TypeScript configuration
├── src/
│   ├── register.ts         → Registration entrypoint (exports register(context))
│   ├── operations/         → Operation handlers (pure business logic)
│   │   ├── createOrder.ts
│   │   └── getOrderStatus.ts
│   └── ui/                 → React UI components & views
│       ├── App.tsx
│       └── index.tsx
└── dist/                   → Compiled build artifacts
```

---

## 3. Sub-App Manifest (`subapp.json`)

```json
{
  "name": "OrderSubApp",
  "version": "1.0.0",
  "description": "Order processing sub-app for Krnl",
  "registrationEntry": "./dist/register.js",
  "dependencies": {
    "zod": "^3.22.4"
  },
  "ui": {
    "title": "Orders Management",
    "entryPath": "./dist/ui/index.js"
  }
}
```

---

## 4. Sub-App Registration Entry (`src/register.ts`)

```typescript
import type { SubAppRegistrationContext, SubAppRegistration } from "@dinilmusick/krnlts";
import { createOrderHandler, createOrderSchema } from "./operations/createOrder.js";

export function register(context: SubAppRegistrationContext): SubAppRegistration {
  // 1. Dependency-injected context provides access to shared services and logger
  context.logger.log(`Registering OrderSubApp on entity: ${context.entity.id}`);

  // 2. Return the registration descriptor
  return {
    name: "OrderSubApp",
    operations: [
      {
        name: "createOrder",
        description: "Creates and verifies a new order",
        input: createOrderSchema,
        handler: createOrderHandler,
        metadata: { category: "Commerce" }
      }
    ],
    ui: {
      title: "Order Management",
      entryPath: "./dist/ui/index.js"
    },
    onInitialize: async (ctx) => {
      ctx.logger.log("OrderSubApp initialized.");
    },
    onDispose: async () => {
      // Clean up resources if necessary
    }
  };
}

export default register;
```

---

## 5. Operation Handler Pattern (`src/operations/createOrder.ts`)

```typescript
import { z } from "zod";
import type { SubAppExecutionContext } from "@dinilmusick/krnlts";

export const createOrderSchema = z.object({
  customerId: z.string(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive()
  }))
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export async function createOrderHandler(
  input: CreateOrderInput,
  context: SubAppExecutionContext
) {
  // Pure business logic — no express req/res
  const orderId = `ORD-${Date.now()}`;
  return {
    orderId,
    customerId: input.customerId,
    status: "CREATED",
    createdAt: Date.now()
  };
}
```

---

## 6. Existing HTTPS Apps / Express Route Migration

Use `createHttpsAppAdapter` to adapt existing REST routes into Krnl sub-app operations:

```typescript
import { createHttpsAppAdapter } from "@dinilmusick/krnlts";

export function register() {
  return createHttpsAppAdapter({
    name: "LegacyApp",
    endpoints: [
      {
        path: "/api/users/profile",
        method: "GET",
        handler: async (query) => fetchProfile(query.userId)
      },
      {
        path: "/api/users/update",
        method: "POST",
        handler: async (body) => updateProfile(body)
      }
    ]
  });
}
```

---

## 7. Krnl Entity Orchestration Flow

Once registered, sub-app operations become first-class functionalities on the host Entity:

```typescript
// Host Entity orchestrates sub-app operations alongside native functionalities
entity.flow("checkoutPipeline")
  .then("OrderSubApp.createOrder")
  .branch(
    (order) => order.status === "CREATED",
    "PaymentSubApp.charge",
    "OrderSubApp.cancelOrder"
  )
  .register({ visibility: "public" });

// Invocable via call
const result = await entity.call("checkoutPipeline", orderInput);
```
