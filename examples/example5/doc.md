# Exhibit 5: Entity Singleton vs Multi-Instance

This exhibit demonstrates the new entity instance policy:

- Each entity class has `Singleton` (boolean).
- `Singleton: true` means only one instance per owner/base-name.
- `Singleton: false` means multiple instances are allowed.
- Functionalities are always single-instance/single-state within each entity instance.

## What this run proves
1. `CacheEntity` is singleton, so creating it twice returns the same instance.
2. `WorkerEntity` is non-singleton, so two calls create `Worker#1` and `Worker#2`.
3. Unused instances can be disposed via `disposeOwnedComponent(entityId)`.

## Run

```bash
node examples/example5/InstanceSystem/InstanceSystem.js
```
