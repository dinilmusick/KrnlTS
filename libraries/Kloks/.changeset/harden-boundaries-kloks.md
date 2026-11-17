---
"@ultrst-armada/kloks": major
---

**Breaking:** The aggregate package now exposes platform boundaries explicitly. Generic server consumers should import `@ultrst-armada/kloks/backend`; Node adapters and browser audio/MIDI capabilities require their explicit subpaths.
