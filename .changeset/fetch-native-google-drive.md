---
"@ultrst-armada/kloks": major
---

**Breaking — Kloks 2.0.0:** The legacy Node Google Drive adapter and OAuth exports are removed. Use the Fetch-native `GoogleDriveWorkspaceService` from `@ultrst-armada/kloks/backend/storage-workspace`; Node storage factories delegate to that service. Kloks no longer declares `googleapis` as a peer dependency. GutTS retains its own optional `googleapis` peer solely for the separate aggregate Node Google Drive integration; neither the GutTS S3-only subpath nor Kloks' Fetch-native Drive entrypoint requires it.

The root package version is explicitly set to `2.0.0` because Kloks' npm Trusted Publishing workflow publishes the version declared in `package.json`; it does not apply Changesets automatically.
