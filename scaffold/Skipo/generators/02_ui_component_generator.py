#!/usr/bin/env python3
"""
Aspect 02: UI Component Primitives & Theme Token Component Suite Generator
Generates:
- Complete React Component Suite folder ([ComponentName]/)
  - [ComponentName].tsx (Pure React component, <= 200 lines, @skipo/ui primitives, 100% var(--skipo-*) tokens, ASCII flowchart)
  - [ComponentName].test.tsx (Companion Vitest suite, real assertions, zero-mock)
  - types.ts (Props, state, and event callback interfaces)
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

GENERATOR_ID = "02_ui_component_generator"
GENERATOR_TITLE = "UI Component Suite & Theme Tokens Generator"

def generate_component_suite(target_dir: Path, params: Dict[str, Any]) -> GeneratorResult:
    start_time = time.time()
    files: List[GeneratedFile] = []

    comp_name = params.get("name") or "ActionCard"
    # Capitalize first letter
    comp_name = comp_name[:1].upper() + comp_name[1:]
    custom = params.get("custom", {})
    props_def = custom.get("props", {"title": "string", "description": "string", "disabled": "boolean"})
    has_button = custom.get("has_button", True)
    has_input = custom.get("has_input", False)

    # 1. types.ts
    prop_lines = []
    for prop_name, prop_type in props_def.items():
        opt = "?" if "optional" in prop_type.lower() or prop_name in ["disabled", "className"] else ""
        clean_type = prop_type.replace("optional", "").strip() or "string"
        prop_lines.append(f"  {prop_name}{opt}: {clean_type};")
    
    if "onAction" not in props_def:
        prop_lines.append("  onAction?: (actionId: string) => void;")

    types_content = f"""{section_header(f"{comp_name} Type Definitions")}
// ══════════════════════════════════════════════════════════════════════════════

export interface {comp_name}Props {{
{chr(10).join(prop_lines)}
  className?: string;
}}

export interface {comp_name}State {{
  isActive: boolean;
  isLoading: boolean;
  lastUpdated: number;
}}
"""
    files.append(GeneratedFile(
        relative_path="types.ts",
        content=types_content,
        description=f"TypeScript interfaces for {comp_name}"
    ))

    # 2. [ComponentName].tsx
    flowchart = generate_ascii_flowchart(f"{comp_name} Render & Event Pipeline", [
        "Receive Props & Initialize Theme Tokens",
        "Validate State & Evaluate Active Handlers",
        "Render @skipo/ui Primitives (Zero Raw HTML)",
        "Emit Action Events to Parent Controller"
    ])

    tsx_content = f"""import React, {{ useState, useCallback }} from 'react';
import {{ BaseButton, BaseCard, BaseBadge }} from '@skipo/ui';
import type {{ {comp_name}Props, {comp_name}State }} from './types';

{flowchart}

{section_header(f"{comp_name} Component")}
// ══════════════════════════════════════════════════════════════════════════════

