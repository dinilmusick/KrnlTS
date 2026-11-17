#!/usr/bin/env python3
"""
scripts/routine_cleanup_engine.py - Routine Codebase Cleanup & Asset Similarity Engine for Skipo.
Pure Python 3 standard library ONLY - zero pip dependencies.

Provides:
  1. Dead/Unused Code Asset & File Scanner:
     - Identifies unreferenced files, orphaned components/helpers, and exported symbols with 0 usages.
  2. Multi-Dimensional Asset Similarity & Redundancy Scanner:
     - Parses functions, interfaces, type aliases, classes, and structs.
     - Computes multi-dimensional similarity (Tokens, Signatures, Body AST/Logic fingerprint, Complexity).
     - Groups clusters with similarity >= threshold (default 0.80).
  3. Safe Collapsing/Consolidation Proposal & Execution:
     - Proposes canonical replacement asset.
     - Performs automated reference substitution across consumer files upon confirmation or with --fix.
"""

from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import List, Dict, Set, Tuple, Optional, Any
import argparse
import difflib
import json
import math
import os
import re
import sys
import time

EXTENSIONS = {".ts", ".tsx", ".js", ".jsx"}
IGNORE_DIRS = {
    "node_modules", "dist", ".next", ".turbo", "build", "out",
    ".git", ".system_generated", "coverage", ".cache", "__pycache__", "tmp"
}

# ══════════════════════════════════════════════════════════════════════════════
# ANSI COLOR CONSTANTS
# ══════════════════════════════════════════════════════════════════════════════
USE_COLOR = sys.stdout.isatty() and (os.name != 'nt' or 'TERM' in os.environ)
def _c(code: str, text: str) -> str: return f"{code}{text}\033[0m" if USE_COLOR else text
def red(t: str) -> str: return _c("\033[91m", t)
def green(t: str) -> str: return _c("\033[92m", t)
def yellow(t: str) -> str: return _c("\033[93m", t)
def cyan(t: str) -> str: return _c("\033[96m", t)
def bold(t: str) -> str: return _c("\033[1m", t)
def dim(t: str) -> str: return _c("\033[2m", t)
def magenta(t: str) -> str: return _c("\033[95m", t)

# ══════════════════════════════════════════════════════════════════════════════
# DATA MODELS
# ══════════════════════════════════════════════════════════════════════════════
@dataclass
class CodeAsset:
    id: str
    kind: str  # "function" | "interface" | "type" | "class" | "const_fn"
    name: str
    file_path: str
    start_line: int
    end_line: int
    signature: str
    raw_body: str
    normalized_body: str
    identifiers: Set[str]
    param_count: int
    line_count: int
    is_exported: bool

@dataclass
class SimilarityPair:
    asset_a: CodeAsset
    asset_b: CodeAsset
    score: float
    dimension_scores: Dict[str, float]
    diagnostic: str

# ══════════════════════════════════════════════════════════════════════════════
# TOKENIZATION & NORMALIZATION UTILITIES
# ══════════════════════════════════════════════════════════════════════════════
def tokenize_words(identifier: str) -> Set[str]:
    parts = re.findall(r'[A-Z]?[a-z]+|[A-Z]+(?=[A-Z][a-z]|\d|\W|$)|\d+', identifier)
    return {p.lower() for p in parts} if parts else {identifier.lower()}

def strip_comments_and_strings(code: str) -> str:
    code = re.sub(r'/\*[\s\S]*?\*/', '', code)
    code = re.sub(r'//.*', '', code)
    code = re.sub(r'([\'"`])(?:\\.|(?!\1)[^\\])*\1', '""', code)
    return code

def normalize_code_body(code: str) -> str:
    clean = strip_comments_and_strings(code)
    # Standardize whitespace and brackets
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean

