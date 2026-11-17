# ULTRST Armada synchronization

The standalone repositories remain independently usable. This private workspace has imported source trees under `libraries/`, `scaffold/` and `apps/` with Git subtree history. The ATAX repository owns orchestration; Armada does not schedule agents.

## Components

| Component | Prefix | Standalone source |
|---|---|---|
| GutTS | libraries/GutTS | dinilmusick/GutTS |
| KrnlTS | libraries/KrnlTS | dinilmusick/KrnlTS |
| FrnlTS | libraries/FrnlTS | dinilmusick/FrnlTS |
| Kloks | libraries/Kloks | dinilmusick/Kloks |
| Floks | libraries/Floks | dinilmusick/Floks |
| Skipo | scaffold/Skipo | dinilmusick/Skipo |
| Aiko | apps/Aiko | dinilmusick/Aiko |
| SRKL | apps/SRKL | dinilmusick/Srkl-Engine |
| Kone | apps/Kone | dinilmusick/Kone |

## Inbound changes

From a fresh feature branch of Armada `main`, run:

```bash
bash scripts/sync-subtree.sh pull GutTS main
```

Review the resulting source diff, run relevant unit/integration checks, and open an Armada PR. The helper refuses a dirty tree or direct work on `main`.

## Outbound changes

From a fresh feature branch containing reviewed Armada edits to one component:

```bash
bash scripts/sync-subtree.sh split GutTS
```

This creates a local export branch. Compare its history to the standalone repository. Push **to a new branch** in that standalone repository and open a PR against its default branch. Do not force-push or bypass branch protections. Note that the split may include other edits to the same prefix; inspect the full diff before exporting.

## Operational requirements still pending

- A GitHub Actions sync controller to react to both origins, deduplicate echoes, map source SHAs and open safe PRs instead of direct pushes.
- Credential-isolated automated outbound branch publishing, with scoped permissions to the standalone repository.
- Conflicting concurrent edits must stop and request explicit reconciliation. Do not auto-resolve or force push.
- Automated proof of both inbound and outbound update cycles, including source lineage, branch divergence, idempotence, private source boundaries and cleanup.

Current scripts supply manual controlled Git subtree primitives, **not** a completed automatic two-way sync system. Avoid treating sync as production-ready until those tests pass.
