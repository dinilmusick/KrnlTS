/**
 * ASCII Architecture Flowchart: zodStructuralGate
 *
 *   ┌──────────────────────────────────┐
 *   │   Initialize zodStructuralGate   │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │         jsonSchemaToZod          │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │            enumValues            │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │               type               │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ AIKO DETERMINISTIC STRUCTURAL GATE (ZOD) ═════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import { z, ZodTypeAny } from 'zod';

export interface ZodValidationResult {
  valid: boolean;
  data?: any;
  errors?: string[];
}

export function jsonSchemaToZod(schema: any): ZodTypeAny {
  if (!schema || typeof schema !== 'object') {
    return z.any();
  }

  if (schema.enum && Array.isArray(schema.enum) && schema.enum.length > 0) {
    const enumValues = schema.enum.map(String) as [string, ...string[]];
    return z.enum(enumValues);
  }

  const type = schema.type;

  if (type === 'string') {
    return z.string();
  }

  if (type === 'integer') {
    return z.number().int();
  }

  if (type === 'number') {
    return z.number();
  }

  if (type === 'boolean') {
    return z.boolean();
  }

  if (type === 'array') {
    const itemsSchema = schema.items ? jsonSchemaToZod(schema.items) : z.any();
    return z.array(itemsSchema);
  }

  if (type === 'object' || schema.properties) {
    const shape: Record<string, ZodTypeAny> = {};
    const properties = schema.properties || {};
    const requiredSet = new Set(Array.isArray(schema.required) ? schema.required : []);

    for (const [key, propDef] of Object.entries(properties)) {
      let fieldSchema = jsonSchemaToZod(propDef);
      if (!requiredSet.has(key)) {
        fieldSchema = fieldSchema.optional();
      }
      shape[key] = fieldSchema;
    }

    return z.object(shape).passthrough();
  }

  return z.any();
}

export class ZodStructuralGate {
  public static validate(schema: any, payloadCandidate: any): ZodValidationResult {
    if (!schema || typeof schema !== 'object' || Object.keys(schema).length === 0) {
      return { valid: true, data: payloadCandidate };
    }

    try {
      const zodSchema = jsonSchemaToZod(schema);
      const parseResult = zodSchema.safeParse(payloadCandidate);

      if (parseResult.success) {
        return {
          valid: true,
          data: parseResult.data
        };
      }

      const issues = parseResult.error.issues || (parseResult.error as any).errors || [];
      const formattedErrors = issues.map((err: any) => {
        const pathStr = err.path && err.path.length > 0 ? err.path.join('.') : 'root';
        return `${pathStr}: ${err.message}`;
      });

      return {
        valid: false,
        errors: formattedErrors
      };
    } catch (e: any) {
      return {
        valid: false,
        errors: [`Zod structural parsing failed: ${e.message || String(e)}`]
      };
    }
  }
}