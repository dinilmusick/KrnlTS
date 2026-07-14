---
name: krnlts-router
description: Router skill to guide the developer agent to the relevant KrnlTS subsystem sub-skill.
---

# KrnlTS Agent Router Guide

Welcome. This is the main router guide for developing, debugging, or using the **KrnlTS/KrnlJS** library. When executing any task on this codebase or any downstream app, inspect the task category below and load the relevant sub-skill using the `view_file` tool.

## Sub-Skills Directory

### 1. Core Architecture & Conventions
*   **Skill Path**: [architecture/SKILL.md](file:///Users/dinil/Desktop/Projects/Javascript/KrnlTS/krnlts-guide/skills/architecture/SKILL.md)
*   **Use When**: Designing entity files, adding functionalities, organizing file hierarchy, resolving module imports (the `.js` rule), or destructuring the main function context.
*   **Key Focus**: Avoids duplicating structural setup, explains the difference between `subapps/` (backend) and `frontends/` (UI).

### 2. Krnl-Tools Utility Suite
*   **Skill Path**: [utility-tools/SKILL.md](file:///Users/dinil/Desktop/Projects/Javascript/KrnlTS/krnlts-guide/skills/utility-tools/SKILL.md)
*   **Use When**: Doing filesystem operations, running shell commands, managing environment variables, handling concurrency, strings, objects, caching, or fetching HTTP.
*   **Key Focus**: Prevents downstream devs from importing external node libraries or writing redundant file-write, shell, or cache wrappers.

### 3. Agentic Layer & Orchestration
*   **Skill Path**: [ai-orchestration/SKILL.md](file:///Users/dinil/Desktop/Projects/Javascript/KrnlTS/krnlts-guide/skills/ai-orchestration/SKILL.md)
*   **Use When**: Configuring agentic endpoints, editing agent specifications, customizing the application orchestrator routing/learning loops, injecting persistent memories (endpoint/orchestrator learnings), or wiring built-in tools.
*   **Key Focus**: Explains the Zod-to-JSON mapping, how endpoint agents utilize prior memory, and how the orchestrator updates specs dynamically.

### 4. Ports, Access Control & Ingress Network
*   **Skill Path**: [network-ingress/SKILL.md](file:///Users/dinil/Desktop/Projects/Javascript/KrnlTS/krnlts-guide/skills/network-ingress/SKILL.md)
*   **Use When**: Managing service port registration, setting endpoint key security gates, setting up zero-port ingress networks, routing WS RPCs, or proxying requests.
*   **Key Focus**: Prevents port conflicts and shows how multiple subapps share a single OS gateway port. Includes the dynamic port discovery fallback chain.

### 5. Frontend & UI Systems
*   **Skill Path**: [frontends/SKILL.md](file:///Users/dinil/Desktop/Projects/Javascript/KrnlTS/krnlts-guide/skills/frontends/SKILL.md)
*   **Use When**: Customizing the default admin panel dashboard, modifying get/set definitions routes, registering custom Vite/Next.js UI block containers, or viewing telemetry log outputs.
*   **Key Focus**: Explains the live-refreshing frontend driven by `getEndpointDefinitions` and how custom UI adapter processes are registered.
