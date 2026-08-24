---
name: libraries-concepts-guidelines
description: Directives for the root-level libraries folder, {Name}Concepts naming convention, shared data structures, and cross-cutting utility functions.
---

# LIBRARIES & CONCEPTS GUIDELINES

## 1. ARCHITECTURAL PLACEMENT
```
[Root / System Level]
├── SystemEntity.ts (Entry Point / System Entity extending Entity)
├── entities/       (Domain Entities & Functionalities)
└── libraries/      (Universal Shared Utilities & Concepts)
      ├── MathConcepts.ts
      ├── DataConcepts.ts
      ├── ValidationConcepts.ts
      ├── GraphConcepts.ts
      ├── StringConcepts.ts
      ├── StateConcepts.ts
      └── UIConcepts.ts
```
- **Built-in Standard Library**: `@dinilmusick/krnlts` exports pre-built uniform template modules (`DataConcepts`, `ValidationConcepts`, `MathConcepts`, `StringConcepts`, `GraphConcepts`, `StateConcepts`).
- **Project-Level Extensions**: Custom domain concepts live in `libraries/{Domain}Concepts.ts`.

---

## 2. NAMING CONVENTION (`{Name}Concepts`)
```
∀ file ∈ libraries/:
  filename(file) ≡ `${DomainName}Concepts.${ext}`
```
- **Rule**: Every utility/library file MUST strictly follow the `{Name}Concepts` naming pattern (e.g. `StringConcepts.ts`, `TreeConcepts.ts`, `CacheConcepts.ts`).
- **Convention Equivalent**: Replaces conventional `utils/` or `helpers/` bags with domain-bounded Concept files.

---

## 3. CONTENTS & RESPONSIBILITIES
- **Shared Data Structures**: Canonical interfaces, types, schemas, and data structures utilized across multiple entities.
- **Common Functions**: Pure, deterministic polymorphic template functions (`<TIn, TOut>`) invoked across diverse codebase assets.
- **Uniform Calling Syntax**: Functions follow standard operator signatures (`Concept.transform`, `Concept.validate`, `Concept.query`, `Concept.extract`).
- **Independence**: Concept files must remain decoupled from specific entity state or backend runtime bindings.

---

## 4. CODE REUSE RULE
```python
def on_utility_creation(function_or_struct, domain):
    target_file = f"libraries/{domain}Concepts.ts"
    if is_used_across_multiple_entities(function_or_struct):
        append_to_concept_library(target_file, function_or_struct)
    else:
        # Local to single functionality
        place_in_feature_helpers_folder(function_or_struct)
```
