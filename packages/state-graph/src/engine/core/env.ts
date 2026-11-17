/**
 * @file env.ts
 * @description Type-safe environment loading and config validation tool.
 */

import fs from "fs";
import path from "path";
import type { ZodTypeAny } from "zod";

/**
 * Reads a process environment variable with type coercion and defaults.
 */
export function getEnv<T>(key: string, defaultValue?: T): T {
  const val = process.env[key];
  if (val === undefined) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`[SkipoEnvError] Missing required environment variable: ${key}`);
  }

  if (typeof defaultValue === "number") {
    const num = Number(val);
    if (isNaN(num)) {
      throw new Error(`[SkipoEnvError] Expected number for ${key}, received: ${val}`);
    }
    return num as any;
  }

  if (typeof defaultValue === "boolean") {
    return (val === "true" || val === "1") as any;
  }

  try {
    if (defaultValue && typeof defaultValue === "object") {
      return JSON.parse(val);
    }
  } catch (e) {}

  return val as any;
}

/**
 * Asserts environment variable is set and returns its string value.
 */
export function requireEnv(key: string): string {
  const val = process.env[key];
  if (val === undefined) {
    throw new Error(`[SkipoEnvError] Missing required environment variable: ${key}`);
  }
  return val;
}

/**
 * Loads a .env file and injects variables into process.env.
 */
export function loadEnv(filePath?: string): void {
  const file = filePath || path.join(process.cwd(), ".env");
  if (!fs.existsSync(file)) return;

  try {
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const equalsIndex = trimmed.indexOf("=");
      if (equalsIndex === -1) continue;

      const key = trimmed.slice(0, equalsIndex).trim();
      let value = trimmed.slice(equalsIndex + 1).trim();

      // Handle quotes
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }

      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch (e) {}
}

/**
 * Validates the entire config using a Zod schema.
 */
export function validateEnvSchema<T extends ZodTypeAny>(zodSchema: T): T['_output'] {
  try {
    return zodSchema.parse(process.env);
  } catch (err: any) {
    throw new Error(`[SkipoEnvError] Environment validation failed: ${err.message || String(err)}`);
  }
}

/**
 * Checks if a connection string is a placeholder or template value.
 */
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
    'username:password'
  ];
  return placeholders.some(p => trimmed.includes(p));
}

/**
 * Sanitizes a database URL, returning undefined if it is empty or a placeholder.
 */
export function sanitizeDatabaseUrl(url?: string): string | undefined {
  if (!url || isPlaceholderConnection(url)) return undefined;
  return url.trim();
}

