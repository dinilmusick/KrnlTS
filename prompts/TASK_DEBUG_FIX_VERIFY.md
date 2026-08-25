# TASK: DEBUG_FIX_AND_VERIFY_PROTOCOL
$DEBUG := \text{Diagnose}(\mathcal{E}) \to \text{Patch}(\mathcal{P}) \to \text{Verify}(\mathcal{V}) \quad \text{s.t.} \quad \text{Regressions} = \emptyset

## 1. IN-CODE UTILITY DOCUMENTATION, SECTION DEMARCATION & NAMING RULES
- **Naming**: Use long, descriptive names for all test cases, diagnostic harnesses, and assertion helpers (e.g., `verifyUserSessionAuthenticationAndPermissionCascading`).
- **Docblocks**: Document the utility of all verification routines with an ASCII test sequence flow chart.
- **Section Demarcation**: Partition setup, test executions, assertions, and cleanup with `// ══════════════════════════════════════════════════════════════════════════════════════════`.

## 2. ERROR TAXONOMY & RESOLUTION MATRIX
$$\begin{array}{lll}
\text{Error Tag} & \text{Root Cause} & \text{Resolution Action} \\
\hline
\text{[AccessDenied]} & \text{Port/Key/Admin mismatch} & \text{Verify AdminGuard token format ("sess::<userId>::...") or header key} \\
\text{[DependencyGate]} & \text{Unsatisfied requires spec} & \text{Check entity capability resolution or startup boot barrier} \\
\text{[KrnlSchemaError]} & \text{Input/Output type mismatch} & \text{Validate payload against Zod/Protobuf definitions} \\
\text{[KrnlBackendWarning]} & \text{Table or DB connection error} & \text{Ensure provider credentials and filePath/endpoint are valid}
\end{array}$$

## 3. CANONICAL REPRODUCTION & VERIFICATION SCRIPT TEMPLATE
```typescript
// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & TEST HARNESS SETUP
// ══════════════════════════════════════════════════════════════════════════════════════════
import { Entity, krnlLocalFunctionality } from "../dist/index.js";

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * TEST SUITE: verifyUserSessionAuthenticationAndPermissionCascading
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Automated regression test verifying that session token validation and table CRUD
 *          mutations complete without contract violations.
 *
 * Test Flow Chart:
 *   [Initialize Root Entity] ───► [Configure Backend Credentials]
 *                                           │
 *                                           ▼
 *                              [Invoke Target Functionality]
 *                                           │
 *                                           ▼
 *                              [Assert Exact Return Schema] ───► [Cleanup & Exit 0]
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
async function verifyUserSessionAuthenticationAndPermissionCascading(): Promise<void> {
  console.log("Starting automated verification harness...");
  const testRootSystemEntity = new Entity("TestRootSystemEntity");

  // 1. Setup & Configure Backend
  testRootSystemEntity.configureBackend({
    defaultService: "sqlite",
    sqlite: { type: "sqlite", filePath: "./test_temp.sqlite", enableWAL: true }
  });

  // 2. Execute Functionality Call
  const executionResult = await testRootSystemEntity.call("track_user_activity_metrics", {
    userId: "usr_regression_test_01",
    activityType: "LOGIN"
  });

  // 3. Assert Expected Invariants
  if (!executionResult || executionResult.status !== "success") {
    throw new Error(`Regression detected: Expected success status, received ${JSON.stringify(executionResult)}`);
  }

  console.log("✅ All regression assertions passed with 0 errors!");
}

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. TEST EXECUTION RUNNER
// ══════════════════════════════════════════════════════════════════════════════════════════
verifyUserSessionAuthenticationAndPermissionCascading().catch((error: Error) => {
  console.error("❌ Verification failed with error:", error.message);
  process.exit(1);
});
```

## 4. VERIFICATION PROTOCOL (MANDATORY CHECKS)
1. **Compilation Check**: `npm run build` must produce clean ESM, CJS, and DTS bundles with 0 errors.
2. **Unit & Integration Run**: Run `node examples/test_{feature}.js`.
3. **Full Regression Suite**: Run `node examples/test_all_examples.js` to ensure zero regressions across the codebase.
```
