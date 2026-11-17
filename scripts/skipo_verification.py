"""Read-only deterministic canonical-state gate."""
from __future__ import annotations
import hashlib, importlib.util, json, os, re, sys
from pathlib import Path
from typing import Any
from skipo_state_registry import validate_registry_contract
ROOT = Path(__file__).resolve().parents[1]

def version_tuple(value: str | None) -> tuple[int, ...]:
    match = re.search(r"(\d+(?:\.\d+){0,2})", value or "")
    return tuple(int(part) for part in match.group(1).split(".")) if match else (0,)

REGISTRY = ROOT / "architecture/capabilities/registry.json"
MIGRATIONS = ROOT / "architecture/capabilities/migrations.json"

def read(path):
    try: return json.loads(path.read_text(encoding="utf-8")), None
    except FileNotFoundError: return None, "missing"
    except (OSError, UnicodeError, json.JSONDecodeError) as exc: return None, str(exc)

def diag(code, status, message, path=None, expected=None, actual=None, remediation=None):
    d = {"code":code,"status":status,"message":message}
    if path is not None: d["path"] = path
    if expected is not None: d["expected"] = expected
    if actual is not None: d["actual"] = actual
    if remediation is not None: d["remediation"] = remediation
    return d

def env_values(root):
    result = {}
    for path in sorted(root.glob(".env*")):
        if not path.is_file() or path.is_symlink(): continue
        try: lines = path.read_text(encoding="utf-8").splitlines()
        except (OSError, UnicodeError): continue
        for line in lines:
            line = line.strip()
            if line.startswith("export "): line = line[7:].strip()
            match = re.match(r"^([A-Za-z_][A-Za-z0-9_]*)\s*=", line) if line and not line.startswith("#") else None
            if match: result[match.group(1)] = True
    return result

def verification_fingerprint(root: Path) -> str:
    """Bind a repair receipt to the exact state that was independently verified."""
    digest = hashlib.sha256()
    tracked = [
        (root / "package.json", "package.json"),
        (root / ".skipo/project.json", ".skipo/project.json"),
        (root / ".skipo/capabilities.json", ".skipo/capabilities.json"),
        (root / ".skipo/dependencies.json", ".skipo/dependencies.json"),
        (root / ".skipo/migration-state.json", ".skipo/migration-state.json"),
        (REGISTRY, "@canonical/registry.json"),
        (MIGRATIONS, "@canonical/migrations.json"),
    ]
    for path in sorted(root.glob(".env*")):
        if path.is_file() and not path.is_symlink():
            tracked.append((path, path.relative_to(root).as_posix()))
    for path, label in tracked:
        digest.update(label.encode("utf-8") + b"\\0")
        try:
            digest.update(path.read_bytes())
        except OSError:
            digest.update(b"<unreadable-or-missing>")
        digest.update(b"\\0")
    caps, error = read(root / ".skipo/capabilities.json")
    if not error and isinstance(caps, dict) and isinstance(caps.get("generated"), list):
        for entry in sorted(caps["generated"], key=lambda item: str(item.get("path", "")) if isinstance(item, dict) else ""):
            if not isinstance(entry, dict) or not isinstance(entry.get("path"), str):
                continue
            path = root / entry["path"]
            try:
                path.resolve(strict=False).relative_to(root)
                if path.is_file() and not path.is_symlink():
                    digest.update(entry["path"].encode("utf-8") + b"\\0")
                    digest.update(path.read_bytes())
            except (OSError, ValueError):
                continue
    for name in sorted(set(registry_environment_forbidden(root))):
        digest.update(name.encode("utf-8") + (b"=present" if name in os.environ else b"=absent"))
    return digest.hexdigest()


def registry_environment_forbidden(root: Path) -> list[str]:
    registry, error = read(REGISTRY)
    if error or not isinstance(registry, dict):
        return []
    values = registry.get("applicationState", {}).get("environment", {}).get("forbiddenVariables", [])
    return values if isinstance(values, list) and all(isinstance(value, str) for value in values) else []


