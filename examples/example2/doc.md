# Example 2: Deep Entity Nesting (3 Levels)

This example demonstrates the hierarchical composition and logic promotion features of Krnl.

## Structure
- **`Level1System`** (Root System)
  - **`Level2Entity`** (Middle Component)
    - **`Level3Entity`** (Deepest Component)
      - **`DeepLogic`** (Logic Atom)

## Key Concepts
- **Automatic Promotion**: When `Level3Entity` adds `DeepLogic` as a public functionality, it automatically bubbles up to `Level2Entity`.
- **Bubbling Up**: `Level2Entity` then promotes it further to `Level1System`.
- **Direct Calling**: Even though `DeepLogic` is defined 3 levels deep, it can be called directly from the root system as `this.call("DeepLogic")`.
- **Pure Descriptors**: Each entity file only describes its components and logic, maintaining atomic separation.

## How to run
Run the root system file:
```bash
node examples/example2/Level1System/Level1System.js
```
The system will automatically instantiate its components and test the deep call.
