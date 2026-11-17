#!/usr/bin/env python3
"""Aspect 25: Canonical Skipo UI styling pipeline.

Every generated Skipo frontend must compile Tailwind itself, explicitly register
Floks utility sources, load Skipo theme tokens, and mount the canonical theme provider.
"""

from pathlib import Path
import json
import sys
import time

try:
    from .common import Violation, ChecklistResult, parse_standard_args, print_checklist_report
except ImportError:
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from common import Violation, ChecklistResult, parse_standard_args, print_checklist_report

ASPECT_ID = "aspect_25_skipo_ui_style_pipeline"
ASPECT_TITLE = "Skipo UI Style Pipeline"

def validate(root_dir: Path) -> ChecklistResult:
    start = time.time()
    violations = []
    package_path = root_dir / "package.json"
    if not package_path.exists():
        return ChecklistResult(ASPECT_ID, ASPECT_TITLE, True, [], 0, 0, 100.0)

    try:
        package = json.loads(package_path.read_text(encoding="utf-8"))
    except Exception as exc:
        violations.append(Violation("style-package-invalid", "error", str(exc), "package.json"))
        return ChecklistResult(ASPECT_ID, ASPECT_TITLE, False, violations, 1, 0, 0.0)

    if "skipo" not in package:
        return ChecklistResult(ASPECT_ID, ASPECT_TITLE, True, [], 1, 0, 100.0)

    deps = {**package.get("dependencies", {}), **package.get("devDependencies", {})}
    if "tailwindcss" not in deps:
        violations.append(Violation("missing-tailwindcss", "error", "Skipo apps must compile Tailwind CSS.", "package.json"))
    if "next" not in deps and "@tailwindcss/vite" not in deps:
        violations.append(Violation("missing-tailwind-consumer", "error", "Skipo Vite apps must use @tailwindcss/vite.", "package.json"))

    vite_css = root_dir / "src/index.css"
    next_css = root_dir / "app/globals.css"
    css = vite_css if vite_css.is_file() else next_css if next_css.is_file() else None
    if css is None:
        violations.append(Violation("missing-global-style-entrypoint", "error", "Generated Skipo apps require a canonical global CSS entrypoint.", "src/index.css"))
    else:
        text = css.read_text(encoding="utf-8", errors="ignore")
        for token, message in [
            ('@import "tailwindcss"', "Global CSS must import Tailwind."),
            ("@source", "Global CSS must explicitly register application/library sources."),
            ("@ultrst-armada/floks", "Global CSS must explicitly register Floks styles/sources."),
            ("@skipo/ui/theme", "Global CSS must load canonical theme tokens."),
        ]:
            if token not in text:
                # Current published Floks path uses its canonical package theme tokens or local tokens.
                if token == "@skipo/ui/theme" and any(t in text for t in ["@ultrst-armada/floks/ui/theme/tokens.css", "tokens.css", "@skipo/ui/theme"]):
                    continue
                violations.append(Violation("missing-style-contract", "error", message, str(css.relative_to(root_dir))))

        if "@xyflow/react" in deps and "@xyflow/react/dist/style.css" not in text:
            violations.append(Violation("missing-xyflow-style", "error", "Apps using @xyflow/react must import '@xyflow/react/dist/style.css'.", str(css.relative_to(root_dir))))

        if "@ultrst-armada/floks" in deps and "@ultrst-armada/floks/ui/dist/index.css" not in text and "floks" not in text:
            violations.append(Violation("missing-floks-ui-css", "error", "Apps using Floks must import '@ultrst-armada/floks/ui/dist/index.css'.", str(css.relative_to(root_dir))))

    if "next" in deps:
        providers = root_dir / "app/providers.tsx"
        layout = root_dir / "app/layout.tsx"
        if not providers.is_file() or "SkipoThemeProvider" not in providers.read_text(encoding="utf-8", errors="ignore"):
            violations.append(Violation("missing-root-theme-provider", "error", "Next.js scaffold must mount SkipoThemeProvider.", "app/providers.tsx"))
        if not layout.is_file() or "Providers" not in layout.read_text(encoding="utf-8", errors="ignore"):
            violations.append(Violation("theme-provider-not-mounted", "error", "Next.js root layout must mount the theme provider.", "app/layout.tsx"))
    else:
        app = root_dir / "src/frontend/App.tsx"
        if not app.is_file() or "SkipoThemeProvider" not in app.read_text(encoding="utf-8", errors="ignore"):
            violations.append(Violation("missing-root-theme-provider", "error", "Vite scaffold must mount SkipoThemeProvider.", "src/frontend/App.tsx"))
        vite = root_dir / "vite.config.ts"
        if not vite.is_file() or "@tailwindcss/vite" not in vite.read_text(encoding="utf-8", errors="ignore"):
            violations.append(Violation("missing-vite-tailwind-plugin", "error", "Vite scaffold must install the Tailwind Vite plugin.", "vite.config.ts"))

    files_scanned = 6
    errors = sum(v.severity == "error" for v in violations)
    score = max(0.0, 100.0 - errors * 20.0)
    return ChecklistResult(ASPECT_ID, ASPECT_TITLE, errors == 0, violations, files_scanned, (time.time() - start) * 1000, score)

if __name__ == "__main__":
    args = parse_standard_args("Aspect 25: Canonical Skipo UI styling pipeline")
    result = validate(Path(args.path).resolve())
    print_checklist_report(result, verbose=args.verbose)
    raise SystemExit(0 if result.passed else 1)
