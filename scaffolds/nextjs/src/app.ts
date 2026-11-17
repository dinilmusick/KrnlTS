import { externalInterfaces } from "./backend/UniversalBackend.js";
import { proxyLuthAuthRequest } from "./backend/auth/luthSession.js";

/**
 * Canonical Web-standard application entrypoint.
 * All provider adapters delegate to this handler; add application routes here.
 */
export interface SkipoEnv {
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
  [key: string]: unknown;
}

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "access-control-allow-headers": "content-type,authorization",
};

async function fetchStaticAsset(
  request: Request,
  assets: SkipoEnv["ASSETS"],
): Promise<Response | null> {
  if (!assets || (request.method !== "GET" && request.method !== "HEAD")) return null;
  const pathname = new URL(request.url).pathname;
  if (pathname.startsWith("/api/") || pathname === "/mcp") return null;

  const candidates: string[] = [];
  if (pathname === "/") {
    candidates.push("/index.html");
  } else if (!pathname.includes(".")) {
    const cleanPath = pathname.replace(/\/$/, "");
    candidates.push(`${cleanPath}.html`, `${cleanPath}/index.html`, pathname, "/index.html");
  } else {
    candidates.push(pathname);
  }

  for (const candidate of candidates) {
    const assetUrl = new URL(request.url);
    assetUrl.pathname = candidate;
    const response = await assets.fetch(new Request(assetUrl, request));
    if (response.status !== 404) return response;
  }
  return null;
}

export async function fetch(
  request: Request,
  env: SkipoEnv = {},
  _ctx?: unknown,
): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const authProxy = await proxyLuthAuthRequest(request);
  if (authProxy) return authProxy;
  const mcp = await externalInterfaces.mcp(request);
  if (mcp) return mcp;
  const http = await externalInterfaces.http(request);
  if (http) return http;
  if (url.pathname === "/health" || url.pathname === "/api/health") {
    return Response.json({ status: "ok", runtime: "fetch" }, { headers: cors });
  }
  const assetResponse = await fetchStaticAsset(request, env.ASSETS);
  if (assetResponse) return assetResponse;
  return Response.json({ error: "Not Found" }, { status: 404, headers: cors });
}

export default { fetch };
