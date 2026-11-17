/**
 * @file functions/index.ts
 * @description Pure environment-neutral utility functions.
 */

export function sanitizeIdentifier(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
}

export function isValidServiceKey(key: string): boolean {
  return typeof key === 'string' && key.trim().length >= 4;
}
