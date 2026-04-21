# Example 11: Service Suite Verification

Comprehensive verification scripts for the AI-Ready Unified Service Suite.

## Features Verified
1. **Multi-Protocol Support**: REST, SSE, MCP, and ACP.
2. **Single-Port Unification**: Ensuring WS and HTTP share the same listener without conflict.
3. **Logic Bubbling**: Verifying that bubbled-up functionalities are accessible via HTTP.

## How to Run
- To verify the suite structure:
  ```bash
  node verify_suite.js
  ```
- To verify single-port behavior:
  ```bash
  node verify_single_port.js
  ```
