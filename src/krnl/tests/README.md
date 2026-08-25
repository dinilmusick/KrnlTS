# Test Harnesses & Validation (`src/krnl/tests/`)

## 1. Directory Purpose & Architectural Role
Houses internal unit tests, contract validation suites, and mock fixtures testing core Gross Architecture primitives, protocol serialization, and data layer invariants.

## 2. Testing Directives
- Every new feature or core modification must include an accompanying automated test case.
- All test suites must execute in complete isolation with zero shared mutable state.
