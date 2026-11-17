import { NodeRegistry, NodeDefinition } from "../registry/index.js";

// 1. WebSocket Simulator Node
export const WebSocketNode: NodeDefinition = {
  metadata: {
    type: "networking/websocket",
    category: "networking",
    displayName: "WebSocket Connection",
    description: "Simulates opening a WebSocket socket channel and sending messages"
  },
  inputs: {
    endpoint: { type: "string", label: "WebSocket Endpoint", defaultValue: "wss://echo.websocket.org" },
    message: { type: "string", label: "Payload Message to Send", defaultValue: '{"action": "ping"}' }
  },
  outputs: {
    connected: { type: "boolean", label: "Successfully Connected" },
    received: { type: "string", label: "Received message payload" }
  },
  async execute(inputs) {
    const endpoint = String(inputs.endpoint ?? "wss://echo.websocket.org");
    const msg = String(inputs.message ?? "");
    
    // Simulate real socket roundtrip delay safely
    await new Promise(r => setTimeout(r, 400));
    
    return {
      connected: true,
      received: `[Simulated Echo Server] Received: "${msg}" at WS channel ${endpoint}`
    };
  }
};

export function registerNetworkingNodes(registry: NodeRegistry) {
  registry.register(WebSocketNode, true);
}
