---
name: architecture-audit-cadence-and-deduplication
description: Mandatory persistent turn-counter state engine, routine cadence audit, app debugging, KrnlTS quad-unit compliance, deduplication, and 4-layer function isolation.
---

# CADENCE AUDIT & DEDUPLICATION (DENSE)

$$\text{Trigger}(\text{turns}) = (\text{turns} \ge 5) \implies \text{Audit}(\mathcal{P}) \wedge \text{Remediate}(\mathcal{P}) \wedge (\text{turns} \leftarrow 0)$$

## 1. STATE MACHINE ALGORITHM

```python
def check_cadence(workspace="."):
    state_file = f"{workspace}/.skipo/agent-state.json"
    state = read_json(state_file) if exists(state_file) else {"turns": 0, "threshold": 5, "total": 0}
    state["turns"] += 1
    state["total"] += 1
    
    if state["turns"] >= state["threshold"]:
        # 1. Run 6-pillar audit & diagnostics
        res = exec("python3 checklists/full_system_validator.py .")
        # 2. Auto-remediate deviations (dedup, purity, limits, anti-stub)
        if res.code != 0:
            auto_remediate()
        state["turns"] = 0
        state["lastAudit"] = now_iso()
        
    write_json(state_file, state)
```

## 2. 6-PILLAR AUDIT CONTRACT

```
1. Quad-Units   : Logic, Schema, Table, Tests per functionality.
2. Layer Purity : L0 (Math) -> L1 (Transform) -> L2 (IO) -> L3 (Context). Zero backward calls.
3. Line Limits  : <= 200 lines/file (150 for helpers). Decompose if exceeded.
4. Dedup        : Delta Logic = 0. Extract shared types to concepts/definitions.
5. Anti-Polling : No setInterval < 5000ms for network. Use SSE or backoff.
6. Zero Stubs   : Zero TODOs, real driver bindings, real assertions in tests.
```

## 3. CHECKLIST COMMAND
`python3 checklists/full_system_validator.py .`
