# Example 3: Event Emission and Subscription

This example demonstrates how to create, emit, and subscribe to events across different entities in Krnl.

## Structure
- **`EventSystem`** (Root System)
  - **`ProducerEntity`** (Emitter)
    - **`Ping`** (Logic Atom that emits `ping-emitted` events)
  - **`ConsumerEntity`** (Subscriber)
    - **`Logger`** (Logic Atom that collects and logs events)

## Key Concepts
- **`emitters`**: Defined in the functionality descriptor. Used to push data streams.
- **`collectors`**: Automatic interfaces created for each functionality. They can subscribe to emitters.
- **Event Bubbling**: Events emitted deep inside a component's functionality are promoted to the component's interface.
- **Wiring**: The root system (`EventSystem`) acts as the orchestrator, connecting the `Producer`'s output to the `Consumer`'s input.

## How to run
Run the root system file:
```bash
node examples/example3/EventSystem/EventSystem.js
```
The system will trigger the `Producer`'s logic multiple times, and you will see the `Consumer` logging the received events.
