---
name: external-interface-spec
description: Canonical HTTPS and MCP external interface contract for every Skipo application.
---

# Skipo External Interface Specification

Every Skipo application exposes two protocol adapters over one canonical capability registry: HTTPS (Web Fetch) and MCP Streamable HTTP. The adapters are application infrastructure, not module-host functionality.

## Invariants

1. Business logic exists only in backend services/facades. Adapters perform protocol translation, validation, authorization, and error serialization.
2. Every externally callable capability has a stable ID, description, JSON input schema, JSON output schema, and explicit service/operation invocation mapping.
3. Capability exposure is opt-in. Registration defaults to authenticated access; public access must be explicit. Role-gated capabilities require a matching principal role.
4. The application's authentication adapter must validate requests with the canonical identity authority (Luth in generated applications). Caller-supplied identity headers are never trusted.
5. HTTP and MCP call the same registry invocation method. Neither protocol calls a service implementation directly.
6. Discovery filters capabilities through the same authorization policy as invocation.
7. Input and output values are checked against declared JSON schemas. Errors are normalized and internal exceptions are never serialized.
8. MCP supports JSON-RPC initialize, ping, tools/list, and tools/call over POST /mcp.
9. HTTP endpoints are GET /api/capabilities, GET /api/capabilities/:id, POST /api/capabilities/:id/invoke, and GET /api/openapi.json.
10. New application scaffolds must mount both adapters on the universal Fetch entrypoint. Existing Aiko/FOD routes remain independently owned and are not removed by this interface layer.

A future workflow-backed provider may register an invocation mapping without changing either adapter. This specification does not implement Aiko workflow exposure, FOD, or a module host.
