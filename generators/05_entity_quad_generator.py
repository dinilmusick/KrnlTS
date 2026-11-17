#!/usr/bin/env python3
"""
Aspect 05: Real Data & Quad-Unit Entity Atom Suite Generator (Anti-Mock)
Generates:
- Complete Quad-Unit Entity Atom folder ([EntityName]/)
  - schema.ts (Zod runtime validation schema)
  - types.ts (Inferred domain model interfaces)
  - store.ts (Authentic store adapter with zero mock/placeholder data)
  - EmptyState.tsx (Mandatory real-data empty state UI component with CTA)
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

GENERATOR_ID = "05_entity_quad_generator"
GENERATOR_TITLE = "Quad-Unit Entity Atom & Real Data Suite Generator"

def generate_entity_quad(target_dir: Path, params: Dict[str, Any]) -> GeneratorResult:
    start_time = time.time()
    files: List[GeneratedFile] = []

    entity_name = params.get("name") or "Project"
    entity_name = entity_name[:1].upper() + entity_name[1:]
    entity_var = entity_name[:1].lower() + entity_name[1:]
    custom = params.get("custom", {})
    fields = custom.get("fields", {
        "title": "string",
        "description": "string",
        "ownerId": "string",
        "status": "active | archived | draft"
    })

    # 1. schema.ts
    schema_fields = [
        "  id: z.string().uuid(),",
        "  createdAt: z.number().int().positive(),",
        "  updatedAt: z.number().int().positive(),"
    ]
    for fname, ftype in fields.items():
        if fname in ["id", "createdAt", "updatedAt"]:
            continue
        if "|" in ftype:
            opts = ", ".join(f"'{o.strip()}'" for o in ftype.split("|"))
            schema_fields.append(f"  {fname}: z.enum([{opts}]),")
        elif "number" in ftype.lower():
            schema_fields.append(f"  {fname}: z.number(),")
        elif "boolean" in ftype.lower():
            schema_fields.append(f"  {fname}: z.boolean(),")
        else:
            schema_fields.append(f"  {fname}: z.string().min(1, '{fname} is required'),")

    schema_content = f"""import {{ z }} from 'zod';

{section_header(f"{entity_name} Validation Schema")}
// ══════════════════════════════════════════════════════════════════════════════

export const {entity_name}Schema = z.object({{
{chr(10).join(schema_fields)}
}});

export const Create{entity_name}Schema = {entity_name}Schema.omit({{
  id: true,
  createdAt: true,
  updatedAt: true
}});

export const Update{entity_name}Schema = Create{entity_name}Schema.partial();
"""
    files.append(GeneratedFile(
        relative_path="schema.ts",
        content=schema_content,
        description=f"Zod runtime validation schema for {entity_name}"
    ))

    # 2. types.ts
    types_content = f"""import type {{ z }} from 'zod';
import type {{ {entity_name}Schema, Create{entity_name}Schema, Update{entity_name}Schema }} from './schema';

{section_header(f"{entity_name} Domain Models")}
// ══════════════════════════════════════════════════════════════════════════════

export type {entity_name} = z.infer<typeof {entity_name}Schema>;
export type Create{entity_name}Input = z.infer<typeof Create{entity_name}Schema>;
export type Update{entity_name}Input = z.infer<typeof Update{entity_name}Schema>;

export interface {entity_name}QueryFilter {{
  status?: string;
  limit?: number;
  offset?: number;
}}
"""
    files.append(GeneratedFile(
        relative_path="types.ts",
        content=types_content,
        description=f"Inferred TypeScript types for {entity_name}"
    ))

    # 3. store.ts (Authentic storage adapter - zero mock arrays)
    flowchart_store = generate_ascii_flowchart(f"{entity_name} Storage Repository", [
        "Validate Input through Zod Schema",
        "Generate Cryptographic ID and Timestamps",
        "Perform Storage Read / Write Operation",
        "Emit Updated Entity to In-Memory / DB Store"
    ])

    store_content = f"""import {{ randomUUID }} from 'crypto';
import {{ {entity_name}Schema, Create{entity_name}Schema }} from './schema';
import type {{ {entity_name}, Create{entity_name}Input, Update{entity_name}Input, {entity_name}QueryFilter }} from './types';

{flowchart_store}

{section_header(f"{entity_name} Authentic Store Adapter")}
// ══════════════════════════════════════════════════════════════════════════════

