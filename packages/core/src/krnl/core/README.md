# Krnl Core Subsystem (`src/krnl/core/`)

## 1. Directory Purpose & Architectural Role
Houses the central Gross Architecture composition and orchestration primitives. In the Krnl paradigm, **the entity tree IS the kernel**, and capabilities bubble up from atomic functionalities to root ingress adapters.

## 2. File Manifest (Key Primitives)
| File | Responsibility |
| :--- | :--- |
| `K_ENT_Entity.ts` | The unified `Entity<TState, TEvents>` class supporting state reactivity, protocol adapter hosting, and sub-app registration. |
| `K_ENT_Krnl_Entity_Base.ts` | Foundation entity class providing interface promotion, hierarchical lifecycle management, and backend credential cascading. |
| `K_LIB_Krnl_Functionality_Types.ts` | Atomic functionality unit (`krnlLocalFunctionality`) owning logic, state, table CRUD, emitters, helpers, and schemas. |
| `K_LIB_Krnl_Flow.ts` | Pipeline orchestration builder (`KrnlFlowBuilder`) for sequential multi-step execution graphs. |
| `K_LIB_Krnl_SubApp_Engine.ts` | Sub-App discovery, registration, lifecycle, and validation engine. |
| `K_LIB_Krnl_SubApp_Worker_Host.ts` | Isolated process runner for worker-type sub-apps. |
| `K_LIB_Krnl_Protocol_MCP.ts` | Model Context Protocol adapter for exposing functionalities as agent tools. |
| `K_LIB_Krnl_Protocol_ACP.ts` | Agent Communication Protocol adapter for inter-agent messaging. |
| `K_LIB_Krnl_System_Unified_Http_Adapter.ts` | Single-port unified HTTP, WebSocket, and REST ingress server. |
| `K_LIB_Krnl_System_Magnetic_Loader.ts` | Filesystem auto-loader mapping folders directly to runtime entity trees. |
| `K_LIB_Krnl_Telemetry.ts` | Sub-millisecond performance, latency, and memory tracking engine. |

## 3. Data Flow & Execution Topology
- Functionalities execute inside their host entities.
- Root entities host active protocol adapters and expose unified ports to the network.
- Events emitted on `krnlEmitter` bubble to parent entities and external subscribers over WebSocket streams.
