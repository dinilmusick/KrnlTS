#!/usr/bin/env python3
"""
Aspect 11: App Architecture Spec & Service Suite Generator
Generates:
- Complete APP_ARCHITECTURE_SPEC canonical tree (src/frontend/pages, src/frontend/components, src/backend, src/libraries)
- Single Backend Entrypoint Facade (<AppName>Backend.ts)
- Plug-and-play Service Suites (<service>.ts facade, client/, server/, remote/, repositories/)
- Gateway subsystem (gateway.ts, registry/, resolver/, transport/)
- Pure neutral libraries shared by frontend and backend
- Invariant tests, config directories, and GitHub Actions workflows
"""

from pathlib import Path
from typing import List, Dict, Any
import json
import sys
import time

try:
    from .common import (
        GeneratedFile, GeneratorResult, section_header,
        generate_ascii_flowchart, emit_directory, parse_generator_args,
        print_generator_report
    )
except ImportError:
    from common import (
        GeneratedFile, GeneratorResult, section_header,
        generate_ascii_flowchart, emit_directory, parse_generator_args,
        print_generator_report
    )

GENERATOR_ID = "11_app_architecture_generator"
GENERATOR_TITLE = "APP_ARCHITECTURE_SPEC Canonical Generator"

def generate_app_architecture(target_dir: Path, params: Dict[str, Any]) -> GeneratorResult:
    start_time = time.time()
    files: List[GeneratedFile] = []
    
    app_name = params.get("name") or target_dir.name or "SkipoApp"
    mode = params.get("mode", "app") # "app" or "service"

    if mode == "service":
        service_name = params.get("service_name") or app_name.lower()
        # Generate single service suite
        files.extend(_generate_service_files(service_name))
    else:
        # Generate full canonical app suite
        files.extend(_generate_full_app_files(app_name))

    result = emit_directory(
        target_dir=target_dir,
        files=files,
        dry_run=params.get("dry_run", False),
        force=params.get("force", False)
    )
    result.generator_id = GENERATOR_ID
    result.generator_title = GENERATOR_TITLE
    result.duration_ms = (time.time() - start_time) * 1000
    return result

def _generate_service_files(name: str) -> List[GeneratedFile]:
    camel = name[:1].lower() + name[1:]
    pascal = name[:1].upper() + name[1:]
    files = []

    # Facade
    facade_content = f"""/**
 * @file {camel}.ts
 * @description {pascal} Service Facade.
 * Conforms to APP_ARCHITECTURE_SPEC Sections 5 & 6.
 */

import type {{ Runtime, Deployment }} from '@skipo/backend';
import {{ {camel}Server }} from './server/{camel}Server';
import {{ {camel}Remote }} from './remote/{camel}Remote';

export const runtime: Runtime = 'server';
export const deployment: Deployment = 'local';

export const service = {{
  name: '{camel}',
  runtime,
  deployment,
  execute: async (payload: Record<string, unknown>) => {{
    if (deployment === 'local') {{
      return {camel}Server.run(payload);
    }}
    return {camel}Remote.dispatch(payload);
  }},
}};
"""
    files.append(GeneratedFile(
        relative_path=f"{camel}.ts",
        content=facade_content,
        description=f"Service facade for {camel}"
    ))

    # client/
    client_content = f"""export class {pascal}Client {{
  public getClientInfo() {{
    return {{ name: '{camel}', runtime: 'client' }};
  }}
}}
export const {camel}Client = new {pascal}Client();
"""
    files.append(GeneratedFile(
        relative_path=f"client/{camel}Client.ts",
        content=client_content,
        description=f"Client implementation for {camel}"
    ))

    # server/
    server_content = f"""import {{ {camel}Repository }} from '../repositories/{camel}Repository';

export class {pascal}Server {{
  public async run(payload: Record<string, unknown>) {{
    await {camel}Repository.persist(payload);
    return {{ success: true, processedAt: Date.now() }};
  }}
}}
export const {camel}Server = new {pascal}Server();
"""
    files.append(GeneratedFile(
        relative_path=f"server/{camel}Server.ts",
        content=server_content,
        description=f"Local server implementation for {camel}"
    ))

    # remote/
    remote_content = f"""export class {pascal}Remote {{
  public async dispatch(payload: Record<string, unknown>) {{
    const res = await fetch('/api/{camel}', {{
      method: 'POST',
      headers: {{ 'Content-Type': 'application/json' }},
      body: JSON.stringify(payload),
    }});
    return res.json();
  }}
}}
export const {camel}Remote = new {pascal}Remote();
"""
    files.append(GeneratedFile(
        relative_path=f"remote/{camel}Remote.ts",
        content=remote_content,
        description=f"Remote gateway client for {camel}"
    ))

    # repositories/
    repo_content = f"""export class {pascal}Repository {{
  private store: Map<string, Record<string, unknown>> = new Map();

  public async persist(data: Record<string, unknown>) {{
    const id = `item_${{Date.now()}}`;
    this.store.set(id, data);
    return {{ id, ...data }};
  }}

  public async find(id: string) {{
    return this.store.get(id) || null;
  }}
}}
export const {camel}Repository = new {pascal}Repository();
"""
    files.append(GeneratedFile(
        relative_path=f"repositories/{camel}Repository.ts",
        content=repo_content,
        description=f"Repository persistence boundary for {camel}"
    ))

    return files

