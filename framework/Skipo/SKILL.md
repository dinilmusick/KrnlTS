---
name: skipo-application-composer
description: Deterministic Skipo application construction, capability composition, migration, drift detection, repair and verification.
---

# SKIPO APPLICATION COMPOSER

Canonical application contract: [architecture/app-architecture/SKILL.md](./architecture/app-architecture/SKILL.md). Workspace architecture: [architecture/workspace-architectures/SKILL.md](./architecture/workspace-architectures/SKILL.md).

Skipo is an application framework, not an agent manager.

## Canonical engine

```text
registry → resolver → composer → verifier
                  ↑        |
                  └ repair ← drift detector
```

## Commands

```bash
python3 scripts/skipo_cli.py adopt .
python3 scripts/skipo_cli.py diagnose .
python3 scripts/skipo_cli.py plan .
python3 scripts/skipo_cli.py add auth
python3 scripts/skipo_cli.py add workspace
python3 scripts/skipo_cli.py add service storage
python3 scripts/skipo_cli.py add service midi
python3 scripts/skipo_cli.py add ui settings
python3 scripts/skipo_cli.py sync .
python3 scripts/skipo_cli.py update .
python3 scripts/skipo_cli.py repair .
python3 scripts/skipo_cli.py verify .
python3 scripts/skipo_cli.py test .
```

Applications are composed from canonical Floks/Kloks providers. Agents must not hand-code infrastructure that exists as a registered capability.

## BLOCKING VERIFICATION GATE

A task is complete only when `python3 scripts/skipo_cli.py verify .` exits 0 and the full Skipo validation suite passes.

## Drift policy

A canonical capability has one implementation. A local implementation is classified as:

- `keep`: no canonical duplicate detected.
- `adapt`: application code already uses the canonical provider and can remain app-owned.
- `retire`: a known duplicate is present and the registry explicitly marks it safe to remove.

Repair must re-run verification after every mutation.

## Boundaries

ATAX = agent coordination/state/evidence.
Skipo = deterministic application construction and evolution.
Kloks = canonical backend services.
Floks = canonical UI.
Luth = authentication authority.
