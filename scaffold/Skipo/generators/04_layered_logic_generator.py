#!/usr/bin/env python3
"""
Aspect 04: Code Limits, Layered Functions & Purity Suite Generator
Generates:
- Complete Layered Logic Suite folder ([ModuleName]/)
  - [ModuleName].ts (Pure L0-L3 hierarchical function module, <= 200 lines, descriptive names, ASCII flowchart, // ════ borders)
  - [ModuleName].test.ts (Companion operational test suite)
  - types.ts (Domain contracts)
  - index.ts (Barrel re-export)
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

GENERATOR_ID = "04_layered_logic_generator"
GENERATOR_TITLE = "Layered Functions & Code Limits Suite Generator"

def generate_layered_suite(target_dir: Path, params: Dict[str, Any]) -> GeneratorResult:
    start_time = time.time()
    files: List[GeneratedFile] = []

    mod_name = params.get("name") or "TransformEngine"
    mod_name = mod_name[:1].upper() + mod_name[1:]
    custom = params.get("custom", {})
    layer = custom.get("layer", "L1_TRANSFORMS") # L0_MATH, L1_TRANSFORMS, L2_STATE, L3_ORCHESTRATION

    # 1. types.ts
    types_content = f"""{section_header(f"{mod_name} Pure Layer Contracts")}
// ══════════════════════════════════════════════════════════════════════════════

export interface ProcessingOptions {{
  strictValidation: boolean;
  maxExecutionWindowMilliseconds: number;
  enableTelemetryTracking: boolean;
}}

export interface ProcessedResult<T = unknown> {{
  success: boolean;
  outputPayload: T;
  executionTimestamp: number;
  durationMilliseconds: number;
  errorMessages: string[];
}}
"""
    files.append(GeneratedFile(
        relative_path="types.ts",
        content=types_content,
        description=f"TypeScript interfaces for {mod_name}"
    ))

    # 2. [ModuleName].ts
    flowchart = generate_ascii_flowchart(f"{mod_name} Pure Pipeline Execution", [
        "Validate Input Parameters & Options",
        "Execute Pure Mathematical or Data Transform",
        "Normalize Result Schema & Error Boundaries",
        "Return Immutable ProcessedResult"
    ])

    code_content = f"""import type {{ ProcessingOptions, ProcessedResult }} from './types';

{flowchart}

{section_header("L0: Pure Helper Utilities")}
// ══════════════════════════════════════════════════════════════════════════════

export function computeExecutionDuration(
  startTimeMilliseconds: number,
  endTimeMilliseconds: number
): number {{
  const calculatedDuration = Math.max(0, endTimeMilliseconds - startTimeMilliseconds);
  return Math.round(calculatedDuration * 100) / 100;
}}

export function sanitizeInputString(rawInputText: string): string {{
  const trimmedString = rawInputText.trim();
  const normalizedString = trimmedString.replace(/[\\u0000-\\u001F\\u007F-\\u009F]/g, '');
  return normalizedString;
}}

{section_header("L1: Core Transform Logic")}
// ══════════════════════════════════════════════════════════════════════════════

export function execute{mod_name}Pipeline<TInput extends Record<string, unknown>>(
  inputData: TInput,
  options: ProcessingOptions
): ProcessedResult<TInput> {{
  const startTimestamp = Date.now();
  const errorMessages: string[] = [];

  if (options.strictValidation && Object.keys(inputData).length === 0) {{
    errorMessages.push('Input data must contain at least one valid key-value pair.');
    return {{
      success: false,
      outputPayload: inputData,
      executionTimestamp: startTimestamp,
      durationMilliseconds: computeExecutionDuration(startTimestamp, Date.now()),
      errorMessages
    }};
  }}

  const transformedEntries = Object.entries(inputData).map(([key, value]) => {{
    const sanitizedKey = sanitizeInputString(key);
    const sanitizedValue = typeof value === 'string' ? sanitizeInputString(value) : value;
    return [sanitizedKey, sanitizedValue];
  }});

  const transformedPayload = Object.fromEntries(transformedEntries) as TInput;
  const finishTimestamp = Date.now();

  return {{
    success: errorMessages.length === 0,
    outputPayload: transformedPayload,
    executionTimestamp: startTimestamp,
    durationMilliseconds: computeExecutionDuration(startTimestamp, finishTimestamp),
    errorMessages
  }};
}}
"""
    files.append(GeneratedFile(
        relative_path=f"{mod_name}.ts",
        content=code_content,
        description=f"Pure layered logic module strictly under 200 lines"
    ))

    # 3. [ModuleName].test.ts
    test_content = f"""import {{ describe, it, expect }} from 'vitest';
import {{
  computeExecutionDuration,
  sanitizeInputString,
  execute{mod_name}Pipeline
}} from './{mod_name}';

{section_header(f"{mod_name} Verification Test Suite")}
// ══════════════════════════════════════════════════════════════════════════════

describe('{mod_name} Layered Execution Suite', () => {{
  it('computes valid duration avoiding negative deltas', () => {{
    const duration = computeExecutionDuration(1000, 1250);
    expect(duration).toBe(250);

    const reversedDelta = computeExecutionDuration(2000, 1000);
    expect(reversedDelta).toBe(0);
  }});

  it('sanitizes input string removing control characters', () => {{
    const clean = sanitizeInputString('  valid_payload\\u0000  ');
    expect(clean).toBe('valid_payload');
  }});

  it('executes pipeline transform successfully with valid options', () => {{
    const input = {{ testKey: '  dataValue  ' }};
    const options = {{
      strictValidation: true,
      maxExecutionWindowMilliseconds: 5000,
      enableTelemetryTracking: true
    }};

    const result = execute{mod_name}Pipeline(input, options);
    expect(result.success).toBe(true);
    expect(result.outputPayload.testKey).toBe('dataValue');
    expect(result.errorMessages).toHaveLength(0);
  }});

  it('rejects empty input payload when strictValidation is enabled', () => {{
    const result = execute{mod_name}Pipeline({{}}, {{
      strictValidation: true,
      maxExecutionWindowMilliseconds: 5000,
      enableTelemetryTracking: false
    }});

    expect(result.success).toBe(false);
    expect(result.errorMessages).toContain('Input data must contain at least one valid key-value pair.');
  }});
}});
"""
    files.append(GeneratedFile(
        relative_path=f"{mod_name}.test.ts",
        content=test_content,
        description=f"Companion test suite for {mod_name}"
    ))

    # 4. index.ts
    index_content = f"""{section_header(f"{mod_name} Barrel Re-export")}
// ══════════════════════════════════════════════════════════════════════════════

export * from './types';
export * from './{mod_name}';
"""
    files.append(GeneratedFile(
        relative_path="index.ts",
        content=index_content,
        description=f"Barrel facade re-exporting {mod_name}"
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
    args = parse_generator_args("Skipo Layered Functions & Code Limits Suite Generator")
    mod_name = args.get("name") or "TransformEngine"
    target_path = Path(args["target_path"] or f"src/frontend/lib/{mod_name}").resolve()
    result = generate_layered_suite(target_path, args)

    if args["json"]:
        print(json.dumps(result.to_dict(), indent=2))
    else:
        print_generator_report(result)

    sys.exit(0 if result.success else 1)

if __name__ == "__main__":
    main()
