/**
 * @file types.ts
 * @description Canonical AI Tools and MCP runtime contracts for @kloks/backend
 */

export interface MCPToolParameter {
  type: string;
  description?: string;
  properties?: Record<string, unknown>;
  required?: string[];
  items?: Record<string, unknown>;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

export interface MCPServerConfig {
  id: string;
  name: string;
  transport: 'stdio' | 'sse' | 'websocket';
  url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  status?: 'connected' | 'disconnected' | 'error';
}

export interface ToolExecutionResult {
  toolName: string;
  success: boolean;
  output?: unknown;
  error?: string;
  durationMs: number;
}
