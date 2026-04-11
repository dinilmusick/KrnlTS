# Exhibit 6: System Availability Flags (Discoverable + Busy Reservation)

This example demonstrates the new system-entity availability controls in `krnlSystemEntityBase` with deterministic checks.

## What it validates

1. **Reservation enforcement over RPC**  
   `SupervisorSystem` successfully calls `SubserviceSystem` before reservation, then gets rejected once `SubserviceSystem` is reserved for another requester.

2. **Busy reservation flag**  
   `SubserviceSystem.reserveFor("SupervisorSystem")` marks the subservice as busy and updates flags (`busy`, `reservedBy`, `reservedAt`).

3. **Discoverability on/off**  
   `setDiscoverable(false)` and `setDiscoverable(true)` are reflected in `getManifest().flags`.

4. **Peer filtering semantics**  
   The script injects sample peer rows and verifies:
   - hidden peers are not returned,
   - stale peers are pruned using `peerTtlMs`,
   - `discoverPeers({ includeBusy: false })` excludes busy peers.

## Run

```bash
node examples/example6/AvailabilitySystem/AvailabilitySystem.js
```

Expected output sequence:
- Initial RPC heartbeat succeeds.
- External requester is rejected while reserved.
- Owner requester (`SupervisorSystem`) is still allowed.
- Manifest flags show discoverability toggling.
- `listPeers()` and `discoverPeers({ includeBusy: false })` return filtered/pruned results.
