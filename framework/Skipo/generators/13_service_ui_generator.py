#!/usr/bin/env python3
"""Aspect 13: Deterministic Service UI Composition & Provenance Generator
Spec: ECOSYSTEM-TIGHTENING-PLAN §6-§7, KRUSBL-PLAN-PATCH §1-§8 (< 200 lines)."""
from pathlib import Path
from typing import List, Dict, Any
import json, time

try:
    from .common import (
        GeneratedFile, GeneratorResult, section_header,
        emit_directory, parse_generator_args, print_generator_report
    )
except ImportError:
    from common import (
        GeneratedFile, GeneratorResult, section_header,
        emit_directory, parse_generator_args, print_generator_report
    )

GENERATOR_ID = "13_service_ui_generator"
GENERATOR_TITLE = "Deterministic Service UI Composition & Provenance Generator"

CANONICAL_UI_REGISTRY: Dict[str, Dict[str, Any]] = {
    "auth": {
        "service_id": "kloks.service.auth", "schema_id": "kloks.service.auth.ui", "schema_version": "1.0.0",
        "requirement_mode": "required", "package_id": "@ultrst-armada/floks", "export_path": "ui",
        "page_name": "Auth.ui", "section_name": "Auth.ui.LoginSection", "component_name": "AuthPage", "title": "AuthSection",
    },
    "storage": {
        "service_id": "kloks.service.storage", "schema_id": "kloks.service.storage.ui", "schema_version": "1.0.0",
        "requirement_mode": "optional", "package_id": "@ultrst-armada/floks", "export_path": "ui",
        "page_name": "Storage.ui", "section_name": "Storage.ui.TilesSection", "component_name": "WorkspaceTilesMenu", "title": "StorageSection",
    },
}

def get_pkg_version(target_dir: Path, pkg: str) -> str:
    name = pkg.split('/')[-1]
    for p in [target_dir / "node_modules" / pkg / "package.json",
              Path(__file__).resolve().parent.parent.parent / name.capitalize() / "package.json",
              Path(__file__).resolve().parent.parent.parent / name / "package.json"]:
        if p.exists():
            try:
                v = json.loads(p.read_text()).get("version")
                if v: return f"^{v}"
            except Exception: pass
    return "^1.0.0"

def resolve_service_ui_config(target_dir: Path, raw_name: str) -> Dict[str, Any]:
    key = raw_name.lower().replace("service", "").replace("section", "")
    manifest_paths = [
        target_dir / "node_modules/@ultrst-armada/kloks/packages/services/kloks.manifest.json",
        target_dir.parent / "node_modules/@ultrst-armada/kloks/packages/services/kloks.manifest.json",
        Path(__file__).resolve().parent.parent.parent / "Kloks/packages/services/kloks.manifest.json",
    ]
    for p in manifest_paths:
        if p.exists():
            try:
                data = json.loads(p.read_text())
                for s in data.get("services", []):
                    sid = str(s.get("id", "")).lower()
                    if key in sid or key in str(s.get("name", "")).lower():
                        u = s.get("ui", {})
                        if u and u.get("requirementMode") != "none":
                            pkg_id = u.get("package", "@ultrst-armada/floks")
                            return {
                                "service_id": s.get("id"),
                                "schema_id": u.get("schema", f"{s.get('id')}.ui"),
                                "schema_version": s.get("version", "1.0.0"),
                                "requirement_mode": u.get("requirementMode", "optional"),
                                "package_id": pkg_id,
                                "package_version": get_pkg_version(target_dir, pkg_id),
                                "export_path": u.get("export", "ui"),
                                "page_name": u.get("page", f"{raw_name}.ui"),
                                "section_name": u.get("section", f"{raw_name}.ui.MainSection"),
                                "component_name": u.get("component", f"{raw_name}Component"),
                                "title": f"{raw_name}Section",
                            }
            except Exception: pass
    cfg = CANONICAL_UI_REGISTRY.get(key)
    pkg_id = cfg["package_id"] if cfg else "@ultrst-armada/floks"
    ver = get_pkg_version(target_dir, pkg_id)
    return {
        "service_id": cfg.get("service_id", f"kloks.service.{key}") if cfg else f"kloks.service.{key}",
        "schema_id": cfg.get("schema_id", f"kloks.service.{key}.ui") if cfg else f"kloks.service.{key}.ui",
        "schema_version": "1.0.0",
        "requirement_mode": cfg.get("requirement_mode", "optional") if cfg else "optional",
        "package_id": pkg_id,
        "package_version": ver,
        "export_path": cfg.get("export_path", "ui") if cfg else "ui",
        "page_name": cfg.get("page_name", f"{raw_name}.ui") if cfg else f"{raw_name}.ui",
        "section_name": cfg.get("section_name", f"{raw_name}.ui.MainSection") if cfg else f"{raw_name}.ui.MainSection",
        "component_name": cfg.get("component_name", f"{raw_name}Component") if cfg else f"{raw_name}Component",
        "title": f"{raw_name}Section",
    }

