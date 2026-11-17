// ══════════════════════════════════════════════════════════════════════════════
// SKIPO CANONICAL VALIDATION SCHEMAS & ERROR FORMATTERS
// Architecture: Zod runtime boundary validation for APIs and graph topology
// ══════════════════════════════════════════════════════════════════════════════

import { z } from 'zod';

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const GraphNodeDataSchema = z.record(z.unknown()).default({});

export const GraphNodeSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  position: PositionSchema,
  data: GraphNodeDataSchema.optional(),
});

export const GraphEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string().nullable().optional(),
  targetHandle: z.string().nullable().optional(),
});

export const GraphTopologySchema = z.object({
  nodes: z.array(GraphNodeSchema),
  edges: z.array(GraphEdgeSchema),
});

export const CommandPrioritySchema = z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']);

export const DispatchCommandSchema = z.object({
  type: z.string().min(1, 'Command type is required'),
  payload: z.record(z.unknown()).default({}),
  priority: CommandPrioritySchema.optional().default('NORMAL'),
});

export const JobStatusResponseSchema = z.object({
  id: z.string(),
  status: z.string(),
  result: z.unknown().optional(),
  error: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
});

export const WorkspaceCreateSchema = z.object({
  name: z.string().min(1, 'Workspace name is required'),
  description: z.string().optional(),
});

export interface FormattedZodError {
  success: false;
  error: string;
  issues: Array<{ path: string; message: string }>;
}

export function formatZodError(error: z.ZodError): FormattedZodError {
  const issues = error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
  return {
    success: false,
    error: `Validation failed: ${issues.map((i) => `${i.path}: ${i.message}`).join(', ')}`,
    issues,
  };
}

export type GraphNodeShape = z.infer<typeof GraphNodeSchema>;
export type GraphEdgeShape = z.infer<typeof GraphEdgeSchema>;
export type GraphTopologyShape = z.infer<typeof GraphTopologySchema>;
export type DispatchCommandShape = z.infer<typeof DispatchCommandSchema>;
export type CommandPriority = z.infer<typeof CommandPrioritySchema>;
