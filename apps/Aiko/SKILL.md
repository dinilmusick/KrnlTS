# Aiko AI Gateway API Skill Specification

Aiko is a multi-vendor AI model gateway that routes client requests based on required capability profiles (Intelligence, Tooling, Speed, Cost) and handles API key rotation, persistent database storage, real SDK verification, credit balancing, failover, local GGUF models, default tool usage, and a 15-parameter 4-stage Intelligence Spec matching engine.

Base URL: `http://localhost:3000/api/v1` (or hosted app URL)

---

## 1. 15-Parameter Intelligence Spec Matching Engine

Aiko uses a 15-dimension vector and a 4-stage matching algorithm to evaluate capability distance, under-specification penalties, dynamic runtime downranks, and provider preferences.

### Core 15 Dimensions (0.0 to 10.0 scale):
`reasoning`, `planning`, `toolUsage`, `structuredOutput`, `jsonStrictness`, `coding`, `extraction`, `classification`, `summarization`, `creativity`, `determinism`, `context`, `vision`, `multimodal`, `outputComplexity`.

### Endpoint: `POST /api/v1/matching/rank`

**Request Body**:
```json
{
  "intelligenceSpec": {
    "reasoning": 9.0,
    "planning": 8.5,
    "toolUsage": 8.0,
    "structuredOutput": 9.0,
    "jsonStrictness": 9.0,
    "coding": 9.0,
    "extraction": 8.0,
    "classification": 8.0,
    "summarization": 8.0,
    "creativity": 6.0,
    "determinism": 9.0,
    "context": 8.0,
    "vision": 0.0,
    "multimodal": 0.0,
    "outputComplexity": 8.5
  },
  "prioritiseReasoning": true,
  "prioritiseDeterminism": false,
  "preferLocal": false,
  "avoidPaidProviders": false,
  "blacklistedProviders": []
}
```

---

## 2. Default Tool Usage & Unified Generation

All generation endpoints (`/chat/completions`, `/generate`, `/chat/direct`) automatically enable tool usage by default (including `web_search`, `calculator`, `get_current_time`) and forward custom client tool definitions seamlessly.

### Endpoint: `POST /api/v1/chat/completions` (OpenAI-Compatible with Tool Call Return)

```json
{
  "messages": [{"role": "user", "content": "What is 15 * 84? Also search for latest news on Mars rover."}],
  "intelligenceSpec": {
    "reasoning": 8,
    "toolUsage": 9,
    "coding": 8
  },
  "enableDefaultTools": true
}
```

**Response Payload**:
```json
{
  "id": "chatcmpl-aiko-1700000000",
  "object": "chat.completion",
  "model": "gemini-3.6-flash",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "[Aiko Tool Usage Invoked]: web_search(query='latest news on Mars rover')",
        "tool_calls": [
          {
            "id": "call_12345",
            "type": "function",
            "function": {
              "name": "web_search",
              "arguments": "{\"query\":\"latest news on Mars rover\"}"
            }
          }
        ]
      },
      "finish_reason": "tool_calls"
    }
  ],
  "aiko_metadata": {
    "providerUsed": "google",
    "keyUsedId": "key-google-env",
    "latencyMs": 210,
    "failoverChain": ["google:gemini-3.6-flash:key-google-env"]
  }
}
```

---

## 3. Direct Provider & Model Chat Execution

### Endpoint: `POST /api/v1/chat/direct`

```json
{
  "providerId": "google",
  "modelId": "gemini-3.6-flash",
  "prompt": "Explain quantum computing in 2 sentences.",
  "enableDefaultTools": true
}
```

---

## 4. Persistent Database & API Key Management

Stored in SQLite database (`data/keys_db.sqlite`).

- `GET /api/v1/keys`: Fetch registered keys, rotation strategy, next predicted key in rotation, and key-model usage statistics.
- `GET /api/v1/keys/next`: Query which API key is predicted to be used for the next prompt (`nextKeyId`, `nextKey`) based on current provider, model, and rotation strategy.
- `GET /api/v1/keys/usage`: Query per-key per-model daily, weekly, monthly, and total call counts (`keyId`, `modelId`, `dayCount`, `weekCount`, `monthCount`, `totalCount`).
- `GET /api/v1/keys/export`: Download or fetch structured backup JSON file containing metadata, email profile sections, provider mappings, and key definitions.
- `POST /api/v1/keys/import`: Import and restore key backup payload into SQLite database, auto-creating email profile sections and re-verifying key statuses.
- `POST /api/v1/keys`: Register and validate a new API key.
- `POST /api/v1/keys/:id/verify`: Verify key live against official SDK/APIs.
- `POST /api/v1/keys/reset-all-failures`: Reset failure states and rate-limit cooldowns across all keys in the pool.
- `DELETE /api/v1/keys/:id`: Remove a registered API key.
- `POST /api/v1/rotation/strategy`: Set rotation strategy (`round-robin`, `least-latency`, `cost-optimized`, `weighted`, `usage-balanced`). Dynamically balances traffic using persistent daily/weekly/monthly key-model call metrics.

