export interface FrnlRoute {
  readonly id: string;
  readonly pattern: string;
  readonly load?: () => Promise<unknown>;
}

export interface FrnlRouteMatch {
  readonly id: string;
  readonly params: Readonly<Record<string, string>>;
  readonly query: Readonly<Record<string, string>>;
  readonly path: string;
}

export interface BuildRouteUrlOptions {
  /** If true, throws an error if params contains keys not declared in the route pattern. */
  readonly strict?: boolean;
  /** If true, unconsumed keys from params are automatically appended to query parameters. */
  readonly appendUnmatchedParamsToQuery?: boolean;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizePattern(pattern: string): string {
  if (!pattern || pattern.trim() === '') {
    return '/';
  }
  const trimmed = pattern.trim();
  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeading.length > 1 && withLeading.endsWith('/')
    ? withLeading.slice(0, -1)
    : withLeading;
}

interface CompiledRoute {
  regex: RegExp;
  paramNames: string[];
  wildcardName?: string;
}

function compileRoute(pattern: string): CompiledRoute {
  const norm = normalizePattern(pattern);
  const paramNames: string[] = [];
  let wildcardName: string | undefined;

  const parts = norm.split('/');
  const regexParts = parts.map((part) => {
    if (part.startsWith(':')) {
      const name = part.slice(1);
      paramNames.push(name);
      return '([^/]+)';
    }
    if (part === '*' || part.startsWith('*')) {
      const name = part.length > 1 ? part.slice(1) : 'wildcard';
      wildcardName = name;
      paramNames.push(name);
      return '(.*)';
    }
    return escapeRegex(part);
  });

  const source = regexParts.join('/');
  return {
    regex: new RegExp(`^${source}/?$`),
    paramNames,
    wildcardName,
  };
}

export function matchRoute(route: FrnlRoute, url: string): FrnlRouteMatch | null {
  const parsed = new URL(url, 'http://frnl.local');
  const compiled = compileRoute(route.pattern);
  const match = compiled.regex.exec(parsed.pathname);

  if (!match) {
    return null;
  }

  const params: Record<string, string> = {};
  compiled.paramNames.forEach((name, index) => {
    const rawVal = match[index + 1] ?? '';
    params[name] = decodeURIComponent(rawVal);
  });

  const query: Record<string, string> = {};
  parsed.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  return {
    id: route.id,
    params: Object.freeze(params),
    query: Object.freeze(query),
    path: parsed.pathname,
  };
}

export function buildRouteUrl(
  route: FrnlRoute,
  params: Record<string, string> = {},
  query: Record<string, string> = {},
  options: BuildRouteUrlOptions = {}
): string {
  const norm = normalizePattern(route.pattern);
  const parts = norm.split('/');
  const consumedParams = new Set<string>();

  const builtParts = parts.map((part) => {
    if (part.startsWith(':')) {
      const name = part.slice(1);
      consumedParams.add(name);
      const value = params[name];
      if (value === undefined || value === null || value === '') {
        throw new Error(`Missing route parameter: ${name}`);
      }
      return encodeURIComponent(value);
    }
    if (part === '*' || part.startsWith('*')) {
      const name = part.length > 1 ? part.slice(1) : 'wildcard';
      consumedParams.add(name);
      consumedParams.add('wildcard');
      const value = params[name] ?? params.wildcard ?? '';
      return value
        .split('/')
        .map((segment) => encodeURIComponent(segment))
        .join('/');
    }
    return part;
  });

  const path = builtParts.join('/') || '/';

  // Check for unknown / unconsumed parameters
  const unconsumed: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (!consumedParams.has(key)) {
      if (options.strict) {
        throw new Error(`Unknown route parameter: ${key}`);
      }
      unconsumed[key] = value;
    }
  }

  const finalQuery: Record<string, string> = {
    ...(options.appendUnmatchedParamsToQuery ? unconsumed : {}),
    ...query,
  };

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(finalQuery)) {
    if (value !== undefined && value !== null) {
      searchParams.set(key, value);
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export class FrnlRouter {
  private readonly routeMap = new Map<string, FrnlRoute>();
  private readonly patternMap = new Map<string, string>(); // pattern -> routeId

  constructor(routes: readonly FrnlRoute[] = []) {
    for (const route of routes) {
      this.addRoute(route);
    }
  }

  addRoute(route: FrnlRoute): void {
    if (!route || !route.id || typeof route.id !== 'string') {
      throw new TypeError('Invalid route: id must be a non-empty string');
    }
    if (this.routeMap.has(route.id)) {
      throw new Error(`Duplicate route id: ${route.id}`);
    }

    const norm = normalizePattern(route.pattern);
    const existingRouteId = this.patternMap.get(norm);
    if (existingRouteId) {
      throw new Error(
        `Conflicting route pattern '${route.pattern}' already registered by route '${existingRouteId}'`
      );
    }

    this.routeMap.set(route.id, Object.freeze({ ...route }));
    this.patternMap.set(norm, route.id);
  }

  getRoute(id: string): FrnlRoute | undefined {
    return this.routeMap.get(id);
  }

  match(url: string): FrnlRouteMatch | null {
    for (const route of this.routeMap.values()) {
      const match = matchRoute(route, url);
      if (match) {
        return match;
      }
    }
    return null;
  }

  async resolve(url: string): Promise<{ match: FrnlRouteMatch; data?: unknown } | null> {
    const match = this.match(url);
    if (!match) {
      return null;
    }
    const route = this.routeMap.get(match.id);
    const data = route?.load ? await route.load() : undefined;
    return { match, data };
  }

  list(): readonly FrnlRoute[] {
    return [...this.routeMap.values()];
  }

  clear(): void {
    this.routeMap.clear();
    this.patternMap.clear();
  }
}