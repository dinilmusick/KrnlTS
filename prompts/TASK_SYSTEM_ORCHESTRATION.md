```markdown
# TASK: SYSTEM_ORCHESTRATION_AND_P2P_PROTOCOL
$ORCH := \text{MagneticLoader} \otimes \text{IngressNetwork} \otimes \text{FlowPipelines}

## 1. MAGNETIC LOADER (FILESYSTEM AS COMPOSITION)
Directory structure automatically maps to runtime topology:
```
my_system/
├── entities/                 # Auto-mounted Child Entities
│   └── UserEntity/
│       └── functionalities/  # Auto-mounted Functionalities
├── functionalities/          # System-level Functionalities
├── protocol_adapters/        # Ingress Adapters (REST, WS, MCP)
└── flows/                    # KrnlFlowBuilder Pipelines
```
Bootstrapping via Magnetic Loader:
```typescript
import { KrnlSystemMagneticLoader, Entity } from "@dinilmusick/krnlts";

const system = new Entity("RootSystem");
const loader = new KrnlSystemMagneticLoader(system, "./my_system");
await loader.loadAll();
```

## 2. P2P INGRESS & SIBLING NETWORK
For distributed multi-instance communication:
```typescript
import { KrnlSiblingNetwork } from "@dinilmusick/krnlts";

const network = new KrnlSiblingNetwork({
  appName: "WorkerNode_A",
  registryPort: 10099 // Central Registry Host port
});

await network.initialize();
// Discover peer services dynamically
const peer = await network.resolvePeer("WorkerNode_B");
const result = await network.callPeer("WorkerNode_B", "compute_task", { data: 123 });
```

## 3. FLOW PIPELINES (KRNL_FLOW_BUILDER)
```typescript
import { KrnlFlowBuilder } from "@dinilmusick/krnlts";

const pipeline = new KrnlFlowBuilder("OrderProcessingFlow")
  .addStep("validate", { targetFunctionality: "validate_order" })
  .addStep("charge", { targetFunctionality: "charge_payment" })
  .addStep("notify", { targetFunctionality: "send_receipt" })
  .build();

const flowResult = await pipeline.execute(system, { orderId: "ord_123" });
```
```
