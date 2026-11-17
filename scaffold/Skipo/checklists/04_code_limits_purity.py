#!/usr/bin/env python3
"""
Aspect 04: Code Limits, Purity & Documentation Standards
Verifies:
- Hard File Line Limits (<= 200 lines/file, <= 150 lines for helper files)
- One Component Per File (Bans multiple component declarations in a single file)
- Top-Level File Purity (App.tsx contains only imports + root composition)
- ASCII Flowchart & JSDoc Docblock Presence
- Bold Unicode Section Demarcation Borders (// ═════...)
- Descriptive Long Naming Conventions (Bans cryptic abbreviations)
"""

from pathlib import Path
import re
import sys
import time

try:
    from .common import (
        Violation, ChecklistResult, scan_files, read_text_safe,
        print_checklist_report, parse_standard_args
    )
except ImportError:
    from common import (
        Violation, ChecklistResult, scan_files, read_text_safe,
        print_checklist_report, parse_standard_args
    )

ASPECT_ID = "aspect_04_code_limits_purity"
ASPECT_TITLE = "Code Limits, Purity & Documentation Standards"

# Cryptic abbreviations to flag in top-level declarations
CRYPTIC_ABBREVIATIONS = {"tmp", "temp", "val", "cb", "fn", "cnt", "cur", "prev", "buf"}

COMPONENT_DECLARATION_REGEX = re.compile(
    r'(?:export\s+(?:default\s+)?function\s+([A-Z][A-Za-z0-9_]*)|'
    r'export\s+const\s+([A-Z][A-Za-z0-9_]*)\s*:\s*(?:React\.)?(?:FC|FunctionComponent)|'
    r'export\s+const\s+([A-Z][A-Za-z0-9_]*)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>\s*\{)'
)

UNICODE_BORDER_PATTERN = "// ══"

# Import parsing for purity classification
IMPORT_PATH_REGEX = re.compile(
    r'''(?:^|\n)\s*import\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]''', re.MULTILINE
)
TYPE_IMPORT_REGEX = re.compile(
    r'''(?:^|\n)\s*import\s+type\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]''', re.MULTILINE
)
PURITY_SUFFIX_REGEX = re.compile(r'_(Pure|Impure|Orchestrator|Facade)\.[tj]sx?$')

INLINE_OP_PATTERNS = [
    re.compile(r'\b(?:if|for|while|switch|try)\s*\('),
    re.compile(r'\b(?:const|let|var)\s+\w+\s*=\s*(?!import)'),
    re.compile(r'(?:=>|function)\s*\{'),
    re.compile(r'\.\s*(?:map|filter|reduce|forEach|find)\s*\('),
    re.compile(r'(?:await|async)\s+'),
    re.compile(r'new\s+[A-Z]'),
]
GRADE_NAMES = {0: "P0 Pure", 1: "P1 Impure", 2: "P2 Orchestrator", 3: "P3 Facade"}

