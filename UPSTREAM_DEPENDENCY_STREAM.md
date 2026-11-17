# Upstream dependency update stream

## Flow

1. GutTS, KrnlTS, FrnlTS, Kloks, or Floks completes its release workflow.
2. If a new package version was published, the release workflow sends a `repository_dispatch` event to Skipo with package, version, repository, and commit metadata.
3. Skipo runs `.github/workflows/dependency-sync.yml`, refreshes the tracked package ranges and lockfile, then runs build, typecheck, and tests.
4. A passing update is proposed through the `automation/upstream-dependency-sync` pull request. Skipo's normal pull-request CI runs again before merge.

The scheduled run every 15 minutes is a fallback for missed events. The automation intentionally opens or updates a PR rather than writing dependency changes directly to `main`.

## Required repository configuration

Add an Actions repository secret named `ECOSYSTEM_SYNC_TOKEN` to each upstream package repository:

- `dinilmusick/GutTS`
- `dinilmusick/KrnlTS`
- `dinilmusick/FrnlTS`
- `dinilmusick/Kloks`
- `dinilmusick/Floks`

The token must be authorized to create a repository-dispatch event in `dinilmusick/Skipo` (fine-grained token with repository Contents write permission is sufficient for the dispatch endpoint). The secret cannot be provisioned by repository workflow code; an owner must add it in GitHub repository settings.

If the secret is absent, the notification step logs a warning and exits without failing the package release. The scheduled Skipo sync remains active.

## Scope and safety

The sync workflow tracks `@dinilmusick/gutts`, `@ultrst-armada/krnl`, `@ultrst-armada/frnlts`, `@ultrst-armada/kloks`, and `@ultrst-armada/floks`. Build, typecheck, and tests must pass before the automation updates the dependency PR. The PR still requires the repository's normal review/merge policy; this workflow does not auto-merge dependency changes.