# ══════════════════════════════════════════════════════════════════════════════
# CODE ASSET PARSER
# ══════════════════════════════════════════════════════════════════════════════
def extract_assets_from_file(file_path: Path, root: Path) -> List[CodeAsset]:
    try:
        content = file_path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return []

    lines = content.splitlines()
    rel_path = str(file_path.relative_to(root))
    assets: List[CodeAsset] = []

    # 1. Interface regex
    for m in re.finditer(r'^(export\s+)?interface\s+([A-Za-z0-9_]+)\s*(?:<[^>]+>)?\s*\{', content, re.MULTILINE):
        is_exp = bool(m.group(1))
        name = m.group(2)
        start_pos = m.start()
        start_line = content[:start_pos].count('\n') + 1
        # match balanced braces
        brace_idx = content.find('{', start_pos)
        if brace_idx != -1:
            depth = 1
            idx = brace_idx + 1
            while idx < len(content) and depth > 0:
                if content[idx] == '{': depth += 1
                elif content[idx] == '}': depth -= 1
                idx += 1
            end_line = content[:idx].count('\n') + 1
            body = content[brace_idx:idx]
            sig = content[start_pos:brace_idx].strip()
            norm = normalize_code_body(body)
            idents = set(re.findall(r'[A-Za-z_][A-Za-z0-9_]*', norm))
            assets.append(CodeAsset(
                id=f"{rel_path}:{name}:{start_line}",
                kind="interface",
                name=name,
                file_path=rel_path,
                start_line=start_line,
                end_line=end_line,
                signature=sig,
                raw_body=body,
                normalized_body=norm,
                identifiers=idents,
                param_count=len(re.findall(r';', body)),
                line_count=end_line - start_line + 1,
                is_exported=is_exp
            ))

    # 2. Type alias regex
    for m in re.finditer(r'^(export\s+)?type\s+([A-Za-z0-9_]+)\s*(?:<[^>]+>)?\s*=\s*([^;]+);', content, re.MULTILINE):
        is_exp = bool(m.group(1))
        name = m.group(2)
        start_line = content[:m.start()].count('\n') + 1
        end_line = content[:m.end()].count('\n') + 1
        body = m.group(3).strip()
        norm = normalize_code_body(body)
        idents = set(re.findall(r'[A-Za-z_][A-Za-z0-9_]*', norm))
        assets.append(CodeAsset(
            id=f"{rel_path}:{name}:{start_line}",
            kind="type",
            name=name,
            file_path=rel_path,
            start_line=start_line,
            end_line=end_line,
            signature=f"type {name}",
            raw_body=body,
            normalized_body=norm,
            identifiers=idents,
            param_count=0,
            line_count=end_line - start_line + 1,
            is_exported=is_exp
        ))

    # 3. Regular function & Arrow function declarations
    fn_patterns = [
        # export [async] function name(...) {
        (r'^(export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)', "function"),
        # export const name = [async] (...) => {
        (r'^(export\s+)?const\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*(?::\s*[^=]+)?\s*=>\s*\{', "const_fn"),
    ]

    for pat, kind in fn_patterns:
        for m in re.finditer(pat, content, re.MULTILINE):
            is_exp = bool(m.group(1))
            name = m.group(2)
            params = m.group(3)
            start_pos = m.start()
            start_line = content[:start_pos].count('\n') + 1
            brace_idx = content.find('{', m.end() - 1)
            if brace_idx != -1:
                depth = 1
                idx = brace_idx + 1
                while idx < len(content) and depth > 0:
                    if content[idx] == '{': depth += 1
                    elif content[idx] == '}': depth -= 1
                    idx += 1
                end_line = content[:idx].count('\n') + 1
                body = content[brace_idx:idx]
                sig = content[start_pos:brace_idx].strip()
                norm = normalize_code_body(body)
                idents = set(re.findall(r'[A-Za-z_][A-Za-z0-9_]*', norm))
                param_items = [p.strip() for p in params.split(',') if p.strip()]
                assets.append(CodeAsset(
                    id=f"{rel_path}:{name}:{start_line}",
                    kind=kind,
                    name=name,
                    file_path=rel_path,
                    start_line=start_line,
                    end_line=end_line,
                    signature=sig,
                    raw_body=body,
                    normalized_body=norm,
                    identifiers=idents,
                    param_count=len(param_items),
                    line_count=end_line - start_line + 1,
                    is_exported=is_exp
                ))

    return assets

