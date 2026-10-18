# TASK: CREATE_FEATURE_PROTOCOL (KRNL_FUNCTIONALITY)
$GOAL := \text{CreateAtomicFeature}(F) \implies \text{krnlLocalFunctionality}(F) \in \text{Entity}(E)

## 1. ATOMIC COMPOSITION, NAMING & TOPOLOGY
$\forall \text{Feature } f$:
- File Location: `entities/{LongDescriptiveEntityName}/functionalities/{LongDescriptiveFeatureName}Functionality.ts`
- Naming Convention: Always use long, descriptive, unambiguous names for files, functions, types, and variables (zero cryptic abbreviations).
- Line Count Constraint: $| \text{Lines}(f) | \le 150$. (If $>150 \implies \text{split into } L_0/L_1 \text{ helpers}$).
- Rule: $\text{Functionality} = \langle \text{DocblockWithFlowchart}, \text{Logic}, \text{State}, \text{Schema}, \text{Emitters}, \text{Helpers}, \text{Table}, \text{Tests} \rangle$.

## 2. 4-LAYER PURITY SEPARATION (STRICT)
$$\begin{array}{lll}
L_0 \text{ (Pure Math)} & f_{\text{calc}}(x) \to y & \text{Deterministic, 0 IO, 0 State, No External Imports} \\
L_1 \text{ (Pure Transform)} & f_{\text{transform}}(D) \to D' & \text{Immutable mapping, Zod/Proto schema parse, pure delta} \\
L_2 \text{ (Impure IO)} & f_{\text{io}}(k) \xrightarrow{\text{IO}} v & \text{DB calls, HTTP/FS operations, Driver bindings} \\
L_3 \text{ (Functionality Atom)} & \text{krnlLocalFunctionality} & \text{Glues } L_0 \dots L_2 \text{ via context } \langle state, table, emitters, helpers \rangle
\end{array}$$
ASSERT: $L_a$ SHALL NEVER invoke $L_b$ for $a < b$.

## 3. ATOMIC DEDICATED TABLE BINDING (ONE-TABLE-PER-FUNCTIONALITY)
If feature persists state $\implies$ declare `backend` flag:
```typescript
backend: "sqlite" | "supabase" | "pocketbase" | "firebase" | true
```
$\implies$ Auto-binds `context.table` with built-in CRUD:
$$\{ \text{create}, \text{insert}, \text{findOne}, \text{find}, \text{update}, \text{delete}, \text{upsert}, \text{count}, \text{query}, \text{clear} \}$$

## 4. CANONICAL IMPLEMENTATION TEMPLATE (MANDATORY FORMAT)
```typescript
// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import { krnlLocalFunctionality } from "@ultrst-armada/krnl";
import { z } from "zod";

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. DATA SCHEMAS, INTERFACES & TYPES
// ══════════════════════════════════════════════════════════════════════════════════════════
export const UserActivityInputSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  activityType: z.enum(["LOGIN", "VIEW_PAGE", "PURCHASE_ITEM"]),
  metadata: z.record(z.any()).optional().default({})
});

export const UserActivityOutputSchema = z.object({
  status: z.enum(["success", "error"]),
  record: z.object({
    id: z.string(),
    userId: z.string(),
    activityType: z.string(),
    timestamp: z.number()
  }),
  totalActivitiesCount: z.number()
});

export type UserActivityInput = z.infer<typeof UserActivityInputSchema>;
export type UserActivityOutput = z.infer<typeof UserActivityOutputSchema>;

// ══════════════════════════════════════════════════════════════════════════════════════════
// 3. PURE HELPER FUNCTIONS & TRANSFORMATIONS (L0 / L1)
// ══════════════════════════════════════════════════════════════════════════════════════════

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * UTILITY: normalizeUserActivityPayload
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Normalizes incoming activity payload and appends a deterministic epoch timestamp.
 *
 * Flow Chart:
 *   [Raw Input] ───► [Zod Validation] ───► [Normalize Metadata] ───► [Attach Timestamp]
 *
 * Example:
 *   const normalized = normalizeUserActivityPayload({ userId: "usr_1", activityType: "LOGIN" });
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
function normalizeUserActivityPayload(input: UserActivityInput) {
  return {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: input.userId.trim().toLowerCase(),
    activityType: input.activityType,
    metadata: input.metadata || {},
    timestamp: Date.now()
  };
}

// ══════════════════════════════════════════════════════════════════════════════════════════
// 4. ATOMIC FUNCTIONALITY DECLARATION (L3)
// ══════════════════════════════════════════════════════════════════════════════════════════

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * FUNCTIONALITY: TrackUserActivityMetricsFunctionality
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Atomic functionality recording user activities to a dedicated SQLite/Postgres table,
 *          updating reactive state, and emitting the "activity:recorded" event stream.
 *
 * Flow Chart & Lifecycle:
 *   [Caller Request] ───► [L1: Schema Parse]
 *                                 │
 *                                 ▼
 *                        [L0: Normalize Payload]
 *                                 │
 *                                 ▼
 *                        [L2: Table CRUD Insert] ───► [Dedicated DB Table]
 *                                 │
 *                                 ▼
 *                        [L3: Emit Reactive Event & Return Result]
 *
 * Example Usage:
 *   const result = await entity.call("track_user_activity_metrics", {
 *     userId: "usr_1001",
 *     activityType: "LOGIN"
 *   });
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
export const TrackUserActivityMetricsFunctionality = new krnlLocalFunctionality({
  id: "track_user_activity_metrics",
  description: "Records and tracks real-time user activity events in dedicated storage.",
  visibility: "public", // Bubbles up to host entity interface
  backend: "sqlite",    // Auto-creates and binds dedicated table "track_user_activity_metrics"
  schema: {
    input: UserActivityInputSchema,
    output: UserActivityOutputSchema
  },
  initialState: {
    totalEventsRecorded: 0
  },
  api: async (input: UserActivityInput, context): Promise<UserActivityOutput> => {
    const { state, table, emitters } = context;

    // 1. Pure Transformation (L1)
    const normalizedRecord = normalizeUserActivityPayload(input);

    // 2. Dedicated Table CRUD Operation (L2)
    const persistedRecord = await table.create(normalizedRecord);
    const totalActivitiesCount = await table.count();

    // 3. Reactive State Mutation & Event Stream (L3)
    state.totalEventsRecorded += 1;
    emitters.get("state:changed")?.pushDataStreamToEmitter({
      prop: "totalEventsRecorded",
      value: state.totalEventsRecorded
    });

    return {
      status: "success",
      record: persistedRecord,
      totalActivitiesCount
    };
  },
  tests: [
    {
      name: "should successfully record user login activity",
      input: { userId: "user_test_01", activityType: "LOGIN" },
      expected: { status: "success" }
    }
  ]
});
```

## 5. ZERO-LEAK UI & ANTI-COPY INVARIANTS (FEATURE FRONTEND RULES)
1. **Zero UI Jargon**: Do not expose backend architecture terms ("Control Plane", "Data Plane", "RBAC", "Storage Adapter", "SyncEngine", "WorkspaceFS") in UI views or buttons.
2. **Zero Promotional / Instructional Copy**: Do not inject tutorial or explanatory text into the UI layout.
3. **Icon-Only Controls**: All buttons must be icon-only (SVG) with hover-only tooltips.
```
