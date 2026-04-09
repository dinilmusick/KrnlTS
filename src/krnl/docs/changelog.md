# KrnlJS Changelog (v1.2.0)

This document outlines the major architectural changes introduced in v1.2.0. If you are updating a legacy project, please follow the "Migration Steps" section below.

## [1.2.0] - 2026-04-07

### Added
- **Transport-Agnostic `RemoteFunctionality`**: `krnlRemoteFunctionality` now uses the `TransportAdapter` interface.
- **`MemoryTransportAdapter`**: Default adapter for local communication.
- **`WebSocketTransportAdapter`**: New adapter for network-based RPC calls.
- **Proxied State Observability**: Functionality state is now reactive via JavaScript `Proxy`.
- **Automatic `state:changed` Event**: Every `LocalFunctionality` now includes a `state:changed` emitter by default.
- **Standardized Lifecycle Hooks**: Added `onMount` and `onTeardown` support in `krnlLocalFunctionality` descriptors.
- **Input Schema Validation**: Added `schema` field to `krnlLocalFunctionality` for automated payload validation (supports Zod or custom functions).
- **Improved RPC Error Handling**: RPC calls now return structured error messages from the remote end.

### Changed
- `krnlRemoteFunctionality`: `targetEntity` is now optional if `transport` is provided.
- `krnlLocalFunctionality`: `events.beginning` and `events.teardown` are now mapped to `onMount` and `onTeardown` for clarity.

## Migration Steps for Legacy Projects

### 1. Update Remote Functionality Registration
If you were manually wrapping WebSocket calls inside a fake `targetEntity` object:
```javascript
// Old (v1.1.0)
entity.addRemote({
  id: "RemoteFunc",
  targetEntity: { call: (fid, data) => entity.commComponent.callWsRpc(addr, 'call', { fid, data }) }
});
```
Update to use the new `WebSocketTransportAdapter`:
```javascript
// New (v1.2.0)
import { WebSocketTransportAdapter } from "krnl/core";

entity.addRemote({
  id: "RemoteFunc",
  transport: new WebSocketTransportAdapter(entity.commComponent, addr),
  targetFunction: "MyFunc"
});
```

### 2. Leverage Implicit State Syncing
Instead of manually emitting events every time you update state in `logic.js`, you can now just mutate the `state` object.
```javascript
// logic.js
export const main = (input, { state }) => {
  state.count += 1; // v1.2.0 automatically emits "state:changed"
}
```

### 3. Move Init/Cleanup to Standardized Hooks
If you had initialization logic in your `main` function or custom event emitters, move them to `onMount` and `onTeardown` in your functionality descriptor.
```javascript
// MyFunc.js descriptor
export const MyFuncAtom = {
  id: "MyFunc",
  onMount: async ({ state }) => { /* Init DB */ },
  onTeardown: async ({ state }) => { /* Close DB */ }
};
```

### 4. Implement Schemas to Simplify Logic
You can remove manual type-checking code from your `logic.js` files by moving validation to the descriptor.
```javascript
// MyFunc.js descriptor
export const MyFuncAtom = {
  id: "MyFunc",
  schema: {
    input: (input) => typeof input.a === 'number'
  }
};
```
