---
name: state-execution-spec
description: Formal specification and enforcement directives for SKIPO::STATE_EXECUTION_ARCHITECTURE.
---

# SKIPO::STATE_EXECUTION_ARCHITECTURE

$$\text{Valid}(\mathcal{A}) \iff \text{SkipoState}(\mathcal{A}) \wedge \text{AcyclicLifecycle}(\mathcal{A}) \wedge \text{PQueueExecution}(\mathcal{A}) \wedge \text{QueueRunnerFacadeBoundary}(\mathcal{A}) \wedge \text{Invariants}_{1..20}(\mathcal{A})$$

## 0. CANONICAL TOPOLOGY

```
SKIPO
├── FRONTEND
│   ├── STATE
│   │   └── Zustand (SKIPO_STATE)
│   └── EXECUTION
│       └── p-queue (In-Process Command Scheduler)
│
└── BACKEND
    └── FACADE (Single Public Execution Interface - Queue Runner Only)
        └── SERVICE (Domain-Level Orchestration Unit)
            └── COMPONENT (Smallest Deterministic Executable Domain Operation)
```

---

## 1. FRONTEND STATE SYSTEM (`SKIPO_STATE`)

$$\text{STATE\_SYSTEM} := \text{SKIPO\_STATE}, \quad \text{STATE\_STORE} := \text{Zustand}, \quad \text{STATE\_ACCESS} := \text{GLOBAL\_ONLY}$$

$$\forall \text{Component } C: C.\text{state} \subseteq \text{SKIPO\_STATE}, \quad C \notin \{\text{ReactLocalState}, \text{PropDrillingState}\}$$

### 1.1 State Entry Schema
$$\text{STATE\_ENTRY} := \{ \text{owner}, \text{lifecycle}, \text{value}, \text{dependencies} \}$$

### 1.2 Lifecycle Scopes
$$\text{LIFECYCLE\_SCOPE} \in \{ \text{COMPONENT}(C), \text{PAGE}(P), \text{APP}, \text{COMPONENT\_DEPENDENCY}(C_2), \text{STATE\_DEPENDENCY}(S_2) \}$$

- **COMPONENT(C)**: $\text{mount}(C) \implies \text{create}(S), \quad \text{unmount}(C) \implies \text{destroy}(S)$
- **PAGE(P)**: $\text{mount}(P) \implies \text{create}(S), \quad \text{unmount}(P) \implies \text{destroy}(S)$
- **APP**: $\text{app.start} \implies \text{create}(S), \quad \text{app.stop} \implies \text{destroy}(S)$
- **COMPONENT\_DEPENDENCY**($C_2$): $\text{mount}(C_2) \implies \text{retain}(S), \quad \text{unmount}(C_2) \implies \text{destroy}(S)$
- **STATE\_DEPENDENCY**($S_2$): $\text{create}(S_2) \implies \text{retain}(S_1), \quad \text{destroy}(S_2) \implies \text{destroy}(S_1)$

### 1.3 Lifecycle Graph Invariant
$$G_{state} = (V, E), \quad V := \text{Components} \cup \text{States} \cup \text{Pages} \cup \text{APP}, \quad E := \text{lifecycle\_dependency}$$

$$\text{cycle}(S_1 \dots S_n \to S_1) := \text{INVALID}$$
$$\text{destroy}(X) \implies \text{recursively\_destroy}(\text{dependents}(X)) \wedge \text{remove}(S, \text{Zustand})$$

---

## 2. EXECUTION SYSTEM (`SKIPO_EXECUTION`)

$$\text{EXECUTION\_PIPELINE} := \text{FRONTEND\_COMPONENT} \to \text{SKIPO\_COMMAND} \to \text{p-queue} \to \text{JOB} \to \text{QUEUE_RUNNER} \to \text{BACKEND\_FACADE} \to \text{SERVICE} \to \text{OPERATION\_COMPONENT}$$

### 2.1 Boundary Inviolability
$$\text{DIRECT\_COMPONENT} \to \text{BACKEND\_FACADE} := \text{FORBIDDEN}$$
$$\text{DIRECT\_COMPONENT} \to \text{SERVICE} := \text{FORBIDDEN}$$
$$\text{DIRECT\_COMPONENT} \to \text{DATABASE} := \text{FORBIDDEN}$$
$$\text{DIRECT\_COMPONENT} \to \text{EXTERNAL\_SERVICE} := \text{FORBIDDEN}$$

