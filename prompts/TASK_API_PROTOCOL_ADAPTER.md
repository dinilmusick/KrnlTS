```markdown
# TASK: API_AND_PROTOCOL_ADAPTER_PROTOCOL
$INGRESS := \text{UnifiedPort} \implies \langle \text{REST}, \text{WebSocket}, \text{MCP}, \text{ACP} \rangle

## 1. UNIFIED PORT PRINCIPLE
A single HTTP/TCP port serves all communication transports without port proliferation:
- `/api/{functionalityId}` $\implies$ Ingress REST RPC
- `/ws` $\implies$ Bidirectional WebSocket RPC & Event Streaming
- `/mcp` $\implies$ Model Context Protocol (tools, resources, prompts)
- `/acp` $\implies$ Agent Communication Protocol (swarm coordination)

## 2. ATTACHING PROTOCOL ADAPTERS TO ROOT ENTITY
```typescript
import { Entity, krnlSystemUnifiedHttpAdapter, KrnlProtocolMCP } from "@dinilmusick/krnlts";

const rootSystem = new Entity("MyRootSystem");

// Attach unified HTTP/REST/WS adapter
const httpAdapter = new krnlSystemUnifiedHttpAdapter({
  port: 10080,
  enableWS: true,
  enableREST: true
});
rootSystem.attachProtocolAdapter("http", httpAdapter);

// Attach Model Context Protocol adapter for LLM/Agent tools
const mcpAdapter = new KrnlProtocolMCP({
  serverName: "MyKrnlMCP",
  version: "1.0.0"
});
rootSystem.attachProtocolAdapter("mcp", mcpAdapter);

// Start self-hosting (root position only)
await rootSystem.startSelfHosting();
```

## 3. ACCESS CONTROL GATES (ENDPOINT SECURITY)
```typescript
export const secureFunctionality = new krnlLocalFunctionality({
  id: "secure_operation",
  accessPolicy: "require_key", // "unrestricted" | "require_key" | "forbid_unlisted"
  accessKey: "my-secret-key",
  api: async (input) => {
    return { ok: true };
  }
});
```

## 4. SCHEMA CONTRACTS (ZOD & PROTOBUF)
```typescript
import { z } from "zod";

const inputSchema = z.object({
  action: z.enum(["start", "stop"]),
  timeoutMs: z.number().optional().default(5000)
});

// Automatic runtime input & output validation
functionality.schema = { input: inputSchema };
```
```
