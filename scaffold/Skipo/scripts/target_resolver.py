#!/usr/bin/env python3
"""
target_resolver.py - AST and semantic source target resolver for Skipo Builder.
Does NOT rely on raw line numbers.
Resolves targets semantically by:
- file
- symbol (function, class, variable declaration)
- property (object property inside symbol or top-level)
- section (named logical section or marker)
- anchor (insert point within AST/block, e.g. 'children', 'start', 'end')
- nodeType ('jsx-element', 'object-literal', 'import-block', 'interface')
"""

from __future__ import annotations
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import re

@dataclass
class TargetSpec:
    file: str
    symbol: Optional[str] = None
    property: Optional[str] = None
    section: Optional[str] = None
    anchor: Optional[str] = None
    node_type: Optional[str] = None
    key: Optional[str] = None

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> TargetSpec:
        return cls(
            file=data.get("file", ""),
            symbol=data.get("symbol"),
            property=data.get("property"),
            section=data.get("section"),
            anchor=data.get("anchor"),
            node_type=data.get("nodeType") or data.get("node_type"),
            key=data.get("key"),
        )

@dataclass
class ResolvedTarget:
    found: bool
    file_path: Path
    start_char: int
    end_char: int
    matched_text: str
    target_spec: TargetSpec
    insertion_point: int
    reason: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "found": self.found,
            "filePath": str(self.file_path),
            "startChar": self.start_char,
            "endChar": self.end_char,
            "targetSpec": asdict(self.target_spec),
            "reason": self.reason
        }

def find_balanced_closing(content: str, start_index: int, open_ch: str = '{', close_ch: str = '}') -> int:
    """Finds matching closing character taking nested blocks and string escapes into account."""
    depth = 0
    in_string = False
    quote_char = ''
    i = start_index

    while i < len(content):
        c = content[i]
        prev = content[i - 1] if i > 0 else ''

        if in_string:
            if c == quote_char and prev != '\\':
                in_string = False
            i += 1
            continue

        if c in ("'", '"', '`'):
            in_string = True
            quote_char = c
            i += 1
            continue

        if c == open_ch:
            depth += 1
        elif c == close_ch:
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return -1

