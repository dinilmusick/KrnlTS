# Krnl vNext API Reference

## `krnlEntityBase`

Constructor:

```ts
new krnlEntityBase(name: string)
new krnlEntityBase({
  id: string,
  localFunctionalities?: LocalFunctionality[],
  remoteFunctionalities?: RemoteFunctionality[]
})
```

Methods:

- `addLocal(localFunctionality)`
- `addRemote(remoteFunctionality)`
- `getLocal(fid)`
- `getRemote(fid)`
- `call(fid, input?, opts?)`
- `dispose()`

Properties:

- `localFunctionalities: Map<string, krnlLocalFunctionality>`
- `remoteFunctionalities: Map<string, krnlRemoteFunctionality>`
- `collectors: Set<krnlCollector>`

Legacy properties remain for compatibility:

- `returnedFunctionalities`
- `broadcastFunctionalities`
- `stateManager`
- `interface`

## `krnlLocalFunctionality`

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

- `bindToEntity(entity)`
- `execute(input, opts?)`

## `krnlRemoteFunctionality`

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

- `bindToEntity(entity)`
- `resolveTarget(opts?)`
- `execute(input, opts?)`
- `bindEvents(bindings)`

Invariants:

1. `LocalFunctionality` owns logic/state.
2. `RemoteFunctionality` is forwarding-only.
3. Cross-entity invocation should happen through remote functionalities.
