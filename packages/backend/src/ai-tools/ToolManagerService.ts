/**
 * @file ToolManagerService.ts
 * @description General-purpose Tool Registry and Lifecycle Orchestrator
 */

import type { MCPTool, ToolExecutionResult } from './types.js';
import { mcpEngine } from './mcpEngine.js';

export class ToolManagerService {
  registerTool(tool: MCPTool, handler?: (args: any) => Promise<any>): void {
    mcpEngine.registerTool(tool, handler);
  }

  listTools(): MCPTool[] {
    return mcpEngine.listTools();
  }

  async execute(toolName: string, args: Record<string, unknown>): Promise<ToolExecutionResult> {
    return mcpEngine.executeTool(toolName, args);
  }
}

export const toolManagerService = new ToolManagerService();