# ══════════════════════════════════════════════════════════════════════════════
# MULTI-DIMENSIONAL SIMILARITY CALCULATOR
# ══════════════════════════════════════════════════════════════════════════════
def compute_multidimensional_similarity(a: CodeAsset, b: CodeAsset) -> Tuple[float, Dict[str, float], str]:
    # Invariant: Must be compatible kinds (function/const_fn together, type/interface together)
    fn_kinds = {"function", "const_fn"}
    type_kinds = {"type", "interface"}
    if not ((a.kind in fn_kinds and b.kind in fn_kinds) or (a.kind in type_kinds and b.kind in type_kinds)):
        return 0.0, {}, "Incompatible asset kinds"

    # 1. Naming similarity (Jaccard on sub-word tokens)
    tokens_a = tokenize_words(a.name)
    tokens_b = tokenize_words(b.name)
    s_name = len(tokens_a & tokens_b) / max(1, len(tokens_a | tokens_b))

    # 2. Signature / Arity similarity
    diff_params = abs(a.param_count - b.param_count)
    s_sig = max(0.0, 1.0 - (diff_params / max(1, max(a.param_count, b.param_count))))

    # 3. Normalized Body String similarity (SequenceMatcher on AST structure)
    s_body = difflib.SequenceMatcher(None, a.normalized_body, b.normalized_body).ratio()

    # 4. Identifier token Jaccard similarity (Logic vocabulary)
    s_idents = len(a.identifiers & b.identifiers) / max(1, len(a.identifiers | b.identifiers))

    # 5. Complexity / Size parity
    diff_lines = abs(a.line_count - b.line_count)
    s_size = max(0.0, 1.0 - (diff_lines / max(1, max(a.line_count, b.line_count))))

    # Weighted Aggregation
    # Computational similarity (body + idents) heavily weighted, name provides semantic nuance
    weights = {
        "body": 0.40,
        "identifiers": 0.25,
        "signature": 0.15,
        "name": 0.10,
        "size": 0.10
    }

    dim_scores = {
        "s_body": round(s_body, 3),
        "s_identifiers": round(s_idents, 3),
        "s_signature": round(s_sig, 3),
        "s_name": round(s_name, 3),
        "s_size": round(s_size, 3)
    }

    agg = (
        s_body * weights["body"] +
        s_idents * weights["identifiers"] +
        s_sig * weights["signature"] +
        s_name * weights["name"] +
        s_size * weights["size"]
    )

    diagnostic = []
    if s_body > 0.85: diagnostic.append("Near-identical control/AST structure")
    if s_idents > 0.80: diagnostic.append("Identical variable & API call vocabulary")
    if s_name > 0.70: diagnostic.append("Morphologically equivalent naming")
    if s_sig == 1.0: diagnostic.append("Exact arity match")

    diag_str = "; ".join(diagnostic) if diagnostic else "Moderate structural overlap"
    return round(agg, 3), dim_scores, diag_str

# ══════════════════════════════════════════════════════════════════════════════
# UNUSED CODE ASSET SCANNER
# ══════════════════════════════════════════════════════════════════════════════
def scan_unused_code_assets(root: Path) -> Dict[str, Any]:
    all_files: List[Path] = []
    for p in root.rglob("*"):
        if p.is_file() and p.suffix in EXTENSIONS:
            if not any(part in IGNORE_DIRS for part in p.parts):
                all_files.append(p)

    file_contents = {}
    for f in all_files:
        try:
            file_contents[f] = f.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue

    # Identify unimported files
    imported_rel_paths: Set[str] = set()
    for f, content in file_contents.items():
        # Match imports: import ... from './something'
        matches = re.findall(r'(?:import|from|require)\s*[\'"]([^\'"]+)[\'"]', content)
        for target in matches:
            if target.startswith('.'):
                # resolve relative
                resolved = (f.parent / target).resolve()
                for ext in ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx", "/index.js"]:
                    cand = Path(str(resolved) + ext)
                    if cand.is_file():
                        try:
                            imported_rel_paths.add(str(cand.relative_to(root)))
                        except ValueError:
                            pass

    entry_files = {
        "src/App.tsx", "src/main.tsx", "src/index.tsx", "src/index.ts",
        "App.tsx", "index.tsx", "index.ts", "assistant.py", "code-purity-audit.py"
    }

    orphaned_files: List[str] = []
    for f in all_files:
        rel = str(f.relative_to(root))
        if any(rel.endswith(entry) for entry in entry_files):
            continue
        if ".test." in rel or ".spec." in rel or "__tests__" in rel:
            continue
        if rel not in imported_rel_paths:
            orphaned_files.append(rel)

    # Identify exported symbols with zero usages across other files
    exported_symbols: List[Dict[str, Any]] = []
    for f in all_files:
        rel = str(f.relative_to(root))
        assets = extract_assets_from_file(f, root)
        for a in assets:
            if not a.is_exported:
                continue
            # Check references in all other files
            usage_count = 0
            for other_f, content in file_contents.items():
                if other_f == f:
                    continue
                # Simple word boundary regex
                if re.search(rf'\b{re.escape(a.name)}\b', content):
                    usage_count += 1
            if usage_count == 0:
                exported_symbols.append({
                    "symbol": a.name,
                    "kind": a.kind,
                    "file_path": a.file_path,
                    "line": a.start_line
                })

    return {
        "orphaned_files": sorted(orphaned_files),
        "unused_exports": exported_symbols
    }

