# FLOKSWP — IMPLEMENTATION SPECIFICATION

FloksWP is the concrete frontend element library counterpart to Floks. It is built on FrnlWP and targets WordPress/Elementor.

UI_PRIMITIVE := atomic reusable Elementor-compatible element.
UI_COMPOSITE := reusable element composed from semantic children, Slots, state or Flows.

FrnlWP owns runtime semantics; FloksWP owns concrete UI. Backend capabilities remain in KrnlWP/KloksWP.