def _generate_full_app_files(app_name: str) -> List[GeneratedFile]:
    pascal = app_name[:1].upper() + app_name[1:]
    camel = app_name[:1].lower() + app_name[1:]
    files = []

    # 1. Backend Facade: src/backend/<AppName>Backend.ts
    backend_content = f"""/**
 * @file {pascal}Backend.ts
 * @description Single Frontend-Backend Entrypoint Facade with WorkerExecutionBoundary & Core Services.
 * Conforms to APP_ARCHITECTURE_SPEC and SKIPO::STATE_EXECUTION_ARCHITECTURE (Laws L7, L23).
 */

import {{ ExecutableBackendFacade, WorkerExecutionBoundary }} from '@skipo/backend';
import {{ queryUnifiedDb }} from './services/core/unifiedDb';

export const {camel}BackendFacade = new ExecutableBackendFacade('{pascal}Backend');
export const {camel}Worker = new WorkerExecutionBoundary('{pascal}Worker', {camel}BackendFacade);

export const {pascal}Backend = {{
  services: {{
    coreDb: {{ query: queryUnifiedDb }},
  }},
  serviceOrchestrations: {{}},
  orchestrations: {{}},
  worker: {camel}Worker,
  WorkerExecutionBoundary: {camel}Worker,
}};
"""
    files.append(GeneratedFile(
        relative_path=f"src/backend/{pascal}Backend.ts",
        content=backend_content,
        description="Single backend facade entrypoint"
    ))

    # 1.1. Universal Core Database Client (Law L23)
    unified_db_content = """/**
 * @file unifiedDb.ts
 * @description Isomorphic Database Client using Neon Serverless HTTP driver.
 * Operates identically across Node.js, Vercel Serverless, and Cloudflare Workers (Law L23).
 * Conforms to Skipo Governance (< 200 lines).
 */

import { neon } from '@neondatabase/serverless';

declare const process: any;

export interface UnifiedQueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export function cleanDbUrl(url?: unknown): string {
  if (!url || typeof url !== 'string') return '';
  return url.trim().replace(/^["']|["']$/g, '');
}

export function getUnifiedDbUrl(env?: Record<string, unknown>): string {
  const fromEnv =
    cleanDbUrl(env?.SYSTEM_DATABASE_URL) ||
    cleanDbUrl(env?.SYSTEM_DATABASE_URL_2) ||
    cleanDbUrl(env?.SYSTEM_DATABASE_URL_3);

  if (fromEnv) return fromEnv;

  if (typeof process !== 'undefined' && process.env) {
    return (
      cleanDbUrl(process.env.SYSTEM_DATABASE_URL) ||
      cleanDbUrl(process.env.SYSTEM_DATABASE_URL_2) ||
      cleanDbUrl(process.env.SYSTEM_DATABASE_URL_3) ||
      ''
    );
  }

  return '';
}

export async function queryUnifiedDb<T = any>(
  sqlText: string,
  params: any[] = [],
  env?: Record<string, unknown>
): Promise<UnifiedQueryResult<T>> {
  const dbUrl = getUnifiedDbUrl(env);
  if (!dbUrl) {
    throw new Error('[UnifiedDB] No database URL configured in environment.');
  }

  const sql = neon(dbUrl);
  try {
    const rows = (await sql.query(sqlText, params)) as T[];
    return {
      rows: Array.isArray(rows) ? rows : [],
      rowCount: Array.isArray(rows) ? rows.length : 0,
    };
  } catch (err: any) {
    console.error('[UnifiedDB] Query execution error:', err.message);
    throw err;
  }
}
"""
    files.append(GeneratedFile(
        relative_path="src/backend/services/core/unifiedDb.ts",
        content=unified_db_content,
        description="Zero-Drift universal Neon database client for Vercel and Cloudflare (Law L23)."
    ))

    # 2. Frontend index
    files.append(GeneratedFile(
        relative_path="src/frontend/index.ts",
        content="// Frontend plane entrypoint\nexport {};\n",
        description="Frontend plane entrypoint"
    ))

    # 3. Libraries directories
    files.append(GeneratedFile(
        relative_path="src/libraries/types/index.ts",
        content="// Environment-neutral pure types\nexport {};\n",
        description="Pure types library"
    ))
    files.append(GeneratedFile(
        relative_path="src/libraries/functions/index.ts",
        content="// Environment-neutral pure functions\nexport {};\n",
        description="Pure functions library"
    ))

    # 4. Canonical frontend page/component tree
    files.append(GeneratedFile(
        relative_path="src/frontend/components/components.ts",
        content="// Canonical component facade. Pages import UI only through this file.\n",
        description="Frontend component facade"
    ))
    files.append(GeneratedFile(
        relative_path="src/frontend/pages/home/page.tsx",
        content="import { FrnlPage } from '../../components/components.js';\n\nexport function HomePage() {\n  return <FrnlPage appName=\"Skipo\">Home</FrnlPage>;\n}\n\nexport default HomePage;\n",
        description="Canonical route-scoped page scaffold using the component facade"
    ))
    files.append(GeneratedFile(
        relative_path="src/frontend/pages/home/orchestrations/.gitkeep",
        content="",
        description="Page-scoped Frnl orchestration directory; definitions are generated by the Frnl CLI"
    ))

    # 5. Gateway
    gateway_content = """export class Gateway {
  public async invoke(serviceName: string, action: string, payload: unknown) {
    return { serviceName, action, payload };
  }
}
export const gateway = new Gateway();
"""
    files.append(GeneratedFile(
        relative_path="src/backend/gateway/gateway.ts",
        content=gateway_content,
        description="Gateway entrypoint"
    ))

    # 6. CI Workflows
    validate_yml = """name: Validate
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npx tsc --noEmit
      - run: python3 checklists/full_system_validator.py .
"""
    files.append(GeneratedFile(
        relative_path=".github/workflows/validate.yml",
        content=validate_yml,
        description="CI validation workflow"
    ))

    # 7. Next.js Standalone Tracing & Tree-Shaking Configuration
    next_cfg = """/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  swcMinify: true,
  reactStrictMode: true,
  compress: true,
  outputFileTracingExcludes: {
    '*': ['@swc/core', 'esbuild', 'terser', 'uglify-js', 'typescript'],
  },
};

module.exports = nextConfig;
"""
    files.append(GeneratedFile(
        relative_path="next.config.js",
        content=next_cfg,
        description="Next.js standalone config with bundle tracing exclusions"
    ))

    # 8. Clean 3-Tier System Environment Template
    env_tpl = """# SYSTEM DATABASE INFRASTRUCTURE (Strict 3-Tier Postgres Architecture)
# Admin credentials and bucket secrets reside in ultrst_credentials table in the database.
APP_URL="http://localhost:3000"
SYSTEM_DATABASE_URL="postgres://postgres:password@db1.region.example.com:5432/postgres?sslmode=require"
# SYSTEM_DATABASE_URL_2="postgres://postgres:password@db2.region.example.com:5432/postgres?sslmode=require"
# SYSTEM_DATABASE_URL_3="postgres://postgres:password@db3.region.example.com:5432/postgres?sslmode=require"
"""
    files.append(GeneratedFile(
        relative_path=".env.example",
        content=env_tpl,
        description="Strict 3-tier system database environment template"
    ))

    return files

def main():
    args = parse_generator_args("Skipo APP_ARCHITECTURE_SPEC Canonical Generator")
    target_path = Path(args["target_path"] or ".").resolve()
    result = generate_app_architecture(target_path, args)

    if args["json"]:
        print(json.dumps(result.to_dict(), indent=2))
    else:
        print_generator_report(result)

    sys.exit(0 if result.success else 1)

if __name__ == "__main__":
    main()
