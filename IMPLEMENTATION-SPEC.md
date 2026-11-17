# FRNLWP — IMPLEMENTATION SPECIFICATION

FrnlWP is the WordPress frontend semantic runtime counterpart to FrnlTS. It owns component state, properties, events, visual parameters, themes, scope and runtime orchestration. Concrete reusable UI belongs to FloksWP.

WordPress/PHP handles registration and configuration; browser JS handles interactive runtime. FrnlWP MUST NOT own the Elementor component catalog.