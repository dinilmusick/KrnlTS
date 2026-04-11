# Exhibit 7: Network Orchestrator Entity

This example demonstrates the new `krnlNetworkOrchestratorEntityBase`.

## What it validates

1. The orchestrator can reference active systems and inspect/manage their routes.
2. The orchestrator can command **system-to-system wiring** (source emitter → target collector).
3. A route can be marked immutable (`externallyMutable: false`) so non-manager orchestrators cannot disconnect it.
4. The managing orchestrator can still disconnect its own managed route.

## Run

```bash
node examples/example7/OrchestratorSystem/OrchestratorSystem.js
```

Expected output sequence:
- Route creation logged.
- Data emission from `SourceSystem` reaches `TargetSystem` through `system-commands`.
- External disconnect attempt is rejected.
- Manager orchestrator disconnect succeeds.

