#!/usr/bin/env python3
"""Aspect 22: Skipo source import-direction governance.

Allowed source dependency graph:
  frontend -> libraries
  frontend -> public backend barrel (src/backend/index.ts)
  backend  -> libraries
  backend  -> backend
  libraries -> libraries

Forbidden:
  backend -> frontend
  libraries -> frontend
  libraries -> backend
  frontend -> backend internals
  any other src-plane direction.
"""

from pathlib import Path
from typing import Optional
import re
import sys
import time

try:
    from .common import ChecklistResult, Violation
except ImportError:
    try:
        from common import ChecklistResult, Violation
    except ImportError:
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        from common import ChecklistResult, Violation

IMPORT_REGEX = re.compile(
    r"""import\s+(?:(?:\*\s+as\s+\w+)|(?:\{[^}]*\})|(?:[\w\s,{}*]+))\s+from\s+['"]([^'"]+)['"]""",
    re.MULTILINE,
)
DYNAMIC_IMPORT_REGEX = re.compile(r"""import\(\s*['"]([^'"]+)['"]\s*\)""")
REQUIRE_REGEX = re.compile(r"""require\(\s*['"]([^'"]+)['"]\s*\)""")

FORBIDDEN_BROWSER_EXACT = {"@ultrst-armada/kloks"}

FORBIDDEN_BROWSER_EXTERNALS = (
    "@ultrst-armada/kloks/backend",
    "@ultrst-armada/kloks/storage",
    "@ultrst-armada/kloks/node",
    "@ultrst-armada/krnl",
    "@kloks/",
    "@dinilmusick/gutts/server",
    "@dinilmusick/gutts/storage",
    "@dinilmusick/gutts/models",
    "@dinilmusick/gutts/semantic-input",
    "@aws-sdk/",
    "@neondatabase/serverless",
    "@supabase/supabase-js",
    "@google/genai",
    "@google-cloud/",
    "better-auth",
    "pg",
    "kysely",
    "kysely-neon",
    "googleapis",
    "onnxruntime-node",
    "node:",
)



def _is_forbidden_browser_external(specifier: str) -> bool:
    if specifier in FORBIDDEN_BROWSER_EXACT:
        return True
    for forbidden in FORBIDDEN_BROWSER_EXTERNALS:
        if forbidden.endswith(("/", ":")):
            if specifier.startswith(forbidden):
                return True
        elif specifier == forbidden or specifier.startswith(forbidden + "/"):
            return True
    return False


def _source_plane(target: Path, path: Path) -> Optional[str]:
    try:
        rel = path.resolve().relative_to(target.resolve())
    except ValueError:
        return None
    parts = rel.parts
    if len(parts) >= 2 and parts[0] == "src" and parts[1] in {"frontend", "backend", "libraries"}:
        return parts[1]
    return None


def _resolve_local_import(source: Path, specifier: str) -> Optional[Path]:
    if not specifier.startswith("."):
        return None
    candidate = (source.parent / specifier).resolve()
    candidates = [candidate]
    if candidate.suffix == "":
        candidates.extend(candidate.with_suffix(ext) for ext in (".ts", ".tsx", ".js", ".jsx"))
        candidates.extend(candidate / ("index" + ext) for ext in (".ts", ".tsx", ".js", ".jsx"))
    elif candidate.suffix in {".js", ".jsx"}:
        candidates.extend(candidate.with_suffix(ext) for ext in (".ts", ".tsx"))
    for item in candidates:
        if item.is_file():
            return item
    return candidate


def _service_scope(target: Path, path: Path) -> Optional[str]:
    try:
        rel = path.resolve().relative_to(target.resolve())
    except ValueError:
        return None
    parts = rel.parts
    if len(parts) >= 4 and parts[0] == "src" and parts[1] == "backend" and parts[2] == "services":
        return parts[3]
    return None


def _is_service_local_library(path: Path) -> bool:
    return "services" in path.parts and "libraries" in path.parts


def _is_public_backend_barrel(target: Path, imported: Optional[Path]) -> bool:
    if imported is None:
        return False
    try:
        rel = imported.resolve().relative_to(target.resolve()).as_posix()
    except ValueError:
        return False
    return rel in {"src/backend/index.ts", "src/backend/index.js", "src/backend/index", "src/backend"}


def _iter_imports(content: str):
    seen = set()
    for regex in (IMPORT_REGEX, DYNAMIC_IMPORT_REGEX, REQUIRE_REGEX):
        for match in regex.finditer(content):
            specifier = match.group(1)
            if specifier not in seen:
                seen.add(specifier)
                yield specifier, content.count("\n", 0, match.start()) + 1


