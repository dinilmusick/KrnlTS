# Detached Forge Snapshot

This directory is a one-time extracted snapshot used as source material for the embedded Kloks WASM runtime.

There is intentionally no Git submodule, Git remote, upstream sync workflow, runtime fetch, build-time fetch, or package dependency on the wasm-oj/forge Git repository.

The upstream revision used for provenance is recorded in PROVENANCE-UPSTREAM-REVISION.txt.
Forge and third-party license/attribution material is preserved under licenses/.

Published npm compiler/runtime artifacts are vendored only as a one-time source/material snapshot. They are not consumed as live dependencies of this workspace.
