import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fetchHandler } from "../backend/adapters/httpsAdapter.js";

const root = process.cwd();
const assets = {
  async fetch(request: Request): Promise<Response> {
    const pathname = decodeURIComponent(new URL(request.url).pathname);
    const requested = resolve(root, "dist/client", `.${pathname}`);
    const base = resolve(root, "dist/client");
    if (requested !== base && !requested.startsWith(base + sep)) {
      return new Response("Not Found", { status: 404 });
    }
    const candidates = [requested];
    for (const candidate of candidates) {
      try {
        const body = await readFile(candidate);
        const types: Record<string, string> = {
          ".html": "text/html; charset=utf-8",
          ".js": "text/javascript; charset=utf-8",
          ".css": "text/css; charset=utf-8",
          ".json": "application/json",
          ".svg": "image/svg+xml",
          ".png": "image/png",
        };
        return new Response(body, {
          headers: { "content-type": types[extname(candidate)] || "application/octet-stream" },
        });
      } catch { /* Try the SPA index fallback. */ }
    }
    return new Response("Not Found", { status: 404 });
  },
};

const port = Number(process.env.PORT || 3000);
const server = createServer(async (incoming, outgoing) => {
  try {
    const protocol = incoming.headers["x-forwarded-proto"] || "http";
    const host = incoming.headers.host || "localhost";
    const chunks: Uint8Array[] = [];
    for await (const chunk of incoming) chunks.push(
      typeof chunk === "string" ? Buffer.from(chunk) : chunk,
    );
    const body = incoming.method === "GET" || incoming.method === "HEAD"
      ? undefined
      : Buffer.concat(chunks);
    const request = new Request(`${protocol}://${host}${incoming.url || "/"}`, {
      method: incoming.method,
      headers: incoming.headers as HeadersInit,
      body,
    });
    const response = await fetchHandler(request, { ...process.env, ASSETS: assets });
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    outgoing.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    outgoing.end(error instanceof Error ? error.message : "Internal Server Error");
  }
});
server.listen(port, () => console.log(`Skipo Fetch app listening on ${port}`));
