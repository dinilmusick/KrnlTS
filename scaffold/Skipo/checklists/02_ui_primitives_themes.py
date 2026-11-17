#!/usr/bin/env python3
"""
Aspect 02: UI Component Primitives & Theme Token Semantics
Verifies:
- Zero-Custom-UI Mandate: Banned raw HTML controls (<button>, <input>, <select>, <textarea>, clickable <div onClick>)
- Standard @skipo/ui Primitives Usage (BaseButton, BaseInput, CredentialField, etc.)
- 100% Theme Token Semantics: Bans hardcoded colors (#hex, rgb(), hsl()) outside token definitions
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

ASPECT_ID = "aspect_02_ui_primitives_themes"
ASPECT_TITLE = "UI Component Primitives & Theme Token Semantics"

# Banned raw controls in application code (excluding primitive definition files)
RAW_CONTROL_PATTERNS = [
    (re.compile(r'<button\b', re.IGNORECASE), "Raw <button> is prohibited. Use @skipo/ui BaseButton or IconOnlyButton instead."),
    (re.compile(r'<input\b', re.IGNORECASE), "Raw <input> is prohibited. Use @skipo/ui BaseInput or CredentialField instead."),
    (re.compile(r'<select\b', re.IGNORECASE), "Raw <select> is prohibited. Use @skipo/ui BaseSelect instead."),
    (re.compile(r'<textarea\b', re.IGNORECASE), "Raw <textarea> is prohibited. Use @skipo/ui BaseTextarea instead."),
    (re.compile(r'<div[^>]*\bonClick\b', re.IGNORECASE), "Clickable <div onClick> is prohibited. Use @skipo/ui BaseButton with transparent variant.")
]

# Color patterns
HEX_COLOR_REGEX = re.compile(r'(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})\b')
RGB_COLOR_REGEX = re.compile(r'\b(rgb|rgba|hsl|hsla)\s*\([^\)]+\)')

BUTTON_BLOCK_REGEX = re.compile(r'<(?:button|BaseButton|BrutalistButton)\b(?:(?:"[^"]*"|\'[^\']*\'|\{[^{}]*\}|[^>"\']))*>\s*(.*?)\s*</(?:button|BaseButton|BrutalistButton)>', re.DOTALL | re.IGNORECASE)
ICON_TAG_REGEX = re.compile(r'<([A-Z][A-Za-z0-9]+)\b[^>]*(?:size=|className=|strokeWidth=|fill=)[^>]*\s*/?>')
REDUNDANT_SYMBOL_REGEX = re.compile(r'(?:[\'"`]|>)\s*([★☆✓✔✕✖\+])\s+[A-Za-z0-9]')

EXCLUDED_PRIMITIVE_FILES = {
    "BaseButton.tsx", "BaseInput.tsx", "BaseSelect.tsx", "BaseTextarea.tsx", "BaseToggle.tsx",
    "BaseBadge.tsx", "BaseCard.tsx", "CredentialField.tsx", "IconOnlyButton.tsx",
    "BrutalistButton.tsx", "BrutalistInput.tsx", "BrutalistSelect.tsx", "BaseIconButton.tsx",
    "theme.ts", "tokens.ts", "tokens.css", "globals.css", "palette.ts", "tailwind.config.js",
    "tailwind.config.ts", "SolidifyWidget.tsx", "CompatibleNodePicker.tsx", "CanvasContextMenu.tsx",
    "MovableSocketHandle.tsx", "NodeCard.tsx", "NodeGraphCanvas.tsx", "MovableSocketView.tsx",
    "ServiceButton.tsx", "ServiceInputField.tsx", "ServiceDropdown.tsx", "ServiceVideoPlayer.tsx",
    "ServiceAudioPlayer.tsx", "ServiceTextBanner.tsx", "ServiceImageContainer.tsx",
}

def validate_ui_and_themes(root_dir: Path) -> ChecklistResult:
    start_time = time.time()
    violations = []
    
    files = scan_files(root_dir, {".tsx", ".jsx", ".css"})
    files_scanned = len(files)

    for file_path in files:
        rel_path = file_path.relative_to(root_dir)
        fname = file_path.name
        
        # Skip UI primitive definitions and test suites
        if fname in EXCLUDED_PRIMITIVE_FILES or ".test." in fname or ".spec." in fname:
            continue
        if "packages/ui/src/components/base" in str(rel_path) or "packages/systems" in str(rel_path) or "libraries/skipo" in str(rel_path):
            continue

        content = read_text_safe(file_path)
        if not content:
            continue

        lines = content.splitlines()

        # Check raw controls (only in TSX/JSX)
        if file_path.suffix in {".tsx", ".jsx"}:
            for line_idx, line in enumerate(lines, 1):
                trimmed = line.strip()
                if trimmed.startswith("//") or trimmed.startswith("/*"):
                    continue
                for pattern, msg in RAW_CONTROL_PATTERNS:
                    if pattern.search(line):
                        violations.append(Violation(
                            rule_id="banned-raw-html-control", severity="error", message=msg,
                            file_path=str(rel_path), line=line_idx, snippet=trimmed[:100],
                            suggestion="Import standard @skipo/ui component primitives."
                        ))

            for m in BUTTON_BLOCK_REGEX.finditer(content):
                b_body, line_no = m.group(1), content[:m.start()].count('\n') + 1
                icons, sym = ICON_TAG_REGEX.findall(b_body), REDUNDANT_SYMBOL_REGEX.search(b_body)
                if icons and sym:
                    violations.append(Violation(
                        rule_id="duplicate-button-icon-anti-pattern", severity="error",
                        message=f"Button displays duplicate icons: <{icons[0]}> paired with redundant text symbol '{sym.group(1)}'.",
                        file_path=str(rel_path), line=line_no, snippet=b_body.strip().splitlines()[0][:100],
                        suggestion="Remove redundant symbol glyphs (e.g. '+', '★', '✓') when an icon component is present."
                    ))
                elif len(icons) > 1 and ("?" not in b_body or ":" not in b_body):
                    violations.append(Violation(
                        rule_id="duplicate-button-icon-anti-pattern", severity="error",
                        message=f"Button renders multiple unconditional icon components ({', '.join(icons[:2])}).",
                        file_path=str(rel_path), line=line_no, snippet=b_body.strip().splitlines()[0][:100],
                        suggestion="Ensure buttons contain at most one icon component for a singular action."
                    ))
                txt_only = re.sub(r'\{[^{}]*\}', ' ', re.sub(r'<[^>]+>', ' ', b_body)).strip()
                if not any(k in txt_only for k in ['=>', 'const ', 'return ', ';', '{']):
                    words = [w for w in txt_only.split() if re.search(r'^[a-zA-Z0-9]+$', w)]
                    if len(words) > 4:
                        violations.append(Violation(
                            rule_id="ui-text-label-exceeds-four-words", severity="error",
                            message=f"UI label '{' '.join(words[:4])}...' has {len(words)} words (max 4). Move detailed copy to D+Hover description.",
                            file_path=str(rel_path), line=line_no, snippet=b_body.strip().splitlines()[0][:100],
                            suggestion="Cap visible label to <=4 words. Use element description for extended guidance."
                        ))

        # Check hardcoded colors
        for line_idx, line in enumerate(lines, 1):
            trimmed = line.strip()
            if trimmed.startswith("//") or trimmed.startswith("/*"):
                continue
            
            # Skip SVG path data and d attributes
            if 'd="' in line or "d='" in line or "<path" in line:
                continue

            if "var(--skipo-" in line:
                continue

            hex_match = HEX_COLOR_REGEX.search(line)
            if hex_match:
                matched_val = hex_match.group(0)
                # Ignore common standard defaults in SVGs or pure black/white in tokens
                if matched_val.lower() not in {"#fff", "#ffffff", "#000", "#000000"} or "style=" in line:
                    violations.append(Violation(
                        rule_id="hardcoded-color-token-bypass",
                        severity="error",
                        message=f"Hardcoded color '{matched_val}' bypasses standard design tokens.",
                        file_path=str(rel_path),
                        line=line_idx,
                        snippet=trimmed[:100],
                        suggestion="Use CSS variable var(--skipo-*) (e.g. var(--skipo-surface), var(--skipo-accent), var(--skipo-border-color))."
                    ))

            rgb_match = RGB_COLOR_REGEX.search(line)
            if rgb_match and "var(--skipo-" not in line:
                violations.append(Violation(
                    rule_id="hardcoded-color-function-bypass",
                    severity="error",
                    message=f"Direct color function '{rgb_match.group(0)[:30]}' detected.",
                    file_path=str(rel_path),
                    line=line_idx,
                    snippet=trimmed[:100],
                    suggestion="Replace with semantic token: var(--skipo-matte-bg), var(--skipo-accent-glow), etc."
                ))

    # Check custom scrollbar definitions in CSS files
    css_files = [f for f in files if f.suffix == ".css"]
    has_custom_scrollbar = False
    for cf in css_files:
        c_text = read_text_safe(cf)
        if c_text and any(term in c_text for term in ["scrollbar-width", "scrollbar-color", "::-webkit-scrollbar", "scrollbar-thin"]):
            has_custom_scrollbar = True
            break

    if css_files and not has_custom_scrollbar:
        violations.append(Violation(
            rule_id="missing-custom-themed-scrollbars",
            severity="error",
            message="No custom themed scrollbar definitions found in CSS files. Scrollbars must be custom styled to match application theme.",
            file_path=str(css_files[0].relative_to(root_dir)),
            suggestion="Add custom scrollbar definitions using theme tokens (e.g., scrollbar-width: thin; scrollbar-color: var(--skipo-accent) var(--skipo-surface); or ::-webkit-scrollbar)."
        ))

    errors = sum(1 for v in violations if v.severity == "error")
    return ChecklistResult(
        aspect_id=ASPECT_ID, aspect_title=ASPECT_TITLE, passed=errors == 0,
        violations=violations, files_scanned=files_scanned, duration_ms=(time.time() - start_time) * 1000,
        score=max(0.0, 100.0 - (errors * 10.0))
    )

def main():
    args = parse_standard_args("Aspect 02: UI Component Primitives & Theme Token Semantics Validator")
    result = validate_ui_and_themes(Path(args.path).resolve())
    if args.json:
        import json
        print(json.dumps(result.to_dict(), indent=2))
    else:
        print_checklist_report(result, verbose=args.verbose)
    sys.exit(0 if result.passed else 1)

if __name__ == "__main__":
    main()
