# TypeScript → PHP / WordPress equivalence

KrnlWP intentionally mirrors KrnlTS semantics while using native PHP, WordPress and mature Composer libraries.

| TypeScript system | WordPress/PHP analogue | Ownership |
|---|---|---|
| KrnlTS service runtime | KrnlWP Service + ManagedService | KrnlWP |
| Functionality | KrnlWP Contract\Functionality | KrnlWP |
| FunctionalityOrchestration | KrnlWP Runtime\Orchestrator | KrnlWP |
| Event system | Symfony EventDispatcher + WP hooks adapter | KrnlWP |
| DI/container | Symfony DependencyInjection | KrnlWP |
| Runtime validation / Zod | Symfony Validator | KrnlWP |
| AST validation / ts-morph | nikic/php-parser (future validator layer) | KrnlWP |
| p-queue / queued work | Action Scheduler; Messenger remains a transport abstraction | KrnlWP |
| WebSocket / protocol adapters | WordPress REST plus protocol adapters | KrnlWP |
| State primitives | StateStore; persistent state delegates to WP options/meta/cache | KrnlWP/KloksWP |
| better-sqlite3 / storage adapters | WordPress DB, options/meta and cache abstractions | KloksWP |
| GutTS | GutWP | GutWP |
| FrnlTS | FrnlWP | FrnlWP |
| Zustand frontend runtime | FrnlWP browser runtime; Zustand remains the reference JS state mechanism | FrnlWP |
| Kloks | KloksWP | KloksWP |
| Floks | FloksWP + Elementor | FloksWP |
| Skipo | SkipoWP | SkipoWP |

**Rule:** reuse mature libraries first. KrnlWP should only implement semantics and adapters that are genuinely missing.
