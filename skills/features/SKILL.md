---
name: feature-lifecycle-guidelines
description: Directives for incremental codebase evolution (anti-nuke / no rewrite-from-scratch on big changes), absolute zero-trace feature purges (no zombie/commented-out code), and orphan elimination.
---

# FEATURE LIFECYCLE, EVOLUTION & PURGE GUIDELINES

## 1. INCREMENTAL EVOLUTION INVARIANT (ANTI-NUKE / NO REWRITE-FROM-SCRATCH)
```
∀ task ∈ Major_Changes ∨ Complex_Refactors ∨ Architecture_Pivots:
  approach ≡ SURGICAL_INCREMENTAL_EVOLUTION
  nuke_and_rebuild_from_scratch ≡ STRICTLY_FORBIDDEN
```

### Directives on Major / Complex Changes:
- **Consult `docs/HISTORY.md` First**: Before beginning any major refactor, the agent MUST read `docs/HISTORY.md` to refresh memory on past user intents, constraints, and architecture decisions.
- **NEVER Nuke Working Code**: AI agents MUST NEVER wipe out whole project directories, delete existing files wholesale, or rebuild the entire codebase from scratch when requested to make a large change or architectural pivot.
- **Surgical In-Place Modification**: Transform the system incrementally. Identify specific files and functions requiring modification, preserving all working components, edge-case handlers, and helper libraries.
- **Preserve Unaffected Subsystems**: Unrelated services, orchestrations, quad-units, UI views, and concept utilities must remain completely intact.
- **Record in `docs/HISTORY.md`**: Upon completing major changes, append a bulleted entry in `docs/HISTORY.md` capturing the user's intent, rationale, and specific structural changes.
- **Why This Matters**: Rewriting from scratch wipes out customized user configurations, introduces massive regression surfaces, and causes severe instability.

---

## 2. ABSOLUTE ZERO-TRACE FEATURE PURGE PROTOCOL
```
TRIGGER: User requests removal / deprecation / deletion of a feature or pipeline.
REQUIREMENT: 100% Complete Eradication across ALL layers simultaneously.
FORBID: Zombie code, commented-out blocks, disabled flags, dangling stubs.
```

### Complete Multi-Layer Deletion Checklist:
```
[ ] 1. Functionality Quad-Unit Folder:
       • Completely delete: krnl/backend/functionalities/<FeatureName>/ and krnl/frontend/functionalities/<FeatureName>/
       • Eradicate: <FeatureName>Atom.ts, main_function/ (logic.ts, lifecycle.ts),
         state_data/state.ts, helper_functions/, events/, manifest.json.
[ ] 2. Service Facade & Orchestrator:
       • Remove imports, functionality registration, and flow references from services/<Service>/ and orchestrations/<Orchestration>/.
[ ] 3. System Ingress Surface & Routing:
       • Remove route handlers, endpoint mappings, and WebSocket actions from assembler.ts & protocol_adapters/.
[ ] 4. UI Layer & Packages:
       • Remove all buttons, tiles, forms, views, modals, and dedicated assets from frontends/.
[ ] 5. State & Storage:
       • Remove reactive store slices, action reducers, and database tables/schemas exclusive to this feature.
[ ] 6. Concept Libraries:
       • Remove feature-exclusive utility functions from libraries/{Domain}Concepts.ts (preserve shared ones).
[ ] 7. Tests & Documentation:
       • Delete test files, mock fixtures, API documentation entries, and SKILL.md references.
[ ] 8. Dependencies:
       • Remove feature-exclusive packages from package.json and krnl.json.
```

---

## 3. STRICT ZERO-ZOMBIE RULES (NO PARTIAL DELETION)
1. **Zero Commented-Out Code**: Never comment out deprecated code (`/* ... */` or `// ...`). If a feature is deleted, the code must be fully deleted from the filesystem.
2. **Zero `if (false)` or Feature Flag Leftovers**: Never disable dead features via boolean guards or unused configuration flags.
3. **Prevent Agent & Developer Confusion**: Commented-out or zombie code misleads future AI agents and human developers into believing the feature is partially maintained or safe to invoke.
4. **Hard Deletes Only**: Delete all references cleanly and atomically.

---

## 4. POST-DELETE VERIFICATION PIPELINE
```python
def verify_feature_purge(feature_name: str, alias_terms: list[str]):
    # 1. Global Grep: Assert 0 residual textual references
    for term in [feature_name] + alias_terms:
        matches = grep_search(query=term, search_path=project_root)
        assert len(matches) == 0, f"Error: Residual trace of '{term}' found in {matches}!"

    # 2. Assert zero orphaned imports
    orphans = scan_for_orphaned_imports()
    assert len(orphans) == 0, f"Error: Dangling imports remaining: {orphans}"

    # 3. Assert zero dead endpoints
    dead_routes = scan_for_dead_endpoints()
    assert len(dead_routes) == 0, f"Error: Dangling API routes found: {dead_routes}"

    # 4. Verify clean project build
    run_build_verification()
```