class SemanticTargetResolver:
    """Resolves stable semantic targets in TypeScript and JSX files without line numbers."""

    def __init__(self, project_root: Path):
        self.project_root = project_root

    def resolve(self, target: TargetSpec | Dict[str, Any]) -> ResolvedTarget:
        spec = target if isinstance(target, TargetSpec) else TargetSpec.from_dict(target)
        file_path = (self.project_root / spec.file).resolve()

        if not file_path.exists():
            return ResolvedTarget(
                found=False,
                file_path=file_path,
                start_char=-1,
                end_char=-1,
                matched_text="",
                target_spec=spec,
                insertion_point=-1,
                reason=f"Target file does not exist: {spec.file}"
            )

        content = file_path.read_text(encoding="utf-8")

        # 1. Marker-based resolution: // SKIPO:TARGET <section>
        if spec.section:
            marker_pattern = rf"//\s*SKIPO:TARGET\s+{re.escape(spec.section)}\b"
            m = re.search(marker_pattern, content)
            if m:
                end_marker = rf"//\s*SKIPO:END\s+{re.escape(spec.section)}\b"
                em = re.search(end_marker, content[m.end():])
                end_pos = m.end() + em.start() if em else m.end()
                return ResolvedTarget(
                    found=True,
                    file_path=file_path,
                    start_char=m.start(),
                    end_char=end_pos,
                    matched_text=content[m.start():end_pos],
                    target_spec=spec,
                    insertion_point=m.end()
                )

        # 2. Backend property resolution (e.g. symbol='SkipoBackend' or property='services')
        if spec.property:
            # Look for property: { ... }
            prop_pattern = rf"(?:export\s+const\s+{re.escape(spec.property)}\s*=\s*\{{)|(?:{re.escape(spec.property)}\s*:\s*\{{)"
            m = re.search(prop_pattern, content)
            if m:
                open_brace_idx = m.end() - 1
                close_brace_idx = find_balanced_closing(content, open_brace_idx, '{', '}')
                if close_brace_idx != -1:
                    # Insertion point is right before close_brace
                    insert_pt = close_brace_idx
                    # If property already contains key, verify existing target
                    existing_key = False
                    if spec.key:
                        block_content = content[open_brace_idx:close_brace_idx]
                        if re.search(rf"\b{re.escape(spec.key)}\s*:", block_content):
                            existing_key = True
                    return ResolvedTarget(
                        found=True,
                        file_path=file_path,
                        start_char=m.start(),
                        end_char=close_brace_idx + 1,
                        matched_text=content[m.start():close_brace_idx + 1],
                        target_spec=spec,
                        insertion_point=insert_pt,
                        reason="Property already contains key" if existing_key else None
                    )

        # 3. Frontend App JSX main-content or children resolution
        if spec.symbol in ("App", "AppShell") or spec.section in ("main-content", "children", "header", "footer"):
            # Check for <AppShell ...> or <BaseCard ...> or <InfiniteCanvas
            if spec.section in ("main-content", "children"):
                card_m = re.search(r"<BaseCard[^>]*>([\s\S]*?)</BaseCard>", content)
                if card_m:
                    return ResolvedTarget(
                        found=True,
                        file_path=file_path,
                        start_char=card_m.start(),
                        end_char=card_m.end(),
                        matched_text=card_m.group(0),
                        target_spec=spec,
                        insertion_point=card_m.start(1)
                    )
                app_shell_m = re.search(r"<AppShell[^>]*>([\s\S]*?)</AppShell>", content)
                if app_shell_m:
                    return ResolvedTarget(
                        found=True,
                        file_path=file_path,
                        start_char=app_shell_m.start(),
                        end_char=app_shell_m.end(),
                        matched_text=app_shell_m.group(0),
                        target_spec=spec,
                        insertion_point=app_shell_m.start(1)
                    )

            if spec.section == "header":
                header_m = re.search(r"header=\{([\s\S]*?)\}", content)
                if header_m:
                    return ResolvedTarget(
                        found=True,
                        file_path=file_path,
                        start_char=header_m.start(),
                        end_char=header_m.end(),
                        matched_text=header_m.group(0),
                        target_spec=spec,
                        insertion_point=header_m.start(1)
                    )

            if spec.section == "footer":
                footer_m = re.search(r"footer=\{([\s\S]*?)\}", content)
                if footer_m:
                    return ResolvedTarget(
                        found=True,
                        file_path=file_path,
                        start_char=footer_m.start(),
                        end_char=footer_m.end(),
                        matched_text=footer_m.group(0),
                        target_spec=spec,
                        insertion_point=footer_m.start(1)
                    )

        # 4. Fallback symbol function/class resolution
        if spec.symbol:
            sym_pattern = rf"(?:export\s+(?:function|const|class)\s+{re.escape(spec.symbol)}\b)"
            m = re.search(sym_pattern, content)
            if m:
                # Find start of body
                body_start = content.find('{', m.end())
                if body_start != -1:
                    body_end = find_balanced_closing(content, body_start, '{', '}')
                    return ResolvedTarget(
                        found=True,
                        file_path=file_path,
                        start_char=m.start(),
                        end_char=body_end + 1 if body_end != -1 else len(content),
                        matched_text=content[m.start():body_end + 1] if body_end != -1 else content[m.start():],
                        target_spec=spec,
                        insertion_point=body_start + 1
                    )

        return ResolvedTarget(
            found=False,
            file_path=file_path,
            start_char=-1,
            end_char=-1,
            matched_text="",
            target_spec=spec,
            insertion_point=-1,
            reason=f"Could not semantically resolve target: {spec}"
        )
