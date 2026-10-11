/**
 * @file ValidationConcepts.ts
 * @role component
 * @description Polymorphic generic templates for Zod schema validation and assertion contracts.
 */

import { z } from "zod";

export interface ValidationSuccess<T> {
  success: true;
  data: T;
}

export interface ValidationFailure {
  success: false;
  errors: string[];
  fieldErrors?: Record<string, string[]>;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

/**
 * Formats a ZodError into a human-readable list of string error messages.
 */
export function formatZodErrors(error: z.ZodError): string[] {
  return error.errors.map((e) => {
    const field = e.path.join(".");
    return field ? `[${field}] ${e.message}` : e.message;
  });
}

/**
 * Validates data against any Zod schema and returns a structured ValidationResult.
 */
export function validateSchema<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  data: unknown
): ValidationResult<z.infer<TSchema>> {
  const parsed = schema.safeParse(data);
  if (parsed.success) {
    return {
      success: true,
      data: parsed.data
    };
  }

  const flattened = parsed.error.flatten();
  return {
    success: false,
    errors: formatZodErrors(parsed.error),
    fieldErrors: flattened.fieldErrors as Record<string, string[]>
  };
}

/**
 * Asserts that data satisfies a given Zod schema, throwing an Error if invalid.
 */
export function assertSchema<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  data: unknown,
  customErrorMessage?: string
): asserts data is z.infer<TSchema> {
  const result = validateSchema(schema, data);
  if (!result.success) {
    const msg = customErrorMessage
      ? `${customErrorMessage}: ${result.errors.join("; ")}`
      : `[SCHEMA_VALIDATION_ERROR] ${result.errors.join("; ")}`;
    throw new Error(msg);
  }
}
