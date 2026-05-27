# Example 13: Dynamic Port Assignment Resilience

This example demonstrates how systems can dynamically discover occupied ports in the network and assign their own ports to avoid conflicts.

## Concepts
- **Network Port Checking**: Systems query the network to see what ports are already in use.
- **Dynamic Assignment**: Systems adjust their ports based on the current environment state.
- **Sequence Resilience**: Testing that both App1 and App2 behave identically regardless of which one starts first.

## How to Run
```bash
node run_test.js
```
