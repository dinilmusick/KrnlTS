---
name: libraries-concepts-guidelines
description: Directives for root libraries/ folder, {Domain}Concepts naming pattern, and pure utility reuse.
---

# LIBRARIES & CONCEPTS GUIDELINES

## 1. FORMAL CONSTRAINTS

$$\forall f \in \text{src/libraries/}: \text{Match}(f, `^[A-Z][a-zA-Z0-9]*Concepts\.(ts|js)\$`) \wedge \text{Pure}(f)$$

$$\text{Imports}(\text{Entities}) \cap \text{src/libraries/*} = \emptyset \quad (\text{Libraries callable ONLY by Functionalities})$$

## 2. STANDARD MODULES & SCOPE

| Module | Canonical Domain Responsibilities |
| :--- | :--- |
| `MathConcepts.ts` | Vectors, matrix transforms, pure algebraic calculations |
| `DataConcepts.ts` | Canonical lenses, immutable diffing, indexing, grouping |
| `ValidationConcepts.ts` | Type narrowing, schema assertions, contract verification |
| `GraphConcepts.ts` | Node/edge traversals, topological sorting, DAG cycles |
| `StringConcepts.ts` | Tokenizers, slugifiers, regex parsers, string templates |
| `StateConcepts.ts` | State machine transitions, event reducers |

## 3. PLACEMENT ALGORITHM

```python
def route_utility(fn, domain):
    if is_cross_cutting(fn):
        return f"src/libraries/{domain}Concepts.ts" # Pure, reusable L0A
    return f"src/functionalities/{feature}/helper_functions/{fn.name}.ts"
```
