# KrnlTS Changelog (v2.0.0)

This document outlines the major architectural changes introduced in v2.0.0. This version represents a complete migration to TypeScript.

## [2.0.0] - 2026-04-29

### Added
- **Full TypeScript Migration**: All core modules converted to `.ts`.
- **Strict Build Pipeline**: Integrated `tsup` for ESM/CJS bundling with automatic `.d.ts` generation.
- **Reactive Telemetry Flags**: `telemetryEnabled` now automatically toggles the global telemetry engine via reactive setters.
- **Ambient Declarations**: Added `declarations.d.ts` for improved IDE support on external dependencies.
- **Modern Module Resolution**: Switched to `NodeNext` for improved ESM compatibility and type discovery.

### Changed
- **Package Renaming**: Formally transitioned from `KrnlJS` to `KrnlTS`.
- **Inheritance Refinement**: Decoration hooks (`_decorateResult`, `_decorateError`) converted to formal methods in the base class for type-safe overriding.
- **Example Migration**: All examples updated to point to the compiled `/dist` directory.

### Fixed
- Resolved IDE type discovery issues for `zod-to-json-schema`.
- Fixed cross-system result decoration inconsistencies.

## [1.2.2] - 2026-04-11

### Added
- New `krnlNetworkOrchestratorEntityBase` for network-level orchestration:
  - inspect peer manifests (`getPeerManifest`)
  - inspect peer routes (`listPeerRoutes`)
  - create inter-system routes (`connectSystems`)
  - disconnect managed routes (`disconnectPeerRoute`)
- New orchestration RPCs on system entities:
  - `list-routes`
  - `disconnect-route`
  - `connect-to-target`
- New example:
  - `examples/example7/OrchestratorSystem/OrchestratorSystem.js`

### Changed
- WS routes now carry management policy metadata:
  - `managedBy`
  - `externallyMutable`
  - `metadata`
- Route disconnection now enforces immutable-route policy for external requesters.
- `wire(...)` and `wire-output-to-me` now accept a `connectionPolicy` object to define route mutability/manager.

## [1.2.1] - 2026-04-10

### Added
- **System availability flags** on `krnlSystemEntityBase`:
  - `discoverable`
  - `busy`
  - `reservedBy`
  - `reservedAt`
- **Availability APIs**:
  - `setDiscoverable(value)`
  - `reserveFor(serviceName)`
  - `releaseReservation(serviceName?)`
  - `getSystemFlags()`
- **Example 6** showing discoverability toggling + reservation workflow:
  - `examples/example6/AvailabilitySystem/AvailabilitySystem.js`

### Changed
- Discovery beacons now include availability metadata (`discoverable`, `busy`, `reservedBy`).
- Discovery broadcasting is suppressed when `discoverable` is `false`.
- `listPeers()` now prunes stale peers by TTL and returns discoverable peers.
- `getManifest` and telemetry now include system flags for observability.
- `discoverPeers` now supports filtering out busy peers (`discoverPeers({ includeBusy: false })`).
- `adminCommand` now supports:
  - `set-discoverable`
  - `reserve`
  - `release-reservation`

### Security / Access Control
- Incoming RPC calls and remote wiring requests are rejected when a system is reserved by another service.
- Outgoing `wire(...)` attempts now fail fast when the target peer is marked busy.

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
import { WebSocketTransportAdapter } from "src/krnl/core";

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
