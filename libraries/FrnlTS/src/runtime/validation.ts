import { z } from 'zod';

export const entityIdSchema = z.string().min(1);
export const stateNameSchema = z.string().min(1);
export const propertyKeySchema = z.string().min(1);

/**
 * Property values are intentionally extensible to support arbitrary CSS, design tokens,
 * numeric scales, callbacks, or application payloads while the enclosing semantic structure
 * (entity ID, property key, and state model) is strictly validated.
 */
export const propertyValueSchema = z.unknown();
export const propertiesSchema = z.record(z.string(), propertyValueSchema);

/** Optional visual overrides registered under a theme's component and state names. */
export const frnlThemeStateSchema = z.object({
  visualParameters: propertiesSchema.optional(),
}).strict();

export const frnlThemeComponentSchema = z.object({
  states: z.record(z.string().min(1), frnlThemeStateSchema).optional(),
}).strict();

/** Themes are data-only maps: component name -> state name -> visual parameters. */
export const frnlThemeDefinitionSchema = z.record(
  z.string().min(1),
  frnlThemeComponentSchema,
);

export const entityStateSchema = z.object({
  state: stateNameSchema,
  properties: propertiesSchema,
});

export const entityStateChangedPayloadSchema = z.object({
  entityId: entityIdSchema,
  previousState: stateNameSchema,
  state: stateNameSchema,
});

export const entityPropertyChangedPayloadSchema = z.object({
  entityId: entityIdSchema,
  key: propertyKeySchema,
  value: propertyValueSchema,
});

export const flowTriggeredPayloadSchema = z.object({
  flowId: z.string().min(1),
  componentId: entityIdSchema,
  trigger: z.string().min(1),
  payload: propertyValueSchema.optional(),
});

export const frnlEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('entity.stateChanged'), payload: entityStateChangedPayloadSchema }),
  z.object({ type: z.literal('entity.propertyChanged'), payload: entityPropertyChangedPayloadSchema }),
  z.object({ type: z.literal('flow.triggered'), payload: flowTriggeredPayloadSchema }),
]);

export type EntityState = z.infer<typeof entityStateSchema>;
export type FrnlEventPayload = z.infer<typeof frnlEventSchema>;
export type FrnlEvent = z.infer<typeof frnlEventSchema>;

export function parseFrnlInput<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  return schema.parse(input);
}

export function validateFrnlInput<T extends z.ZodType>(schema: T, input: unknown): input is z.infer<T> {
  return schema.safeParse(input).success;
}
