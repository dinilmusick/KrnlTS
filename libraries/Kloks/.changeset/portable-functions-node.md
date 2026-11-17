---
"@ultrst-armada/kloks": major
"@kloks/functions": major
"@kloks/backend": major
---

**Breaking:** Node filesystem and process utilities are no longer exported from the portable functions entry. Import `FileCache`, `loadEnv`, `readFile`, and shell/process utilities from `@kloks/functions/node`. Use `@kloks/functions/portable` for runtime-neutral utilities and `@kloks/functions/base` for the minimal base contracts. The compatibility root service facade uses the optional KrnlTS peer.
