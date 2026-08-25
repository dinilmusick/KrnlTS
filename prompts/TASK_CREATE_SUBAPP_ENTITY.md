# TASK: CREATE_SUBAPP_OR_ENTITY_PROTOCOL
$TOPOLOGY := \text{Tree}(\mathcal{E}) \quad \text{where } \mathcal{E} = \{ \text{Entity}_1, \dots, \text{Entity}_n \}

## 1. IN-CODE UTILITY DOCUMENTATION, SECTION DEMARCATION & NAMING RULES
- **Naming**: Always use long, descriptive names for entities and sub-apps (e.g., `CustomerBillingManagementEntity.ts`, `FinancialAnalyticsReportingSubAppDescriptor.ts`).
- **Docblocks**: Document the utility of all entities, reactive state models, and attached sub-apps with an ASCII hierarchy diagram.
- **Section Demarcation**: Partition imports, state models, constructor initialization, functionalities, and exports with `// ══════════════════════════════════════════════════════════════════════════════════════════`.

## 2. ROOT VS CHILD POSITION RULE (CRITICAL)
$$\text{Position}(E) = \begin{cases}
\text{ROOT} & \text{if } E.\text{hierarchyManager}.\text{getOwnerEntity}() = \emptyset \implies \text{Adapters ACTIVE (Unified Port: REST/WS/MCP/ACP)} \\
\text{CHILD} & \text{if } E.\text{hierarchyManager}.\text{getOwnerEntity}() \neq \emptyset \implies \text{Adapters DORMANT (Capabilities bubble up to Root)}
\end{cases}$$

## 3. CANONICAL ENTITY IMPLEMENTATION TEMPLATE
```typescript
// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import { Entity, krnlLocalFunctionality, type SubAppDescriptor } from "@dinilmusick/krnlts";

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
 *            └── [FinancialAnalyticsReportingSubApp] (Embedded Sub-App)
 *
 * Example:
 *   const billingEntity = new CustomerBillingManagementEntity("BillingDepartment");
 *   await billingEntity.call("process_invoice", { invoiceId: "inv_123" });
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

    // Attach atomic functionalities
    this.addLocal(ProcessInvoiceFunctionality);
  }
}

// ══════════════════════════════════════════════════════════════════════════════════════════
// 4. SUB-APP REGISTRATION DESCRIPTOR
// ══════════════════════════════════════════════════════════════════════════════════════════
export const FinancialAnalyticsReportingSubAppDescriptor: SubAppDescriptor = {
  id: "financial_analytics_reporting_subapp",
  name: "Financial Analytics & Reporting Sub-App",
  version: "1.0.0",
  type: "embedded", // "embedded" | "worker" | "remote"
  operations: [
    {
      id: "generateMonthlyRevenueReport",
      name: "Generate Monthly Revenue Report",
      description: "Aggregates revenue totals across all processed billing invoices",
      parameters: { type: "object", properties: { targetMonth: { type: "string" } } },
      execute: async (input, context) => {
        return { reportId: `rep_${Date.now()}`, month: input.targetMonth };
      }
    }
  ],
  events: [
    { id: "analytics:report_generated", name: "Analytics Report Generated Event" }
  ]
};
```
