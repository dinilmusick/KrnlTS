# TASK: CREATE_SUBAPP_OR_ENTITY_PROTOCOL
$TOPOLOGY := \text{Tree}(\mathcal{E}) \quad \text{where } \mathcal{E} = \{ \text{Entity}_1, \dots, \text{Entity}_n \}

## 1. IN-CODE UTILITY DOCUMENTATION, SECTION DEMARCATION & NAMING RULES
- **Naming**: Always use long, descriptive names for entities and sub-apps (e.g., `CustomerBillingManagementEntity.ts`, `FinancialAnalyticsReportingEngine`).
- **Docblocks**: Document the utility of all entities, reactive state models, and attached sub-apps with an ASCII hierarchy diagram.
- **Section Demarcation**: Partition imports, state models, constructor initialization, functionalities, and exports with `// ══════════════════════════════════════════════════════════════════════════════════════════`.

## 2. ROOT VS CHILD POSITION RULE (CRITICAL)
$$\text{Position}(E) = \begin{cases}
\text{ROOT} & \text{if } E.\text{hierarchyManager}.\text{getOwnerEntity}() = \emptyset \implies \text{Adapters ACTIVE (Unified Port: REST/WS/MCP/ACP)} \\
\text{CHILD} & \text{if } E.\text{hierarchyManager}.\text{getOwnerEntity}() \neq \emptyset \implies \text{Adapters DORMANT (Capabilities bubble up to Root)}
\end{cases}$$

## 3. SUB-APP ENGINE INVARIANTS (THE ZERO-SERVER RULE)
$$\text{SubApp Engine} = \{\text{Domain Core Logic}, \text{Declarative Operations}, \text{Self-Contained UI}, \text{Manifest}\}$$
1. **Zero-Server Rule**: Sub-apps **NEVER** bind listening OS ports, invoke `http.createServer()`, or start independent Express servers. Transport exposure (REST, WebSockets, MCP, ACP) is solely owned by the host Krnl Entity.
2. **Standard Manifest (`subapp.json`)**: Declares app metadata, registration entrypoint, dependencies, and optional UI spec.
3. **Registration Contract (`register.ts`)**: Exports `register(context: SubAppRegistrationContext): SubAppRegistration`.
4. **Standalone Decoupling (`engine/CoreEngine.ts`)**: Pure domain logic and models reside in an isolated, transport-agnostic engine class.
5. **Declarative Operations (`operations/`)**: Every operation defines typed Zod input/output schemas, descriptions, and handlers.

---

## 4. CANONICAL ENTITY IMPLEMENTATION TEMPLATE

```typescript
// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import { Entity, krnlLocalFunctionality } from "@dinilmusick/krnl";
import type { SubAppDescriptor, SubAppInstance } from "@dinilmusick/krnl";

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. DATA SCHEMAS, INTERFACES & REACTIVE STATE
// ══════════════════════════════════════════════════════════════════════════════════════════
export interface CustomerBillingEntityState {
  orchestrationStatus: "INITIALIZING" | "ACTIVE" | "MAINTENANCE";
  totalInvoicesProcessedCount: number;
  lastProcessedTimestamp: number;
}

// ══════════════════════════════════════════════════════════════════════════════════════════
// 3. ENTITY CLASS ORCHESTRATION & TOPOLOGY
// ══════════════════════════════════════════════════════════════════════════════════════════

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * ENTITY: CustomerBillingManagementEntity
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Manages the lifecycle, billing sub-apps, and invoice generation functionalities
 *          for the organization.
 *
 * Topology & Hierarchy Flow Chart:
 *   [Root System Entity]
 *            │
 *            ▼
 *   [CustomerBillingManagementEntity]
 *            ├── [ProcessInvoiceFunctionality] (Local Functionality)
 *            └── [FinancialAnalyticsEngine] (Mounted Sub-App Engine)
 *
 * Example:
 *   const billingEntity = new CustomerBillingManagementEntity("BillingDepartment");
 *   await billingEntity.boot();
 *   await billingEntity.call("FinancialAnalyticsEngine.generateReport", { targetMonth: "2026-08" });
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
export class CustomerBillingManagementEntity extends Entity<CustomerBillingEntityState> {
  constructor(entityName = "CustomerBillingManagementEntity", ownerEntity = null) {
    super(entityName, ownerEntity, {
      initialState: {
        orchestrationStatus: "INITIALIZING",
        totalInvoicesProcessedCount: 0,
        lastProcessedTimestamp: Date.now()
      }
    });

    // Attach local atomic functionalities
    this.addLocal({
      id: "process_invoice",
      description: "Process customer invoice and update billing state",
      api: async (input: { invoiceId: string; amount: number }) => {
        this.mutateState(s => {
          s.totalInvoicesProcessedCount++;
          s.lastProcessedTimestamp = Date.now();
        });
        return { status: "success", invoiceId: input.invoiceId };
      }
    });
  }

  /**
   * Boot lifecycle: Discover, mount, and register all sub-apps in subapps/.
   */
  async boot(): Promise<void> {
    const descriptors = await this.discoverSubApps("subapps");
    for (const desc of descriptors) {
      await this.loadSubApp(desc);
    }
  }
}
```

