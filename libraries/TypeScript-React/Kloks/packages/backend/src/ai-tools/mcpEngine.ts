/**
 * @file mcpEngine.ts
 * @description Master Model Context Protocol (MCP) server manager and dispatcher
 */

import type { MCPServerConfig, MCPTool, ToolExecutionResult } from './types.js';

export class MCPEngine {
  private servers: Map<string, MCPServerConfig> = new Map();
  private registeredTools: Map<string, MCPTool> = new Map();
  private toolHandlers: Map<string, (args: any) => Promise<any>> = new Map();

  getSystemTools(): MCPTool[] {
    return this.listTools();
  }

  async handleJsonRpc(payload: any): Promise<any> {
    const { id, method, params } = payload ?? {};
    if (method === 'tools/list') {
      return { jsonrpc: '2.0', id, result: { tools: this.listTools() } };
    }
    if (method === 'tools/call') {
      const toolName = params?.name;
      if (!toolName) return { jsonrpc: '2.0', id, error: { code: -32602, message: 'Tool name is required.' } };
      const result = await this.executeTool(toolName, params?.arguments ?? {});
      return {
        jsonrpc: '2.0',
        id,
        result: result.success
          ? { content: [{ type: 'text', text: JSON.stringify(result.output ?? '') }] }
          : { content: [{ type: 'text', text: result.error ?? 'Tool execution failed' }], isError: true },
      };
    }
    return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method "${method}" not found.` } };
  }

  registerServer(config: MCPServerConfig): void {
    this.servers.set(config.id, config);
  }

  getServer(id: string): MCPServerConfig | undefined {
    return this.servers.get(id);
  }

  listServers(): MCPServerConfig[] {
    return Array.from(this.servers.values());
  }

  registerTool(tool: MCPTool, handler?: (args: any) => Promise<any>): void {
    this.registeredTools.set(tool.name, tool);
    if (handler) {
      this.toolHandlers.set(tool.name, handler);
    }
  }

  listTools(): MCPTool[] {
    return Array.from(this.registeredTools.values());
  }

  async executeTool(toolName: string, args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const start = Date.now();
    const handler = this.toolHandlers.get(toolName);

    if (!handler) {
      return {
        toolName,
        success: false,
        error: `No local handler registered for MCP tool: ${toolName}`,
        durationMs: Date.now() - start,
      };
    }

    try {
      const output = await handler(args);
      return {
        toolName,
        success: true,
        output,
        durationMs: Date.now() - start,
      };
    } catch (err: unknown) {
      return {
        toolName,
        success: false,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      };
    }
  }
}

export const mcpEngine = new MCPEngine();
