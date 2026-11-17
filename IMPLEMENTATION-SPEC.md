# SKIPOWP — IMPLEMENTATION SPECIFICATION

SkipoWP is the WordPress application construction/composition counterpart to Skipo.

BACKEND := KrnlWP + KloksWP.
FRONTEND := FrnlWP + FloksWP + WordPress/Elementor.
UTILITIES := GutWP.

SkipoWP owns scaffolding, generators, configuration, composition, validators and application wiring. It does not reimplement lower-layer internals.