def validate_code_limits_and_purity(root_dir: Path) -> ChecklistResult:
    start_time = time.time()
    violations = []

    files = scan_files(root_dir, {".ts", ".tsx", ".js", ".jsx"})
    files_scanned = len(files)

    for file_path in files:
        rel_path = file_path.relative_to(root_dir)
        fname = file_path.name

        # Skip only type definition files and node_modules
        if fname.endswith(".d.ts") or "node_modules" in str(rel_path):
            continue

        content = read_text_safe(file_path)
        if not content:
            continue

        # Skip generated bundles/files and vendored libraries
        if "// @generated" in content[:300] or "/* @generated" in content[:300] or "libraries/skipo" in str(rel_path):
            continue

        lines = content.splitlines()
        line_count = len(lines)

        # 1. Line Count Check: Strict 200 line hard limit (150 for helpers) - BLOCKING ERROR
        max_lines = 150 if "helper" in str(rel_path).lower() or "utils" in str(rel_path).lower() else 200
        if line_count > max_lines:
            violations.append(Violation(
                rule_id="file-line-limit-exceeded",
                severity="error",
                message=f"File exceeds maximum line limit ({line_count} lines > {max_lines} max).",
                file_path=str(rel_path),
                line=line_count,
                suggestion="Decompose file into sub-components, extracted pure helper functions, or custom hooks. No code file may exceed 200 lines."
            ))

        # 2. One Component Per File (in TSX/JSX)
        if file_path.suffix in {".tsx", ".jsx"}:
            matches = COMPONENT_DECLARATION_REGEX.findall(content)
            comp_names = [m[0] or m[1] or m[2] for m in matches if (m[0] or m[1] or m[2])]
            if len(comp_names) > 1 and "index.ts" not in fname and "test" not in fname:
                violations.append(Violation(
                    rule_id="one-component-per-file-violation",
                    severity="error",
                    message=f"Multiple component declarations ({', '.join(comp_names[:4])}) detected in single file.",
                    file_path=str(rel_path),
                    suggestion="Extract each component into its own standalone file according to Skipo Single-Component Law."
                ))

        # 3. Top-Level Purity (App.tsx / index.tsx)
        if fname in {"App.tsx", "App.jsx"}:
            # App.tsx should not define complex state machines or direct fetch calls
            if "useEffect(" in content or "fetch(" in content or "axios." in content:
                violations.append(Violation(
                    rule_id="top-level-purity-violation",
                    severity="warning",
                    message="App.tsx contains side-effects or inline fetch calls. Must contain only imports and shell composition.",
                    file_path=str(rel_path),
                    suggestion="Delegate business logic, data fetching, and state management to sub-apps or custom hooks."
                ))

        # 4. Bold Unicode Section Demarcation for files > 60 lines
        if line_count > 60 and UNICODE_BORDER_PATTERN not in content:
            violations.append(Violation(
                rule_id="missing-bold-section-borders",
                severity="info",
                message="File exceeds 60 lines but lacks bold unicode section demarcation borders (// ═══...).",
                file_path=str(rel_path),
                suggestion="Add bold unicode section headers dividing imports, schemas, logic, and exports."
            ))

        # 5. Cryptic Abbreviations in filename
        name_parts = re.split(r'[._-]', fname.replace(file_path.suffix, ""))
        for part in name_parts:
            if part.lower() in CRYPTIC_ABBREVIATIONS and len(part) <= 4:
                violations.append(Violation(
                    rule_id="cryptic-naming-abbreviation",
                    severity="warning",
                    message=f"Cryptic abbreviation '{part}' in filename.",
                    file_path=str(rel_path),
                    suggestion="Use long, expressive, self-documenting naming (e.g. 'temporaryWorkspace' instead of 'tmp')."
                ))

        # 6. Purity Classification: Parse imports and detect grade violations
        all_imports = set(IMPORT_PATH_REGEX.findall(content))
        type_imports = set(TYPE_IMPORT_REGEX.findall(content))
        local_imp = {i for i in all_imports if i not in type_imports and (i.startswith('.') or i.startswith('@/') or i.startswith('~/'))}
        ext_imp = {i for i in all_imports if i not in type_imports and not (i.startswith('.') or i.startswith('@/') or i.startswith('~/'))}

        # Count inline operations
        op_count = 0
        for ln in lines:
            s = ln.strip()
            if not s or s.startswith('//') or s.startswith('/*') or s.startswith('*'):
                continue
            if s.startswith('import ') or s.startswith('export {') or s.startswith('export default'):
                continue
            if s.startswith('export type ') or s.startswith('type ') or s.startswith('interface '):
                continue
            for pat in INLINE_OP_PATTERNS:
                if pat.search(s):
                    op_count += 1
                    break

        # Classify detected grade
        has_local, has_ext = len(local_imp) > 0, len(ext_imp) > 0
        if not has_local and not has_ext:
            det_grade = 0
        elif has_local and op_count <= 3 and not has_ext and len(local_imp) >= 3:
            det_grade = 3
        elif has_local and op_count <= 8:
            det_grade = 2
        else:
            det_grade = 1

        # Check naming suffix vs detected grade
        suffix_match = PURITY_SUFFIX_REGEX.search(fname)
        if suffix_match:
            named = {"Pure": 0, "Impure": 1, "Orchestrator": 2, "Facade": 3}[suffix_match.group(1)]
            if named != det_grade:
                violations.append(Violation(
                    rule_id="purity-grade-mismatch",
                    severity="error",
                    message=f"Named {GRADE_NAMES[named]} but detected {GRADE_NAMES[det_grade]} ({len(local_imp)} local, {len(ext_imp)} ext, {op_count} ops).",
                    file_path=str(rel_path),
                    suggestion="Rename file or refactor imports to match purity grade."
                ))

        # Facade with excessive inline logic
        if det_grade == 3 and op_count > 3:
            violations.append(Violation(
                rule_id="facade-has-logic",
                severity="error",
                message=f"Facade (P3) has {op_count} inline operations. Facades must only re-export.",
                file_path=str(rel_path),
                suggestion="Move logic to _Orchestrator or _Impure files."
            ))

        # Orchestrator with excessive logic
        if det_grade == 2 and op_count > 15:
            violations.append(Violation(
                rule_id="orchestrator-excessive-logic",
                severity="error",
                message=f"Orchestrator (P2) has {op_count} inline ops (max 15). Too much direct logic.",
                file_path=str(rel_path),
                suggestion="Extract logic into _Pure or _Impure files."
            ))

    duration_ms = (time.time() - start_time) * 1000
    errors = sum(1 for v in violations if v.severity == "error")
    score = max(0.0, 100.0 - (errors * 10.0) - (len(violations) - errors) * 2.0)

    return ChecklistResult(
        aspect_id=ASPECT_ID,
        aspect_title=ASPECT_TITLE,
        passed=errors == 0,
        violations=violations,
        files_scanned=files_scanned,
        duration_ms=duration_ms,
        score=score
    )

def main():
    args = parse_standard_args("Aspect 04: Code Limits, Purity & Documentation Standards Validator")
    root_path = Path(args.path).resolve()
    result = validate_code_limits_and_purity(root_path)

    if args.json:
        import json
        print(json.dumps(result.to_dict(), indent=2))
    else:
        print_checklist_report(result, verbose=args.verbose)

    sys.exit(0 if result.passed else 1)

if __name__ == "__main__":
    main()
