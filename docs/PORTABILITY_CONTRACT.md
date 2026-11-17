# Skipo cross-provider application contract

## Canonical application entry

Every generated application has one provider-independent entry point:

- `src/app.ts`
- `export async function fetch(request: Request, env?: SkipoEnv, ctx?: unknown): Promise<Response>`

Application routes use the Web-standard `Request` and `Response` contracts. Application behavior, Luth authentication, HTTP capabilities, MCP handling, and static asset dispatch are implemented once at this boundary.

The developer-facing build command is `npm run build` (also available as `pnpm build` or `yarn build`).

## Provider outputs

| Target | Adapter | Generated output |
|---|---|---|
| Cloudflare Workers | `src/providers/cloudflare.ts` | `dist/providers/cloudflare/worker.js` |
| Vercel Edge HTTP | `src/providers/vercel.ts` | `api/[...path].js` |
| Vercel Edge MCP | `src/providers/vercel.ts` | `api/mcp.js` |
| Local Node.js / Cloud Run | `src/providers/node.ts` | `dist/providers/node/server.js` |

Vercel rewrites `/api/:path*` to the catch-all function and `/mcp` to the dedicated MCP function. The MCP adapter accepts both `/mcp` and `/api/mcp`.

The Node adapter owns Node HTTP, filesystem asset serving, and process startup. It is not imported by the Cloudflare or Vercel adapters. Cloud Run uses the same Node output and `npm start`.

## Interfaces and authentication

- HTTP capability discovery and invocation are exposed through the standard HTTP adapter.
- MCP tools are exposed through the MCP adapter.
- Both interfaces use the same capability registry, Luth session authentication, and role checks.
- Unauthenticated callers cannot discover or invoke authenticated capabilities.
- The generic application contract does not require a hosting-provider SDK.

## Dependency and scaffold policy

- Vite and Next.js templates share the same Fetch application contract and provider outputs.
- The generated pnpm manifest explicitly approves the esbuild build step.
- Ecosystem package baselines are pinned to currently published compatible versions in the manifest and lockfile.
- Generic applications do not import Kloks browser audio/MIDI runtimes.
- Aiko/FOD-specific application modules are not part of generic Skipo scaffolds.