def generate_service_ui_suite(target_dir: Path, params: Dict[str, Any]) -> GeneratorResult:
    start_time = time.time()
    files: List[GeneratedFile] = []
    raw_name = params.get("name") or "Auth"
    lookup_key = raw_name.lower().replace("service", "").replace("section", "")
    config = resolve_service_ui_config(target_dir, raw_name)
    comp_name = config["title"]
    floks_comp = config["component_name"]

    section_code = f"""// @skipo:service   {config['service_id']}
// @skipo:schema    {config['schema_id']}@{config['schema_version']}
// @skipo:package   {config['package_id']}@{config['package_version']}
// @skipo:export    {config['export_path']}
// @skipo:page      {config['page_name']}
// @skipo:section   {config['section_name']}
// @skipo:component {config['component_name']}
// @skipo:origin    GENERATED
{section_header(f"{comp_name} - Service UI Composition")}
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import {{ {floks_comp} }} from '{config['package_id']}/{config['export_path']}';

export interface {comp_name}Props {{
  title?: string;
  onSuccess?: (result: any) => void;
  className?: string;
}}

export const {comp_name}: React.FC<{comp_name}Props> = ({{
  title = '{comp_name}',
  onSuccess,
  className = '',
}}) => {{
  return (
    <div className={{`skipo-section-${lookup_key} ${{className}}`}}>
      <{floks_comp}
        appName={{title}}
        onLogin={{async (email: string, password: string) => {{
          const res = await fetch('/api/auth/login', {{
            method: 'POST',
            headers: {{ 'Content-Type': 'application/json' }},
            body: JSON.stringify({{ email, password }}),
          }});
          return res.json();
        }}}}
        onRegister={{async (input: any) => {{
          const res = await fetch('/api/auth/register', {{
            method: 'POST',
            headers: {{ 'Content-Type': 'application/json' }},
            body: JSON.stringify(input),
          }});
          return res.json();
        }}}}
        onSuccess={{onSuccess}}
      />
    </div>
  );
}};

export default {comp_name};
"""

    files.append(GeneratedFile(
        relative_path=f"{comp_name}.tsx",
        content=section_code,
        description=f"Deterministic React composition for {config['section_name']} backed by {config['package_id']}."
    ))

    files.append(GeneratedFile(
        relative_path="index.ts",
        content=f"export * from './{comp_name}';\nexport {{ default }} from './{comp_name}';\n",
        description=f"Barrel export for {comp_name} suite."
    ))

    emit_directory(target_dir, files, dry_run=params.get("dry_run", False), force=params.get("force", False))

    messages = [
        f"Generated Service UI Suite for '{config['service_id']}' in {target_dir}",
        f"Bound to public FLOKS export: {config['package_id']}/{config['export_path']} -> {floks_comp}",
        f"Requirement mode: {config['requirement_mode'].upper()}",
        "Embedded full provenance comments for KRUSBL discovery"
    ]

    return GeneratorResult(
        generator_id=GENERATOR_ID,
        generator_title=GENERATOR_TITLE,
        success=True,
        target_directory=str(target_dir),
        files=files,
        duration_ms=round((time.time() - start_time) * 1000, 2),
        messages=messages
    )

if __name__ == "__main__":
    target, params = parse_generator_args("Generate Service UI Composition Suite", ["name"])
    res = generate_service_ui_suite(target, params)
    print_generator_report(res)
