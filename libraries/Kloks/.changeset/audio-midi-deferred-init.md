---
"@kloks/audio-midi": major
---

**Breaking:** Importing audio/MIDI no longer initializes browser hardware or wires global state-graph bridges. Service facades initialize bridges when started; direct engine consumers must call `initializeAudioMidiEngineBridges()` before relying on state-graph integration. Web Audio and device discovery remain available through explicit initialization.
