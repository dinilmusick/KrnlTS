---
name: entity-functionality-architecture
description: Directives for Entity-Functionality folder architecture, main functionality files, helper folders, events, state isolation, and System Entity entry point.
---

# ENTITY & FUNCTIONALITY ARCHITECTURE

## 1. FORMAL TOPOLOGY & RULES

$$\text{Project} = \{\text{src/}\langle\text{Entity}\rangle\text{.ts}\} \cup \text{src/functionalities/} \cup \text{src/libraries/} \cup \text{src/protocol\_adapters/}$$

$$\begin{array}{ll}
\mathbf{R_1} \text{ (Flat Peer Entities)} & \forall e \in \text{Entities}: \text{Dir}(e) = \text{src/} \wedge \text{Dir}(e) \neq \text{src/entities/} \\
\mathbf{R_2} \text{ (Quad-Unit Packaging)} & \forall f \in \text{Func}: \text{Files}(f) = \{ \text{Atom.ts}, \text{main\_function/}, \text{state\_data/}, \text{helper\_functions/}, \text{events/}, \text{manifest.json} \} \\
\mathbf{R_3} \text{ (Zero Entity Libs)} & \forall e \in \text{Entities}: e \cap \text{src/libraries/*} = \emptyset \\
\mathbf{R_4} \text{ (Anti-Polling)} & \text{Loop}(\text{setInterval} \vee \text{onTick}) \implies \text{HALT} \wedge \text{Use}(\text{entity.emitEvent}, \text{entity.on})
\end{array}$$

## 2. DIRECTORY SCHEMA

```
src/
├── <EntityA>.ts, <EntityB>.ts       # Flat peer entities (/** @role skeleton */)
├── functionalities/<Feature>/       # Shared quad-unit feature implementations
│   ├── <Feature>Atom.ts             # Capability spec & metadata
│   ├── main_function/logic.ts       # Orchestrator: (input, { state, entity })
│   ├── state_data/state.ts          # State schema & atomic accessors (/** @role component */)
│   ├── helper_functions/            # Pure L0A helpers (/** @role component */)
│   ├── events/                      # Domain event emitters (/** @role component */)
│   └── manifest.json                # Declared npm packages & tools
├── libraries/                       # Shared concepts (Math, Data, Validation) - Func ONLY
└── protocol_adapters/               # Ingress adapters (HttpsAdapter.ts, WssAdapter.ts)
```

## 3. ORCHESTRATION & EXECUTION MATRIX

```typescript
// Entity Orchestration Law: Entities compose functionalities, NOT raw libraries
export class OrderEntity extends Entity<OrderState, OrderEvents> {
  setup() {
    this.flow("process")
      .thenFunctionality("ValidateOrder")             // Allowed
      .thenEntityOrchestration("BillingEntity", "pay") // Cross-entity Allowed
      // .thenFunction(rawLibFunc)                    // STRICTLY FORBIDDEN
  }
}
```

```
CLI Commands:
- Single Entity: krnl dev --entity <EntityName> | krnl build --entity <EntityName>
- Combined Build: krnl dev --all | krnl build --all
```
