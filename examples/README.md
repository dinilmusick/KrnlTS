# Examples & Integration Test Suites (`examples/`)

## 1. Directory Purpose & Architectural Role
Contains end-to-end integration exhibits, runnable systems, and automated regression test harnesses verifying the full feature set of `@dinilmusick/krnlts`.

## 2. Test Manifest
| Test Script / Directory | Responsibility |
| :--- | :--- |
| `test_all_examples.js` | Master regression runner executing all integration test suites sequentially. |
| `test_universal_backend.js` | Comprehensive test verifying Control Plane, AdminGuard, SQLite, PostgreSQL, Supabase, and Functionality Table CRUD engine. |
| `test_schema.js` | Zod and Protobuf input/output schema validation tests. |
| `test_registry.js` | Central app registry and dynamic port resolution tests. |
| `test_resilience.js` | RPC timeout, retry logic, and connection drop recovery tests. |
| `test_telemetry.js` | Sub-millisecond latency and memory tracking validation. |
| `frontend_demo/` | In-process frontend generation and web server demonstration. |
| `magnetic_demo/` | Filesystem auto-mounting and magnetic loader demonstration. |
| `example1/` | P2P entity network communication exhibit. |

## 3. Running Tests
```bash
# Run all regression tests
node examples/test_all_examples.js

# Run universal backend test
node examples/test_universal_backend.js
```
