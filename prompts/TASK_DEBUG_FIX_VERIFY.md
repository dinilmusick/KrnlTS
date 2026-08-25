```markdown
# TASK: DEBUG_FIX_AND_VERIFY_PROTOCOL
$DEBUG := \text{Diagnose}(\mathcal{E}) \to \text{Patch}(\mathcal{P}) \to \text{Verify}(\mathcal{V}) \quad \text{s.t.} \quad \text{Regressions} = \emptyset

## 1. ERROR TAXONOMY & RESOLUTION MATRIX
$$\begin{array}{lll}
\text{Error Tag} & \text{Root Cause} & \text{Resolution Action} \\
\hline
\text{[AccessDenied]} & \text{Port/Key/Admin mismatch} & \text{Verify AdminGuard token format or accessPolicy key headers} \\
\text{[DependencyGate]} & \text{Unsatisfied requires spec} & \text{Check entity capability resolution or startup boot barrier} \\
\text{[KrnlSchemaError]} & \text{Input/Output type mismatch} & \text{Validate payload against Zod/Protobuf definitions} \\
\text{[KrnlBackendWarning]} & \text{Table or DB connection error} & \text{Ensure provider credentials and filePath/endpoint are valid}
\end{array}$$

## 2. REPRODUCTION & VERIFICATION SCRIPT TEMPLATE
Always create an isolated test in `examples/test_{feature}.js`:
```typescript
import { Entity, krnlLocalFunctionality } from "../dist/index.js";

async function verify() {
  console.log("Starting verification...");
  const system = new Entity("TestSystem");
  
  // 1. Setup & Execute
  const result = await system.call("my_functionality", { testPayload: true });
  
  // 2. Assert Invariants
  if (!result || result.status !== "success") {
    throw new Error(`Assertion failed: expected success, got ${JSON.stringify(result)}`);
  }
  console.log("✅ Verification passed!");
}

verify().catch(err => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
```

## 3. VERIFICATION PROTOCOL (MANDATORY CHECKS)
1. **Compilation Check**: `npm run build` must produce clean ESM, CJS, and DTS bundles with 0 errors.
2. **Unit & Integration Run**: Run `node examples/test_{feature}.js`.
3. **Full Regression Suite**: Run `node examples/test_all_examples.js` to ensure zero regressions across the codebase.
```
