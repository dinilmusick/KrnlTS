# Skipo Framework

Skipo is the application framework and governance engine for Skipo-based projects.

## Distribution model

The **Skipo GitHub repository remains private**. The public consumption boundary is npm.

The release pipeline produces the public package:

- `@ultrst-armada/skipo` — the self-contained framework CLI and engine.

The npm package does not download or clone the private Skipo repository at runtime.

## Consumer workflow

Create a project:

```bash
npx @ultrst-armada/skipo create MyApp
```

Or use the framework directly:

```bash
npx @ultrst-armada/skipo inspect .
npx @ultrst-armada/skipo check .
npx @ultrst-armada/skipo fix .
npx @ultrst-armada/skipo update .
npx @ultrst-armada/skipo test .
```

The same npm-distributed engine can run in:

- a local developer environment;
- a Google AI Studio / local coding-agent environment;
- an ATAX GitHub Actions runner.

GitHub is therefore the **source/release system**, while npm is the **distribution system**.

## Release model

The private repository publishes from tags matching:

```text
skipo-v<version>
```

The root Skipo version and the npm package version must match the release tag.

The GitHub workflow uses npm Trusted Publishing (OIDC), so normal releases do not require a long-lived npm token. npm requires a trusted-publisher relationship for each package and the workflow has `id-token: write`. npm currently requires Node 22.14+ and npm 11.5.1+ for trusted publishing; the release workflow uses Node 24.

Because the source repository is private, npm provenance attestations are not generated for these releases; this is an npm limitation for packages published from private repositories.

## One-time npm setup

After the package exists on npm, configure the GitHub Actions trusted publisher for the package:

- Organization/user: `dinilmusick`
- Repository: `Skipo`
- Workflow filename: `publish-skipo-cli.yml`
- Allow `npm publish`

npm documents this as the token-free recommended CI/CD publishing mechanism.
