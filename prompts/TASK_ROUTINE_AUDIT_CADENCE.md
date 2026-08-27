# TASK: ROUTINE_AUDIT_AND_CADENCE_DEBUG_PROTOCOL
$CADENCE := \text{ReadState}(\mathcal{S}) \to \begin{cases} \text{AuditAndRemediate}(\mathcal{C}) \to \text{ResetState}(\mathcal{S}) & \text{if } \text{turns} \ge \text{threshold} \\ \text{IncrementCounter}(\mathcal{S}) \to \text{ExecuteEdit}(\mathcal{C}) & \text{otherwise} \end{cases}

## 1. PERSISTENT TURN-COUNTER ENGINE (`.skipo/agent-state.json`)
Before executing or proposing any code edits, inspect `.skipo/agent-state.json`:
```json
{
  "turnsSinceLastAudit": 0,
  "auditCadenceThreshold": 5,
  "totalTurns": 0,
  "lastAudit": {
    "timestamp": "2026-08-26T12:00:00.000Z",
    "status": "PASSED",
    "refactorsPerformed": [],
    "checksPassed": ["quad_units", "layer_purity", "line_limits", "deduplication", "anti_polling", "zero_mock", "diagnostics"]
  },
  "history": []
}
```

## 2. AUDIT CADENCE EXECUTION PROTOCOL
$$\begin{array}{lll}
\text{Condition} & \text{Action} & \text{State Transition} \\
\hline
\text{turnsSinceLastAudit} \ge 5 & \textbf{MANDATORY AUDIT \& DEBUG} & \text{Audit} \to \text{Remediate} \to \text{Test} \to \text{turnsSinceLastAudit} = 0 \\
\text{turnsSinceLastAudit} < 5 & \textbf{NORMAL EDIT} & \text{turnsSinceLastAudit} = \text{turnsSinceLastAudit} + 1 \to \text{Apply Prompt}
\end{array}$$

## 3. 6-PILLAR AUDIT & APP DEBUGGING CHECKLIST
1. **Quad-Units**: All features reside in `entities/<EntityName>/functionalities/<FeatureName>/` with `main_function/`, `state_data/`, `helper_functions/`, `events/`, `manifest.json`.
2. **Layer Purity**: Strict $L_0 \to L_1 \to L_2 \to L_3$ flow. Zero inline calculations in $L_1/L_2$. Zero direct calls from $L_2/L_3$ to $L_0$.
3. **Multi-Tier Line Limits**: Files $\le 200$ lines, helpers $\le 30$ lines, main functions $\le 20$ lines.
4. **Deduplication**: Abstract shared structs ($\ge 65\%$ overlap) into `libraries/{Domain}Concepts.ts`. Unify identical signatures.
5. **Anti-Polling**: Zero `onTick()` or `setInterval` busy loops. Enforce `state:changed` and reactive event bus listeners.
6. **Diagnostics & Tests**: Run `npm run build` & regression tests (`node examples/test_*.js`). Ensure 0 compilation or runtime errors.

## 4. IN-CODE DOCUMENTATION & BOLD DEMARCATION
- Every refactored or new file MUST include docblocks with ASCII flowcharts.
- Section partitions MUST use `// ══════════════════════════════════════════════════════════════════════════════════════════`.
- Identifiers MUST use long, descriptive naming (zero single-letter abbreviations).
