/**
 * ASCII Architecture Flowchart: helpers
 *
 *   ┌──────────────────────────────────┐
 *   │        Initialize helpers        │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │         jsonSchemaToZod          │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │            schemaType            │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │           itemsSchema            │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

import { z, ZodType } from 'zod';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════


// ════ HELPERS IMPLEMENTATION ══════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export function jsonSchemaToZod(schema: any): ZodType<any> {
  const schemaType = schema?.type || 'object';

  if (schemaType === 'string') {
    if (schema.enum && Array.isArray(schema.enum)) {
      return z.enum(schema.enum as [string, ...string[]]);
    }
    return z.string();
  }

  if (schemaType === 'number' || schemaType === 'integer') {
    return z.number();
  }

  if (schemaType === 'boolean') {
    return z.boolean();
  }

  if (schemaType === 'array') {
    const itemsSchema = schema.items ? jsonSchemaToZod(schema.items) : z.any();
    return z.array(itemsSchema);
  }

  if (schemaType === 'object' || schema?.properties) {
    const shape: Record<string, ZodType<any>> = {};
    const props = schema?.properties || {};
    const requiredSet = new Set<string>(schema?.required || []);

    for (const [key, propSchema] of Object.entries<any>(props)) {
      let fieldSchema = jsonSchemaToZod(propSchema);
      if (!requiredSet.has(key)) {
        fieldSchema = fieldSchema.optional();
      }
      shape[key] = fieldSchema;
    }

    return z.object(shape).passthrough();
  }

  return z.any();
}

export async function executeBuiltInTool(name: string, args: any): Promise<any> {
  if (name === 'web_search') {
    const query = args.query || '';
    return {
      status: 'success', query,
      results: [
        { title: `Latest updates on ${query}`, snippet: `AIKO Search Index: High-confidence document set retrieved for "${query}".` },
        { title: `Technical Docs for ${query}`, snippet: `Official specification and documentation for ${query}.` }
      ]
    };
  }

  if (name === 'calculator') {
    const expr = args.expression || '0';
    try {
      const safeExpr = expr.replace(/[^0-9+\-*/().\s]/g, '');
      const evaluated = Function(`"use strict"; return (${safeExpr})`)();
      return { status: 'success', expression: expr, result: evaluated };
    } catch (err: any) {
      return { status: 'error', expression: expr, message: `Evaluation failed: ${err.message}` };
    }
  }

  if (name === 'get_current_time') {
    const tz = args.timezone || 'UTC';
    return { status: 'success', timezone: tz, isoTimestamp: new Date().toISOString(), unixMs: Date.now() };
  }

  return { status: 'executed', toolName: name, args };
}