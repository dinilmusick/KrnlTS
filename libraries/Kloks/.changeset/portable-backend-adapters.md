---
"@ultrst-armada/kloks": major
"@kloks/backend": major
---

**Breaking:** Portable backend exports no longer include Node filesystem/server adapters. Import those capabilities from `@kloks/backend/node` or `@kloks/backend/storage/node`; the generic `/backend` entry remains Fetch-compatible and Worker-safe.
