/**
 * @file schemas.ts
 * @description Runtime Zod Schemas for Kloks Public Contracts and Canonical Models.
 * Enforces: ∀ public runtime boundary: TypeScriptContract ∧ ZodRuntimeContract
 */

import { z } from 'zod';

// 1. Core Metadata & Geometry
export const GraphEntityMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  archetype: z.string(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
  customAttributes: z.record(z.unknown()).optional(),
});
export type GraphEntityMetadata = z.infer<typeof GraphEntityMetadataSchema>;

export const SocketPosition2DSchema = z.object({
  x: z.number(),
  y: z.number(),
});
export type SocketPosition2D = z.infer<typeof SocketPosition2DSchema>;

export const SocketDirectionSchema = z.enum(['input', 'output', 'bidirectional']);
export type SocketDirection = z.infer<typeof SocketDirectionSchema>;

export const SocketGeometryConfigSchema = z.object({
  radius: z.number().default(6),
  hitRadius: z.number().default(12),
  snapDistance: z.number().default(18),
  direction: SocketDirectionSchema.default('input'),
  relativeOffset: SocketPosition2DSchema.default({ x: 0, y: 0 }),
});
export type SocketGeometryConfig = z.infer<typeof SocketGeometryConfigSchema>;

export const SocketStyleConfigSchema = z.object({
  color: z.string(),
  hoverColor: z.string().optional(),
  activeColor: z.string().optional(),
  borderColor: z.string().optional(),
  borderWidth: z.number().optional(),
  fillOpacity: z.number().optional(),
});
export type SocketStyleConfig = z.infer<typeof SocketStyleConfigSchema>;

// 2. Wires
export const WireEndpoint2DSchema = z.object({
  nodeId: z.string(),
  socketId: z.string(),
  position: SocketPosition2DSchema,
});
export type WireEndpoint2D = z.infer<typeof WireEndpoint2DSchema>;

export const WireCurveStyleSchema = z.enum(['bezier', 'linear', 'orthogonal', 'stepped']);
export type WireCurveStyle = z.infer<typeof WireCurveStyleSchema>;

export const WireAnimationConfigSchema = z.object({
  animated: z.boolean().default(false),
  speed: z.number().default(1),
  direction: z.enum(['forward', 'reverse']).default('forward'),
  pulseFrequency: z.number().optional(),
});
export type WireAnimationConfig = z.infer<typeof WireAnimationConfigSchema>;

export const WireVisualConfigSchema = z.object({
  strokeColor: z.string(),
  strokeWidth: z.number().default(2),
  strokeDashArray: z.string().optional(),
  curveStyle: WireCurveStyleSchema.default('bezier'),
  curvature: z.number().default(0.5),
  opacity: z.number().default(1),
  glow: z.boolean().default(false),
  glowColor: z.string().optional(),
});
export type WireVisualConfig = z.infer<typeof WireVisualConfigSchema>;

// 3. Nodes & Dimensions
export const NodeDimensions2DSchema = z.object({
  width: z.number(),
  height: z.number(),
  minWidth: z.number().optional(),
  minHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  maxHeight: z.number().optional(),
});
export type NodeDimensions2D = z.infer<typeof NodeDimensions2DSchema>;

export const NodeScreenRect2DSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});
export type NodeScreenRect2D = z.infer<typeof NodeScreenRect2DSchema>;

export const NodeHeaderStyleSchema = z.object({
  backgroundColor: z.string().optional(),
  titleColor: z.string().optional(),
  iconColor: z.string().optional(),
  badgeColor: z.string().optional(),
});
export type NodeHeaderStyle = z.infer<typeof NodeHeaderStyleSchema>;

// 4. Audio & MIDI
export const AudioBusConfigSchema = z.object({
  channelCount: z.number().default(2),
  sampleRate: z.number().default(44100),
  bufferSize: z.number().default(512),
  latencyHint: z.enum(['interactive', 'balanced', 'playback']).default('interactive'),
});
export type AudioBusConfig = z.infer<typeof AudioBusConfigSchema>;

export const AudioHardwareStateSchema = z.object({
  contextState: z.enum(['suspended', 'running', 'closed', 'uninitialized']),
  sampleRate: z.number(),
  inputChannels: z.number(),
  outputChannels: z.number(),
  activeInputDeviceId: z.string().nullable().optional(),
  activeOutputDeviceId: z.string().nullable().optional(),
});
export type AudioHardwareState = z.infer<typeof AudioHardwareStateSchema>;

export const MidiCommandTypeSchema = z.enum([
  'NOTE_ON',
  'NOTE_OFF',
  'CONTROL_CHANGE',
  'PITCH_BEND',
  'PROGRAM_CHANGE',
  'AFTERTOUCH',
  'POLY_PRESSURE',
  'CLOCK',
  'START',
  'CONTINUE',
  'STOP',
  'ACTIVE_SENSING',
  'SYSTEM_RESET',
]);
export type MidiCommandType = z.infer<typeof MidiCommandTypeSchema>;

export const MidiEventPayloadSchema = z.object({
  command: MidiCommandTypeSchema,
  channel: z.number().min(1).max(16).default(1),
  note: z.number().min(0).max(127).optional(),
  velocity: z.number().min(0).max(127).optional(),
  controller: z.number().min(0).max(127).optional(),
  value: z.number().min(0).max(127).optional(),
  timestamp: z.number().optional(),
});
export type MidiEventPayload = z.infer<typeof MidiEventPayloadSchema>;

// 5. Backend & Orchestration Operation Contracts
export const BackendOperationSchema = z.object({
  name: z.string(),
  service: z.string(),
  description: z.string().optional(),
  inputSchemaName: z.string().optional(),
  outputSchemaName: z.string().optional(),
});
export type BackendOperation = z.infer<typeof BackendOperationSchema>;

// 6. Public Contract Meta-Schema
export const PublicContractDefinitionSchema = z.object({
  package: z.string(),
  version: z.string(),
  description: z.string(),
  exports: z.record(z.object({
    types: z.string(),
    import: z.string(),
    default: z.string(),
  })),
  symbols: z.array(z.object({
    name: z.string(),
    subpath: z.string(),
    kind: z.enum(['class', 'type', 'interface', 'function', 'const', 'object']),
    hasZodSchema: z.boolean(),
  })),
  facades: z.array(z.object({
    id: z.string(),
    name: z.string(),
    subpath: z.string(),
    runtime: z.enum(['client', 'server']),
    deployment: z.enum(['local', 'remote']),
  })),
  invariants: z.array(z.string()),
});
export type PublicContractDefinition = z.infer<typeof PublicContractDefinitionSchema>;

// 7. Contract Snapshot & Diff Schema
export const ContractSnapshotSchema = z.object({
  package: z.string(),
  version: z.string(),
  timestamp: z.number(),
  checksum: z.string(),
  publicSymbols: z.array(z.string()),
  normalizedSignatures: z.record(z.string()),
  zodFingerprints: z.record(z.string()),
  facades: z.array(z.string()),
  events: z.array(z.string()),
  commands: z.array(z.string()),
  errorCodes: z.array(z.string()),
});
export type ContractSnapshot = z.infer<typeof ContractSnapshotSchema>;
