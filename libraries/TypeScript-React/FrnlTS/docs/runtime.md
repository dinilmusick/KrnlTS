# FrnlTS Frontend Runtime

FrnlTS is the semantic frontend runtime layer for Krusbl. React is the concrete UI layer; FrnlTS attaches semantic state and event machinery to ordinary React components.

## Runtime modules

- **Lifecycle** — validated component/runtime lifecycle state machine.
- **Contracts** — versioned inputs, outputs, events, commands, and capabilities.
- **Commands and Effects** — explicit intent and effect execution boundaries.
- **Faults** — structured recoverable/retryable failures.
- **Resources and Scopes** — owned asynchronous resources with deterministic disposal.
- **Registry** — semantic registrations and capability checks.
- **Dependencies** — dependency graph validation and topology.
- **Routing** — typed route matching and URL construction.
- **Accessibility Contracts** — machine-checkable semantic accessibility rules.
- **Semantic Store** — Zustand-backed component state, semantic parent relationships, events, themes, and flows.

## Architecture

```text
Ordinary React components
        │
        ├── useFrnlComponent
        └── normal React composition
                │
                ▼
        Frnl semantic runtime
        ├── state / events / themes
        ├── flows
        ├── lifecycle / resources
        ├── contracts / capabilities
        ├── dependencies / registry
        ├── routing
        └── accessibility validation
```

There is no Frnl renderer layer. React components are rendered by React.

## Package subpaths

- `@dinilmusick/frnlts` — complete semantic runtime.
- `@dinilmusick/frnlts/runtime` — headless runtime.
- `@dinilmusick/frnlts/react` — direct React integration.
