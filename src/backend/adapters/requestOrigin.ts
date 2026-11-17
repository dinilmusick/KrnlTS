export interface RequestOriginInput {
  remoteAddress?: string | null;
  forwardedHost?: string | string[];
  forwardedProto?: string | string[];
}
function singleHeader(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value.length === 1 ? value[0].trim() : null;
  if (typeof value !== 'string' || value.includes(',')) return null;
  return value.trim();
}
function isLoopback(address: string | null | undefined): boolean {
  if (!address) return false;
  const normalized = address.toLowerCase().replace(/^::ffff:/, '');
  return normalized === '::1' || normalized === '127.0.0.1' || /^127(?:\.\d{1,3}){3}$/.test(normalized);
}
function parseOrigin(host: string, protocol: string): string | null {
  if (!host || /[\s,/@\\]/.test(host) || !['http','https'].includes(protocol.toLowerCase())) return null;
  try {
    const parsed = new URL(protocol.toLowerCase() + '://' + host);
    if (!parsed.hostname || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) return null;
    return parsed.origin;
  } catch { return null; }
}
function appOrigin(appUrl?: string | null): string {
  if (appUrl) {
    try {
      const parsed = new URL(appUrl);
      if (['http:','https:'].includes(parsed.protocol) && parsed.hostname && !parsed.username && !parsed.password) return parsed.origin;
    } catch {}
  }
  return 'http://localhost:3000';
}
export function resolveRequestOrigin(input: RequestOriginInput, appUrl?: string | null): string {
  const fallback = appOrigin(appUrl);
  if (!isLoopback(input.remoteAddress)) return fallback;
  const host = singleHeader(input.forwardedHost);
  const protocol = singleHeader(input.forwardedProto);
  if (!host || !protocol) return fallback;
  return parseOrigin(host, protocol) || fallback;
}