---

## 5. Model Catalog, Performance Grading & Route Availability

- `GET /api/v1/models`: Retrieve catalog with 15-parameter intelligence spec vectors and runtime stats.
- `POST /api/v1/models/refresh`: Sync live active models from Google, Groq, Cerebras, Together AI, OpenRouter, and Hugging Face.
- `POST /api/v1/inference/feedback`: Process feedback contracts for model performance grading:
  - `status: "success"`: Records success and restores route ranking.
  - `status: "unsuited_inference"`: Model returned inference but failed job criteria. Reduces intelligence spec vector parameters corresponding to `failedAspects` (e.g., `["reasoning", "coding"]`).
  - `status: "no_inference"`: Provider/route transport failure. Increments `consecutiveRouteFailures`. After **10 repeat failures**, marks the route as `currently_unavailable` (greyed out in UI and excluded from candidate matching).
- `POST /api/v1/models/check-availability`: Probes and restores routes marked `currently_unavailable` back to `online` status.

---

## 6. Local Models & Event Stream

- `GET /api/v1/local-models`: List offline GGUF model files.
- `POST /api/v1/local-models/load`: Load model into RAM/VRAM memory.
- `GET /api/v1/stream-events`: SSE stream emitting real-time request activity logs and latency metrics.

---

## 7. Programmatic Tool Agents, Feature Agents, Sub-Agents & Intelligence Specs API

External services can programmatically construct, configure, override, train, and execute entire autonomous agent structures without touching the UI.

### 7.1 Intelligence Specs & Preferences Specs API
- `GET /api/v1/intelligence-specs` / `GET /api/v1/presets`: List all 15-parameter intelligence spec presets.
- `POST /api/v1/intelligence-specs` / `POST /api/v1/presets`: Create custom intelligence spec with tensor values (`reasoning`, `planning`, `toolUsage`, etc.).
- `PUT /api/v1/intelligence-specs/:id`: Update existing intelligence spec parameters.
- `DELETE /api/v1/intelligence-specs/:id`: Delete custom intelligence spec.
- `POST /api/v1/intelligence-specs/reset`: Reset specs to factory defaults.
- `GET /api/v1/preference-specs` / `GET /api/v1/preferences-presets`: List all preference presets.
- `POST /api/v1/preference-specs`: Create custom preference spec (latency budget, cost, provider filter).
- `PUT /api/v1/preference-specs/:id`: Update preference spec.
- `DELETE /api/v1/preference-specs/:id`: Delete preference spec.

### 7.2 Tool Agent Creation & Configuration
- `GET /api/v1/tools` / `GET /api/v1/workspaces/:workspace/tools`: List tools with agents and specs.
- `POST /api/v1/tools`: Create tool with agent definition, intelligence specs, and default subagents.
- `PUT /api/v1/tools/:toolName`: Update tool definition.
- `DELETE /api/v1/tools/:toolName`: Remove tool.
- `POST /api/v1/tools/:toolName/spec`: Set tool intelligenceSpecId, preferenceSpecId, routerSpecId, enhancerSpecId.
- `POST /api/v1/tools/:toolName/overrides`: Set tool model override (`overrideModel`, `manualModels`, `selectedModel`).

### 7.3 Feature Agent (Endpoint) Creation & Configuration
- `GET /api/v1/tools/:toolName/features` (alias `/endpoints`): List endpoints of a tool.
- `POST /api/v1/tools/:toolName/features`: Create feature endpoint with agent definition and input/output schemas.
- `PUT /api/v1/tools/:toolName/features/:featureName`: Update feature endpoint.
- `DELETE /api/v1/tools/:toolName/features/:featureName`: Delete feature endpoint.
- `POST /api/v1/tools/:toolName/features/:featureName/spec`: Set feature intelligence spec.
- `POST /api/v1/tools/:toolName/features/:featureName/overrides`: Set feature model overrides.
- `POST /api/v1/tools/:toolName/features/:featureName/execute`: Programmatically execute endpoint payload through `EndpointExecutor`.

### 7.4 Sub-Agents within Tool Agent
- `GET /api/v1/tools/:toolName/subagents`: List subagents (`router`, `enhancer`, `generative`, custom).
- `POST /api/v1/tools/:toolName/subagents`: Create or update subagent on tool agent.
- `PUT /api/v1/tools/:toolName/subagents/:roleOrId`: Update subagent instructions, specs, or flags.
- `DELETE /api/v1/tools/:toolName/subagents/:roleOrId`: Delete custom subagent.
- `POST /api/v1/tools/:toolName/subagents/:roleOrId/spec`: Set subagent intelligence spec and preference spec.
- `POST /api/v1/tools/:toolName/subagents/:roleOrId/overrides`: Set subagent model overrides.
- `POST /api/v1/tools/:toolName/subagents/:roleOrId/execute`: Invoke subagent with prompt.
- **Subagent Skills**:
  - `GET /api/v1/tools/:toolName/subagents/:roleOrId/skills`: List skills.
  - `POST /api/v1/tools/:toolName/subagents/:roleOrId/skills`: Add/update skill with endpoint refs/cURL.
  - `DELETE /api/v1/tools/:toolName/subagents/:roleOrId/skills/:skillId`: Delete skill.
