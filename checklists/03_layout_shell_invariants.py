#!/usr/bin/env python3
"""
Aspect 03: Layout Shell Invariants & User Experience Invariants
Verifies:
- Anti-Nested Tabs Law (Bans nested TabContainer elements)
- Dedicated BottomStrip (30px) with BottomStripContext provider
- Ban on Floating Tooltip Bubbles / Popovers (Bans skipo-tooltip floating bubbles)
- FloatingDetailsPanel Invariants (8-way resize, draggable header, pin toggle, persistent geometry)
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

ASPECT_ID = "aspect_03_layout_shell_invariants"
ASPECT_TITLE = "Layout Shell & User Experience Invariants"

def validate_layout_shell(root_dir: Path) -> ChecklistResult:
    start_time = time.time()
    violations = []
    
    files = scan_files(root_dir, {".tsx", ".jsx"})
    files_scanned = len(files)

    for file_path in files:
        rel_path = file_path.relative_to(root_dir)
        fname = file_path.name

        # Skip primitive definition files
        if fname in {"TabContainer.tsx", "BaseTooltip.tsx", "BottomStrip.tsx", "FloatingDetailsPanel.tsx"}:
            continue
        if ".test." in fname or ".spec." in fname or "libraries/skipo" in str(rel_path):
            continue

        content = read_text_safe(file_path)
        if not content:
            continue

        lines = content.splitlines()

        # 1. Anti-Nested Tabs Check: Count TabContainer occurrences in same file and nesting
        tab_container_count = content.count("<TabContainer")
        if tab_container_count > 1:
            violations.append(Violation(
                rule_id="anti-nested-tabs-violation", severity="error",
                message=f"Multiple (<TabContainer>) declarations ({tab_container_count}) detected in single view.",
                file_path=str(rel_path),
                suggestion="Primary view navigation MUST be flat in the single top-level TopToolbar. Zero nested tabs allowed."
            ))

        # 2. Ban on Floating Tooltip Bubbles: Check for skipo-tooltip or floating balloon classes
        for line_idx, line in enumerate(lines, 1):
            if "skipo-tooltip--" in line or ("skipo-tooltip" in line and "BaseTooltip" not in fname):
                violations.append(Violation(
                    rule_id="floating-tooltip-bubble-forbidden", severity="error",
                    message="Floating tooltip bubble class detected. Floating tooltips and popovers are prohibited.",
                    file_path=str(rel_path), line=line_idx, snippet=line.strip()[:100],
                    suggestion="Route inspection text to BottomStrip via BottomStripContext (e.g. useBottomStrip().setHoverText(...))."
                ))

        # 2b. Bottom Bar Center Slot Exclusivity Law (Dynamic hover inspection labels only)
        if "<BottomStrip" in content and "centerSlot" in content:
            for line_idx, line in enumerate(lines, 1):
                if "centerSlot=" in line or "centerSlot:" in line:
                    if any(bad in line for bad in ["<button", "<BaseButton", "<input", "<form", "<select", "onClick", "Button"]):
                        violations.append(Violation(
                            rule_id="bottom-bar-center-slot-reserved", severity="error",
                            message="Interactive elements or buttons placed in BottomStrip centerSlot. Exclusively reserved for hover inspection.",
                            file_path=str(rel_path), line=line_idx, snippet=line.strip()[:100],
                            suggestion="Remove interactive controls from BottomStrip centerSlot."
                        ))

        # 3. FloatingDetailsPanel Invariants Check:
        # If file acts as an inspector / details panel, ensure it uses FloatingDetailsPanel
        if "details" in fname.lower() or "inspector" in fname.lower():
            if "FloatingDetailsPanel" not in content and "PanelContainer" not in content:
                violations.append(Violation(
                    rule_id="details-panel-missing-floating-primitive",
                    severity="warning",
                    message=f"Details inspector '{fname}' does not utilize standard FloatingDetailsPanel.",
                    file_path=str(rel_path),
                    suggestion="Wrap inspector in FloatingDetailsPanel to guarantee 8-way resize, dragging, pinning, and geometry persistence."
                ))

        # 4. Overlay / Dialogue Interaction Isolation Law:
        # When a modal, dialogue, or overlay is displayed, mouse wheel and keyboard interactions
        # MUST be captured/trapped by the overlay container and backdrop. No leaking to underlying canvas.
        is_dialogue_or_overlay = (
            ("modal" in fname.lower() or "dialog" in fname.lower() or "overlay" in fname.lower())
            and file_path.suffix in {".tsx", ".jsx"}
            and fname not in {"ConfirmModal.tsx", "BaseModal.tsx"}
        ) or (
            ('role="dialog"' in content or "role='dialog'" in content or "fixed inset-0" in content)
            and ("backdrop" in content.lower() or "z-50" in content or "z-40" in content)
        )

        if is_dialogue_or_overlay:
            has_wheel_isolation = (
                "onWheel" in content
                or "overscroll-contain" in content
                or "wheel" in content.lower()
                or "ModalContainer" in content
            )
            if not has_wheel_isolation:
                violations.append(Violation(
                    rule_id="overlay-wheel-leakage-violation",
                    severity="error",
                    message=f"Dialogue / Overlay component '{fname}' does not isolate wheel events. Mouse wheel events will leak into underlying canvas.",
                    file_path=str(rel_path),
                    suggestion="Add onWheel={(e) => e.stopPropagation()} and CSS overscroll-contain to dialog card and overlay backdrop, or wrap in ModalContainer."
                ))
            
            # Check keyboard / escape isolation if interactive form/dialog
            has_key_or_close = (
                "onClose" in content
                or "escape" in content.lower()
                or "onkeydown" in content.lower()
                or "onKeyDown" in content
                or "ModalContainer" in content
            )
            if not has_key_or_close:
                violations.append(Violation(
                    rule_id="overlay-keyboard-isolation-warning",
                    severity="warning",
                    message=f"Dialogue / Overlay component '{fname}' lacks keyboard escape trap or onClose dismissal handler.",
                    file_path=str(rel_path),
                    suggestion="Handle Escape key and trap keyboard interactions inside the overlay."
                ))

            # 5. Progressive Disclosure & Collapsible Dialog Sections Mandate (Law L13):
            # Multi-section creation dialogues, edit modals, and configuration dialogs
            # MUST NOT render flat uncompressed lists of customization sections simultaneously.
            # Secondary customization sections (icons, typography, colors, tags, advanced options)
            # MUST mount collapsed/compressed by default via accordion or collapsible containers.
            if ("edit" in fname.lower() or "create" in fname.lower() or "node" in fname.lower() or "config" in fname.lower()):
                has_multiple_customization_sections = (
                    ("section" in content.lower() or "picker" in content.lower() or "emoji" in content.lower())
                    and ("font" in content.lower() or "color" in content.lower() or "tag" in content.lower())
                )
                if has_multiple_customization_sections:
                    has_collapsible_behavior = (
                        "collapsible" in content.lower()
                        or "accordion" in content.lower()
                        or "opensections" in content.lower()
                        or "togglesection" in content.lower()
                        or "isopen" in content.lower()
                    )
                    if not has_collapsible_behavior:
                        violations.append(Violation(
                            rule_id="dialog-clutter-uncompressed-sections-violation",
                            severity="error",
                            message=f"Dialogue / Modal '{fname}' contains multiple customization sections without collapsible accordion state. Secondary sections must mount compressed by default.",
                            file_path=str(rel_path),
                            suggestion="Implement collapsible section headers (CollapsibleSectionHeader) defaulting to collapsed state, allowing clean default flow and on-demand expansion."
                        ))

    bs_ctx = root_dir / "packages/ui/src/components/bottom-strip/BottomStripContext.tsx"
    if bs_ctx.exists():
        c = read_text_safe(bs_ctx)
        if "isDKeyPressed" not in c or "inspectionDescription" not in c:
            violations.append(Violation(
                rule_id="bottom-strip-missing-d-hover-mode", severity="error",
                message="BottomStripContext missing D+Hover description mode (Law L19).",
                file_path=str(bs_ctx.relative_to(root_dir)),
                suggestion="Add isDKeyPressed and inspectionDescription to BottomStripContext."
            ))

    errors = sum(1 for v in violations if v.severity == "error")
    return ChecklistResult(
        aspect_id=ASPECT_ID, aspect_title=ASPECT_TITLE, passed=errors == 0,
        violations=violations, files_scanned=files_scanned,
        duration_ms=(time.time() - start_time) * 1000,
        score=max(0.0, 100.0 - (errors * 15.0) - (len(violations) - errors) * 5.0)
    )

def main():
    args = parse_standard_args("Aspect 03: Layout Shell Invariants & User Experience Invariants Validator")
    result = validate_layout_shell(Path(args.path).resolve())
    if args.json:
        import json
        print(json.dumps(result.to_dict(), indent=2))
    else:
        print_checklist_report(result, verbose=args.verbose)
    sys.exit(0 if result.passed else 1)

if __name__ == "__main__":
    main()
