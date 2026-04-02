# Example 1: Full System Orchestration

This example demonstrates how a multi-system architecture is built using Krnl.

## CalculatorSystem
A logic-heavy system that handles arithmetic operations and logging. It showcases:
- **`krnlSystemEntityBase`** usage.
- **Nested entities** (Display, Logger).
- **Local functionalities** (Calculator).
- **Libraries** for concept definitions.

## WebInterfaceSystem
A UI-focused system that provides a web-based interface for interacting with the Krnl network. It showcases:
- **`krnlSystemEntityBase`** as a gateway.
- **WebSocket Communication** to interact with remote systems.

## Key Features
- **Network Transparency**: The WebInterfaceSystem can discover and communicate with the CalculatorSystem.
- **Atomic Scaffolding**: Both systems follow the strict directory structure of Krnl.
- **Logic Promotion**: Public functionalities are automatically exposed to the network.