- **Subagent Learning Steps**:
  - `GET /api/v1/tools/:toolName/subagents/:roleOrId/learnings`: List learning steps.
  - `POST /api/v1/tools/:toolName/subagents/:roleOrId/learnings`: Add learning step.
  - `PUT /api/v1/tools/:toolName/subagents/:roleOrId/learnings/:learningId`: Update learning step.
  - `DELETE /api/v1/tools/:toolName/subagents/:roleOrId/learnings/:learningId`: Delete learning step.

### 7.5 Sub-Agents within Feature Agent (Nested Sub-Agent in Endpoint Agent)
- `GET /api/v1/tools/:toolName/features/:featureName/subagents`: List subagents in feature agent.
- `POST /api/v1/tools/:toolName/features/:featureName/subagents`: Create subagent in feature agent.
- `PUT /api/v1/tools/:toolName/features/:featureName/subagents/:roleOrId`: Update feature subagent.
- `DELETE /api/v1/tools/:toolName/features/:featureName/subagents/:roleOrId`: Delete feature subagent.
- `POST /api/v1/tools/:toolName/features/:featureName/subagents/:roleOrId/spec`: Set feature subagent spec.
- `POST /api/v1/tools/:toolName/features/:featureName/subagents/:roleOrId/overrides`: Set feature subagent overrides.
- `POST /api/v1/tools/:toolName/features/:featureName/subagents/:roleOrId/execute`: Invoke feature subagent with prompt.
- **Feature Subagent Skills**:
  - `GET /api/v1/tools/:toolName/features/:featureName/subagents/:roleOrId/skills`: List skills.
  - `POST /api/v1/tools/:toolName/features/:featureName/subagents/:roleOrId/skills`: Add/update skill.
  - `DELETE /api/v1/tools/:toolName/features/:featureName/subagents/:roleOrId/skills/:skillId`: Delete skill.
- **Feature Subagent Learning Steps**:
  - `GET /api/v1/tools/:toolName/features/:featureName/subagents/:roleOrId/learnings`: List learning steps.
  - `POST /api/v1/tools/:toolName/features/:featureName/subagents/:roleOrId/learnings`: Add learning step.
  - `PUT /api/v1/tools/:toolName/features/:featureName/subagents/:roleOrId/learnings/:learningId`: Update learning step.
  - `DELETE /api/v1/tools/:toolName/features/:featureName/subagents/:roleOrId/learnings/:learningId`: Delete learning step.

### 7.6 Tool & Feature Learning Steps API
- `GET /api/v1/tools/:toolName/learnings`: List tool learnings.
- `POST /api/v1/tools/:toolName/learnings`: Add learning to tool.
- `PUT /api/v1/tools/:toolName/learnings/:id`: Update tool learning.
- `DELETE /api/v1/tools/:toolName/learnings/:id`: Delete tool learning.
- `GET /api/v1/tools/:toolName/features/:featureName/learnings`: List feature learnings.
- `POST /api/v1/tools/:toolName/features/:featureName/learnings`: Add learning to feature.
- `PUT /api/v1/tools/:toolName/features/:featureName/learnings/:id`: Update feature learning.
- `DELETE /api/v1/tools/:toolName/features/:featureName/learnings/:id`: Delete feature learning.

---

## 8. Error Classification & Structured Failure Diagnostics

When an inference route or key fails, Aiko intercepts upstream codes and parses bodies through `errorParser.ts` into explicit classifications:

- `[PROVIDER Model Unavailable (404)]`: Model discontinued, deprecated, or not found on provider. Model is downranked and marked unavailable without penalizing valid keys.
- `[PROVIDER Authentication Error (401/403)]`: Key invalid, revoked, or unauthorized. Key is marked invalid with specific resolution suggestion.
- `[PROVIDER Rate Limit / Quota Exceeded (429)]`: Request quota exhausted. Key is rotated to next active backup key in pool.
- `[PROVIDER Billing Required (402)]`: Insufficient balance / credit exhaustion.
- `[PROVIDER Context Limit Exceeded (400)]`: Input prompt exceeds context window limit for targeted model.
- `[PROVIDER Parameter Specification Error]`: Parameter mismatch or invalid payload structure.
- `[PROVIDER Service Outage (5xx)]`: Upstream provider outage / server error.

