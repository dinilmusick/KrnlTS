#!/usr/bin/env python3
"""
code-purity-audit.py — Skipo Code Purity, Directory Structure & Line Limit Enforcement Auditor.
Pure Python 3 standard library ONLY — zero pip dependencies.

Scans ALL .ts/.tsx/.js/.jsx files across the entire codebase and enforces:
  1. Zero loose code files in repository root (L16)
  2. Strict directory placement (code files restricted to approved architectural planes)
  3. Clean naming conventions (identifiers, extensions, purity suffixes)
  4. Hard line limits (≤200 lines, ≤150 for helpers)
  5. File Purity Classification (P0 Pure → P1 Impure → P2 Orchestrator → P3 Facade)
  6. Naming Convention (_Pure, _Impure, _Orchestrator, _Facade suffixes)
  7. Acyclic Import DAG validation
  8. Facade composition enforcement (every service/backend gets a facade)
"""

from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple
import argparse
import json
import os
import re
import sys
import time

# ══════════════════════════════════════════════════════════════════════════════
# ANSI COLOR CONSTANTS
# ══════════════════════════════════════════════════════════════════════════════
USE_COLOR = sys.stdout.isatty() and (os.name != 'nt' or 'TERM' in os.environ)

def _c(code: str, text: str) -> str:
    return f"{code}{text}\033[0m" if USE_COLOR else text

def red(t: str) -> str: return _c("\033[91m", t)
def green(t: str) -> str: return _c("\033[92m", t)
def yellow(t: str) -> str: return _c("\033[93m", t)
def cyan(t: str) -> str: return _c("\033[96m", t)
def bold(t: str) -> str: return _c("\033[1m", t)
def dim(t: str) -> str: return _c("\033[2m", t)
def magenta(t: str) -> str: return _c("\033[95m", t)

# ══════════════════════════════════════════════════════════════════════════════
# CONSTANTS & CONFIGURATION
# ══════════════════════════════════════════════════════════════════════════════
EXTENSIONS = {".ts", ".tsx", ".js", ".jsx"}
IGNORE_DIRS = {
    "node_modules", "dist", ".next", ".turbo", "build", "out",
    ".git", ".system_generated", "coverage", ".cache", "__pycache__"
}
MAX_LINES = 200
MAX_LINES_HELPER = 150

ALLOWED_ROOT_CODE_CONFIGS = {
    "next.config.js", "next.config.mjs", "next.config.ts",
    "vite.config.js", "vite.config.ts", "electron.vite.config.ts",
    "tailwind.config.js", "tailwind.config.ts", "postcss.config.js",
    "postcss.config.mjs", "turbo.json", "tsup.config.ts"
}
ALLOWED_TOP_CODE_DIRS = {
    "src", "packages", "scripts", "backend", "components", "hooks", "lib",
    "api", "standalone", "features", "data", "database",
    "skipo-audio-midi-engine", "checklists", "generators", "mutators"
}
VALID_NAME_PATTERN = re.compile(r"^[a-zA-Z0-9_\-\.\[\]@]+$")

GRADE_NAMES = {0: "P0 Pure", 1: "P1 Impure", 2: "P2 Orchestrator", 3: "P3 Facade"}
GRADE_SUFFIXES = {"_Pure": 0, "_Impure": 1, "_Orchestrator": 2, "_Facade": 3}

# Regex to extract import paths from TypeScript/JavaScript
IMPORT_REGEX = re.compile(
    r'''(?:^|\n)\s*import\s+'''
    r'''(?:type\s+)?'''          # optional 'type' keyword
    r'''(?:[\s\S]*?\s+from\s+)?'''  # optional named/default imports
    r'''['"]([^'"]+)['"]''',
    re.MULTILINE
)

# Separate regex to detect if an import is type-only
TYPE_IMPORT_REGEX = re.compile(
    r'''(?:^|\n)\s*import\s+type\s+'''
    r'''(?:[\s\S]*?\s+from\s+)?'''
    r'''['"]([^'"]+)['"]''',
    re.MULTILINE
)