def verify_canonical_state(root: Path, framework_version: str | None = None):
    root = root.resolve()
    ds = []
    registry, error = read(REGISTRY)
    if error or not isinstance(registry, dict):
        ds.append(diag("SKIPO_REGISTRY_INVALID","invalid","Canonical registry is unreadable.","architecture/capabilities/registry.json"))
        return result(ds, root)
    for error in validate_registry_contract(registry):
        ds.append(diag("SKIPO_REGISTRY_INVALID","invalid",error,"architecture/capabilities/registry.json"))
    if ds: return result(ds, root)
    # The framework source repository is not itself an adopted downstream application.
    # Validate its package/registry contract without demanding application-local .skipo state.
    package_probe, package_probe_error = read(root / "package.json")
    if root == ROOT.resolve() and isinstance(package_probe, dict) and package_probe.get("name") == "skipo":
        expected = registry["applicationState"]["framework"].get("version")
        actual = package_probe.get("version")
        if actual != expected:
            ds.append(diag("SKIPO_FRAMEWORK_PACKAGE_VERSION_MISMATCH","invalid","Framework package version differs from canonical registry.","package.json",expected,actual))
        migration_probe, migration_error = read(MIGRATIONS)
        if migration_error or not isinstance(migration_probe, dict):
            ds.append(diag("SKIPO_MIGRATION_REGISTRY_INVALID","invalid","Migration registry is unreadable.","architecture/capabilities/migrations.json"))
        return result(ds, root, [], False)
    app = registry["applicationState"]
    manifest, me = read(root / ".skipo/project.json")
    package, pe = read(root / "package.json")
    if pe or not isinstance(package,dict):
        ds.append(diag("SKIPO_PACKAGE_INVALID","invalid","A valid package.json is required.","package.json"))
    if me == "missing":
        ds.append(diag("SKIPO_MANIFEST_MISSING","invalid","Project has not been adopted by Skipo.",".skipo/project.json",remediation="Run skipo adopt explicitly."))
    elif me or not isinstance(manifest,dict):
        ds.append(diag("SKIPO_MANIFEST_INVALID","invalid","Skipo project manifest is malformed.",".skipo/project.json"))
    else:
        if manifest.get("framework") != "skipo":
            ds.append(diag("SKIPO_FRAMEWORK_MISMATCH","invalid","Manifest framework must be skipo.",".skipo/project.json","skipo",manifest.get("framework")))
        expected = framework_version or app["framework"].get("version")
        actual = manifest.get("skipo_version")
        if actual != expected:
            ds.append(diag("SKIPO_VERSION_MISMATCH","repairable","Recorded Skipo version does not match the required version.",".skipo/project.json",expected,actual,"Run skipo update explicitly, then verify again."))
    files = {k:".skipo/"+v for k,v in {"capabilities":"capabilities.json","dependencies":"dependencies.json","migrations":"migration-state.json"}.items()}
    state = {}
    for key, rel in files.items():
        value, err = read(root / rel)
        if err == "missing":
            ds.append(diag("SKIPO_STATE_MISSING","repairable","Required Skipo state file is missing.",rel,remediation="Run skipo adopt or skipo update explicitly."))
            state[key] = {}
        elif err or not isinstance(value,dict):
            ds.append(diag("SKIPO_STATE_INVALID","invalid","Skipo state file is malformed.",rel))
            state[key] = {}
        else: state[key] = value
    caps = registry["capabilities"]
    installed = state["capabilities"].get("installed",{})
    generated = state["capabilities"].get("generated",[])
    deps = package.get("dependencies",{}) if isinstance(package,dict) else {}
    dep_state = state["dependencies"]
    if not isinstance(installed,dict) or not isinstance(generated,list):
        ds.append(diag("SKIPO_CAPABILITY_STATE_INVALID","invalid","Capability state has invalid installed/generated shapes.",files["capabilities"]))
        installed, generated = {}, []
    if not isinstance(deps,dict):
        ds.append(diag("SKIPO_DEPENDENCIES_INVALID","invalid","package.json dependencies must be an object.","package.json")); deps = {}
    for cap_id, record in sorted(installed.items()):
        spec = caps.get(cap_id)
        if spec is None:
            ds.append(diag("SKIPO_UNKNOWN_CAPABILITY","invalid","Unknown installed capability: "+cap_id,files["capabilities"])); continue
        if spec.get("status") != "canonical":
            ds.append(diag("SKIPO_DEPRECATED_CAPABILITY","unresolved","Installed capability is deprecated: "+cap_id,files["capabilities"]))
        if not isinstance(record,dict):
            ds.append(diag("SKIPO_INSTALLED_CAPABILITY_INVALID","invalid","Installed capability record is malformed: "+cap_id,files["capabilities"])); continue
        if record.get("providers") != spec.get("providers"):
            ds.append(diag("SKIPO_PROVIDER_OWNERSHIP_MISMATCH","unsafe/ambiguous","Provider ownership differs from canonical registry: "+cap_id,files["capabilities"],spec.get("providers"),record.get("providers"),"Review ownership and explicitly recompose."))
        for name, version in sorted(spec.get("dependencies",{}).items()):
            if deps.get(name) != version:
                ds.append(diag("SKIPO_CANONICAL_DEPENDENCY_MISMATCH","repairable","Canonical dependency contract is unsatisfied: "+name,"package.json",version,deps.get(name),"Run skipo add or update, reinstall dependencies, then verify."))
            if dep_state.get(name) != version:
                ds.append(diag("SKIPO_DEPENDENCY_STATE_MISMATCH","repairable","Recorded dependency state differs: "+name,files["dependencies"],version,dep_state.get(name),"Run skipo sync or update explicitly."))
    ownership_records = {
        entry.get("path"): entry for entry in generated
        if isinstance(entry, dict) and isinstance(entry.get("path"), str)
    }
    for cap_id in sorted(installed):
        spec = caps.get(cap_id, {})
        for expected_file in spec.get("generated", []):
            rel = expected_file.get("path")
            if not rel or rel in ownership_records:
                continue
            path = root / rel
            if path.exists():
                ds.append(diag("SKIPO_GENERATED_OWNERSHIP_UNRECORDED","unsafe/ambiguous","Canonical generated file exists without a Skipo ownership record: "+rel,rel,remediation="Review provenance and explicitly adopt or recompose the file."))
            else:
                ds.append(diag("SKIPO_GENERATED_MISSING","repairable","Canonical generated file and ownership record are missing: "+rel,rel,remediation="Run explicit skipo repair, then verify."))
    seen = set()
    for entry in generated:
        if not isinstance(entry,dict) or not isinstance(entry.get("path"),str):
            ds.append(diag("SKIPO_GENERATED_ENTRY_INVALID","invalid","Generated ownership entry is malformed.",files["capabilities"])); continue
        rel = entry["path"]
        if rel in seen:
            ds.append(diag("SKIPO_GENERATED_ENTRY_DUPLICATE","invalid","Generated ownership entry is duplicated: "+rel,files["capabilities"])); continue
        seen.add(rel)
        path = root / rel
        try: path.resolve(strict=False).relative_to(root)
        except (OSError,ValueError):
            ds.append(diag("SKIPO_GENERATED_PATH_ESCAPE","unsafe/ambiguous","Generated path escapes project root: "+rel,rel)); continue
        if entry.get("owner") != "skipo":
            ds.append(diag("SKIPO_GENERATED_OWNER_INVALID","unsafe/ambiguous","Generated file is not Skipo-owned: "+rel,rel)); continue
        if path.is_symlink():
            ds.append(diag("SKIPO_GENERATED_SYMLINK","unsafe/ambiguous","Generated path is a symlink: "+rel,rel)); continue
        if not path.is_file():
            ds.append(diag("SKIPO_GENERATED_MISSING","repairable","Generated file is missing: "+rel,rel,remediation="Review and run explicit skipo repair.")); continue
        try: checksum = hashlib.sha256(path.read_bytes()).hexdigest()
        except OSError:
            ds.append(diag("SKIPO_GENERATED_UNREADABLE","invalid","Cannot read generated file: "+rel,rel)); continue
        expected = entry.get("checksum")
        if not isinstance(expected,str) or not re.fullmatch(r"[0-9a-f]{64}",expected):
            ds.append(diag("SKIPO_CHECKSUM_INVALID","invalid","Generated checksum is missing or malformed: "+rel,rel))
        elif checksum != expected:
            ds.append(diag("SKIPO_CHECKSUM_MISMATCH","repairable","Generated capability file has drifted: "+rel,rel,expected,checksum,"Review diff, run explicit skipo repair, then verify."))
    migrations, err = read(MIGRATIONS)
    if err or not isinstance(migrations, dict) or not isinstance(migrations.get("migrations"), list):
        ds.append(diag("SKIPO_MIGRATION_REGISTRY_INVALID", "invalid", "Migration registry must contain a migrations array.", "architecture/capabilities/migrations.json"))
    else:
        target_framework = framework_version or app["framework"].get("version")
        ms = state["migrations"]
        applied = ms.get("applied", [])
        pending = ms.get("pending", [])
        if (
            not isinstance(applied, list)
            or not isinstance(pending, list)
            or any(not isinstance(mid, str) or not mid for mid in applied + pending)
            or len(applied) != len(set(applied))
            or len(pending) != len(set(pending))
            or set(applied) & set(pending)
        ):
            ds.append(diag("SKIPO_MIGRATION_STATE_INVALID", "invalid", "Migration state must contain unique string IDs in disjoint applied and pending arrays.", files["migrations"]))
        else:
            declared = {}
            for migration in migrations["migrations"]:
                if not isinstance(migration, dict) or not isinstance(migration.get("id"), str) or not migration["id"]:
                    ds.append(diag("SKIPO_MIGRATION_REGISTRY_INVALID", "invalid", "Every migration must be an object with a non-empty string id.", "architecture/capabilities/migrations.json"))
                    continue
                mid = migration["id"]
                if version_tuple(migration.get("version", "0.0.0")) > version_tuple(target_framework):
                    continue
                if mid in declared:
                    ds.append(diag("SKIPO_MIGRATION_REGISTRY_INVALID", "invalid", "Duplicate migration id: " + mid, "architecture/capabilities/migrations.json"))
                    continue
                declared[mid] = migration
                retire_paths = migration.get("retirePaths", [])
                if not isinstance(retire_paths, list) or any(not isinstance(rel, str) or not rel for rel in retire_paths):
                    ds.append(diag("SKIPO_MIGRATION_REGISTRY_INVALID", "invalid", "Migration retirePaths must be an array of non-empty relative paths: " + mid, "architecture/capabilities/migrations.json"))
                    continue
                for rel in retire_paths:
                    legacy_path = root / rel
                    try:
                        legacy_path.resolve(strict=False).relative_to(root)
                    except (OSError, ValueError):
                        ds.append(diag("SKIPO_MIGRATION_PATH_ESCAPE", "invalid", "Migration path escapes project root: " + rel, rel))
                        continue
                    if legacy_path.exists():
                        ds.append(diag("SKIPO_LEGACY_MIGRATION_PATH_REMAINS", "unresolved", "Legacy path required to be retired by migration " + mid + " remains: " + rel, rel, remediation="Run the declared migration explicitly, then verify again."))
            for mid in sorted(set(applied + pending) - set(declared)):
                ds.append(diag("SKIPO_MIGRATION_UNKNOWN", "invalid", "Migration state references an unknown migration: " + mid, files["migrations"]))
            for mid in pending:
                ds.append(diag("SKIPO_MIGRATION_PENDING", "unresolved", "Migration obligation remains pending: " + mid, files["migrations"], remediation="Execute declared migration and verify postconditions."))
            for mid in sorted(set(declared) - set(applied) - set(pending)):
                ds.append(diag("SKIPO_MIGRATION_NOT_APPLIED", "repairable", "Required migration is not recorded: " + mid, files["migrations"], remediation="Run skipo update explicitly."))
    forbidden = sorted(set(app.get("environment",{}).get("forbiddenVariables",[])))
    present = env_values(root)
    for name in forbidden:
        if name in os.environ or name in present:
            ds.append(diag("SKIPO_FORBIDDEN_ENVIRONMENT_VARIABLE","unsafe/ambiguous","Forbidden environment variable is present: "+name,".env* or process environment",remediation="Remove the variable from process and project environment files."))
    # Reuse the capability drift detector; never apply its proposed actions during verification.
    try:
        from skipo_capabilities import diagnose
        for finding in diagnose(root):
            classification = finding.get("classification")
            if finding.get("error"):
                ds.append(diag("SKIPO_ARCHITECTURE_DIAGNOSIS_INVALID","invalid",str(finding["error"]),finding.get("path")))
            elif classification == "retire":
                ds.append(diag("SKIPO_ARCHITECTURAL_DRIFT_RETIRE","repairable","Explicitly retireable canonical duplicate remains: "+str(finding.get("path")),finding.get("path"),remediation="Run explicit skipo repair, then verify."))
            elif classification == "keep":
                ds.append(diag("SKIPO_ARCHITECTURE_AMBIGUOUS","unsafe/ambiguous","Potential duplicate implementation requires ownership review: "+str(finding.get("path")),finding.get("path"),remediation="Confirm canonical ownership or retain the implementation with an explicit architecture decision."))
    except Exception as exc:
        ds.append(diag("SKIPO_ARCHITECTURE_DIAGNOSIS_FAILED","invalid","Unable to execute Skipo capability drift detection: "+str(exc)))
    # Execute existing Skipo architecture and runtime-environment constraints.
    checklist_dir = ROOT / "checklists"
    if str(checklist_dir) not in sys.path:
        sys.path.insert(0, str(checklist_dir))
    verification_aspects = [("24_capability_architecture.py", "24")]
    if any(path.is_file() for path in root.glob(".env*")):
        verification_aspects.append(("26_skipo_runtime_environment_governance.py", "26"))
    for filename, aspect in verification_aspects:
        module_path = checklist_dir / filename
        try:
            spec_obj = importlib.util.spec_from_file_location("skipo_verify_aspect_" + aspect, module_path)
            module = importlib.util.module_from_spec(spec_obj)
            spec_obj.loader.exec_module(module)
            constraint_result = module.validate(root)
            for violation in constraint_result.violations:
                rule = getattr(violation, "rule_id", getattr(violation, "rule", "SKIPO_CONSTRAINT"))
                if aspect == "26" and rule not in {"ENV-001", "ENV-002", "ENV-004"}:
                    continue
                ds.append(diag(
                    "SKIPO_CONSTRAINT_" + str(rule).replace(".", "_"),
                    "unresolved",
                    str(getattr(violation, "message", "Skipo constraint failed.")),
                    getattr(violation, "file_path", None),
                    remediation=getattr(violation, "suggestion", None),
                ))
        except Exception as exc:
            ds.append(diag("SKIPO_CONSTRAINT_VALIDATOR_FAILED","invalid","Unable to execute Skipo constraint validator "+filename+": "+str(exc),filename))
    receipt, receipt_error = read(root / ".skipo/verification-state.json")
    repaired = (
        not ds
        and receipt_error is None
        and isinstance(receipt, dict)
        and receipt.get("lastRepair") == "verified"
        and receipt.get("fingerprint") == verification_fingerprint(root)
    )
    return result(ds, root, sorted(installed), repaired)

def result(ds, root, installed=None, repaired=False):
    rank = {"invalid":6,"unsafe/ambiguous":5,"unresolved":4,"repairable":3}
    status = max((d["status"] for d in ds),key=lambda x:rank.get(x,0),default="clean")
    if status == "clean" and repaired: status = "repaired"
    ds.sort(key=lambda d:(d["code"],d.get("path",""),d["message"]))
    return {"ok":status in {"clean","repaired"},"operation":"verify","status":status,"project":".",
            "capabilities":installed or [],"diagnostic_count":len(ds),"diagnostics":ds,
            "errors":[d["message"] for d in ds]}
