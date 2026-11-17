/**
 * @file trustedOrigins.ts
 * @description Computes allowed origins for SRKL CORS governance.
 * Complies with Skipo line limits (< 200 lines).
 */

import { getPrimarySrklCoreDeploymentUrl } from '@ultrst-armada/kloks/backend/node';
import { getSystemCredentials } from './system-credentials';

export async function getTrustedOrigins(): Promise<string[]> {
  const record = await getSystemCredentials('system', true);
  const credentials = record?.credentials || {};
  const authSettings = credentials.betterAuth || {};
  let baseURL = (process.env.APP_URL || '').replace(/\/+$/, '');
  try {
    const primary = await getPrimarySrklCoreDeploymentUrl();
    if (primary) baseURL = primary;
  } catch {
    // Fall back to configured APP_URL or request origin
  }
  const configuredOrigins = Array.isArray(authSettings.trustedOrigins)
    ? authSettings.trustedOrigins.filter(
        (val: unknown): val is string => typeof val === 'string' && Boolean(val.trim()),
      )
    : [];
  const googleOAuth = credentials.googleDriveOAuth || credentials.googleOAuth || {};
  const googleReturnOrigins = Array.isArray(googleOAuth.allowedReturnOrigins)
    ? googleOAuth.allowedReturnOrigins.flatMap((value: unknown) => {
        if (typeof value !== 'string') return [];
        try {
          const parsed = new URL(value.trim());
          if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') return [];
          return [parsed.origin];
        } catch {
          return [];
        }
      })
    : [];
  return [...new Set([baseURL, ...configuredOrigins, ...googleReturnOrigins].filter(Boolean))];
}
