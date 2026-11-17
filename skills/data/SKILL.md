---
name: data-integrity-guidelines
description: Directives for data integrity, zero mock data, real backend integrations, explicit error rendering, and AI provider constraints.
---

# DATA INTEGRITY GUIDELINES

## 1. ABSOLUTE PROHIBITION OF FAKE / MOCK DATA
```
FORBID:
  fake_data:       [mock_json, synthetic_records, hardcoded_placeholders]
  fake_services:   [stubbed_resolvers, mock_timers, fake_auth]
  fake_endpoints:  [dummy_endpoints, noop_handlers]

REQUIRE:
  ∀ visual_element ∈ Rendered_Components:
    source(visual_element) ∈ { real_backend_call, real_db_record, real_endpoint }
```

---

## 2. MISSING DATA & ERROR HANDLING
```
if isMissing(data) ∨ isNull(data) ∨ isError(data):
    renderExplicitErrorState(
        error_code = data.error_code,
        message = "Real backend returned no data or failed execution",
        remediation_action = retry | configure
    )
    FORBID(renderPlaceholderData)
    FORBID(renderSilentNull)
```

---

## 3. AI PROVIDER CONSTRAINTS
- **User-Specified Only**: Use ONLY the AI provider explicitly requested by the user.
- **Never Default to Gemini**: Do not assume, inject, or default to Gemini or any other LLM.
- **Explicit Request Required**: Zero AI pipelines or models shall be initialized without direct user instruction.
