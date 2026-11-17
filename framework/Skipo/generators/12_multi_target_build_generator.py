#!/usr/bin/env python3
"""
Aspect 12: Multi-Target Build & Protocol Adapters Generator
Generates:
- Single Universal Polyglot Entrypoint (src/backend/adapters/universalEntry.ts)
- Universal Fetch Protocol Adapter (src/backend/adapters/httpsAdapter.ts)
- Node HTTP to Web Standard Bridge (src/backend/adapters/nodeBridge.ts)
- Cloudflare Worker configuration (wrangler.toml) with run_worker_first = true
- Single Universal Build Pipeline (scripts/skipo-build.cjs)
- API target TypeScript configuration (tsconfig.api.json)
"""

from pathlib import Path
from typing import List, Dict, Any
import json
import sys
import time

try:
    from .common import (
        GeneratedFile, GeneratorResult, emit_directory,
        print_generator_report, parse_generator_args
    )
except ImportError:
    from common import (
        GeneratedFile, GeneratorResult, emit_directory,
        print_generator_report, parse_generator_args
    )

GENERATOR_ID = "12_multi_target_build_generator"
GENERATOR_TITLE = "MULTI_TARGET_BUILD_SPEC Canonical Generator"

def generate_multi_target_suite(target_dir: Path, params: Dict[str, Any]) -> GeneratorResult:
    start_time = time.time()
    files: List[GeneratedFile] = []
    
    app_name = params.get("name") or "SkipoApp"
    backend_import = params.get("backend_facade") or f"{app_name}Backend"
    
    # 1. nodeBridge.ts (Node.js HTTP to Web Standard fetch bridge)
    node_bridge_code = """/**
 * @file nodeBridge.ts
 * @description Bridges Node.js IncomingMessage / ServerResponse to Web Standard fetch.
 * Enables identical execution in Node.js (Vercel Serverless / local dev) and Cloudflare Workers.
 * Conforms to Skipo Governance (< 100 lines). Zero Express dependency.
 */

export async function adaptNodeRequest(
  req: any,
  res: any,
  fetchHandler: (req: Request, env?: any) => Promise<Response>,
  env?: any
) {
  if (req instanceof Request) {
    return fetchHandler(req, env);
  }

  const protocol = req.headers['x-forwarded-proto'] || (req.socket?.encrypted ? 'https' : 'http');
  const host = req.headers.host || 'localhost:3000';
  const url = new URL(req.url || '/', `${protocol}://${host}`);

  let body: any = null;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (req.body && typeof req.body === 'object') {
      body = JSON.stringify(req.body);
    } else if (typeof req.body === 'string') {
      body = req.body;
    } else {
      const chunks: any[] = [];
      for await (const chunk of req) chunks.push(chunk);
      body = Buffer.concat(chunks).toString();
    }
  }

  const webReq = new Request(url.toString(), {
    method: req.method,
    headers: req.headers,
    body: body && body.length > 0 ? body : undefined,
  });

  const webRes = await fetchHandler(webReq, env || process.env);

  res.statusCode = webRes.status;
  webRes.headers.forEach((val: string, key: string) => {
    res.setHeader(key, val);
  });
  const text = await webRes.text();
  res.end(text);
}
"""
    files.append(GeneratedFile(
        relative_path="src/backend/adapters/nodeBridge.ts",
        content=node_bridge_code,
        description="Node HTTP to Web Standard fetch bridge for Vercel Serverless and Node server."
    ))

    # 1.1 httpsAdapter.ts (Universal Fetch API / Routing / Asset Fallback)
    adapter_code = """/**
 * Compatibility adapter for existing Skipo backend route imports.
 * The canonical application implementation lives only in src/app.ts.
 */
export { fetch as fetchHandler, default } from '../../app.js';
export type { SkipoEnv as Env } from '../../app.js';
"""
    if not (target_dir / "src/backend/adapters/httpsAdapter.ts").exists():
        files.append(GeneratedFile(
            relative_path="src/backend/adapters/httpsAdapter.ts",
            content=adapter_code,
            description="Compatibility re-export for the canonical Fetch application entry."
        ))

    # 1.2 universalEntry.ts (Single Universal Polyglot Entrypoint: CF Workers, Vercel, Node)
    universal_entry_code = f"""/**
 * @file universalEntry.ts
 * @description Single Universal Backend Entrypoint for {app_name}.
 * Canonical Web-standard Fetch application running on Cloudflare Workers and serverless runtimes.
 */

import {{ fetchHandler, Env }} from './httpsAdapter';
import {{ adaptNodeRequest }} from './nodeBridge';

export function normalizeEnv(env: Env = {{}}, requestUrl?: string): Env {{
  return {{
    ...env,
    SYSTEM_DATABASE_URL: (env.SYSTEM_DATABASE_URL as string) || (typeof process !== 'undefined' ? process.env.SYSTEM_DATABASE_URL : undefined),
    SYSTEM_DATABASE_URL_2: (env.SYSTEM_DATABASE_URL_2 as string) || (typeof process !== 'undefined' ? process.env.SYSTEM_DATABASE_URL_2 : undefined),
    SYSTEM_DATABASE_URL_3: (env.SYSTEM_DATABASE_URL_3 as string) || (typeof process !== 'undefined' ? process.env.SYSTEM_DATABASE_URL_3 : undefined),
    APP_URL: (env.APP_URL as string) || (typeof process !== 'undefined' ? process.env.APP_URL : undefined) || (requestUrl ? new URL(requestUrl).origin : undefined),
  }};
}}

// Polyglot Universal Handler for Node.js / Serverless bridging
const universalHandler = async function (req: any, res?: any, env?: any): Promise<any> {{
  if (req && res && typeof res.writeHead === 'function') {{
    return adaptNodeRequest(req, res, (webReq) => fetchHandler(webReq, normalizeEnv((process.env as unknown as Env) || {{}}, req.url)));
  }}
  return fetchHandler(req, normalizeEnv(env || res, req?.url));
}};

// Cloudflare Workers ExportedHandler — Law L24: MUST be plain object literal {{ fetch }}
export default {{
  async fetch(request: Request, env: Env = {{}}, ctx?: any): Promise<Response> {{
    return fetchHandler(request, normalizeEnv(env, request.url));
  }},
}};

export {{ fetchHandler, adaptNodeRequest, universalHandler }};
"""
    files.append(GeneratedFile(
        relative_path="src/backend/adapters/universalEntry.ts",
        content=universal_entry_code,
        description="Single Universal Polyglot Entrypoint for Node, Vercel, and Cloudflare Workers."
    ))

    # 2. Build manifests
    fullstack_manifest = {
        "target": "fullstack",
        "include": ["frontend", "backend", "libraries", "frontend-state"],
        "exclude": []
    }
    api_manifest = {
        "target": "api",
        "entry": "src/backend/adapters/universalEntry.ts",
        "include": [
            "backend/adapters",
            "backend/services/core",
            "backend/orchestrations",
            "backend/gateway",
            "libraries"
        ],
        "exclude": ["frontend", "frontend-state", "**/client/**"]
    }
    files.append(GeneratedFile(
        relative_path="config/build/manifests/fullstack.json",
        content=json.dumps(fullstack_manifest, indent=2) + "\n",
        description="Build manifest defining includes/excludes for FULLSTACK target."
    ))
    files.append(GeneratedFile(
        relative_path="config/build/manifests/api.json",
        content=json.dumps(api_manifest, indent=2) + "\n",
        description="Build manifest defining includes/excludes for API target."
    ))

    # 3. wrangler.toml (Law L22, L24: main = api/index.js, run_worker_first = true)
    wrangler_content = f"""name = "{app_name.lower()}-engine"
main = "api/index.js"
compatibility_date = "2024-10-01"
compatibility_flags = ["nodejs_compat", "nodejs_compat_populate_process_env"]

[assets]
directory = "./dist"
binding = "ASSETS"
run_worker_first = true
not_found_handling = "single-page-application"

[build]
command = "npm run build"

[vars]
APP_URL = "http://localhost:3000"
"""
    files.append(GeneratedFile(
        relative_path="wrangler.toml",
        content=wrangler_content,
        description="Cloudflare Worker deployment manifest configured for universal single artifact."
    ))

    # Database and other provider-specific capabilities are opt-in. The generic
    # application scaffold must not require a database URL or provider binding.

    # 4. vercel.json Contract
    vercel_config = {
        "$schema": "https://openapi.vercel.sh/vercel.json",
        "framework": "vite",
        "buildCommand": "npm run build",
        "outputDirectory": "dist",
        "rewrites": [
            {"source": "/api/(.*)", "destination": "/api"},
            {"source": "/(.*)", "destination": "/index.html"}
        ]
    }
    files.append(GeneratedFile(
        relative_path="vercel.json",
        content=json.dumps(vercel_config, indent=2) + "\n",
        description="Vercel full-stack deployment contract supporting SPA rewrites and Serverless Function."
    ))

    # 5. scripts/skipo-build.cjs (Single Universal Artifact Pipeline: Law L22)
    skipo_build_script = """#!/usr/bin/env node

/**
 * @file skipo-build.cjs
 * @description Single Universal Build Pipeline for Skipo framework applications.
 * Conforms to Law L22 (Single Build Pipeline).
 *
 * Compiles all targets into ONE universal artifact set:
 * 1. Frontend SPA (Vite) -> dist/
 * 2. Universal Polyglot Backend (esbuild) -> api/index.js
 *    (Serves Local Node, Vercel Serverless, and Cloudflare Workers identically)
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

console.log('[skipo-build] Starting Universal Single-Pass Build...');
const startTime = Date.now();

// Ensure output directories exist
fs.mkdirSync(path.join(rootDir, 'api'), { recursive: true });

function run(cmd, desc) {
  console.log(`[skipo-build] ${desc}...`);
  execSync(cmd, { cwd: rootDir, stdio: 'inherit' });
}

function compressWasmAssets() {
  if (!fs.existsSync(distDir)) return;
  let compressedCount = 0;
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) { visit(p); continue; }
      if (!entry.isFile() || !entry.name.endsWith('.wasm')) continue;
      const src = fs.readFileSync(p);
      fs.writeFileSync(`${p}.gz`, zlib.gzipSync(src, { level: 9 }));
      fs.unlinkSync(p);
      compressedCount++;
    }
  };
  visit(distDir);
  if (compressedCount > 0) {
    console.log(`[skipo-build] Prepared ${compressedCount} compressed WASM asset(s) for Cloudflare.`);
  }
}

try {
  // 1. Frontend SPA build
  run('npx vite build', 'Building Vite frontend assets');
  compressWasmAssets();

  const nodeBuiltins = [
    'http', 'https', 'http2', 'events', 'stream', 'buffer', 'fs', 'path',
    'url', 'util', 'net', 'tls', 'zlib', 'os', 'child_process',
    'crypto', 'worker_threads', 'cluster', 'dgram', 'dns', 'readline', 'vm',
    'querystring', 'process', 'assert', 'tty', 'perf_hooks', 'string_decoder',
    'inspector', '@aws-sdk/*', 'node:*',
    '@ultrst-armada/kloks/backend/node'
  ].map((m) => `'--external:${m}'`).join(' ');

  // 2. Single Universal Polyglot Backend bundle
  run(
    `npx esbuild src/backend/adapters/universalEntry.ts --bundle --platform=neutral --format=esm --alias:crypto=node:crypto --define:import.meta.url='"https://localhost/api/index.js"' ${nodeBuiltins} --outfile=api/index.js`,
    'Bundling Single Universal Polyglot Backend (api/index.js)'
  );

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\\n✨ [skipo-build] Universal single-artifact build completed in ${duration}s.`);
} catch (error) {
  console.error('\\n❌ [skipo-build] Build failed:', error.message);
  process.exit(error.status || 1);
}
"""
    files.append(GeneratedFile(
        relative_path="scripts/skipo-build.cjs",
        content=skipo_build_script,
        description="Single Universal Build Pipeline script compiling frontend and universal polyglot backend."
    ))

    required_scripts = {
        "build": "node scripts/skipo-build.mjs",
        "start": "node dist/providers/node/server.js"
    }
    package_path = target_dir / "package.json"
    existing_package: Dict[str, Any] = {}
    if package_path.exists():
        try:
            existing_package = json.loads(package_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as error:
            raise ValueError(f"Cannot merge build scripts into invalid package.json: {error}") from error
    package_content = existing_package or {"name": app_name.lower(), "private": True}
    package_content["scripts"] = {**package_content.get("scripts", {}), **required_scripts}
    files.append(GeneratedFile(
        relative_path="package.json",
        content=json.dumps(package_content, indent=2) + "\n",
        description="Unified build commands for Vercel, Cloudflare, and Node."
    ))

    # Do not emit the retired polyglot/split-target artifacts. Provider packaging is
    # generated after the single Fetch application has been emitted.
    retired_paths = {
        "src/backend/adapters/universalEntry.ts",
        "src/backend/adapters/nodeBridge.ts",
        "config/build/manifests/fullstack.json",
        "config/build/manifests/api.json",
        "tsconfig.api.json",
        "scripts/skipo-build.cjs",
    }
    files = [item for item in files if item.relative_path not in retired_paths]

    result = emit_directory(
        target_dir=target_dir,
        files=files,
        dry_run=params.get("dry_run", False),
        force=params.get("force", False)
    )
    result.generator_id = GENERATOR_ID
    result.generator_title = GENERATOR_TITLE
    result.duration_ms = (time.time() - start_time) * 1000
    if not params.get("dry_run", False):
        from scripts.generate_provider_packaging import generate_provider_packaging
        generated = generate_provider_packaging(target_dir, app_name)
        result.messages.append(
            f"Generated one Fetch application with {len(generated)} provider packaging assets."
        )
    return result

def main():
    args = parse_generator_args("MULTI_TARGET_BUILD_SPEC Canonical Generator")
    target_path = Path(args.get("target_path") or ".").resolve()
    res = generate_multi_target_suite(target_path, args)
    if args.get("json"):
        print(json.dumps(res.to_dict(), indent=2))
    else:
        print_generator_report(res)
    sys.exit(0 if res.success else 1)

if __name__ == "__main__":
    main()
