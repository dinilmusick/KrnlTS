#!/usr/bin/env python3
"""
Aspect 14: App-Level Concept Library Generator
Generates:
- <library-name>_concepts/ directory inside src/libraries/
- Single-asset data definition file (<PascalName>Types.ts)
- Single-asset function file (<camelName>Transform.ts)
- <library-name>_concepts.ts concept facade aggregating all assets
- Creates or updates root <AppName>Concepts.ts aggregating all concept library facades
"""

from pathlib import Path
from typing import List, Dict, Any
import re
import sys
import time
import json

try:
    from .common import (
        GeneratedFile, GeneratorResult, emit_directory, parse_generator_args,
        print_generator_report
    )
except ImportError:
    from common import (
        GeneratedFile, GeneratorResult, emit_directory, parse_generator_args,
        print_generator_report
    )

GENERATOR_ID = "14_concept_library_generator"
GENERATOR_TITLE = "App-Level Concept Library Generator"

def _to_snake_case(name: str) -> str:
    s = re.sub(r'([A-Z]+)([A-Z][a-z])', r'\1_\2', name)
    s = re.sub(r'([a-z\d])([A-Z])', r'\1_\2', s)
    s = s.replace('-', '_').lower()
    if s.endswith('_concepts'):
        s = s[:-9]
    return s

def _to_pascal_case(name: str) -> str:
    snake = _to_snake_case(name)
    return ''.join(word.capitalize() for word in snake.split('_'))

def _to_camel_case(name: str) -> str:
    pascal = _to_pascal_case(name)
    return pascal[:1].lower() + pascal[1:] if pascal else ''

def generate_concept_library(target_dir: Path, params: Dict[str, Any]) -> GeneratorResult:
    start_time = time.time()
    files: List[GeneratedFile] = []

    raw_lib_name = params.get("name") or "sample"
    snake_lib = _to_snake_case(raw_lib_name)
    pascal_lib = _to_pascal_case(raw_lib_name)
    camel_lib = _to_camel_case(raw_lib_name)
    lib_folder_name = f"{snake_lib}_concepts"
    facade_file_name = f"{snake_lib}_concepts.ts"

    app_name = params.get("app_name") or params.get("app") or "Skipo"
    app_pascal = _to_pascal_case(app_name)
    app_concepts_facade = f"{app_pascal}Concepts.ts"

    # Determine src/libraries root
    # target_dir might be project root, src, or src/libraries
    if (target_dir / "src/libraries").exists():
        libraries_root = target_dir / "src/libraries"
    elif target_dir.name == "libraries" and target_dir.parent.name == "src":
        libraries_root = target_dir
    elif target_dir.name == "src" and (target_dir / "libraries").exists():
        libraries_root = target_dir / "libraries"
    else:
        libraries_root = target_dir / "src/libraries"

    concept_dir_rel = f"src/libraries/{lib_folder_name}" if not libraries_root.is_relative_to(target_dir) or libraries_root != target_dir else lib_folder_name

    # 1. Single-asset: Data Definition (Types / Interfaces)
    types_filename = f"{pascal_lib}Types.ts"
    types_content = f"""/**
 * @file {types_filename}
 * @description Single-asset data definition for {lib_folder_name}.
 * Conforms to Skipo App-Level Concept Libraries specification.
 */

export interface {pascal_lib}Model {{
  readonly id: string;
  readonly name: string;
  readonly createdAt: number;
  readonly metadata?: Record<string, unknown>;
}}

export interface {pascal_lib}Options {{
  readonly enabled?: boolean;
  readonly strict?: boolean;
}}
"""
    files.append(GeneratedFile(
        relative_path=f"{concept_dir_rel}/{types_filename}",
        content=types_content,
        description=f"Single-asset data definition for {snake_lib}"
    ))

    # 2. Single-asset: Pure function
    func_filename = f"{camel_lib}Transform.ts"
    func_content = f"""/**
 * @file {func_filename}
 * @description Single-asset pure function for {lib_folder_name}.
 * Conforms to Skipo App-Level Concept Libraries specification.
 */

import type {{ {pascal_lib}Model, {pascal_lib}Options }} from './{pascal_lib}Types.js';

export function {camel_lib}Transform<T extends {pascal_lib}Model>(item: T, options?: {pascal_lib}Options): T {{
  if (!item || typeof item !== 'object') {{
    throw new Error('[{camel_lib}Transform] Item must be a valid {pascal_lib}Model.');
  }}
  if (options?.enabled === false) {{
    return item;
  }}
  return {{
    ...item,
    metadata: {{
      ...item.metadata,
      transformedAt: Date.now(),
    }},
  }};
}}
"""
    files.append(GeneratedFile(
        relative_path=f"{concept_dir_rel}/{func_filename}",
        content=func_content,
        description=f"Single-asset function for {snake_lib}"
    ))

    # 3. Concept Library Facade (<library-name>_concepts.ts)
    lib_facade_content = f"""/**
 * @file {facade_file_name}
 * @description Concept library facade for {lib_folder_name}.
 * Aggregates and exposes all contained code assets.
 */

export * from './{pascal_lib}Types.js';
export {{ {camel_lib}Transform }} from './{camel_lib}Transform.js';

import {{ {camel_lib}Transform }} from './{camel_lib}Transform.js';

export const {lib_folder_name} = {{
  {camel_lib}Transform,
}} as const;

export default {lib_folder_name};
"""
    files.append(GeneratedFile(
        relative_path=f"{concept_dir_rel}/{facade_file_name}",
        content=lib_facade_content,
        description=f"Library facade for {lib_folder_name}"
    ))

    # 4. Root App Concepts Facade (<app_name>Concepts.ts)
    app_facade_path = "src/libraries" if concept_dir_rel.startswith("src/libraries") else "."
    app_facade_rel = f"{app_facade_path}/{app_concepts_facade}"
    
    # Check existing concept libraries in libraries_root
    existing_concepts = [lib_folder_name]
    if libraries_root.exists():
        for d in libraries_root.iterdir():
            if d.is_dir() and d.name.endswith("_concepts") and d.name not in existing_concepts:
                existing_concepts.append(d.name)

    import_lines = []
    export_entries = []
    for c in sorted(existing_concepts):
        import_lines.append(f"import {{ {c} }} from './{c}/{c}.js';")
        export_entries.append(f"  {c},")

    app_facade_content = f"""/**
 * @file {app_concepts_facade}
 * @description Root Application Concepts Facade for {app_pascal}.
 * Aggregates all individual <library-name>_concepts facades.
 * Accessible to all frontend and backend code assets.
 */

{chr(10).join(import_lines)}

export {{
{chr(10).join(export_entries)}
}};

export const {app_pascal}Concepts = {{
{chr(10).join(export_entries)}
}} as const;

export default {app_pascal}Concepts;
"""
    files.append(GeneratedFile(
        relative_path=app_facade_rel,
        content=app_facade_content,
        description=f"Root app concepts facade {app_concepts_facade}"
    ))

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
    args = parse_generator_args("Generate Skipo App-Level Concept Library")
    target_path = Path(args.get("target_path") or ".").resolve()
    params = dict(args)
    params.update(args.get("custom", {}))
    res = generate_concept_library(target_path, params)
    if args.get("json"):
        print(json.dumps(res.to_dict(), indent=2))
    else:
        print_generator_report(res)
    sys.exit(0 if res.success else 1)

if __name__ == "__main__":
    main()
