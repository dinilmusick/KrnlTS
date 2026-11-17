# SkipoWP Laws

1. **Layer ownership is strict.** SkipoWP composes; it does not reimplement KrnlWP, FrnlWP, KloksWP, FloksWP or GutWP internals.
2. **Terminology is canonical.** Service, Functionality, FunctionalityOrchestration, Component, State, Event, Flow, Theme, Library and Application retain the same semantic meaning as the TS ecosystem.
3. **Prefer existing libraries.** Composer packages and WordPress/Elementor APIs are preferred over handwritten replacements.
4. **WordPress is the runtime boundary.** PHP owns server semantics; browser JavaScript owns interactive frontend runtime.
5. **Elementor is presentation infrastructure.** FloksWP owns concrete Elementor widgets; FrnlWP owns semantic frontend runtime.
6. **Generated assets stay small.** No individual source/code asset may exceed **200 lines**.
7. **Validate incrementally.** Small changes are linted and committed before the next architectural layer is added.
8. **Applications remain compositional.** A SkipoWP app should mostly declare configuration and compose reusable lower-layer assets.
