# Exhibit 4: Mechanism Changes (Streaming + One-Shot + Visibility Stop)

This exhibit is a **delta example** that demonstrates the exact behavior introduced in the latest library polish:

1. `public` bubbling from deep entities.
2. Visibility stop when an intermediate proxy is switched to `private`.
3. Collector consumption in both modes:
   - streaming (`subscribeTo(emitter, handler)`)
   - one-shot (`subscribeTo(emitter, handler, { mode: "once" })`)
   - promise-style one-shot (`collectNext(emitter, timeoutMs)`).

## Strict policy demonstrated
- Entity descriptor files only assemble components.
- Functionality descriptor files only assemble atom references.
- Logic exists only in `main_function/`, `helper_functions/`, `events/`, or library files.
- State data exists only in `state_data/` or library files.

## Run

```bash
node examples/example4/MechanismSystem/MechanismSystem.js
```

Expected result shape:
- `streamCount: 3`
- `onceCount: 1`
- `topLevelBlocked: true`
