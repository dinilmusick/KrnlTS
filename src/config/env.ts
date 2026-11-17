/**
 * @file env.ts
 * @description Canonical Kone environment boundary.
 * SYSTEM_DATABASE_URL is the only required application-provided secret.
 */

export interface AppEnv {
  NODE_ENV: string;
  SYSTEM_DATABASE_URL?: string;
  SYSTEM_DATABASE_URL_2?: string;
  SYSTEM_DATABASE_URL_3?: string;
}

export function getAppEnv(): AppEnv {
  if (typeof process !== 'undefined' && process.env) {
    return {
      NODE_ENV: process.env.NODE_ENV || 'development',
      SYSTEM_DATABASE_URL: process.env.SYSTEM_DATABASE_URL,
      SYSTEM_DATABASE_URL_2: process.env.SYSTEM_DATABASE_URL_2,
      SYSTEM_DATABASE_URL_3: process.env.SYSTEM_DATABASE_URL_3,
    };
  }
  return { NODE_ENV: 'development' };
}

export { resolveSystemDatabaseUrl } from '@ultrst-armada/kloks/backend';
