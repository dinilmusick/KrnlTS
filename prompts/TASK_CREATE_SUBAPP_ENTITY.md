```markdown
# TASK: CREATE_SUBAPP_OR_ENTITY_PROTOCOL
$TOPOLOGY := \text{Tree}(\mathcal{E}) \quad \text{where } \mathcal{E} = \{ \text{Entity}_1, \dots, \text{Entity}_n \}

## 1. ROOT VS CHILD POSITION RULE (CRITICAL)
$$\text{Position}(E) = \begin{cases}
\text{ROOT} & \text{if } E.\text{hierarchyManager}.\text{getOwnerEntity}() = \emptyset \implies \text{Adapters ACTIVE (Unified Port: REST/WS/MCP/ACP)} \\
\text{CHILD} & \text{if } E.\text{hierarchyManager}.\text{getOwnerEntity}() \neq \emptyset \implies \text{Adapters DORMANT (Capabilities bubble up to Root)}
\end{cases}$$

## 2. STANDARD ENTITY DECLARATION TEMPLATE
```typescript
import { Entity, krnlLocalFunctionality } from "@dinilmusick/krnlts";

export interface MyEntityState {
  status: "IDLE" | "PROCESSING" | "ERROR";
  itemsCount: number;
}

export class MyEntity extends Entity<MyEntityState> {
  constructor(name = "MyEntity", owner = null) {
    super(name, owner, {
      initialState: { status: "IDLE", itemsCount: 0 }
    });

    // 1. Attach Local Functionalities
    this.addLocal(myActionFunctionality);
  }
}
```

## 3. SUB-APP REGISTRATION & MANIFEST PROTOCOL
When declaring a self-contained sub-app / microservice under an Entity:
```typescript
import { Entity, type SubAppDescriptor } from "@dinilmusick/krnlts";

const descriptor: SubAppDescriptor = {
  id: "analytics_subapp",
  name: "Analytics Service",
  version: "1.0.0",
  type: "embedded", // "embedded" | "worker" | "remote"
  operations: [
    {
      id: "generateReport",
      name: "Generate Report",
      description: "Generates monthly activity metrics",
      parameters: { type: "object", properties: { month: { type: "string" } } },
      execute: async (input, ctx) => {
        return { reportId: `rep_${Date.now()}`, month: input.month };
      }
    }
  ],
  events: [
    { id: "report:ready", name: "Report Ready Event" }
  ]
};

// Register under host entity
parentEntity.registerSubApp(descriptor);
```

## 4. INVARIANTS
1. Sub-apps must be fully self-contained and independently testable.
2. If `type: "worker"`, the sub-app will be executed in an isolated worker host process.
3. All public functionalities attached to child entities automatically register in the parent interface.
```