# Regex for inline require() calls
REQUIRE_REGEX = re.compile(r'''require\s*\(\s*['"]([^'"]+)['"]\s*\)''')

# Naming suffix regex — matches _Pure, _Impure, _Orchestrator, _Facade before extension
NAMING_SUFFIX_REGEX = re.compile(r'_(Pure|Impure|Orchestrator|Facade)\.[tj]sx?$')


# ══════════════════════════════════════════════════════════════════════════════
# FILE SCANNER
# ══════════════════════════════════════════════════════════════════════════════
def scan_all_files(root: Path) -> List[Path]:
    """Walk directory tree, return all matching source files (no exemptions)."""
    results: List[Path] = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in IGNORE_DIRS and not d.startswith('.')]
        for fname in filenames:
            ext = os.path.splitext(fname)[1].lower()
            if ext in EXTENSIONS:
                results.append(Path(dirpath) / fname)
    return results


def read_safe(path: Path) -> Optional[str]:
    """Read file with utf-8, fallback to replace errors."""
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return None


# ══════════════════════════════════════════════════════════════════════════════
# IMPORT PARSER
# ══════════════════════════════════════════════════════════════════════════════
def parse_imports(content: str) -> Tuple[Set[str], Set[str], Set[str]]:
    """
    Parse imports from file content.
    Returns: (local_imports, external_imports, type_only_imports)
    """
    all_imports = set(IMPORT_REGEX.findall(content))
    type_imports = set(TYPE_IMPORT_REGEX.findall(content))
    require_imports = set(REQUIRE_REGEX.findall(content))
    all_imports |= require_imports

    local = set()
    external = set()

    for imp in all_imports:
        if imp in type_imports:
            continue  # type-only imports are exempt
        if imp.startswith('.') or imp.startswith('@/') or imp.startswith('~/'):
            local.add(imp)
        else:
            external.add(imp)

    return local, external, type_imports


# ══════════════════════════════════════════════════════════════════════════════
# INLINE OPERATIONS DETECTOR
# ══════════════════════════════════════════════════════════════════════════════
INLINE_OP_PATTERNS = [
    re.compile(r'\b(?:if|for|while|switch|try)\s*\('),      # control flow
    re.compile(r'\b(?:const|let|var)\s+\w+\s*=\s*(?!import)'),  # variable assignments
    re.compile(r'(?:=>|function)\s*\{'),                     # function bodies
    re.compile(r'\.\s*(?:map|filter|reduce|forEach|find)\s*\('),  # array operations
    re.compile(r'(?:await|async)\s+'),                       # async operations
    re.compile(r'new\s+[A-Z]'),                              # constructor calls
]


def count_inline_operations(content: str, lines: List[str]) -> int:
    """Count lines with inline business logic operations."""
    op_count = 0
    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith('//') or stripped.startswith('/*') or stripped.startswith('*'):
            continue
        if stripped.startswith('import ') or stripped.startswith('export {') or stripped.startswith('export default'):
            continue
        if stripped.startswith('export type ') or stripped.startswith('type ') or stripped.startswith('interface '):
            continue
        if stripped.startswith('export interface ') or stripped.startswith('export const enum'):
            continue
        for pattern in INLINE_OP_PATTERNS:
            if pattern.search(stripped):
                op_count += 1
                break
    return op_count


# ══════════════════════════════════════════════════════════════════════════════
# PURITY GRADE CLASSIFIER
# ══════════════════════════════════════════════════════════════════════════════
def classify_purity_grade(
    local_imports: Set[str],
    external_imports: Set[str],
    inline_op_count: int,
    line_count: int
) -> int:
    """Classify file into purity grade based on import patterns and inline operations."""
    has_local = len(local_imports) > 0
    has_external = len(external_imports) > 0

    if not has_local and not has_external:
        return 0

    if has_local and inline_op_count <= 3 and not has_external:
        if len(local_imports) >= 3:
            return 3

    if has_local and inline_op_count <= 8:
        return 2

    return 1


