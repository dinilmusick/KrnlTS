# Krnl Base API Reference

This document provides a comprehensive reference for the core classes and utility libraries in `krnlBase`.

---

## 1. Core Base Entities

### `krnlEntityBase`
The fundamental building block. Every object in the system that has state or networking inherits from this.
- **Properties**:
    - `interface`: `krnlInterface` instance.
    - `stateManager`: `krnlStateManager` instance.
    - `hierarchyManager`: `krnlEntityCompositionalHierarchyManager` instance.
- **Methods**:
    - `dispose()`: Recursively cleans up all resources and child entities.

### `krnlSystemEntityBase`
Extends `krnlEntityBase`. Use this for system orchestrators.
- **Properties**:
    - `commComponent`: `krnlSystemCommComponent` instance for P2P networking.
- **Methods**:
    - `_attachCollectorHandler(name, callback)`: Attaches a data handler to an interface collector.

---

## 2. Messaging & Networking (`krnlNetworking`)

### `krnlEmitter`
A source of data streams.
- **Methods**:
    - `pushDataStreamToEmitter(data)`: Broadcasts data to all subscribers.
    - `subscribe(callback)`: Returns an unsubscribe function.
    - `pipeTo(targetEntity, transformFn)`: Pipes data to another entity.

### `krnlCollector`
A consumer of data streams.
- **Methods**:
    - `pipeTo(outputEmitter)`: Pipes collected data to another emitter.

### `krnlInterface`
Manages the emitters and collectors within an entity.
- **Methods**:
    - `createEmitter(name)`: Returns a new emitter.
    - `createCollector(name)`: Returns a new collector.

---

## 3. Core Function Atoms (`krnlCoreFunctionAtoms`)

Functional utilities used throughout the framework to ensure deterministic processing.

### Recursive Utilities
- `rMap(array, callback)`: Recursive map implementation.
- `rFind(array, predicate)`: Recursive find implementation.
- `rFindIndex(array, predicate)`: Recursive findIndex implementation.
- `rBuildMap(array, keyProp)`: Converts an array of objects into a Map indexed by `keyProp`.

---

## 4. State Management (`krnlStateManager`)

Handles persistent and transient state for entities.
- **Methods**:
    - `createState(name, initialData)`: Initializes a new state slice.
    - `setStateValue(stateName, key, value)`: Updates a specific key in a state.
    - `getStateValue(stateName, key)`: Retrieves a value.
    - `subscribeToState(stateName, callback)`: Notifies on any change to that state slice.

---

## 5. Functionality Lifecycle

### `returnedFunctionalities`
Standardized request-response pattern.
- **Methods**:
    - `define(name, logic)`: Registers a new capability.
    - `createInstance(name, callerName)`: Returns a unique instance for a caller.
    - `call(instanceName, params)`: Executes the logic.

---

## 6. Storage (`DasyJS`)

Web-optimized file system abstraction for OPFS.
- **Methods**:
    - `init()`: Connects to the browser filesystem.
    - `writeText(path, text)`: Writes a file.
    - `readText(path)`: Reads a file.
    - `deleteFile(path)`: Removes a file.
