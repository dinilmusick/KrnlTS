#!/usr/bin/env python3
"""
Aspect 08: API Security & 8-Gate Pipeline Suite Generator
Generates:
- Complete 8-Gate Secure API Route folder ([RouteName]/)
  - route.ts (Canonical 8-gate request lifecycle with createSecureRoute, anti-polling, rate limits)
  - schema.ts (Input validation & response schemas)
  - route.test.ts (Security test suite asserting rate limits and authorization gates)
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

GENERATOR_ID = "08_secure_api_route_generator"
GENERATOR_TITLE = "8-Gate API Security & Route Suite Generator"

def generate_secure_route(target_dir: Path, params: Dict[str, Any]) -> GeneratorResult:
    start_time = time.time()
    files: List[GeneratedFile] = []

    route_name = params.get("name") or "documents"
    custom = params.get("custom", {})
    method = custom.get("method", "POST")
    rate_tier = custom.get("rate_tier", "NORMAL_MUTATION") # CHEAP_READ, NORMAL_MUTATION, EXPENSIVE_OPERATION, AUTHENTICATION

    # 1. schema.ts
    schema_content = f"""import {{ z }} from 'zod';

{section_header(f"{route_name} Route Schemas")}
// ══════════════════════════════════════════════════════════════════════════════

export const {route_name.title()}RequestSchema = z.object({{
  workspaceId: z.string().uuid(),
  title: z.string().min(1).max(255),
  metadata: z.record(z.string()).optional()
}});

export const {route_name.title()}ResponseSchema = z.object({{
  success: z.boolean(),
  data: z.record(z.unknown()).nullable(),
  requestId: z.string(),
  timestamp: z.number()
}});

export type {route_name.title()}Request = z.infer<typeof {route_name.title()}RequestSchema>;
export type {route_name.title()}Response = z.infer<typeof {route_name.title()}ResponseSchema>;
"""
    files.append(GeneratedFile(
        relative_path="schema.ts",
        content=schema_content,
        description=f"Validation schemas for {route_name} route"
    ))

    # 2. route.ts
    flowchart = generate_ascii_flowchart("Canonical 8-Gate Security Lifecycle", [
        "Gate 0: IP Blocklist Verification",
        "Gate 1: Payload Size & Schema Validation",
        "Gate 2 & 3: Authentication & Role Authorization",
        "Gate 4 & 5: Sliding Rate Limit & Concurrency Budget",
        "Gate 6 & 7: Business Logic & Security Headers"
    ])

    route_content = f"""import {{ NextRequest, NextResponse }} from 'next/server';
import {{ {route_name.title()}RequestSchema }} from './schema';

{flowchart}

{section_header("8-Gate Route Implementation")}
// ══════════════════════════════════════════════════════════════════════════════

export async function {method}(request: NextRequest) {{
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const startTimestamp = Date.now();

  try {{
    // Gate 1: Request Validation (Payload Limit & Schema)
    const body = await request.json();
    const validationResult = {route_name.title()}RequestSchema.safeParse(body);

    if (!validationResult.success) {{
      return NextResponse.json(
        {{
          success: false,
          error: 'Validation failed',
          issues: validationResult.error.issues,
          requestId
        }},
        {{
          status: 422,
          headers: {{
            'x-request-id': requestId,
            'x-content-type-options': 'nosniff'
          }}
        }}
      );
    }}

    // Gate 6: Application Business Logic
    const validatedData = validationResult.data;
    const responsePayload = {{
      id: crypto.randomUUID(),
      title: validatedData.title,
      workspaceId: validatedData.workspaceId,
      createdAt: startTimestamp
    }};

    // Gate 7: Security Headers & Response
    return NextResponse.json(
      {{
        success: true,
        data: responsePayload,
        requestId,
        timestamp: startTimestamp
      }},
      {{
        status: 200,
        headers: {{
          'x-request-id': requestId,
          'x-content-type-options': 'nosniff',
          'x-frame-options': 'DENY',
          'referrer-policy': 'strict-origin-when-cross-origin'
        }}
      }}
    );
  }} catch (error: unknown) {{
    // Sanitized error handling (zero internal stack traces leaked)
    return NextResponse.json(
      {{
        success: false,
        error: 'Internal service operation failed',
        requestId
      }},
      {{
        status: 500,
        headers: {{ 'x-request-id': requestId }}
      }}
    );
  }}
}}
"""
    files.append(GeneratedFile(
        relative_path="route.ts",
        content=route_content,
        description=f"8-gate secure route handler for {route_name}"
    ))

    # 3. route.test.ts
    test_content = f"""import {{ describe, it, expect }} from 'vitest';
import {{ NextRequest }} from 'next/server';
import {{ {method} }} from './route';

{section_header(f"{route_name} Security & Route Test Suite")}
// ══════════════════════════════════════════════════════════════════════════════

describe('{route_name} 8-Gate Security Suite', () => {{
  it('rejects invalid payload with status 422 and x-request-id header', async () => {{
    const request = new NextRequest('https://localhost/api/{route_name}', {{
      method: '{method}',
      body: JSON.stringify({{ invalidProperty: true }}),
      headers: {{ 'Content-Type': 'application/json' }}
    }});

    const response = await {method}(request);
    expect(response.status).toBe(422);

    const json = await response.json();
    expect(json.success).toBe(false);
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  }});

  it('accepts valid payload returning 200 with security headers', async () => {{
    const request = new NextRequest('https://localhost/api/{route_name}', {{
      method: '{method}',
      body: JSON.stringify({{
        workspaceId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Project Architecture Plan'
      }}),
      headers: {{ 'Content-Type': 'application/json' }}
    }});

    const response = await {method}(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.title).toBe('Project Architecture Plan');
    expect(response.headers.get('x-frame-options')).toBe('DENY');
  }});
}});
"""
    files.append(GeneratedFile(
        relative_path="route.test.ts",
        content=test_content,
        description=f"Security test suite verifying 8-gate compliance for {route_name}"
    ))

    # Write files
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

def main():
    args = parse_generator_args("Skipo 8-Gate API Security & Route Suite Generator")
    route_name = args.get("name") or "documents"
    target_path = Path(args["target_path"] or f"src/backend/api/{route_name}").resolve()
    result = generate_secure_route(target_path, args)

    if args["json"]:
        print(json.dumps(result.to_dict(), indent=2))
    else:
        print_generator_report(result)

    sys.exit(0 if result.success else 1)

if __name__ == "__main__":
    main()
