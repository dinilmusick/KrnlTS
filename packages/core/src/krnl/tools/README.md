# Tools & Concept Libraries (`src/krnl/tools/`)

## 1. Directory Purpose & Architectural Role
Encapsulates pure deterministic mathematical logic ($L_0$), pure data transformations ($L_1$), safe IO wrappers ($L_2$), and AST static analysis tools.

## 2. File Manifest
| File | Responsibility | Layer |
| :--- | :--- | :--- |
| `MathConcepts.ts` | Pure deterministic arithmetic, statistical calculations, geometry, and curve formulas. | $L_0$ |
| `StringConcepts.ts` | Pure string formatting, template interpolation, slugification, and text hashing. | $L_0$ |
| `ValidationConcepts.ts` | Pure assertion and type validation utilities. | $L_1$ |
| `DataConcepts.ts` | Pure array, tree, and immutable object transformation helpers. | $L_1$ |
| `GraphConcepts.ts` | Pure graph topological sorting, cycle detection, and adjacency tree calculations. | $L_1$ |
| `KrnlFS.ts` | Atomic file read/write, file locking (`FileLock`), and directory walk utilities. | $L_2$ |
| `KrnlHTTP.ts` | Resilient fetch wrapper with timeouts, retries, and JSON parsing. | $L_2$ |
| `K_LIB_Krnl_Source_Analyzer.ts` | AST parser verifying 4-layer function separation, file line limits, and purity rules. | $L_1$ |
| `ObjectKit.ts` | High-performance deep-clone and deep-merge utilities. | $L_1$ |

## 3. Purity Rules
- $L_0$ and $L_1$ tools must NEVER perform side-effects, file access, or network IO.