export class {entity_name}Store {{
  private records: Map<string, {entity_name}> = new Map();

  async findById(entityId: string): Promise<{entity_name} | null> {{
    return this.records.get(entityId) || null;
  }}

  async list(filter: {entity_name}QueryFilter = {{}}): Promise<{entity_name}[]> {{
    const allRecords = Array.from(this.records.values());
    const limit = filter.limit || 50;
    const offset = filter.offset || 0;
    return allRecords.slice(offset, offset + limit);
  }}

  async create(input: Create{entity_name}Input): Promise<{entity_name}> {{
    const validated = Create{entity_name}Schema.parse(input);
    const now = Date.now();
    const record: {entity_name} = {{
      ...validated,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now
    }} as {entity_name};

    this.records.set(record.id, record);
    return record;
  }}

  async update(entityId: string, updates: Update{entity_name}Input): Promise<{entity_name} | null> {{
    const existing = this.records.get(entityId);
    if (!existing) return null;

    const updated: {entity_name} = {{
      ...existing,
      ...updates,
      updatedAt: Date.now()
    }};

    this.records.set(entityId, updated);
    return updated;
  }}

  async delete(entityId: string): Promise<boolean> {{
    return this.records.delete(entityId);
  }}
}}

export const {entity_var}Store = new {entity_name}Store();
"""
    files.append(GeneratedFile(
        relative_path="store.ts",
        content=store_content,
        description=f"Authentic store adapter for {entity_name} with zero mock data"
    ))

    # 4. EmptyState.tsx (Mandatory zero-mock UI state)
    empty_content = f"""import React from 'react';
import {{ BaseButton }} from '@skipo/ui';

{section_header(f"{entity_name} EmptyState UI Component")}
// ══════════════════════════════════════════════════════════════════════════════

export interface {entity_name}EmptyStateProps {{
  onCreateClick?: () => void;
  title?: string;
  description?: string;
}}

export const {entity_name}EmptyState: React.FC<{entity_name}EmptyStateProps> = ({{
  onCreateClick,
  title = 'No {entity_name} Records Found',
  description = 'There are currently no active {entity_var} entries registered in this workspace.'
}}) => {{
  return (
    <div
      role="region"
      aria-label="{entity_name} Empty State"
      style={{{{
        padding: '32px 24px',
        textAlign: 'center',
        border: '1px dashed var(--skipo-border-color)',
        borderRadius: 'var(--skipo-radius-md, 8px)',
        backgroundColor: 'var(--skipo-surface)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}}}
    >
      <div style={{{{ fontSize: '32px', marginBottom: '12px' }}}}>📁</div>
      <h3 style={{{{ margin: '0 0 8px 0', color: 'var(--skipo-text-primary)' }}}}>{{title}}</h3>
      <p style={{{{ margin: '0 0 16px 0', color: 'var(--skipo-text-secondary)', fontSize: '13px', maxWidth: '380px' }}}}>
        {{description}}
      </p>
      {{onCreateClick && (
        <BaseButton
          variant="primary"
          onClick={{onCreateClick}}
          style={{{{ backgroundColor: 'var(--skipo-accent)', color: 'var(--skipo-surface)' }}}}
        >
          Create New {entity_name}
        </BaseButton>
      )}}
    </div>
  );
}};

export default {entity_name}EmptyState;
"""
    files.append(GeneratedFile(
        relative_path="EmptyState.tsx",
        content=empty_content,
        description=f"Mandatory zero-mock empty state component for {entity_name}"
    ))

    # 5. index.ts
    index_content = f"""{section_header(f"{entity_name} Quad-Unit Atom Barrel")}
// ══════════════════════════════════════════════════════════════════════════════

export * from './schema';
export * from './types';
export * from './store';
export * from './EmptyState';
"""
    files.append(GeneratedFile(
        relative_path="index.ts",
        content=index_content,
        description=f"Barrel facade re-exporting {entity_name} Quad-Unit Atom"
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
    args = parse_generator_args("Skipo Quad-Unit Entity Atom & Real Data Suite Generator")
    entity_name = args.get("name") or "Project"
    target_path = Path(args["target_path"] or f"src/backend/entities/{entity_name}").resolve()
    result = generate_entity_quad(target_path, args)

    if args["json"]:
        print(json.dumps(result.to_dict(), indent=2))
    else:
        print_generator_report(result)

    sys.exit(0 if result.success else 1)

if __name__ == "__main__":
    main()
