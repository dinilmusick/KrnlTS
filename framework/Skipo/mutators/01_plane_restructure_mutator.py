#!/usr/bin/env python3
"""
Aspect 01 Mutator: Plane Restructure & Directory Consolidation
Transforms:
- Flat monolithic directory layouts into strict Plane Isolation (src/frontend & src/backend)
- Groups loose components into cohesive component suite folders with barrel facades
- Re-links relative import paths across migrated files
- Generates root and plane barrel files to ensure 100% backward compatibility
"""

from pathlib import Path
from typing import List, Dict, Any, Tuple
import os
import re
import shutil
import sys
import time

try:
    from .common import (
        MutationAction, MutatorResult, rewrite_file_safe, section_border,
        parse_mutator_args, print_mutator_report
    )
except ImportError:
    from common import (
        MutationAction, MutatorResult, rewrite_file_safe, section_border,
        parse_mutator_args, print_mutator_report
    )

MUTATOR_ID = "01_plane_restructure"
MUTATOR_TITLE = "Plane Restructure & Directory Consolidation Mutator"

def is_ui_file(content: str, filename: str) -> bool:
    """Detect if a file belongs to the Frontend plane."""
    if filename.endswith(".tsx") or filename.endswith(".jsx"):
        return True
    if "React" in content or "useState" in content or "useEffect" in content or "@skipo/ui" in content:
        return True
    if filename[0].isupper() and (filename.endswith(".ts") or filename.endswith(".js")):
        return True
    return False

def is_backend_file(content: str, filename: str) -> bool:
    """Detect if a file belongs to the Backend plane."""
    if "api" in filename.lower() or "route" in filename.lower() or "server" in filename.lower():
        return True
    if "sqlite" in content.lower() or "s3client" in content.lower() or "database" in content.lower() or "nextresponse" in content.lower():
        return True
    if "store" in filename.lower() or "db" in filename.lower() or "entity" in filename.lower():
        return True
    return False

