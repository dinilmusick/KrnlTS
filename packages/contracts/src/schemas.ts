/**
 * @file schemas.ts
 * @description Zod Schemas for Floks Component Theme Contracts & ThemePacks.
 * Enforces docs/04_THETA_COMPONENT_CONTRACTS.md:
 * - ComponentThemeContract
 * - VisualSlot
 * - VisualState
 * - VisualParameter
 * - ThemeTarget
 * - ThemePack
 */

import { z } from 'zod';

export const VisualSlotSchema = z.object({
  id: z.string(),
  acceptedElementTypes: z.array(z.string()),
  required: z.boolean().default(false),
  constraints: z.record(z.unknown()).optional(),
});
export type VisualSlot = z.infer<typeof VisualSlotSchema>;

export const VisualParameterSchema = z.object({
  id: z.string(),
  type: z.enum(['color', 'dimension', 'number', 'string', 'boolean', 'gradient', 'shadow']),
  default: z.union([z.string(), z.number(), z.boolean()]),
  constraints: z.record(z.unknown()).optional(),
});
export type VisualParameter = z.infer<typeof VisualParameterSchema>;

export const VisualStateSchema = z.object({
  id: z.string(),
  parameters: z.array(VisualParameterSchema),
  transitions: z.record(z.string()).optional(),
});
export type VisualState = z.infer<typeof VisualStateSchema>;

export const ThemeTargetSchema = z.object({
  library: z.literal('@ultrst-armada/floks'),
  componentId: z.string(),
  componentVersion: z.string(),
  contractVersion: z.string().default('1.0.0'),
});
export type ThemeTarget = z.infer<typeof ThemeTargetSchema>;

export const ComponentThemeContractSchema = z.object({
  componentId: z.string(),
  componentVersion: z.string(),
  displayName: z.string().optional(),
  slots: z.array(VisualSlotSchema),
  states: z.array(VisualStateSchema),
  parameters: z.array(VisualParameterSchema),
  assets: z.array(z.string()),
});
export type ComponentThemeContract = z.infer<typeof ComponentThemeContractSchema>;

export const ThemePackSlotBindingSchema = z.object({
  slotId: z.string(),
  elementType: z.string(),
  assetRef: z.string().optional(),
  styles: z.record(z.string()).optional(),
});
export type ThemePackSlotBinding = z.infer<typeof ThemePackSlotBindingSchema>;

export const ThemePackStateMappingSchema = z.object({
  stateId: z.string(),
  parameterOverrides: z.record(z.union([z.string(), z.number(), z.boolean()])),
});
export type ThemePackStateMapping = z.infer<typeof ThemePackStateMappingSchema>;

export const ThemePackSchema = z.object({
  themeId: z.string(),
  name: z.string(),
  version: z.string(),
  target: ThemeTargetSchema,
  slots: z.array(ThemePackSlotBindingSchema),
  states: z.array(ThemePackStateMappingSchema),
  parameters: z.record(z.union([z.string(), z.number(), z.boolean()])),
  assetTypes: z.array(z.string()),
  metadata: z.record(z.unknown()).optional(),
});
export type ThemePack = z.infer<typeof ThemePackSchema>;
