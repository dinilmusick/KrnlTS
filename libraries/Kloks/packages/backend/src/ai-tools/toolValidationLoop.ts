/**
 * @file toolValidationLoop.ts
 * @description Validates tool inputs and payload schemas before tool invocation
 */

import type { MCPTool } from './types.js';

export interface ToolInputValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateToolInput(
  tool: MCPTool,
  input: Record<string, unknown>
): ToolInputValidationResult {
  const errors: string[] = [];
  const required = tool.inputSchema?.required || [];

  for (const field of required) {
    if (input[field] === undefined || input[field] === null || input[field] === '') {
      errors.push(`Missing required field '${field}'`);
    }
  }

  const props = tool.inputSchema?.properties || {};
  for (const [key, val] of Object.entries(input)) {
    const expectedProp = props[key] as { type?: string } | undefined;
    if (expectedProp?.type) {
      const actualType = Array.isArray(val) ? 'array' : typeof val;
      if (expectedProp.type === 'string' && actualType !== 'string') {
        errors.push(`Field '${key}' expected string but got ${actualType}`);
      } else if (expectedProp.type === 'number' && actualType !== 'number') {
        errors.push(`Field '${key}' expected number but got ${actualType}`);
      } else if (expectedProp.type === 'boolean' && actualType !== 'boolean') {
        errors.push(`Field '${key}' expected boolean but got ${actualType}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