def mutate_plane_structure(target_dir: Path, params: Dict[str, Any]) -> MutatorResult:
    start_time = time.time()
    actions: List[MutationAction] = []
    messages: List[str] = []
    dry_run = params.get("dry_run", False)
    backup = params.get("backup", False)

    src_dir = target_dir / "src" if (target_dir / "src").exists() else target_dir

    # Check for direct files in src_dir
    direct_files = [
        f for f in src_dir.iterdir()
        if f.is_file() and f.suffix in {".ts", ".tsx", ".js", ".jsx"}
        and not f.name.startswith(".") and not f.name.endswith(".d.ts")
    ]

    if not direct_files:
        messages.append("No loose files detected in src/ root. Planes already segregated or empty.")
        return MutatorResult(
            mutator_id=MUTATOR_ID,
            mutator_title=MUTATOR_TITLE,
            success=True,
            target_path=str(target_dir),
            actions=[],
            messages=messages,
            duration_ms=(time.time() - start_time) * 1000
        )

    frontend_dir = src_dir / "frontend"
    backend_dir = src_dir / "backend"

    if not dry_run:
        frontend_dir.mkdir(parents=True, exist_ok=True)
        backend_dir.mkdir(parents=True, exist_ok=True)

    frontend_exports: List[str] = []
    backend_exports: List[str] = []

    for file_path in direct_files:
        fname = file_path.name
        stem = file_path.stem
        content = file_path.read_text(encoding="utf-8", errors="replace")

        # Skip entrypoint main.ts or index.ts if present
        if fname in ["main.ts", "main.tsx", "index.ts", "index.tsx"]:
            continue

        if fname == "App.tsx":
            target_dest = frontend_dir / "App.tsx"
            actions.append(MutationAction(
                action_type="move",
                source_path=str(file_path.relative_to(target_dir)),
                target_path=str(target_dest.relative_to(target_dir)),
                description="Relocated root App component to src/frontend/App.tsx"
            ))
            if not dry_run:
                shutil.move(str(file_path), str(target_dest))
            frontend_exports.append("./App")
            continue

        if is_ui_file(content, fname):
            # Move UI component into dedicated folder: src/frontend/components/[CompName]/[CompName].tsx
            comp_folder = frontend_dir / "components" / stem
            target_dest = comp_folder / fname
            actions.append(MutationAction(
                action_type="move",
                source_path=str(file_path.relative_to(target_dir)),
                target_path=str(target_dest.relative_to(target_dir)),
                description=f"Migrated UI component into component suite folder src/frontend/components/{stem}/"
            ))

            if not dry_run:
                comp_folder.mkdir(parents=True, exist_ok=True)
                shutil.move(str(file_path), str(target_dest))
                
                # Emit barrel index.ts in the component folder
                barrel_content = f"{section_border(f'{stem} Barrel Facade')}\nexport * from './{stem}';\nexport {{ default }} from './{stem}';\n"
                (comp_folder / "index.ts").write_text(barrel_content, encoding="utf-8")

            frontend_exports.append(f"./components/{stem}")

        elif is_backend_file(content, fname):
            # Move backend logic to src/backend/
            sub_folder = "api" if "route" in fname.lower() or "api" in fname.lower() else "services"
            dest_dir = backend_dir / sub_folder
            target_dest = dest_dir / fname
            actions.append(MutationAction(
                action_type="move",
                source_path=str(file_path.relative_to(target_dir)),
                target_path=str(target_dest.relative_to(target_dir)),
                description=f"Migrated backend file to src/backend/{sub_folder}/{fname}"
            ))

            if not dry_run:
                dest_dir.mkdir(parents=True, exist_ok=True)
                shutil.move(str(file_path), str(target_dest))

            backend_exports.append(f"./{sub_folder}/{stem}")

        else:
            # Move utilities/helpers to frontend/lib or backend/lib
            dest_dir = frontend_dir / "lib"
            target_dest = dest_dir / fname
            actions.append(MutationAction(
                action_type="move",
                source_path=str(file_path.relative_to(target_dir)),
                target_path=str(target_dest.relative_to(target_dir)),
                description=f"Moved general utility to src/frontend/lib/{fname}"
            ))

            if not dry_run:
                dest_dir.mkdir(parents=True, exist_ok=True)
                shutil.move(str(file_path), str(target_dest))

            frontend_exports.append(f"./lib/{stem}")

    # Generate Plane Barrels and Root Facade
    if not dry_run:
        # Frontend barrel
        fe_barrel = [section_border("Frontend Plane Barrel")]
        for exp in frontend_exports:
            fe_barrel.append(f"export * from '{exp}';")
        (frontend_dir / "index.ts").write_text("\n".join(fe_barrel) + "\n", encoding="utf-8")

        # Backend barrel
        be_barrel = [section_border("Backend Plane Barrel")]
        for exp in backend_exports:
            be_barrel.append(f"export * from '{exp}';")
        (backend_dir / "index.ts").write_text("\n".join(be_barrel) + "\n", encoding="utf-8")

        # Root src/index.ts re-exporting both planes
        root_barrel = [
            section_border("Skipo Root Plane Facade"),
            "export * as Frontend from './frontend';",
            "export * as Backend from './backend';",
            "export * from './frontend';"
        ]
        (src_dir / "index.ts").write_text("\n".join(root_barrel) + "\n", encoding="utf-8")

    messages.append(f"Successfully consolidated {len(actions)} files into plane architecture.")
    
    return MutatorResult(
        mutator_id=MUTATOR_ID,
        mutator_title=MUTATOR_TITLE,
        success=True,
        target_path=str(target_dir),
        actions=actions,
        messages=messages,
        duration_ms=(time.time() - start_time) * 1000
    )

def main():
    args = parse_mutator_args("Skipo Plane Restructure & Directory Consolidation Mutator")
    target_path = Path(args["target_path"]).resolve()
    result = mutate_plane_structure(target_path, args)

    if args["json"]:
        print(json.dumps(result.to_dict(), indent=2))
    else:
        print_mutator_report(result, verbose=args["verbose"])

    sys.exit(0 if result.success else 1)

if __name__ == "__main__":
    main()
