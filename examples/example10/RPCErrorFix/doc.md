# Example 10: RPC Error Serialization Fix

This example demonstrates how KrnlJS correctly handles error serialization during RPC calls, ensuring that complex error objects are transmitted with full detail instead of being flattened to `[object Object]`.

## Concepts
- **RPC Error Handling**: Custom catch-and-serialize logic in the CommComponent.
- **Payload Preservation**: Ensuring `eslintErrors` or other metadata reaches the caller.

## How to Run
```bash
node run_test.js
```