---

## 5. CANONICAL DRAG-AND-DROP SUB-APP ENGINE TEMPLATES

### 5.1 Sub-App Manifest (`subapps/FinancialAnalyticsEngine/subapp.json`)
```json
{
  "name": "FinancialAnalyticsEngine",
  "version": "1.0.0",
  "description": "High-performance financial computation and reporting engine",
  "registrationEntry": "./register.ts",
  "dependencies": {
    "zod": "^3.24.1"
  },
  "ui": {
    "title": "Financial Analytics",
    "entryPath": "./ui/index.html",
    "routePrefix": "/analytics"
  }
}
```

### 5.2 Pure Standalone Core Engine (`subapps/FinancialAnalyticsEngine/engine/FinancialCoreEngine.ts`)
```typescript
/**
 * @file FinancialCoreEngine.ts
 * @description Pure standalone business logic engine. Zero server code, transport-agnostic.
 */
export class FinancialCoreEngine {
  private records: Map<string, any> = new Map();

  public computeMonthlyReport(month: string): { reportId: string; month: string; totalRevenue: number } {
    return {
      reportId: `rep_${Date.now()}`,
      month,
      totalRevenue: 125000.50
    };
  }

  public cleanup(): void {
    this.records.clear();
  }
}
```

### 5.3 Declarative Operation (`subapps/FinancialAnalyticsEngine/operations/generateReport.ts`)
```typescript
import { z } from "zod";
import type { OperationDefinition } from "@dinilmusick/krnl";
import type { FinancialCoreEngine } from "../engine/FinancialCoreEngine.js";

export function createGenerateReportOperation(engine: FinancialCoreEngine): OperationDefinition {
  return {
    name: "generateReport",
    description: "Aggregates revenue totals across all processed billing invoices",
    input: z.object({
      targetMonth: z.string().min(1, "Target month is required (YYYY-MM)")
    }),
    output: z.object({
      reportId: z.string(),
      month: z.string(),
      totalRevenue: z.number()
    }),
    handler: async (input: { targetMonth: string }) => {
      return engine.computeMonthlyReport(input.targetMonth);
    },
    metadata: { category: "Analytics" }
  };
}
```

### 5.4 Registration Entrypoint (`subapps/FinancialAnalyticsEngine/register.ts`)
```typescript
import type {
  SubAppRegistrationContext,
  SubAppRegistration,
  OperationDefinition
} from "@dinilmusick/krnl";
import { FinancialCoreEngine } from "./engine/FinancialCoreEngine.js";
import { createGenerateReportOperation } from "./operations/generateReport.js";

export function register(context: SubAppRegistrationContext): SubAppRegistration {
  context.logger?.log?.(`[SubApp] Registering FinancialAnalyticsEngine on: ${context.entity?.id}`);

  // 1. Instantiate pure engine core
  const engine = new FinancialCoreEngine();

  // 2. Build declarative operations
  const operations: OperationDefinition[] = [
    createGenerateReportOperation(engine)
  ];

  // 3. Return SubAppRegistration
  return {
    name: "FinancialAnalyticsEngine",
    operations,
    ui: {
      title: "Financial Analytics",
      entryPath: "./ui/index.html"
    },
    onInitialize: async (ctx) => {
      ctx.events?.emit?.("analytics:ready", { timestamp: Date.now() });
    },
    onDispose: async () => {
      engine.cleanup();
    }
  };
}

export default register;
```

