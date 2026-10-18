---
name: krnlts-network-ingress
description: Directives for KrnlTS unified port gateway, dynamic discovery fallback chain, HTTP/WS transport projection, and MCP surface.
---

# KRNLTS INGRESS NETWORK & UNIFIED GATEWAY

## 1. UNIFIED PORT GATEWAY
- KrnlTS consolidates **HTTP REST (`/call/{fid}`), WebSocket RPC, MCP tools, and Glass-Brutalism Admin UI** onto a **single unified OS port**.
- Services running under KrnlTS project their capabilities through unified protocol adapters (`HttpProtocolAdapter`, `WebSocketProtocolAdapter`, etc.).

---

## 2. DYNAMIC PORT DISCOVERY FALLBACK CHAIN
When a Service or CLI dev server boots, it resolves its listening port via the 5-step fallback chain:
1. `preferredPort` passed in configuration.
2. `PORT` environment variable (`process.env.PORT`).
3. App discovery registry query (`app.ports.json`).
4. System-wide registry query (default registry on port 10099).
5. Dynamic OS ephemeral port assignment (`port = 0` $\to$ assigned by kernel).

---

## 3. MODEL CONTEXT PROTOCOL (MCP) EXPOSURE
All public functionalities and orchestrations registered on a ServiceFacade can automatically project as MCP tools at `/mcp` or through the stdio MCP bridge.
