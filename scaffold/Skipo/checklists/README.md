# Skipo & KrnlTS Dynamic Architectural Checklists

This directory contains the **pure Python 3 dynamic checklist validators** designed for 100% environment portability:
- **Google AI Studio Ready**: Written with zero pip dependencies, running directly inside Gemini's sandboxed Python 3 Code Execution runtime.
- **Node.js & CI Compatible**: Includes `runner.mjs` for seamless execution via `node checklists/runner.mjs` or `npm`/`pnpm` script targets.
- **Agent Enforcement Gates**: Executed before declaring any coding or refactoring turn complete.

---

## Aspect Checklist Index

| Aspect | Validator Script | Core Enforcement Rules |
| :--- | :--- | :--- |
| **01: Structure & Governance** | [`01_structure_governance.py`](./01_structure_governance.py) | Monolithic `src/` ban, explicit `src/frontend` & `src/backend` (or `packages/*`), anchored `.gitignore` (`/dist/`, `/.next/`). |
| **02: UI Primitives & Themes** | [`02_ui_primitives_themes.py`](./02_ui_primitives_themes.py) | Zero-custom UI (ban on raw `<button>`, `<input>`, etc.), 100% theme tokens (`var(--skipo-*)`), zero hardcoded hex/rgb. |
| **03: Layout Shell Invariants** | [`03_layout_shell_invariants.py`](./03_layout_shell_invariants.py) | Flat `TopToolbar` (anti-nested-tabs), `BottomStrip` (30px) inspection, anti-floating tooltips, `FloatingDetailsPanel` 8-way resize & pinning. |
| **04: Code Limits & Purity** | [`04_code_limits_purity.py`](./04_code_limits_purity.py) | Max 200 lines/file, one component/file, top-level purity (`App.tsx`), ASCII flowchart docblocks, bold section borders, descriptive naming. |
| **05: Real Data & Anti-Mock** | [`05_real_data_anti_mock.py`](./05_real_data_anti_mock.py) | Zero-placeholder tokens (`"placeholder"`, `"lorem ipsum"`, `"dummy"`), ban on fake dummy arrays, mandatory `<EmptyState>`. |
| **06: Anti-Stub & Asset Depth** | [`06_anti_stub_asset_depth.py`](./06_anti_stub_asset_depth.py) | **CRITICAL**: Zero empty/TODO function bodies, zero no-op handlers (`() => {}`), real service/SDK bindings, non-trivial returns. |
| **07: Backend Storage Decoupling** | [`07_backend_storage_isolation.py`](./07_backend_storage_isolation.py) | Control Plane (`/api/auth`) vs Data Plane (`/api/storage`), direct presigned transfers (ban on `/tmp` file proxying), `CredentialField`. |
| **08: API Security & Governance** | [`08_api_security_governance.py`](./08_api_security_governance.py) | 8-gate request pipeline, rate limiting, anti-polling (>= 5000ms delay or SSE), sanitized error messages (no stack leaks). |
| **09: Test Coverage Integrity** | [`09_test_coverage_integrity.py`](./09_test_coverage_integrity.py) | Companion `*.test.ts(x)` for every feature module, anti-test-stub (bans `expect(true).toBe(true)`), real operational assertions. |
| **10: App Architecture Spec** | [`10_app_architecture_spec_validator.py`](./10_app_architecture_spec_validator.py) | 4 canonical planes (`src/{frontend, backend, libraries, frontend-state}`), single entrypoint facade, root preservation. |
| **11: Multi-Target Build Spec** | [`11_multi_target_build_spec_validator.py`](./11_multi_target_build_spec_validator.py) | Dual target build manifests (`fullstack.json`, `api.json`), `httpsAdapter.ts`, `wrangler.toml`, context-neutral orchestrations. |
| **12: Serverless Deployment Budget** | [`12_serverless_deployment_limits.py`](./12_serverless_deployment_limits.py) | 50MB Hobby / 250MB Pro Vercel function limits, `output: 'standalone'`, tree-shaking, devDependencies isolation, external CDN media. |
| **Full System Pipeline** | [`full_system_validator.py`](./full_system_validator.py) | Master pipeline orchestrating Aspects 01-12 with weighted scoring, executive compliance scorecard, and exit code gate. |

---

## Execution Guide

### In Google AI Studio (Python Code Execution)
When prompting in Google AI Studio with code execution enabled:
```python
import subprocess
result = subprocess.run(["python3", "checklists/full_system_validator.py", "."], capture_output=True, text=True)
print(result.stdout)
assert result.returncode == 0, "Architectural validation failed!"
```

Or execute an individual aspect:
```python
import subprocess
result = subprocess.run(["python3", "checklists/06_anti_stub_asset_depth.py", "."], capture_output=True, text=True)
print(result.stdout)
```

### In Local Terminal / CI
```bash
# Run full system validator
python3 checklists/full_system_validator.py .

# Run with Node.js bridge
node checklists/runner.mjs .

# Run a specific aspect
python3 checklists/full_system_validator.py --aspect stub .
```