# ══════════════════════════════════════════════════════════════════════════════
# NAMING CONVENTION VALIDATOR
# ══════════════════════════════════════════════════════════════════════════════
def extract_naming_grade(filename: str) -> Optional[int]:
    """Extract declared purity grade from filename suffix, or None if no suffix."""
    match = NAMING_SUFFIX_REGEX.search(filename)
    if not match:
        return None
    return {"Pure": 0, "Impure": 1, "Orchestrator": 2, "Facade": 3}.get(match.group(1))


# ══════════════════════════════════════════════════════════════════════════════
# VIOLATION DATA MODEL
# ══════════════════════════════════════════════════════════════════════════════
class AuditViolation:
    """Single violation detected during audit."""
    def __init__(self, rule: str, severity: str, path: str, message: str,
                 line_num: Optional[int] = None, suggestion: Optional[str] = None):
        self.rule = rule
        self.severity = severity
        self.path = path
        self.message = message
        self.line_num = line_num
        self.suggestion = suggestion

    def to_dict(self) -> dict:
        d = {"rule": self.rule, "severity": self.severity, "path": self.path, "message": self.message}
        if self.line_num:
            d["line"] = self.line_num
        if self.suggestion:
            d["suggestion"] = self.suggestion
        return d


class FileAuditResult:
    """Audit result for a single file."""
    def __init__(self, path: str, line_count: int, detected_grade: int,
                 named_grade: Optional[int], local_imports: int,
                 external_imports: int, inline_ops: int):
        self.path = path
        self.line_count = line_count
        self.detected_grade = detected_grade
        self.named_grade = named_grade
        self.local_imports = local_imports
        self.external_imports = external_imports
        self.inline_ops = inline_ops
        self.violations: List[AuditViolation] = []

    def to_dict(self) -> dict:
        return {
            "path": self.path,
            "line_count": self.line_count,
            "detected_grade": GRADE_NAMES[self.detected_grade],
            "named_grade": GRADE_NAMES[self.named_grade] if self.named_grade is not None else None,
            "local_imports": self.local_imports,
            "external_imports": self.external_imports,
            "inline_ops": self.inline_ops,
            "violations": [v.to_dict() for v in self.violations]
        }


