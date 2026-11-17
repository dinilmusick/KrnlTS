/** Resolve APP_URL from a Node.js server environment. Keep process access out of portable entry graphs. */
export function resolveServerRuntimeAppUrl(): string {
  const runtimeProcess = (globalThis as {
    process?: { env?: Record<string, string | undefined> };
  }).process;
  return runtimeProcess?.env?.APP_URL?.trim() || '';
}
