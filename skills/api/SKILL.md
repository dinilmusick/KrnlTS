---
name: api-guidelines
description: Directives for API surface parity, external endpoint triggering, observable UI state synchronization, and endpoint contracts.
---

# API DEVELOPMENT & EXPOSURE GUIDELINES

## 1. FEATURE-TO-API PARITY
```
∀ feature ∈ Application_Features:
  ∃ endpoint(feature) s.t. 
    signature(endpoint) ≡ signature(feature) ∧ 
    accessible(endpoint, scope = EXTERNAL_CALLABLE)
```
- **Rule**: Every single application feature MUST expose a matching API endpoint with identical functionality, callable by external services or CLI automation.

---

## 2. OBSERVABLE STATE & UI MONITORING
```
function onExternalEndpointInvocation(req, endpoint):
    executeBackendLogic(endpoint, req.payload)
    emitSyncEvent(event_type = "EXTERNAL_API_MUTATION", payload = req.payload)
    triggerVisibleUIStateChange(screen_target = endpoint.domain)
// Silent / phantom API execution is strictly forbidden. External calls MUST be visible in UI monitoring state.
```
- **Zero Phantom Operations**: Any mutation or execution triggered via an API endpoint must reflect immediately as a visual UI status / state change in the frontend.

---

## 3. ENDPOINT CONTRACT & DOCUMENTATION
- All endpoints must declare:
  - Exact route path (`/api/v1/...`)
  - Request schema & input validation types
  - Response payload structure
  - Error state mappings (deterministic HTTP status codes)
- Every route creation or change must update the API registry in documentation immediately.