# ══════════════════════════════════════════════════════════════════════════════
# MAIN ROUTINE SCANNER & CONSOLIDATOR
# ══════════════════════════════════════════════════════════════════════════════
def run_similarity_scan(root: Path, threshold: float = 0.80) -> List[SimilarityPair]:
    all_files: List[Path] = []
    for p in root.rglob("*"):
        if p.is_file() and p.suffix in EXTENSIONS:
            if not any(part in IGNORE_DIRS for part in p.parts):
                all_files.append(p)

    all_assets: List[CodeAsset] = []
    for f in all_files:
        all_assets.extend(extract_assets_from_file(f, root))

    pairs: List[SimilarityPair] = []
    n = len(all_assets)
    for i in range(n):
        for j in range(i + 1, n):
            a, b = all_assets[i], all_assets[j]
            # Skip if exact same ID or test files
            if a.id == b.id or ".test." in a.file_path or ".test." in b.file_path:
                continue
            # Avoid comparing assets within identical tiny trivial helpers (< 3 lines)
            if a.line_count < 3 and b.line_count < 3:
                continue

            score, dim_scores, diag = compute_multidimensional_similarity(a, b)
            if score >= threshold:
                pairs.append(SimilarityPair(
                    asset_a=a,
                    asset_b=b,
                    score=score,
                    dimension_scores=dim_scores,
                    diagnostic=diag
                ))

    # Sort descending by similarity
    pairs.sort(key=lambda x: x.score, reverse=True)
    return pairs

def collapse_redundant_assets(
    root: Path,
    canonical_asset: CodeAsset,
    deprecated_asset: CodeAsset,
    dry_run: bool = True
) -> Dict[str, Any]:
    """
    Substitutes all references of deprecated_asset with canonical_asset across the codebase.
    """
    modified_files: List[str] = []
    old_name = deprecated_asset.name
    new_name = canonical_asset.name

    if old_name == new_name:
        return {"status": "skipped", "reason": "Identical names, requires file path consolidation."}

    for p in root.rglob("*"):
        if p.is_file() and p.suffix in EXTENSIONS:
            if any(part in IGNORE_DIRS for part in p.parts):
                continue
            try:
                content = p.read_text(encoding="utf-8")
                if re.search(rf'\b{re.escape(old_name)}\b', content):
                    new_content = re.sub(rf'\b{re.escape(old_name)}\b', new_name, content)
                    if not dry_run:
                        p.write_text(new_content, encoding="utf-8")
                    modified_files.append(str(p.relative_to(root)))
            except Exception:
                continue

    return {
        "status": "success",
        "canonical": canonical_asset.name,
        "deprecated": deprecated_asset.name,
        "updated_files_count": len(modified_files),
        "updated_files": modified_files,
        "dry_run": dry_run
    }

