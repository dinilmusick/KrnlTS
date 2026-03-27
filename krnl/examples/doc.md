# Krnl Storybook + Exhibits

The storybook is now the primary website for learning and testing Krnl:

- Path: `krnl/examples/storybook/index.html`
- It embeds all exhibits in a live iframe.
- You can switch between exhibits without leaving the page.
- It includes a vNext Local/Remote playground.

## Exhibits

- `exhibit0`: function atoms
- `exhibit1`: base concepts + data factory
- `exhibit2`: error concepts
- `exhibit3`: state manager
- `exhibit4`: entity hierarchy
- `exhibit5`: returned functionalities (legacy compatibility)
- `exhibit6`: broadcast functionalities (legacy compatibility)
- `exhibit7`: system orchestration

## Important: run with HTTP server

Do not open exhibits from `file://` URLs because browser module imports are blocked.

```bash
python -m http.server 4173
# open http://localhost:4173/krnl/examples/storybook/index.html
```
