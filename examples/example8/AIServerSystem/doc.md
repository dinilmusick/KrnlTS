# Example 8: AI-Ready Unified Service Suite

This example demonstrates how KrnlJS v1.3.0 automatically handles multiple AI-industry protocols on a single port. 

## Features Demonstrated
1. **Single Port Sharing**: WebSocket, REST, MCP, and ACP all share port `10111`.
2. **MCP (Model Context Protocol)**: Exposing Krnl functionalities as AI Tools.
3. **ACP (Agent Communication Protocol)**: Standardized agent identification and messaging.
4. **REST/SSE**: Direct HTTP access to any entity functionality.

## System Structure
- **AIServerSystem**: The root system entity.
    - **calculator**: Logic atom for math.
    - **textProcessor**: Logic atom for string manipulation.
    - **getSystemStatus**: Metadata provider.

## How to Run

### 1. Start the System
```bash
node run_ai_server.js
```

### 2. Interact via REST
You can use `curl` or any HTTP client:
```bash
curl -X POST http://localhost:10111/call/calculator \
     -H "Content-Type: application/json" \
     -d '{"a": 10, "b": 5, "op": "mul"}'
```

### 3. Interact via MCP (for AI Agents)
Query the tool list:
```bash
curl -X POST http://localhost:10111/mcp \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}'
```

### 4. Interact via ACP (Agent Interop)
Get agent info:
```bash
curl http://localhost:10111/acp/info
```

## Why this matters
With the Unified Service Suite, you can build complex robot or data systems using Krnl's Atomic Entity Model and have them **immediately ready** to be used by LLM agents (via MCP) or other AI specialized agents (via ACP) without writing a single line of adapter code.
