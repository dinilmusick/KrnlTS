#!/usr/bin/env python3
"""
create_secure_route.py - Scaffolds an 8-Gate canonical secure API route with Zod schemas and tests.
Features an AGGRESSIVE VALIDATION & AUTO-DELETE LOOP:
- Generates route.ts using createSecureRoute wrapper with complete signature.
- Generates companion *.test.ts with real assertions.
- Immediately executes Aspect 08 API Security and Aspect 04 Code Limits validators.
- IF VALIDATION FAILS: Immediately deletes the generated route files to enforce clean code writing.
"""

from pathlib import Path
from typing import Tuple
import argparse
import os
import subprocess
import sys
import time

HERE = Path(__file__).resolve().parent
SKIPO_ROOT = HERE.parent

def generate_route_files(route_dir: Path, route_name: str, method: str = "POST", rate_tier: str = "NORMAL_MUTATION") -> Tuple[Path, Path]:
    pascal = route_name[:1].upper() + route_name[1:]
    camel = route_name[:1].lower() + route_name[1:]

    route_file = route_dir / "route.ts"
    test_file = route_dir / f"{camel}.test.ts"
    route_dir.mkdir(parents=True, exist_ok=True)

    route_content = f"""// ══════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════
import {{ NextRequest, NextResponse }} from 'next/server';
import {{ createSecureRoute }} from '@/lib/api-governance';
import {{ z }} from 'zod';

// ══════════════════════════════════════════════════════════════════════════════
// 2. DATA SCHEMAS & INPUT VALIDATION
// ══════════════════════════════════════════════════════════════════════════════
export const {pascal}RequestSchema = z.object({{
  identifier: z.string().min(1, 'Identifier is required'),
  payload: z.record(z.unknown()).optional().default({{}})
}});

export type {pascal}Request = z.infer<typeof {pascal}RequestSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 3. 8-GATE SECURE ROUTE HANDLER
// ══════════════════════════════════════════════════════════════════════════════
export const {method.upper()} = createSecureRoute({{
  id: '{camel}',
  rateLimitTier: '{rate_tier}',
  public: false,
  requiredRoles: ['USER'],
  minimumTrustLevel: 'T1_EMAIL_VERIFIED',
  emailVerificationRequired: true,
  timeoutMs: 8000,
  schema: {pascal}RequestSchema,
  async handler(req: NextRequest, ctx) {{
    const body: {pascal}Request = await req.json();
    return NextResponse.json({{
      success: true,
      identifier: body.identifier,
      timestamp: Date.now()
    }}, {{ status: 200 }});
  }}
}});
"""
    route_file.write_text(route_content, encoding="utf-8")

    test_content = f"""// ══════════════════════════════════════════════════════════════════════════════
// 1. COMPANION OPERATIONAL TEST (ANTI-STUB)
// ══════════════════════════════════════════════════════════════════════════════
import {{ describe, it, expect }} from 'vitest';
import {{ {pascal}RequestSchema }} from './route';

describe('API Route: {camel}', () => {{
  it('validates schema input with real assertions', () => {{
    const valid = {pascal}RequestSchema.safeParse({{ identifier: 'item_1001', payload: {{}} }});
    expect(valid.success).toBe(true);

    const invalid = {pascal}RequestSchema.safeParse({{ identifier: '' }});
    expect(invalid.success).toBe(false);
  }});
}});
"""
    test_file.write_text(test_content, encoding="utf-8")

    return route_file, test_file

def run_validators(route_dir: Path) -> Tuple[bool, str]:
    errors = []
    val_04 = SKIPO_ROOT / "checklists" / "04_code_limits_purity.py"
    if val_04.exists():
        res = subprocess.run(["python3", str(val_04), str(route_dir)], capture_output=True, text=True)
        if res.returncode != 0:
            errors.append(f"[ASPECT 04 VIOLATION]\n{res.stdout or res.stderr}")

    val_08 = SKIPO_ROOT / "checklists" / "08_api_security_governance.py"
    if val_08.exists():
        res = subprocess.run(["python3", str(val_08), str(route_dir)], capture_output=True, text=True)
        if res.returncode != 0:
            errors.append(f"[ASPECT 08 VIOLATION]\n{res.stdout or res.stderr}")

    return len(errors) == 0, "\n\n".join(errors)

def main():
    parser = argparse.ArgumentParser(description="Create an 8-Gate secure route")
    parser.add_argument("name", help="Route name (e.g. workspace/export, items/sync)")
    parser.add_argument("--method", default="POST", choices=["GET", "POST", "PUT", "DELETE"])
    parser.add_argument("--rate-tier", default="NORMAL_MUTATION", choices=["CHEAP_READ", "NORMAL_MUTATION", "EXPENSIVE_OPERATION", "AUTHENTICATION"])
    parser.add_argument("--target", default="", help="Target root directory")
    parser.add_argument("--no-delete-on-fail", action="store_true", help="Do not delete on failure")
    args = parser.parse_args()

    target_root = Path(args.target).resolve() if args.target else Path.cwd().resolve()
    clean_path = args.name.strip("/")
    
    # Determine directory (app/api/ or src/backend/routes/)
    if (target_root / "app" / "api").is_dir():
        route_dir = target_root / "app" / "api" / clean_path
    elif (target_root / "src" / "app" / "api").is_dir():
        route_dir = target_root / "src" / "app" / "api" / clean_path
    else:
        route_dir = target_root / "src" / "backend" / "routes" / clean_path

    route_name = clean_path.split("/")[-1]

    print("=" * 80)
    print(f"  SKIPO SECURE API ROUTE GENERATOR LOOP")
    print(f"  Route:       {clean_path} [{args.method}]")
    print(f"  Target Dir:  {route_dir}")
    print("=" * 80)

    # 1. Generate files
    route_file, test_file = generate_route_files(route_dir, route_name, args.method, args.rate_tier)
    print(f"  ✔ Generated: {route_file.relative_to(target_root)}")
    print(f"  ✔ Generated: {test_file.relative_to(target_root)}")

    # 2. AGGRESSIVE VALIDATION LOOP
    print("  🔍 Running verification gate...")
    passed, error_output = run_validators(route_dir)

    if passed:
        print("  🎉 VALIDATION PASSED: 100% compliance with Skipo 8-Gate Security Governance!")
        print("=" * 80 + "\n")
        sys.exit(0)
    else:
        print("\n" + "!" * 80)
        print("  🚨 VALIDATOR VIOLATION DETECTED DURING ROUTE GENERATION LOOP")
        print("!" * 80)
        print(error_output)

        if not args.no_delete_on_fail:
            print("\n  🗑️ AGGRESSIVE AUTO-DELETE ACTIVATED: Purging non-compliant route...")
            if route_file.exists(): route_file.unlink()
            if test_file.exists(): test_file.unlink()
            if route_dir.exists() and not any(route_dir.iterdir()):
                route_dir.rmdir()
            print(f"  ❌ Removed non-compliant route files.")
        print("=" * 80 + "\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