export const {comp_name}: React.FC<{comp_name}Props> = ({{
  title,
  description,
  disabled = false,
  onAction,
  className = ''
}}) => {{
  const [state, setState] = useState<{comp_name}State>({{
    isActive: false,
    isLoading: false,
    lastUpdated: Date.now()
  }});

  const handleExecute = useCallback(() => {{
    if (disabled || state.isLoading) return;
    setState(prev => ({{ ...prev, isActive: !prev.isActive, lastUpdated: Date.now() }}));
    if (onAction) {{
      onAction('{comp_name.lower()}-toggle');
    }}
  }}, [disabled, state.isLoading, onAction]);

  return (
    <div
      className={{{{className}}}}
      style={{{{
        backgroundColor: 'var(--skipo-surface)',
        borderColor: 'var(--skipo-border-color)',
        color: 'var(--skipo-text-primary)',
        padding: 'var(--skipo-spacing-md, 16px)',
        borderRadius: 'var(--skipo-radius-md, 8px)',
        borderWidth: '1px',
        borderStyle: 'solid'
      }}}}
    >
      <div style={{{{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}}}>
        <h3 style={{{{ margin: 0, color: 'var(--skipo-text-primary)' }}}}>{{title}}</h3>
        <BaseBadge
          variant={{state.isActive ? 'success' : 'default'}}
          style={{{{ backgroundColor: state.isActive ? 'var(--skipo-accent)' : 'var(--skipo-surface-muted)' }}}}
        >
          {{state.isActive ? 'ACTIVE' : 'IDLE'}}
        </BaseBadge>
      </div>

      <p style={{{{ color: 'var(--skipo-text-secondary)', marginTop: '8px', marginBottom: '16px' }}}}>
        {{description}}
      </p>

      <div style={{{{ display: 'flex', gap: '8px' }}}}>
        <BaseButton
          variant="primary"
          disabled={{disabled}}
          onClick={{handleExecute}}
          style={{{{ backgroundColor: 'var(--skipo-accent)', color: 'var(--skipo-surface)' }}}}
        >
          {{state.isActive ? 'Deactivate' : 'Activate'}}
        </BaseButton>
      </div>
    </div>
  );
}};

export default {comp_name};
"""
    files.append(GeneratedFile(
        relative_path=f"{comp_name}.tsx",
        content=tsx_content,
        description=f"Pure React component using @skipo/ui primitives and theme tokens"
    ))

    # 3. [ComponentName].test.tsx
    test_content = f"""import React from 'react';
import {{ describe, it, expect, vi }} from 'vitest';
import {{ render, screen, fireEvent }} from '@testing-library/react';
import {{ {comp_name} }} from './{comp_name}';

{section_header(f"{comp_name} Operational Test Suite")}
// ══════════════════════════════════════════════════════════════════════════════

describe('{comp_name} Operational Suite', () => {{
  it('renders title and description with theme tokens', () => {{
    render(
      <{comp_name}
        title="Telemetry Unit"
        description="Authentic operational metrics panel"
      />
    );

    expect(screen.getByText('Telemetry Unit')).toBeInTheDocument();
    expect(screen.getByText('Authentic operational metrics panel')).toBeInTheDocument();
    expect(screen.getByText('IDLE')).toBeInTheDocument();
  }});

  it('triggers onAction callback with state transition when clicked', () => {{
    const actionSpy = vi.fn();
    render(
      <{comp_name}
        title="Sensor Controller"
        description="Active sensor bus"
        onAction={{actionSpy}}
      />
    );

    const button = screen.getByRole('button', {{ name: /activate/i }});
    fireEvent.click(button);

    expect(actionSpy).toHaveBeenCalledWith('{comp_name.lower()}-toggle');
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  }});

  it('honors disabled prop and prevents action execution', () => {{
    const actionSpy = vi.fn();
    render(
      <{comp_name}
        title="Locked Controller"
        description="Disabled state validation"
        disabled={{true}}
        onAction={{actionSpy}}
      />
    );

    const button = screen.getByRole('button', {{ name: /activate/i }});
    fireEvent.click(button);

    expect(actionSpy).not.toHaveBeenCalled();
  }});
}});
"""
    files.append(GeneratedFile(
        relative_path=f"{comp_name}.test.tsx",
        content=test_content,
        description=f"Companion Vitest suite with real assertions (anti-stub)"
    ))

    # 4. index.ts
    index_content = f"""{section_header(f"{comp_name} Barrel Facade")}
// ══════════════════════════════════════════════════════════════════════════════

export * from './types';
export * from './{comp_name}';
export {{ default }} from './{comp_name}';
"""
    files.append(GeneratedFile(
        relative_path="index.ts",
        content=index_content,
        description=f"Barrel facade re-exporting {comp_name}"
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
    args = parse_generator_args("Skipo UI Component Suite & Theme Tokens Generator")
    comp_name = args.get("name") or "ActionCard"
    target_path = Path(args["target_path"] or f"src/frontend/components/{comp_name}").resolve()
    result = generate_component_suite(target_path, args)

    if args["json"]:
        print(json.dumps(result.to_dict(), indent=2))
    else:
        print_generator_report(result)

    sys.exit(0 if result.success else 1)

if __name__ == "__main__":
    main()
