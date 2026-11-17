/**
 * @file env.ts
 * @description Runtime-neutral environment value parsing and validation.
 */

import type { ZodTypeAny } from 'zod';

export type EnvironmentValues = Record<string, string | undefined>;

function currentEnvironment(): EnvironmentValues {
  const runtime = globalThis as typeof globalThis & {
    process?: { env?: EnvironmentValues };
  };
  return runtime.process?.env ?? {};
}

/**
 * Reads an environment value with type coercion and defaults.
 * Worker and browser callers should pass their environment bindings explicitly.
 */
export function getEnv<T>(key: string, defaultValue?: T, env: EnvironmentValues = currentEnvironment()): T {
  const val = env[key];
  if (val === undefined) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`[SkipoEnvError] Missing required environment variable: ${key}`);
  }

  if (typeof defaultValue === 'number') {
    const num = Number(val);
    if (Number.isNaN(num)) {
      throw new Error(`[SkipoEnvError] Expected number for ${key}, received: ${val}`);
    }
    return num as T;
  }

  if (typeof defaultValue === 'boolean') {
    return (val === 'true' || val === '1') as T;
  }

  try {
    if (defaultValue && typeof defaultValue === 'object') {
      return JSON.parse(val) as T;
    }
  } catch {}

  return val as T;
}

/** Asserts an environment value is set and returns its string value. */
export function requireEnv(key: string, env: EnvironmentValues = currentEnvironment()): string {
  const val = env[key];
  if (val === undefined) {
    throw new Error(`[SkipoEnvError] Missing required environment variable: ${key}`);
  }
  return val;
}

/** Validates an environment object using a Zod schema. */
export function validateEnvSchema<T extends ZodTypeAny>(
  zodSchema: T,
  env: EnvironmentValues = currentEnvironment(),
): T['_output'] {
  try {
    return zodSchema.parse(env);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`[SkipoEnvError] Environment validation failed: ${message}`);
  }
}

/** Checks if a connection string is a placeholder or template value. */
export function isPlaceholderConnection(url?: string): boolean {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim().toLowerCase();
  const placeholders = [
    'ep-sample',
    'example.com',
    'placeholder',
    'user:password@',
    'my_database',
    'your_password',
    'xxx.neon.tech',
    'username:password',
  ];
  return placeholders.some((placeholder) => trimmed.includes(placeholder));
}

/** Sanitizes a database URL, returning undefined if it is empty or a placeholder. */
export function sanitizeDatabaseUrl(url?: string): string | undefined {
  if (!url || isPlaceholderConnection(url)) return undefined;
  return url.trim();
}