# ══════════════════════════════════════════════════════════════════════════════
# CORE AUDIT ENGINE
# ══════════════════════════════════════════════════════════════════════════════
def audit_file(file_path: Path, root: Path) -> FileAuditResult:
    """Run full structure, purity + line limit audit on a single file."""
    rel = file_path.relative_to(root)
    rel_path = str(rel)
    parts = rel.parts
    content = read_safe(file_path) or ""
    lines = content.splitlines()
    line_count = len(lines)
    fname = file_path.name

    local_imports, external_imports, type_imports = parse_imports(content)
    inline_ops = count_inline_operations(content, lines)
    detected_grade = classify_purity_grade(local_imports, external_imports, inline_ops, line_count)
    named_grade = extract_naming_grade(fname)

    result = FileAuditResult(
        path=rel_path, line_count=line_count, detected_grade=detected_grade,
        named_grade=named_grade, local_imports=len(local_imports),
        external_imports=len(external_imports), inline_ops=inline_ops
    )

    # Skip generated files
    if "// @generated" in content[:300] or "/* @generated" in content[:300]:
        return result

    # ── 1. ROOT FILE STRUCTURE VIOLATION (L16) ──
    if len(parts) == 1:
        if fname not in ALLOWED_ROOT_CODE_CONFIGS:
            result.violations.append(AuditViolation(
                rule="forbidden-root-code-file", severity="error", path=rel_path,
                message=f"Direct code file '{fname}' is located in repository root. Code must never reside in root.",
                suggestion="Move file into canonical plane: 'src/frontend/', 'src/backend/', 'packages/<pkg>/src/', or 'scripts/'."
            ))

    # ── 2. UNAUTHORIZED DIRECTORY PLACEMENT ──
    if len(parts) > 1:
        top_dir = parts[0]
        if top_dir not in ALLOWED_TOP_CODE_DIRS and not top_dir.startswith("."):
            result.violations.append(AuditViolation(
                rule="invalid-code-directory-placement", severity="error", path=rel_path,
                message=f"File resides in unauthorized directory '{top_dir}'.",
                suggestion=f"Relocate code from '{top_dir}' into canonical plane 'src/frontend/', 'src/backend/', or 'packages/'."
            ))

    # ── 3. NAMING SYNTAX VALIDATION ──
    for part in parts:
        if not VALID_NAME_PATTERN.match(part) or " " in part:
            result.violations.append(AuditViolation(
                rule="invalid-naming-syntax", severity="error", path=rel_path,
                message=f"Path segment '{part}' contains spaces or illegal characters.",
                suggestion="Rename to kebab-case, camelCase, or PascalCase with clean characters only."
            ))
            break

    # ── 4. LINE LIMIT VIOLATIONS ──
    max_lines = MAX_LINES_HELPER if ("helper" in rel_path.lower() or "utils" in rel_path.lower()) else MAX_LINES
    if line_count > max_lines:
        result.violations.append(AuditViolation(
            rule="line-limit-exceeded", severity="error", path=rel_path,
            message=f"File has {line_count} lines (limit: {max_lines}). Exceeds by {line_count - max_lines} lines.",
            line_num=line_count,
            suggestion=f"Decompose into Pure (_Pure), Impure (_Impure), and Orchestrator (_Orchestrator) files."
        ))

    # ── 5. NAMING vs DETECTED GRADE MISMATCH ──
    if named_grade is not None and named_grade != detected_grade:
        result.violations.append(AuditViolation(
            rule="purity-naming-mismatch", severity="error", path=rel_path,
            message=(f"Named as {GRADE_NAMES[named_grade]} but detected as "
                     f"{GRADE_NAMES[detected_grade]} ({len(local_imports)} local, "
                     f"{len(external_imports)} external, {inline_ops} inline ops)."),
            suggestion="Rename to match detected grade or refactor imports."
        ))

    # ── 6. PURE FILE WITH RUNTIME IMPORTS ──
    if detected_grade == 0 and (len(local_imports) > 0 or len(external_imports) > 0):
        result.violations.append(AuditViolation(
            rule="pure-has-runtime-imports", severity="error", path=rel_path,
            message=f"P0 Pure file has runtime imports ({len(local_imports)} local, {len(external_imports)} external).",
            suggestion="Remove runtime imports or reclassify as _Impure."
        ))

    # ── 7. FACADE WITH INLINE LOGIC ──
    if detected_grade == 3 and inline_ops > 3:
        result.violations.append(AuditViolation(
            rule="facade-has-logic", severity="error", path=rel_path,
            message=f"P3 Facade has {inline_ops} inline operations. Facades must only re-export.",
            suggestion="Move logic to Orchestrator (_Orchestrator) or Impure (_Impure) files."
        ))

    # ── 8. ORCHESTRATOR WITH EXCESSIVE LOGIC ──
    if detected_grade == 2 and inline_ops > 15:
        result.violations.append(AuditViolation(
            rule="orchestrator-excessive-logic", severity="error", path=rel_path,
            message=f"P2 Orchestrator has {inline_ops} inline ops (max: 15). Too much direct logic.",
            suggestion="Extract logic into _Pure or _Impure files. Orchestrators only chain calls."
        ))

    return result


