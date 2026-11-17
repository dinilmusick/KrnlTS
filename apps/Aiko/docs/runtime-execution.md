# Aiko Runtime Execution

## Boundary and execution model

FOD is an internal Aiko workflow subsystem. Its graph engine, scheduler, node registry and editor are implementation components of the Aiko application; they are not a separately deployed service, package, iframe or HTTP dependency.

```text
Browser
  -> Aiko native Workflow UI
  -> Aiko authenticated workflow API
  -> in-process FOD graph engine and scheduler
  -> Aiko workflow, workspace, credential and RuntimeService APIs
  -> registered provider adapter (when available)
```

The browser communicates with Aiko only. Graph loading, saving, validation, scheduling, execution state and result delivery remain within Aiko's application boundary. Internal engine calls are in-process calls, not requests to a FOD server.

## Runtime contracts

- **RuntimeService** coordinates provider lookup, account resolution, resource lifecycle, handle persistence and cleanup.
- **RuntimeProviderRegistry** contains the adapters actually registered by the running Aiko composition. A provider being represented in a node palette or account form does not mean its execution adapter is available.
- **RuntimeProvider** declares a provider ID, supported capabilities, configuration validation and provider-specific resource operations.
- **RuntimeAccount** is workspace-scoped and selects a provider account. Credential material is resolved from Aiko's credential store only for the provider operation.
- **RuntimeHandle** is a secret-free resource reference scoped to a workspace and execution. It must not contain credentials, bearer tokens, private keys or signed secret URLs.
- **RuntimeNodeAdapter** maps graph nodes such as spawn, execute, status and destroy onto the in-process RuntimeService contract. Unsupported capabilities fail explicitly.

## Identity, authorization and workspace scope

Luth is the sole identity and session authority. Aiko does not create a FOD identity, password store or independent session. The request enters through Aiko's Luth-authenticated application boundary; Aiko validates the session and authorizes access to the selected workspace before loading or executing a graph.

The authenticated user and workspace context are derived by the server. Caller-supplied user IDs, identity headers, graph fields or query parameters are not authority. Every workflow, graph, version, execution, log, result, runtime account and persisted handle is scoped to its owning Aiko workspace.

## Persistence and lifecycle

Workflow state belongs to Aiko's existing workspace persistence and storage architecture. The internal workflow subsystem owns graph definitions and their versions, execution records, logs and results through those Aiko services; it must not rely on FOD-local files or a separate FOD database.

Runtime handles are references, not credentials. Persistent handles survive an execution according to provider lifecycle semantics. Transient resources are tied to an execution and must be terminated and have their transient references removed in a `finally` cleanup path, including when graph execution or result persistence fails. Cleanup must be scoped by both workspace and execution.

The runtime-handle serializer rejects credential-bearing fields and secret-like URLs. Provider adapters must return safe access descriptors and must not copy credential payloads into graph data, handles, logs or API responses.

## Provider availability

Aiko dispatches only to adapters registered in its RuntimeProviderRegistry. The current integration work defines account, node and runtime contracts for providers such as Google Cloud Shell, Fly.io and GitHub Codespaces, but **no live cloud execution adapter is registered by default**. Until a real adapter is implemented, registered and verified, execution for that provider must fail explicitly with `PROVIDER_UNAVAILABLE`; saved account metadata is not proof of working execution.

Do not describe cloud execution, SSH, filesystem, ports or any other capability as available unless the corresponding adapter advertises and implements it.

## Internal node lifecycle

A typical graph uses the following lifecycle:

1. **Spawn** validates the provider configuration, verifies the workspace-owned account and resolves its credential internally.
2. **Execute** invokes only capabilities advertised by the selected adapter and account.
3. **Status** reports the provider resource lifecycle without exposing credential material.
4. **Destroy** terminates the resource according to its persistence policy.
5. **Execution cleanup** always terminates transient resources associated with the current workspace and execution.

The graph scheduler owns ordering, cancellation and finalization. Node implementations do not make HTTP requests back into Aiko or to an external FOD service.

## Development and verification

Run the application and checks from the Aiko repository:

```sh
npm run dev
npm run lint
npm test
npm run build:fullstack
npm run build:api
```

Runtime unit tests should use deterministic fake providers and isolated workspace storage. They should cover registration and unavailable-provider behavior, workspace ownership, credential secrecy, capability checks, handle serialization, persistence, transient cleanup and failure paths. Tests that require a real cloud account must be separately identified and must not be represented as passing based on mocks.

## Historical migration note

Older standalone FOD deployments may contain graph files, execution records, logs or credentials outside Aiko. This architecture does not establish a safe automatic importer or guarantee schema compatibility with those stores. Do not point Aiko at a legacy FOD database, delete the old deployment or assume its data has migrated. Preserve a backup and retain the old deployment until a separately specified, tested migration tool and explicit data mapping exist. Credentials should be re-entered into the appropriate Aiko workspace credential store rather than copied into graph definitions or runtime handles.
