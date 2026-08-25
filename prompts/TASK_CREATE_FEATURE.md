```markdown
# TASK: CREATE_FEATURE_PROTOCOL (KRNL_FUNCTIONALITY)
$GOAL := \text{CreateAtomicFeature}(F) \implies \text{krnlLocalFunctionality}(F) \in \text{Entity}(E)

## 1. ATOMIC COMPOSITION & TOPOLOGY
$\forall \text{Feature } f$:
- File Location: `entities/{EntityName}/functionalities/{FeatureId}.ts`
- Line Count Constraint: $| \text{Lines}(f) | \le 150$. (If $>150 \implies \text{split into } L_0/L_1 \text{ helpers}$).
- Rule: $\text{Functionality} = \langle \text{Logic}, \text{State}, \text{Schema}, \text{Emitters}, \text{Helpers}, \text{Table}, \text{Tests} \rangle$.

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

## 4. CANONICAL IMPLEMENTATION TEMPLATE
```typescript
import { krnlLocalFunctionality } from "@dinilmusick/krnlts";
import { z } from "zod";

const InputSchema = z.object({ /* inputs */ });
const OutputSchema = z.object({ /* outputs */ });

// L0/L1 Pure Helper
function pureTransform(data: z.infer<typeof InputSchema>) {
  return { ...data, processedAt: Date.now() };
}

export const myFeatureFunctionality = new krnlLocalFunctionality({
  id: "my_feature",
  description: "Detailed description of feature",
  visibility: "public", // "public" (bubbles up to entity interface) | "private" (internal)
  backend: "sqlite",    // Auto-creates and binds dedicated table "my_feature"
  schema: { input: InputSchema, output: OutputSchema },
  initialState: { counter: 0 },
  api: async (input, context) => {
    const { state, table, emitters, entity, helpers } = context;
    
    // 1. Pure validation & transform (L1)
    const payload = pureTransform(input);

    // 2. Dedicated Table CRUD (L2)
    const record = await table.create({ id: `rec_${Date.now()}`, ...payload });

    // 3. Reactive State & Events (L3)
    state.counter += 1;
    emitters.get("state:changed")?.pushDataStreamToEmitter({ prop: "counter", value: state.counter });

    return { status: "success", record };
  },
  tests: [
    { name: "should execute successfully", input: {}, expected: { status: "success" } }
  ]
});
```
```