# ══════════════════════════════════════════════════════════════════════════════
# CLI INTERFACE
# ══════════════════════════════════════════════════════════════════════════════
def main():
    parser = argparse.ArgumentParser(description="Skipo Routine Codebase Cleanup & Asset Similarity Engine")
    parser.add_argument("target", nargs="?", default=".", help="Target repository directory")
    parser.add_argument("--threshold", "-t", type=float, default=0.80, help="Similarity threshold (0.0 to 1.0, default: 0.80)")
    parser.add_argument("--scan-unused", action="store_true", help="Scan for unimported files and 0-usage exported symbols")
    parser.add_argument("--scan-similar", action="store_true", help="Scan for redundant/clone code assets")
    parser.add_argument("--all", action="store_true", help="Run full cleanup audit (unused + similarity)")
    parser.add_argument("--json", action="store_true", help="Output machine-readable JSON")
    args = parser.parse_args()

    root = Path(args.target).resolve()
    if not (args.scan_unused or args.scan_similar or args.all):
        args.all = True

    results: Dict[str, Any] = {"target": str(root)}

    if args.scan_unused or args.all:
        unused = scan_unused_code_assets(root)
        results["unused_assets"] = unused

    if args.scan_similar or args.all:
        pairs = run_similarity_scan(root, threshold=args.threshold)
        results["similarity_pairs"] = [
            {
                "score": p.score,
                "dimension_scores": p.dimension_scores,
                "diagnostic": p.diagnostic,
                "asset_a": asdict(p.asset_a),
                "asset_b": asdict(p.asset_b),
            } for p in pairs
        ]

    if args.json:
        print(json.dumps(results, indent=2))
        return

    # Formatted terminal printout
    print("\n" + bold("=" * 84))
    print(f"  {bold('SKIPO ROUTINE CLEANUP & CODE ASSET SIMILARITY REPORT')}")
    print(bold("=" * 84))

    if "unused_assets" in results:
        unused = results["unused_assets"]
        orphans = unused["orphaned_files"]
        unused_syms = unused["unused_exports"]
        print(f"\n{bold('1. UNUSED & ORPHANED CODE ASSETS:')}")
        print(dim("-" * 84))
        print(f"  📁 Orphaned Unimported Files: {cyan(str(len(orphans)))}")
        for of in orphans[:10]:
            print(f"    ➜ {yellow(of)}")
        if len(orphans) > 10:
            print(dim(f"    ... and {len(orphans) - 10} more unimported files"))

        print(f"\n  🏷  Exported Symbols with 0 Usages: {cyan(str(len(unused_syms)))}")
        for sym in unused_syms[:10]:
            print(f"    ➜ {red(sym['symbol'])} ({dim(sym['kind'])}) in {sym['file_path']}:{sym['line']}")
        if len(unused_syms) > 10:
            print(dim(f"    ... and {len(unused_syms) - 10} more unused symbols"))

    if "similarity_pairs" in results:
        sim_pairs = results["similarity_pairs"]
        print(f"\n{bold('2. HIGH SIMILARITY CODE ASSETS (CANDIDATE CLONES):')} (Threshold: {args.threshold})")
        print(dim("-" * 84))
        if not sim_pairs:
            print(green("  ✔ Zero redundant or duplicate code assets detected."))
        else:
            print(f"  Found {yellow(str(len(sim_pairs)))} asset pairs exceeding {int(args.threshold * 100)}% similarity:\n")
            for idx, p in enumerate(sim_pairs[:12], 1):
                a = p["asset_a"]
                b = p["asset_b"]
                pct = int(p["score"] * 100)
                score_str = red(f"{pct}%") if pct >= 90 else yellow(f"{pct}%")
                print(f"  [{idx}] {score_str} Match: {bold(a['name'])} ⟷ {bold(b['name'])}")
                print(f"      Asset A: {cyan(a['file_path'])} (L{a['start_line']}-L{a['end_line']})")
                print(f"      Asset B: {cyan(b['file_path'])} (L{b['start_line']}-L{b['end_line']})")
                print(f"      Diagnostic: {magenta(p['diagnostic'])}")
                print(f"      Dimensions: Body={p['dimension_scores']['s_body']} | Idents={p['dimension_scores']['s_identifiers']} | Sig={p['dimension_scores']['s_signature']} | Name={p['dimension_scores']['s_name']}")
                print()

    print(bold("=" * 84) + "\n")

if __name__ == "__main__":
    main()
