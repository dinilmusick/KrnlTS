# Krnl vNext API Reference

## `krnlEntityBase`

The foundation of every Krnl system. Entities are containers for logic (functionalities) and their scoped state.

Constructor:

```ts
new krnlEntityBase(name: string)
```

Methods:

- `addLocal(localFunctionality)`: Registers a logic block owned by this entity.
- `addRemote(remoteFunctionality)`: Registers a proxy to a functionality on another entity.
- `getLocal(fid)`: Retrieves a local functionality by ID.
- `getRemote(fid)`: Retrieves a remote functionality by ID.
- `call(fid, input?, opts?)`: Executes a functionality (local or remote).
- `dispose()`: Tears down the entity and all its components.

Properties:

- `id: string`: Unique identifier.
- `localFunctionalities: Map<string, krnlLocalFunctionality>`
- `remoteFunctionalities: Map<string, krnlRemoteFunctionality>`
- `interface: krnlInterface`: Handles low-level emitters and collectors.

## `krnlLocalFunctionality`

A self-contained block of logic and private state.

```ts
new krnlLocalFunctionality({
  id: string,
  state?: object,
  api?: (input, context) => any,
  helpers?: Record<string, Function> | Map<string, Function>,
  emitters?: Record<string, krnlEmitter> | Map<string, krnlEmitter>,
  collectors?: krnlCollector[],
  lifecycle?: {
    onInit?: Function,
    onCall?: Function,
    onComplete?: Function,
    onError?: Function
  }
})
```

Methods:

- `bindToEntity(entity)`: Attaches the functionality to a host.
- `execute(input, opts?)`: Runs the API logic.

## `krnlRemoteFunctionality`

A proxy that allows an entity to interact with a functionality on another entity.

```ts
new krnlRemoteFunctionality({
  id: string,
  target: {
    entity: Function | { createInstance?: Function, instantiate?: Function } | krnlEntityBase,
    functionality: string
  },
  proxy_api?: (input, opts, remoteSelf) => any,
  collectors?: krnlCollector[]
})
```

Methods:

- `bindToEntity(entity)`: Attaches the proxy to a host.
- `resolveTarget(opts?)`: Locates the actual target entity and functionality.
- `execute(input, opts?)`: Forwards the call to the target.
- `bindEvents(bindings)`: Connects collectors to emitters on the target functionality.

Invariants:

1. `LocalFunctionality` owns logic and private state.
2. `RemoteFunctionality` is forwarding-only (stateless proxy).
3. The `api` function handles request-response (returned values).
4. `emitters` within a functionality handle event streams (broadcasts).
