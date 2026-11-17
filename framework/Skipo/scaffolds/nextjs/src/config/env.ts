/**
 * @file env.ts
 * @description Typed environment access for MyApp.
 * Conforms to Skipo Governance (< 200 lines).
 */

export interface AppEnv {
  NODE_ENV: string;
  APP_URL?: string;
  GEMINI_API_KEY?: string;
  SYSTEM_DATABASE_URL?: string;
  SYSTEM_DATABASE_URL_2?: string;
  SYSTEM_DATABASE_URL_3?: string;
}

export function getAppEnv(): AppEnv {
  if (typeof process !== 'undefined' && process.env) {
    return {
      NODE_ENV: process.env.NODE_ENV || 'development',
      APP_URL: process.env.APP_URL,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      SYSTEM_DATABASE_URL: process.env.SYSTEM_DATABASE_URL,
      SYSTEM_DATABASE_URL_2: process.env.SYSTEM_DATABASE_URL_2,
      SYSTEM_DATABASE_URL_3: process.env.SYSTEM_DATABASE_URL_3,
    };
  }
  return {
    NODE_ENV: 'development',
  };
}

export { resolveSystemDatabaseUrl } from '@ultrst-armada/kloks/backend';
