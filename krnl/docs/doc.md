# Krnl Base Documentation

The `krnlBase` is the mother library of the entire Krnl stack. Every system (Brnda, Qwnsr, Wepr, Symba, Mosy, and any future system) is built on top of it.

---

## 📚 Handbook (Start Here)
Comprehensive guides on how to **use** the library:
- **[Getting Started](handbook/getting_started.md)**: Entities, functionalities, state, hierarchy.
- **[Networking Guide](handbook/networking.md)**: Inter-system wiring using `commComponent`. **Read this before writing any new system.**
- **[API Reference](handbook/api_reference.md)**: Every class and method, with signatures and examples.
- **[Design Principles](handbook/design_principles.md)**: The rules that must never be broken.

---

## 🧩 JavaScript Implementation

### Entities
- [JS Entities Overview](js/entities/doc.md)
- [krnlEntityBase](js/entities/krnlEntityBase/) — Base for all entities.
- [krnlSystemEntityBase](js/entities/krnlSystemEntityBase/) — Base for all **system orchestrators**. Provides `commComponent`.
- [krnlSystemOrchestrator](js/entities/krnlSystemOrchestrator/) — Adds UDP network discovery on top of `krnlSystemEntityBase`.

### Core Libraries
- [JS Libraries Overview](js/libraries/doc.md)
- [Messaging Concepts](js/libraries/krnlNetworking/MessagingConcepts/) — `krnlEmitter`, `krnlCollector`, `krnlInterface`, **`krnlSystemCommComponent`**.
- [Core Function Atoms](js/libraries/krnlCoreFunctionAtoms/) — `rMap`, `rFind`, `rFindIndex`, etc.
- [Base Concepts](js/libraries/krnlBaseConcepts/) — Enums, data primitives.
- [Error Concepts](js/libraries/krnlErrorConcepts/) — `krnlError`, `krnlErrorCodes`.
- [Networking Concepts (doc)](js/libraries/krnlNetworking/NetworkingConcepts/doc.md) — Intra vs. inter-system networking design.

---

## Go Implementation
- [Go Implementation](go/doc.md)