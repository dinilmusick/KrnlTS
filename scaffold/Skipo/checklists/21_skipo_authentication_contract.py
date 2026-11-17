#!/usr/bin/env python3
"""Enforce the canonical Luth-only authentication contract in all Skipo scaffolds."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

# Minimum supported published ecosystem baselines. Upstream sync may advance
# patch/minor versions inside each compatible caret range.
PACKAGE_BASELINE = {
    "@dinilmusick/gutts": "^2.1.1",
    "@ultrst-armada/kloks": "^2.0.4",
    "@ultrst-armada/floks": "^2.0.0",
    "@ultrst-armada/frnlts": "^0.5.23",
    "@ultrst-armada/krnl": "^1.0.25",
}
def _version_tuple(value: str) -> tuple[int, int, int]:
    match = re.search(r"(\d+)\.(\d+)\.(\d+)", str(value))
    if not match:
        raise ValueError(f"Invalid semantic version: {value}")
    return tuple(int(part) for part in match.groups())

def package_spec_satisfies_minimum(actual: str, minimum: str) -> bool:
    if not isinstance(actual, str) or not actual.startswith("^") or not isinstance(minimum, str) or not minimum.startswith("^"):
        return False
    current = _version_tuple(actual)
    floor = _version_tuple(minimum)
    if current < floor:
        return False
    # Mirror caret compatibility: major version stays fixed for >=1; for 0.x
    # the minor version is also fixed.
    if floor[0] > 0:
        return current[0] == floor[0]
    return current[0] == 0 and current[1] == floor[1]

def resolved_version_satisfies_minimum(resolved: str, minimum: str) -> bool:
    try:
        current = _version_tuple(resolved)
        floor = _version_tuple(minimum)
    except ValueError:
        return False
    if current < floor:
        return False
    if floor[0] > 0:
        return current[0] == floor[0]
    return current[0] == 0 and current[1] == floor[1]

SOURCE_SUFFIXES = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"}
FORBIDDEN_SOURCE_PATTERNS = (
    (r"@dinilmusick/gutts/auth", "application must consume the public Kloks auth API rather than GutTS internals"),
    (r"\b(?:bcrypt|bcryptjs)\b", "bcrypt password hashing dependency or implementation"),
    (r"\b(?:hashPassword|verifyPassword|comparePassword|checkPassword)\s*\(", "local password verification/hashing"),
    (r"\bpassword_hash\b|\bpasswordHash\s*:", "application credential hash storage"),
    (r"(?:localStorage|sessionStorage)\s*\.\s*setItem\s*\(\s*['\"][^'\"]*(?:password|credential|refresh.?token)", "browser credential persistence"),
    (r"\b(?:createSession|generateSession|issueSession|mintSession|signSession)\s*\(", "application-local session issuance"),
    (r"\b(?:jsonwebtoken|jwt)\s*\.\s*sign\s*\(", "application-local JWT issuance"),
    (r"\bfrom\s+['\"]better-auth(?:/[^'\"]*)?['\"]|\bimport\s*\(\s*['\"]better-auth", "direct Better Auth integration outside Luth"),
    (r"\b(?:user_credentials|auth_credentials|auth_sessions|user_sessions)\b", "application-local authentication tables"),
    (r"\b(?:INSERT\s+INTO|UPDATE)\s+(?:users|accounts|sessions|credentials)\b", "direct authentication database mutation"),
    (r"\bSELECT\b[\s\S]{0,240}\bFROM\s+(?:users|accounts|sessions|credentials)\b", "direct authentication database reads"),
    (r"\bCREATE\s+TABLE\s+(?:users|accounts|sessions|credentials)\b", "application-local authentication schema"),
    (r'\b(?:pgTable|mysqlTable|sqliteTable)\s*\(\s*["\'](?:users|accounts|sessions|credentials)["\']', "application-local authentication ORM table"),
    (r"\bappBackend\.services\.auth\.(?:login|loginUser|register|registerUser|createSession)", "legacy application-local auth service"),
    (r"\bAuthServiceFacade\b", "legacy Kloks application-local auth facade (AuthServiceFacade)"),
    (r"Bearer\s+sess::", "synthetic application-local session token"),
    (r"SRKL_AUTH_BASE_URL|NEXT_PUBLIC_SRKL_AUTH_BASE_URL|VITE_SRKL_AUTH_BASE_URL", "legacy SRKL authentication endpoint configuration"),
    (r"process\.env\.(?:DATABASE_URL|SYSTEM_DATABASE_URL_1)", "non-canonical database environment variable"),
)

def source_files(root: Path):
    bases = (
        root / "app",
        root / "src",
        root / "scaffolds" / "nextjs" / "app",
        root / "scaffolds" / "nextjs" / "src",
        root / "scaffolds" / "vite" / "src",
    )
    seen: set[Path] = set()
    for base in bases:
        if not base.exists():
            continue
        for path in base.rglob("*"):
            if path.is_file() and path.suffix.lower() in SOURCE_SUFFIXES and path not in seen:
                seen.add(path)
                yield path

def scan_source_tree(root: Path) -> list[str]:
    violations: list[str] = []
    for path in source_files(root):
        source = path.read_text(encoding="utf-8", errors="replace")
        for pattern, description in FORBIDDEN_SOURCE_PATTERNS:
            if re.search(pattern, source, re.IGNORECASE):
                violations.append(f"{path.relative_to(root)}: {description}")
    return violations

def read_manifest(path: Path) -> dict:
    if not path.is_file():
        raise ValueError(f"Missing required manifest: {path}")
    return json.loads(path.read_text(encoding="utf-8"))

def validate_repository(root: Path) -> list[str]:
    errors: list[str] = []
    manifests = {
        "root": root / "package.json",
        "Next.js scaffold": root / "scaffolds" / "nextjs" / "package.json",
        "Vite scaffold": root / "scaffolds" / "vite" / "package.json",
    }
    for label, path in manifests.items():
        try:
            manifest = read_manifest(path)
        except (ValueError, json.JSONDecodeError) as error:
            errors.append(str(error))
            continue
        dependencies = {}
        dependencies.update(manifest.get("dependencies") or {})
        dependencies.update(manifest.get("devDependencies") or {})
        for name in ("bcrypt", "bcryptjs", "@types/bcryptjs"):
            if name in dependencies:
                errors.append(f"{label} installs forbidden auth dependency: {name}")
        for name, expected in PACKAGE_BASELINE.items():
            actual = dependencies.get(name)
            if not package_spec_satisfies_minimum(actual, expected):
                errors.append(
                    f"{label} baseline mismatch for {name}: minimum {expected}, got {actual}"
                )
        gutts_spec = dependencies.get("@dinilmusick/gutts", "")
        if isinstance(gutts_spec, str) and gutts_spec.startswith(("git+", "git:", "github:")):
            errors.append(f"{label} must consume published GutTS, not a Git dependency")
        overrides = manifest.get("pnpm", {}).get("overrides") or {}
        if any(name == "@dinilmusick/gutts" or name.startswith("@dinilmusick/gutts@") for name in overrides):
            errors.append(f"{label} must not override GutTS with a Git SHA or alternate source")

    required_files = (
        "scaffolds/nextjs/app/login/page.tsx",
        "scaffolds/nextjs/src/frontend/pages/auth/LuthAuthPage.tsx",
        "scaffolds/nextjs/src/backend/AppBackend.ts",
        "scaffolds/nextjs/src/backend/auth/luthSession.ts",
        "scaffolds/nextjs/middleware.ts",
        "scaffolds/vite/src/frontend/components/gates/LoginGate.tsx",
        "scaffolds/vite/src/backend/auth/luthSession.ts",
        "scripts/scaffold_app_structure.py",
        "architecture/authentication/SKILL.md",
    )
    for rel in required_files:
        if not (root / rel).is_file():
            errors.append(f"Missing canonical authentication file: {rel}")

    next_login = root / "scaffolds/nextjs/app/login/page.tsx"
    if next_login.is_file():
        source = next_login.read_text(encoding="utf-8")
        if "LuthAuthPage" not in source or "getSkipoApplicationId" not in source:
            errors.append("Next.js login page must compose the Floks LuthAuthPage with the stable app identity")

    next_adapter = root / "scaffolds/nextjs/src/frontend/pages/auth/LuthAuthPage.tsx"
    if next_adapter.is_file():
        source = next_adapter.read_text(encoding="utf-8")
        if "@ultrst-armada/floks/auth" not in source or "FloksLuthAuthPage" not in source:
            errors.append("Next.js auth adapter must delegate to Floks LuthAuthPage")
        if re.search(r"signInWithEmail|signUpWithEmail|signInWithGoogle|onLogin=|onRegister=|onGoogleSignIn=", source):
            errors.append("Next.js auth adapter must not implement authentication callbacks")

    vite_login = root / "scaffolds/vite/src/frontend/components/gates/LoginGate.tsx"
    if vite_login.is_file():
        source = vite_login.read_text(encoding="utf-8")
        if "@ultrst-armada/floks/auth" not in source or "LuthAuthPage" not in source:
            errors.append("Vite LoginGate must use integrated Floks LuthAuthPage")
        if re.search(r"onLogin=|onRegister=|onGoogleSignIn=", source):
            errors.append("Vite LoginGate must not provide application-owned authentication callbacks")

    for rel in (
        "scaffolds/nextjs/app/api/auth/login/route.ts",
        "scaffolds/nextjs/app/api/auth/register/route.ts",
        "scaffolds/nextjs/app/api/login/route.ts",
        "scaffolds/nextjs/app/api/register/route.ts",
    ):
        if (root / rel).exists():
            errors.append(f"Dedicated app-local login/registration endpoint must be absent: {rel}")

    catch_all = root / "scaffolds/nextjs/app/api/auth/[...auth]/route.ts"
    if catch_all.is_file() and "DEFAULT_LUTH_URL" not in catch_all.read_text(encoding="utf-8"):
        errors.append("Next.js auth catch-all must proxy to the canonical Luth URL")

    next_guard = root / "scaffolds/nextjs/src/backend/auth/luthSession.ts"
    if next_guard.is_file():
        source = next_guard.read_text(encoding="utf-8")
        for marker in ("DEFAULT_LUTH_URL", "/api/session", "authenticated !== true", "requireLuthSession"):
            if marker not in source:
                errors.append(f"Next.js Luth guard missing {marker}")

    next_middleware = root / "scaffolds/nextjs/middleware.ts"
    if next_middleware.is_file():
        source = next_middleware.read_text(encoding="utf-8")
        if "getLuthSession" not in source or "forwarded.set('x-user-id', session.user.id)" not in source:
            errors.append("Next.js middleware must verify Luth and overwrite caller-supplied identity headers")

    vite_guard = root / "scaffolds/vite/src/backend/auth/luthSession.ts"
    if vite_guard.is_file():
        source = vite_guard.read_text(encoding="utf-8")
        for marker in ("DEFAULT_LUTH_URL", "/api/session", "authenticated !== true"):
            if marker not in source:
                errors.append(f"Vite Luth guard missing {marker}")

    vite_adapter = root / "scaffolds/vite/src/backend/adapters/httpsAdapter.ts"
    if vite_adapter.is_file():
        source = vite_adapter.read_text(encoding="utf-8")
        if "authenticateLuthRequest" not in source or "universalFetch" not in source:
            errors.append("Vite Node adapter must delegate shared Luth auth routes to the Fetch entry and protect legacy routes")
        if "DepmBackend.services.auth.loginUser" in source or "sess::" in source:
            errors.append("Vite API adapter contains legacy local authentication")

    for framework in ("nextjs", "vite"):
        frontend = root / "scaffolds" / framework / "src" / "frontend"
        if frontend.exists():
            for source_file in frontend.rglob("*"):
                if source_file.is_file() and source_file.suffix.lower() in SOURCE_SUFFIXES:
                    source = source_file.read_text(encoding="utf-8", errors="replace")
                    if re.search(r"['\"]x-user-id['\"]\s*:", source):
                        errors.append(f"{framework} frontend must not send caller-supplied x-user-id: {source_file.relative_to(root)}")
        client = root / "scaffolds" / framework / "src" / "libraries" / "client" / "luthAuthClient.ts"
        if client.is_file():
            source = client.read_text(encoding="utf-8")
            if "getAuthHeaders()" not in source or "@ultrst-armada/kloks/auth" not in source or "@dinilmusick/gutts/auth" in source or "VITE_LUTH_URL" in source or "NEXT_PUBLIC_LUTH_URL" in source:
                errors.append(f"{framework} client must use the public Kloks Luth bearer client without per-app auth URL env vars")

    generator = root / "scripts/scaffold_app_structure.py"
    if generator.is_file():
        source = generator.read_text(encoding="utf-8")
        if '"@ultrst-armada/krnl": "^1.0.9"' in source:
            errors.append("Generic scaffold generator contains stale Krnl package baseline")
        if re.search(r"\bAuthServiceFacade\b", source):
            errors.append("Generic scaffold generator must not generate the legacy Kloks auth facade")
        for marker in ("FloksLuthAuthPage", "requireLuthSession", "DEFAULT_LUTH_URL", "LuthAuthPage"):
            if marker not in source:
                errors.append(f"Generic scaffold generator missing canonical auth output: {marker}")
        if "@ultrst-armada/kloks/auth" not in source or "@dinilmusick/gutts/auth" in source:
            errors.append("Generic scaffold generator must consume the public Kloks auth API")
        if re.search(r"client\.signInWithEmail|client\.signUpWithEmail|client\.signInWithGoogle", source):
            errors.append("Generic scaffold generator must delegate login lifecycle to Floks")

    skill = root / "architecture/authentication/SKILL.md"
    if skill.is_file():
        source = skill.read_text(encoding="utf-8")
        for marker in ("Luth", "Better Auth", "Floks", "Kloks", "protected backend route"):
            if marker not in source:
                errors.append(f"Authentication skill missing contract marker: {marker}")

    errors.extend(scan_source_tree(root))
    return errors

def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    errors = validate_repository(root)
    if errors:
        for error in errors:
            print(f"AUTH CONTRACT VIOLATION: {error}", file=sys.stderr)
        return 1
    print("Canonical Luth-only authentication scaffold: PASS")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
