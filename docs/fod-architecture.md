# Internal FOD Subsystem Architecture

## Decision

FOD is absorbed into Aiko as an internal workflow subsystem. Aiko is the only application boundary. FOD is not a separately deployed service, Skipo module, npm runtime dependency, iframe, remote editor or HTTP peer.

The standalone Fod-Engine repository is a historical source/migration reference only. Aiko must not require it at runtime, deploy it alongside Aiko, embed its frontend, or make network calls to it.

## Component ownership

| Component | Owner | Responsibility |
|---|---|---|
| Workflow UI and graph editor | Aiko frontend | Graph authoring, node palette, inspectors, execution visualization and themes |
| Workflow API | Aiko backend | Luth session validation, workspace authorization, graph/version/execution APIs |
| Graph engine | Internal FOD subsystem | Graph contracts, validation, node execution and result propagation |
| Scheduler | Internal FOD subsystem | Execution lifecycle, ordering, cancellation and finalization |
| Node registry | Internal FOD subsystem | Node definitions and adapters, including Aiko runtime nodes |
| Persistence | Aiko workspace services | Workspace-scoped graphs, versions, executions, logs and results |
| Runtime lifecycle | Aiko RuntimeService | Provider selection, accounts, resource handles and transient cleanup |
| Credentials | Aiko credential services | Workspace-owned secrets, resolved only server-side for provider operations |
| Identity and sessions | Luth | Sole authentication and session authority |

## Request and execution flow

```text
Browser
  -> Aiko native Workflow UI
  -> Aiko workflow API
  -> Luth session validation + Aiko workspace authorization
  -> in-process FOD graph engine
  -> in-process FOD scheduler and node registry
  -> Aiko persistence / credential / RuntimeService contracts
  -> registered provider adapter
  -> workspace-scoped execution result
  -> Aiko API
  -> Browser
```

There is no FOD origin, service token, module token, reverse proxy, cross-application request or iframe boundary in this flow. Internal subsystems call their Aiko-owned interfaces directly.

## Security invariants

1. Luth is the only identity/session authority.
2. Aiko derives the authenticated principal from the validated Luth session; client-supplied identity is never trusted.
3. Every workflow resource is scoped to an Aiko workspace and every operation checks workspace authorization.
4. Credentials stay in Aiko's credential store and are never serialized into graph data, node outputs, logs or runtime handles.
5. Transient resources are cleaned up in a guaranteed execution-finalization path.
6. Provider capabilities are explicit. An unregistered adapter is unavailable, not simulated or silently substituted.

## Persistence contract

The Aiko workspace storage/database architecture owns workflow graphs, graph versions, execution metadata, logs and results. The internal FOD subsystem may define domain models and persistence interfaces, but it does not own a separate database or filesystem root. All storage access must carry the authorized workspace scope.

## Provider adapter status

Provider identities and credential forms do not imply provider execution. Only adapters registered in Aiko's RuntimeProviderRegistry can execute. At the time of this specification, live Google Cloud Shell, Fly.io and GitHub Codespaces adapters are not registered by default; execution must return an explicit unavailable-provider error until real adapters are delivered and verified.

## Local development and deployment

Develop, test, build and deploy Aiko as one Skipo full-stack application. Start the Aiko development server, run the Aiko test/build pipeline, and deploy the Aiko application with its canonical environment. Do not deploy a FOD server, FOD frontend, FOD worker, FOD database or FOD-specific origin.

See [setup and deployment](setup-deployment.md) and [runtime execution](runtime-execution.md) for operational details.
