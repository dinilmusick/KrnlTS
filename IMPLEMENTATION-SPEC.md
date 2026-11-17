# KRNLWP — IMPLEMENTATION SPECIFICATION

KrnlWP is the WordPress/PHP counterpart to KrnlTS. It owns service runtime semantics, lifecycle, contracts, validation and WordPress integration boundaries.

SERVICE := executable backend unit.
FUNCTIONALITY := discrete callable execution unit belonging to one service.
FUNCTIONALITY_ORCHESTRATION := DAG composition of functionalities belonging to one service.

KrnlWP MUST remain independent of KloksWP, FrnlWP, FloksWP and SkipoWP.
