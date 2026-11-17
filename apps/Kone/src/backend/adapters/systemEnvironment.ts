import { tryResolveSystemDatabaseUrl } from '@ultrst-armada/kloks/backend/resolver';

export type SystemEnvironment = Record<string, unknown> & {
  SYSTEM_DATABASE_URL?: string;
  SYSTEM_DATABASE_URL_2?: string;
  SYSTEM_DATABASE_URL_3?: string;
  APP_URL?: string;
};

function clean(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().replace(/^[\"']|[\"']$/g, '').trim();
  return normalized || undefined;
}

/**
 * Normalize deployment bindings for canonical Kloks services.
 * The Fetch path always passes an explicit binding record to Kloks' resolver;
 * it never consults the Node environment object. The legacy _1 alias is deliberately
 * excluded so the supported order is primary, _2, then _3.
 */
export function normalizeSystemEnvironment(
  input: Record<string, unknown> = {},
  requestUrl?: string,
): SystemEnvironment {
  const databaseBindings = {
    SYSTEM_DATABASE_URL: clean(input.SYSTEM_DATABASE_URL),
    SYSTEM_DATABASE_URL_2: clean(input.SYSTEM_DATABASE_URL_2),
    SYSTEM_DATABASE_URL_3: clean(input.SYSTEM_DATABASE_URL_3),
  };
  const resolvedPrimary = tryResolveSystemDatabaseUrl(databaseBindings);
  const appUrl = clean(input.APP_URL) || (requestUrl ? new URL(requestUrl).origin : undefined);
  const rest = { ...input };
  delete rest.SYSTEM_DATABASE_URL_1;

  return {
    ...rest,
    ...databaseBindings,
    ...(resolvedPrimary ? { SYSTEM_DATABASE_URL: resolvedPrimary } : { SYSTEM_DATABASE_URL: undefined }),
    APP_URL: appUrl,
  };
}
