---
name: krnlts-network-ingress
description: Ports allocation registry, access policy gates, and zero-port Ingress Network routing protocols.
---

# KrnlTS Network Registry & Ingress Network

KrnlTS supports advanced service networking using a centralized Registry, fine-grained Access Gates, and a single-port multi-process **Ingress Network** gateway mapping.

## 1. Port Registry & Access Control
Service instances register their communication ports upon startup to allow internal discovery.
```typescript
// Register external/internal services
system.registerPort('payment-gateway', 8092);

// Access policies restrict endpoint calls by port identity
system.addInternalEndpoint({
  id: 'syncLedger',
  api: async (input) => { /* Only accessible to internal ports */ }
});

system.addExternalEndpoint({
  id: 'publicStats',
  api: async () => ({ status: "online" })
}, 'free'); // 'free' disables security checks. Do NOT use legacy 'manifest' routes.
```

---

## 2. Ingress Network Architecture (Zero-Port)
To prevent OS port exhaustion and container port mapping overhead, KrnlTS allows backend sub-apps (members) to share a single host OS port using an **Admin Ingress Gateway**.

```
                       [ Host Gateway Port (e.g. 10099) ]
                                       |
                   -----------------------------------------
                  |                    |                    |
            /auth/call/fid       /data/call/fid      /ws/rpc/target
                  |                    |                    |
             [ AuthService ]      [ DataService ]     [ WebSocket Router ]
             (Sentinel port: -1)  (Sentinel port: -1)  (RPC target validation)
```

### Ingress Gateway Setup
Call `startIngressNetwork` on the gateway admin entity, listing the subapp classes and path prefixes:
```typescript
import { AdminGateway } from "./admin.js";
import { StockService } from "../services/StockService/StockService.js";
import { OrderService } from "../services/OrderService/OrderService.js";

export async function bootstrap(port = 10099) {
  const gateway = new AdminGateway(port);
  
  await gateway.startIngressNetwork([
    { ServiceClass: StockService, prefix: "stock" },
    { ServiceClass: OrderService, prefix: "order" }
  ]);
  
  return gateway;
}
```

### Routing Protocol Rules
1.  **REST routing**: Requests are automatically multiplexed via path prefixes:
    `POST http://<gateway-host>:<port>/<prefix>/call/<fid>`
2.  **Manifest aggregation**: Calling `GET /manifest` on the gateway port aggregates and returns the child subapps' endpoint definitions.
3.  **WebSocket RPC target routing**: WebSocket clients route requests by specifying the `target` parameter in the RPC payload:
    ```json
    {
      "kind": "rpc-request",
      "requestId": "req-101",
      "method": "call",
      "params": {
        "target": "order",
        "fid": "createOrder",
        "data": { "item": "widget" }
      }
    }
    ```
4.  **MCP Integration**: The gateway's central `/mcp` tool endpoint exposes sub-service functionalities namespaces as `<prefix>.<toolName>` (e.g., `stock.checkStock`).
