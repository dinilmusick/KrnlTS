---
name: krnlts-runtime-router
description: Sub-router activated when @ultrst-armada/krnl is detected in a project, directing agents to KrnlTS-specific runtime mechanisms, MagneticLoader, Flows, Utility Tools, and Ingress Gateway.
---

# KRNLTS RUNTIME EXTENSION ROUTER

This sub-router is activated **strictly when a project uses `@ultrst-armada/krnl`** (as detected via `package.json`, `krnl.json`, or `@ultrst-armada/krnl` imports).

It extends the universal **Skipo Base Skills** with concrete KrnlTS library mechanics.

---

## 1. KRNLTS SUBSYSTEM ROUTING MATRIX

| Subsystem / Task | Target Skill File | Directives & Primitives Covered | Trigger Keywords |
| :--- | :--- | :--- | :--- |
| **Core Entity & Flows** | [`runtime/SKILL.md`](./runtime/SKILL.md) | `Entity<TState, TEvents>`, `this.flow()`, `this.call()`, capability bubbling, resolution | `krnl_entity`, `flow_builder`, `resolve_capability`, `emit_event` |
| **Magnetic Discovery & Loaders** | [`magnetic-loader/SKILL.md`](./magnetic-loader/SKILL.md) | `KrnlMagneticLoader.loadAll()`, boot order invariants | `magnetic_loader`, `load_all`, `boot_order` |
| **Krnl-Tools Utility Suite** | [`utility-tools/SKILL.md`](./utility-tools/SKILL.md) | `KrnlFS`, `KrnlEnv`, `KrnlShell`, `AsyncKit`, `ObjectKit`, `CacheKit` | `krnl_fs`, `krnl_env`, `file_lock`, `p_limit`, `deep_clone` |
| **Ingress & Port Gateway** | [`network-ingress/SKILL.md`](./network-ingress/SKILL.md) | Unified HTTP/WS port (`/call/{fid}`), dynamic discovery fallback chain, MCP surface | `unified_adapter`, `comm_port`, `port_discovery`, `mcp_gateway` |
| **AST Validator & CI Gates** | [`validation-cli/SKILL.md`](./validation-cli/SKILL.md) | `krnlts-validate`, `krnlts-watch`, 4-layer purity AST parser, multi-tier line limits | `krnlts_validate`, `purity_rules`, `ast_validation`, `ci_gate` |

---

## 2. DETERMINISTIC KRNLTS DISPATCH LOGIC
```python
def dispatch_krnlts_subsystem(task_intent: str) -> str:
    mapping = {
        "runtime": ["krnl_entity", "flow_builder", "resolve_capability", "emit_event", "state_mutation"],
        "magnetic-loader": ["magnetic_loader", "load_all", "boot_order"],
        "utility-tools": ["krnl_fs", "krnl_env", "file_lock", "p_limit", "deep_clone", "cache_kit"],
        "network-ingress": ["unified_adapter", "comm_port", "port_discovery", "mcp_gateway", "websocket_rpc"],
        "validation-cli": ["krnlts_validate", "purity_rules", "ast_validation", "ci_gate", "compiler_rules"]
    }
    for subskill, keywords in mapping.items():
        if any(kw in task_intent.lower() for kw in keywords):
            return f"./{subskill}/SKILL.md"
    return "./runtime/SKILL.md"  # Default fallback
```