### 2.2 Command & Job Schemas
$$\text{COMMAND} := \{ \text{id}, \text{type}, \text{payload}, \text{metadata}, \text{correlationId}, \text{lifecycle}, \text{createdAt} \}$$
$$\text{JOB} := \{ \text{command}, \text{idempotencyKey}, \text{correlationId}, \text{retryPolicy}, \text{priority}, \text{dependencies} \}$$

### 2.3 Backend Facade Boundary
$$\text{BACKEND\_FACADE} := \text{SINGLE\_PUBLIC\_EXECUTION\_INTERFACE}, \quad \text{FACADE\_ACCESS} := \text{QUEUE_RUNNER\_ONLY}$$
$$\text{Facade} = \{ \text{routing}, \text{validation}, \text{authorization}, \text{orchestration}, \text{service dispatch}, \text{result normalization}, \text{error normalization} \}$$

### 2.4 Operation Components
$$\text{OPERATION\_COMPONENT} := \text{smallest executable domain operation} \quad (x \mapsto y \text{ deterministic})$$

---

## 3. ORDERING & IDEMPOTENCY

$$\forall \text{Observable Job } J: \text{idempotencyKey}(J) := \text{REQUIRED}$$
$$\text{duplicate}(J) \implies \text{single logical effect}, \quad \text{retry}(J) \implies \text{safe}$$

$$J_1 \to J_2 \implies J_2 \text{ depends on } J_1 \implies \text{execute}(J_2) \impliedby \text{complete}(J_1)$$

---

## 4. RESULT FLOW

$$\text{operation} \to \text{service} \to \text{facade} \to \text{queue runner} \to \text{job\_result} \to \text{frontend\_state\_update} \to \text{Zustand}$$
$$\text{result} := \{ \text{correlationId}, \text{status}, \text{data}?, \text{error}? \}$$

$$\text{Zustand} \neq \text{execution queue}, \quad \text{p-queue} \neq \text{state store}$$

---

## 5. ARCHITECTURAL INVARIANTS ($I_1 - I_{20}$)

- $I_1$: Zustand is the sole frontend application state store.
- $I_2$: SKIPO_STATE is the lifecycle abstraction over Zustand.
- $I_3$: Every registered state MUST have an explicit lifecycle.
- $I_4$: Lifecycle dependency connects to arbitrary valid component/state/page/app target.
- $I_5$: Lifecycle dependency graph MUST be acyclic.
- $I_6$: Lifecycle termination triggers deterministic cascade state destruction.
- $I_7$: Every backend-bound frontend operation is scheduled through p-queue.
- $I_8$: Frontend component $\to$ backend facade is strictly FORBIDDEN.
- $I_9$: Frontend component $\to$ service is strictly FORBIDDEN.
- $I_{10}$: Frontend component $\to$ database is strictly FORBIDDEN.
- $I_{11}$: Queue Runner $\to$ backend facade is REQUIRED.
- $I_{12}$: Facade is the single backend execution boundary.
- $I_{13}$: Facade delegates exclusively to domain services.
- $I_{14}$: Services delegate to operation components.
- $I_{15}$: Undocumented execution paths are FORBIDDEN.
- $I_{16}$: Job dependency ordering MUST be explicit in DAG.
- $I_{17}$: Race-prone shared mutations MUST be atomic or dependency-controlled.
- $I_{18}$: Retries MUST be idempotency-safe.
- $I_{19}$: State $\neq$ Execution.
- $I_{20}$: Execution $\neq$ Persistence.


## 6. QUEUE RUNTIME LIMITS

- `p-queue` is the sole canonical scheduling engine for Skipo command execution.
- Queue contents, status, and idempotency caches are process-local and volatile; they are lost on process exit and are not shared between replicas.
- Do not configure Redis, an external broker, or a separate worker process for this queue contract.
- The queue runner is an in-process function scheduled by p-queue, not a worker process. Durable execution, cross-process coordination, and crash recovery are outside this queue contract and require a separately specified persistence/orchestration layer if ever needed.