def validate_import_direction(target: Path) -> ChecklistResult:
    start = time.time()
    violations = []
    files_scanned = 0
    target = target.resolve()

    if not (target / "src" / "frontend").is_dir() or not (target / "src" / "backend").is_dir():
        return ChecklistResult(
            aspect_id="aspect_22",
            aspect_title="Skipo Import Direction Governance",
            passed=True,
            violations=[],
            files_scanned=0,
            duration_ms=(time.time() - start) * 1000,
            score=100.0,
        )

    code_files = [
        p for p in target.rglob("*")
        if p.suffix in {".ts", ".tsx", ".js", ".jsx"}
        and "node_modules" not in p.parts
        and ".git" not in p.parts
        and "dist" not in p.parts
        and "build" not in p.parts
        and ".next" not in p.parts
        and "scaffolds" not in p.parts
    ]

    for fpath in code_files:
        source_plane = _source_plane(target, fpath)
        if source_plane is None:
            continue
        files_scanned += 1

        try:
            content = fpath.read_text(encoding="utf-8")
        except Exception:
            continue

        rel_path = fpath.relative_to(target).as_posix()
        if source_plane in {"frontend", "libraries"}:
            for specifier, line_no in _iter_imports(content):
                if _is_forbidden_browser_external(specifier):
                    violations.append(Violation(
                        rule_id="22.4-browser-server-boundary",
                        severity="error",
                        message=f"Browser/shared source imports forbidden server implementation '{specifier}'.",
                        file_path=rel_path,
                        line=line_no,
                        snippet=specifier,
                        suggestion="Use a browser-safe library/client or a shared contract; server implementations belong behind the backend boundary.",
                    ))
        for specifier, line_no in _iter_imports(content):
            imported = _resolve_local_import(fpath, specifier)
            target_plane = _source_plane(target, imported) if imported else None
            if target_plane is None:
                continue

            if imported and _is_service_local_library(imported):
                source_svc = _service_scope(target, fpath)
                imported_svc = _service_scope(target, imported)
                if source_svc != imported_svc:
                    violations.append(Violation(
                        rule_id="22.3-cross-service-library-import",
                        severity="error",
                        message=(
                            f"Service '{source_svc}' cannot directly import private library from "
                            f"service '{imported_svc}' via '{specifier}'. Access must go through the service facade."
                        ),
                        file_path=rel_path,
                        line=line_no,
                        snippet=specifier,
                        suggestion=f"Export the capability via service '{imported_svc}' facade instead of importing its private libraries.",
                    ))
                    continue

            allowed = (
                (source_plane == "frontend" and target_plane == "frontend") or
                (source_plane == "frontend" and target_plane == "libraries") or
                (source_plane == "frontend" and target_plane == "backend" and
                 _is_public_backend_barrel(target, imported)) or
                (source_plane == "backend" and target_plane in {"backend", "libraries"}) or
                (source_plane == "libraries" and target_plane == "libraries")
            )

            if not allowed:
                violations.append(Violation(
                    rule_id="22.1-forbidden-import-direction",
                    severity="error",
                    message=(
                        f"Forbidden source import direction '{source_plane} -> {target_plane}' "
                        f"through '{specifier}'."
                    ),
                    file_path=rel_path,
                    line=line_no,
                    snippet=next(
                        (line.strip() for line in content.splitlines()
                         if content.splitlines().index(line) + 1 == line_no),
                        "",
                    ),
                    suggestion=(
                        "Allowed flow: frontend -> libraries, frontend -> public backend barrel, "
                        "backend -> libraries/backend, and libraries -> libraries."
                    ),
                ))
                continue

            if source_plane == "frontend" and target_plane == "backend" and not _is_public_backend_barrel(target, imported):
                violations.append(Violation(
                    rule_id="22.2-frontend-backend-internal-import",
                    severity="error",
                    message=f"Frontend imports backend implementation '{specifier}' instead of the public backend barrel.",
                    file_path=rel_path,
                    line=line_no,
                    snippet=specifier,
                    suggestion="Import only from src/backend/index.ts.",
                ))

    duration = (time.time() - start) * 1000
    return ChecklistResult(
        aspect_id="aspect_22",
        aspect_title="Skipo Import Direction Governance",
        passed=not violations,
        violations=violations,
        files_scanned=files_scanned,
        duration_ms=duration,
        score=max(0.0, 100.0 - len(violations) * 10.0),
    )


if __name__ == "__main__":
    import sys
    result = validate_import_direction(Path(sys.argv[1]) if len(sys.argv) > 1 else Path("."))
    print(f"Aspect 22: {result.aspect_title} - {'PASSED' if result.passed else 'FAILED'}")
    for violation in result.violations:
        print(f"  [{violation.severity.upper()}] {violation.file_path}:{violation.line} - {violation.message}")
    sys.exit(0 if result.passed else 1)