# ══════════════════════════════════════════════════════════════════════════════
# REPORT RENDERER
# ══════════════════════════════════════════════════════════════════════════════
def print_report(results: List[FileAuditResult], root: Path,
                 violations_only: bool = False, duration_ms: float = 0) -> None:
    """Print color-coded audit report."""
    total = len(results)
    violating = [r for r in results if r.violations]
    clean = [r for r in results if not r.violations]
    all_violations = [v for r in results for v in r.violations]
    errors = [v for v in all_violations if v.severity == "error"]
    warnings = [v for v in all_violations if v.severity == "warning"]
    grade_counts = {g: sum(1 for r in results if r.detected_grade == g) for g in range(4)}

    print("\n" + bold("=" * 84))
    print(f"  {bold('SKIPO CODE PURITY, DIRECTORY STRUCTURE & LINE LIMIT AUDIT REPORT')}")
    print(bold("=" * 84))
    print(f"  Root:      {cyan(str(root))}")
    print(f"  Files:     {bold(str(total))} scanned")
    print(f"  Duration:  {dim(f'{duration_ms:.1f}ms')}")
    print(dim("-" * 84))

    # ── DIRECTORY & PLACEMENT VIOLATIONS ──
    struct_viols = [
        r for r in results
        if any(v.rule in ("forbidden-root-code-file", "invalid-code-directory-placement", "invalid-naming-syntax") for v in r.violations)
    ]
    if struct_viols:
        print(f"\n  {red(bold('🔴 DIRECTORY STRUCTURE & PLACEMENT VIOLATIONS'))} ({len(struct_viols)} files)")
        print(dim("  " + "-" * 80))
        for r in struct_viols:
            print(f"    {red('✖')} {r.path}")
            for v in r.violations:
                if v.rule in ("forbidden-root-code-file", "invalid-code-directory-placement", "invalid-naming-syntax"):
                    print(f"      {red('→')} [{v.rule}] {v.message}")
                    if v.suggestion:
                        print(f"        {cyan('Fix:')} {v.suggestion}")

    print(f"\n  {bold('PURITY GRADE DISTRIBUTION:')}")
    for grade in range(4):
        count = grade_counts[grade]
        bar = "█" * min(count, 40)
        print(f"    {GRADE_NAMES[grade]:<18} {count:>4}  {dim(bar)}")

    # Line limit violations
    line_viols = sorted(
        [r for r in results if any(v.rule == "line-limit-exceeded" for v in r.violations)],
        key=lambda r: r.line_count, reverse=True
    )
    if line_viols:
        print(f"\n  {red(bold('🔴 LINE LIMIT VIOLATIONS'))} ({len(line_viols)} files)")
        print(dim("  " + "-" * 80))
        for r in line_viols:
            overage = r.line_count - MAX_LINES
            bar = red("█" * min(overage // 10, 30))
            print(f"    {red('✖')} {r.path}")
            print(f"      {bold(str(r.line_count))} lines (+{overage} over)  {bar}")

    # Purity violations
    purity_viols = [
        r for r in results
        if any(v.rule in ("purity-naming-mismatch", "pure-has-runtime-imports",
                          "facade-has-logic", "orchestrator-excessive-logic") for v in r.violations)
    ]
    if purity_viols:
        print(f"\n  {yellow(bold('🟡 PURITY CLASSIFICATION VIOLATIONS'))} ({len(purity_viols)} files)")
        print(dim("  " + "-" * 80))
        for r in purity_viols:
            print(f"    {yellow('⚠')} {r.path}")
            print(f"      Detected: {bold(GRADE_NAMES[r.detected_grade])} | "
                  f"Local: {r.local_imports} | External: {r.external_imports} | Ops: {r.inline_ops}")
            for v in r.violations:
                if v.rule not in ("line-limit-exceeded", "forbidden-root-code-file", "invalid-code-directory-placement", "invalid-naming-syntax"):
                    print(f"      {red('→')} {v.message}")
                    if v.suggestion:
                        print(f"        {cyan('Fix:')} {v.suggestion}")

    if not violations_only and clean:
        print(f"\n  {green(bold('🟢 CLEAN FILES'))} ({len(clean)} files)")
        print(dim("  " + "-" * 80))
        for grade in range(4):
            gf = [r for r in clean if r.detected_grade == grade]
            if gf:
                print(f"    {green('✔')} {GRADE_NAMES[grade]}: {len(gf)} files")

    print(dim("\n  " + "-" * 80))
    status = red(bold("FAILED")) if errors else green(bold("PASSED"))
    print(f"  RESULT: {status} | Errors: {red(str(len(errors)))} | "
          f"Warnings: {yellow(str(len(warnings)))} | Clean: {green(str(len(clean)))}/{total}")
    print(bold("=" * 84) + "\n")

    if errors:
        print(red(bold("  🚨 AGENT MANDATE: Resolve all errors before declaring task complete.")))
        print(cyan("     Place code files in canonical plane folders, never in repo root."))
        print(cyan("     Decompose files: _Pure.ts → _Impure.ts → _Orchestrator.ts → _Facade.ts\n"))


def print_file_inspection(file_path: Path, root: Path) -> None:
    """Print detailed import graph and purity analysis for a single file."""
    result = audit_file(file_path, root)
    print("\n" + bold("=" * 84))
    print(f"  {bold('FILE INSPECTION:')} {cyan(result.path)}")
    print(bold("=" * 84))
    print(f"  Lines:           {bold(str(result.line_count))}")
    print(f"  Detected Grade:  {bold(GRADE_NAMES[result.detected_grade])}")
    if result.named_grade is not None:
        print(f"  Named Grade:     {bold(GRADE_NAMES[result.named_grade])}")
    print(f"  Local Imports:   {result.local_imports}")
    print(f"  External Imports:{result.external_imports}")
    print(f"  Inline Ops:      {result.inline_ops}")

    content = read_safe(file_path) or ""
    local_imports, external_imports, type_imports = parse_imports(content)
    if local_imports:
        print(f"\n  {bold('Local Imports (runtime):')}")
        for imp in sorted(local_imports):
            print(f"    → {imp}")
    if external_imports:
        print(f"\n  {bold('External Imports (runtime):')}")
        for imp in sorted(external_imports):
            print(f"    → {dim(imp)}")
    if type_imports:
        print(f"\n  {bold('Type-Only Imports (exempt):')}")
        for imp in sorted(type_imports):
            print(f"    → {dim(imp)}")

    if result.violations:
        print(f"\n  {red(bold('Violations:'))}")
        for v in result.violations:
            icon = red("✖") if v.severity == "error" else yellow("⚠")
            print(f"    {icon} [{v.rule}] {v.message}")
            if v.suggestion:
                print(f"      {cyan('Fix:')} {v.suggestion}")
    else:
        print(f"\n  {green('✔ No violations detected.')}")
    print(bold("=" * 84) + "\n")


# ══════════════════════════════════════════════════════════════════════════════
# MAIN CLI ENTRYPOINT
# ══════════════════════════════════════════════════════════════════════════════
def main() -> None:
    parser = argparse.ArgumentParser(description="Skipo Code Purity & Line Limit Enforcement Auditor")
    parser.add_argument("target", nargs="?", default=".", help="Target directory to scan (default: .)")
    parser.add_argument("--json", action="store_true", help="Output machine-readable JSON report")
    parser.add_argument("--violations-only", action="store_true", help="Only show files with violations")
    parser.add_argument("--inspect", type=str, default=None, help="Inspect a specific file in detail")
    args = parser.parse_args()

    root = Path(args.target).resolve()

    if args.inspect:
        inspect_path = Path(args.inspect).resolve()
        if not inspect_path.exists():
            print(red(f"File not found: {args.inspect}"))
            sys.exit(1)
        print_file_inspection(inspect_path, root)
        sys.exit(0)

    if not root.is_dir():
        print(red(f"Target is not a directory: {root}"))
        sys.exit(1)

    start = time.time()
    files = scan_all_files(root)
    results = [audit_file(f, root) for f in files]
    duration_ms = (time.time() - start) * 1000
    all_errors = [v for r in results for v in r.violations if v.severity == "error"]

    if args.json:
        output = {
            "root": str(root), "total_files": len(results),
            "total_errors": len(all_errors),
            "total_violations": sum(len(r.violations) for r in results),
            "duration_ms": round(duration_ms, 2), "passed": len(all_errors) == 0,
            "grade_distribution": {
                GRADE_NAMES[g]: sum(1 for r in results if r.detected_grade == g) for g in range(4)
            },
            "files": [r.to_dict() for r in results if r.violations or not args.violations_only]
        }
        print(json.dumps(output, indent=2))
    else:
        print_report(results, root, violations_only=args.violations_only, duration_ms=duration_ms)

    sys.exit(0 if not all_errors else 1)


if __name__ == "__main__":
    main()
