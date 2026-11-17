export interface ParsedCurl {
  method: string;
  url: string;
  path: string;
  protocol?: string;
  domain?: string;
  port?: number;
  headers: Record<string, string>;
  body: string | null;
  jsonPayload: any | null;
  queryParams: Record<string, string>;
  inferredSchema: any;
  summary: string;
  suggestedName: string;
}

function inferJsonSchema(value: any): any {
  if (value === null) return { type: 'null' };
  if (Array.isArray(value)) {
    return {
      type: 'array',
      items: value.length > 0 ? inferJsonSchema(value[0]) : { type: 'string' }
    };
  }
  if (typeof value === 'object') {
    const properties: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      properties[k] = inferJsonSchema(v);
    }
    return { type: 'object', properties };
  }
  return { type: typeof value };
}

function tokenizeCurl(input: string): string[] {
  const normalized = input.replace(/\\\r?\n/g, ' ').trim();
  const tokens: string[] = [];
  let current = '';
  let inQuote: "'" | '"' | null = null;
  let escape = false;

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    if (escape) {
      current += char;
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (inQuote) {
      if (char === inQuote) inQuote = null;
      else current += char;
      continue;
    }
    if (char === "'" || char === '"') {
      inQuote = char;
      continue;
    }
    if (/\s/.test(char)) {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
      continue;
    }
    current += char;
  }
  if (current.length > 0) tokens.push(current);
  return tokens;
}

export function parseCurlCommand(rawInput: string): ParsedCurl | null {
  if (!rawInput || !rawInput.trim()) return null;
  const tokens = tokenizeCurl(rawInput);
  if (tokens.length === 0) return null;

  let method: string | null = null;
  let rawUrl: string | null = null;
  const headers: Record<string, string> = {};
  let body: string | null = null;

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.toLowerCase() === 'curl') continue;

    if (tok === '-X' || tok === '--request') {
      if (tokens[i + 1]) { method = tokens[++i].toUpperCase(); continue; }
    }
    if (tok === '-H' || tok === '--header') {
      if (tokens[i + 1]) {
        const headerStr = tokens[++i];
        const colonIdx = headerStr.indexOf(':');
        if (colonIdx > 0) {
          const k = headerStr.substring(0, colonIdx).trim();
          const v = headerStr.substring(colonIdx + 1).trim();
          headers[k] = v;
        }
        continue;
      }
    }
    if (['-d', '--data', '--data-raw', '--data-binary', '--data-ascii'].includes(tok)) {
      if (tokens[i + 1]) { body = tokens[++i]; continue; }
    }
    if (tok === '--url') {
      if (tokens[i + 1]) { rawUrl = tokens[++i]; continue; }
    }
    if (!tok.startsWith('-') && !rawUrl) {
      rawUrl = tok;
    }
  }

  if (!rawUrl) rawUrl = '/api/endpoint';
  if (!method) method = body ? 'POST' : 'GET';

  let path = rawUrl;
  let protocol: string | undefined;
  let domain: string | undefined;
  let port: number | undefined;
  const queryParams: Record<string, string> = {};

  try {
    const parsed = new URL(rawUrl, 'http://localhost');
    path = parsed.pathname;
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      protocol = parsed.protocol.replace(':', '');
      domain = parsed.hostname;
      port = parsed.port ? parseInt(parsed.port, 10) : undefined;
    }
    parsed.searchParams.forEach((val, key) => { queryParams[key] = val; });
  } catch {
    path = rawUrl.split('?')[0];
  }

  let jsonPayload: any = null;
  let inferredSchema: any = { type: 'object', properties: {} };
  if (body) {
    try {
      jsonPayload = JSON.parse(body);
      inferredSchema = inferJsonSchema(jsonPayload);
    } catch {
      jsonPayload = { raw: body };
      inferredSchema = { type: 'object', properties: { raw: { type: 'string' } } };
    }
  }

  const cleanSegments = path.split('/').filter(Boolean);
  const lastSegment = cleanSegments[cleanSegments.length - 1] || 'endpoint';
  const suggestedName = lastSegment.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
  const summary = `${method} ${path}${jsonPayload ? ` (${Object.keys(jsonPayload).length} params)` : ''}`;

  return {
    method,
    url: rawUrl,
    path: path.startsWith('/') ? path : `/${path}`,
    protocol,
    domain,
    port,
    headers,
    body,
    jsonPayload,
    queryParams,
    inferredSchema,
    summary,
    suggestedName
  };
}
