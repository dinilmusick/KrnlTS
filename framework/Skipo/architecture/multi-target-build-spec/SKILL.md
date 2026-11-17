---
name: multi-target-build-spec
description: One Fetch-standard Skipo application with one build command and generated provider packaging.
---

# SKIPO FETCH APPLICATION AND PROVIDER BUILD CONTRACT

## 1. Invariant

A generated Skipo application has exactly one application implementation:

- Canonical application entry: \`src/app.ts\`
- Application protocol: Web-standard \`fetch(Request, env, ctx) => Promise<Response>\`
- Canonical build command: \`npm run build\`
- Provider-specific files are generated adapters, never independent application implementations.

\`\`\`text
                 src/app.ts
          Fetch(Request, Env, Context)
                     |
          +----------+-----------+
          |          |           |
      Cloudflare   Vercel       Node
       adapter     adapter     adapter
          |          |           |
       Worker      Edge API    HTTP server
          +----------+-----------+
                     |
              npm run build
                     |
       generated provider artifacts
\`\`\`

Application routing, authentication, authorization, and business behavior belong behind the Fetch contract. Provider adapters may translate platform bindings or transport requests, but must delegate to the same application handler.

## 2. Generated provider package contract

The scaffold generator emits:

| File | Responsibility |
|---|---|
| \`src/app.ts\` | Sole Fetch application entry |
| \`src/providers/cloudflare.ts\` | Cloudflare ExportedHandler wrapper |
| \`src/providers/vercel.ts\` | Vercel Edge wrapper |
| \`src/providers/node.ts\` | Node HTTP-to-Fetch bridge |
| \`skipo.providers.json\` | Machine-readable provider and artifact manifest |
| \`scripts/skipo-build.mjs\` | Single provider-aware build pipeline |
| \`wrangler.toml\` | Generated Cloudflare Worker + assets configuration |
| \`vercel.json\` | Generated Vercel build/output configuration |

Provider packaging is generated from the manifest and canonical Fetch application. Do not hand-maintain a second backend implementation per provider.

## 3. One build command

Every generated application exposes \`npm run build\`. The build:

1. Builds frontend assets when the selected frontend toolchain is present.
2. Bundles the Cloudflare adapter to \`dist/providers/cloudflare/worker.js\`.
3. Bundles the Vercel Edge adapter to \`api/index.js\`.
4. Bundles the Node adapter to \`dist/providers/node/server.js\`.
5. Fails immediately if any provider bundle fails.

There are no \`build:fullstack\` or \`build:api\` commands. Platform deployment invokes the same canonical build command and consumes its provider-specific output.

## 4. Dependency DAG preservation

The scaffold may declare dependencies at the application boundary, but it must not rewrite ecosystem package versions or invert package ownership:

\`\`\`text
GutTS
  ├── KrnlTS
  └── FrnlTS
        |
        v
     Kloks / Floks
        |
        v
       Skipo
        |
        v
  Generated application
\`\`\`

Skipo consumes public package contracts. It must not copy package source, introduce reverse imports, or make provider packaging depend on a new ecosystem layer.

## 5. Runtime and portability rules

- The canonical application entry uses Web platform APIs: Request, Response, Headers, URL, fetch, streams, and Web Crypto.
- Node built-ins are allowed only in \`src/providers/node.ts\`.
- Cloudflare and Vercel bundles must not include Node-only adapter imports.
- The Cloudflare default export is an object with a \`fetch\` method.
- Provider adapters must not contain application business logic.
- Environment bindings are passed to the Fetch handler; secrets are not emitted into generated manifests.
- Static assets are generated into a shared client output directory and configured through provider manifests.

## 6. Fresh scaffold regression gate

Tests must create independent temporary applications from the public scaffold entrypoint and assert:

1. The canonical Fetch entry and all provider adapters exist.
2. The provider manifest points every provider at the same application entry.
3. Exactly one build command is exposed.
4. Ecosystem dependency versions remain unchanged.
5. The generated provider build emits Cloudflare, Vercel, and Node artifacts.
6. The Cloudflare bundle contains no Node built-in imports.
7. Repeated generation is deterministic and does not duplicate files.

A scaffold is not verified merely because its templates exist. At least one clean generated application must install dependencies and complete \`npm run build\` in CI.
