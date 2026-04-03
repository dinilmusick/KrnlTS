# Exhibit 3: Events & Inter-Component Communication

This example demonstrates how logic atoms communicate using event streams and how different entities can subscribe to those streams.

## The Concept: "Event Atoms"
Instead of a functionality just returning a value (Request-Response), it can also broadcast signals (Events).

1.  **ProducerEntity** has a functionality called `Ping`.
2.  `Ping` defines an emitter: `ping-emitted`.
3.  Every time `Ping` logic is called, it pushes data into that emitter.

## The Wiring: "Sacred Subscription"
The **Owner Entity** (the System) is responsible for patching these ports together. 

```javascript
// Get the output port
const source = producer.interface.getEmitter("Ping:ping-emitted");

// Get the input port
const sink = consumer.interface.getCollector("Logger");

// Patch them
sink.subscribeTo(source);
```

## Atomic Scaffolding
- `ProducerEntity.js`: Descriptor that assembles the `Ping` logic atom.
- `ConsumerEntity.js`: Descriptor that assembles the `Logger` logic atom.
- `EventSystem.js`: The root server that summons both and performs the wiring.
- `state_data/`: Holds the state atoms for `Ping` and `Logger` so descriptors remain data-free and logic-free.

This example now follows the strict policy: no runtime logic in entity/functionality descriptor files.

## Rationale
This approach allows the Producer and Consumer to remain completely unaware of each other. The Producer just "shouts" and the Consumer just "listens". The System orchestrates the connection, making the code highly modular and reusable.
