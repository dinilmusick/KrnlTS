# Aiko Ecosystem Extraction Specification
Document Version: 1.0.0
Status: ACTIVE SPECIFICATION

This document details the concrete asset boundary mappings for decomposing dinilmusick/Aiko into the canonical ecosystem libraries (@kloks, @floks) while retaining Aiko's unique agentic identity and replacing legacy infrastructure with canonical Skipo/Kloks contracts.

---

## List A: Aiko → Kloks (Backend Services)

Target namespace: `@ultrst-armada/kloks` (local monorepo packages or sub-entry exports).

### A.1 AI Provider Gateway (`@kloks/backend/ai-provider` or `@kloks/ai-provider`)
* **Source Files**:
  - `src/backend/providers.ts`
  - `src/backend/aiko/AikoHttpClient.ts`
  - `src/backend/aiko/EndpointExecutor.ts`
* **Exports**:
  - `PROVIDERS_META`: Record<ProviderId, ProviderMeta>
  - `PROVIDER_COLORS`: Record<ProviderId, string>
  - `ProviderMeta`, `ProviderId`, `ProviderCapabilities`
  - `AIHttpClient`, `EndpointExecutor`
  - `AIProviderService` facade / class
* **Dependencies**: `@ultrst-armada/krnl`

### A.2 AI Inference Executor (`@kloks/backend/ai-inference` or `@kloks/ai-inference`)
* **Source Files**:
  - `src/backend/inferenceExecutor/inferenceExecutor.ts`
  - `src/backend/inferenceExecutor/types.ts`
  - `src/backend/inference/errorParser/errorParser.ts`
  - `src/backend/inference/errorParser/helpers.ts`
  - `src/backend/inference/errorParser/types.ts`
  - `src/backend/aiko/DeterministicEndpointExecutor.ts`
* **Exports**:
  - `performInference()`
  - `InferenceExecutorService`
  - `DeterministicEndpointExecutor`
  - `parseInferenceError()`, `ErrorClassifier`
  - `InferenceRequest`, `InferenceResponse`, `InferenceError`
* **Dependencies**: `@google/genai`, `@kloks/backend/ai-provider`

### A.3 AI Model Catalog & Discovery (`@kloks/backend/ai-models` or `@kloks/ai-models`)
* **Source Files**:
  - `src/backend/modelCatalog/modelCatalog.ts`
  - `src/backend/modelCatalog/types.ts`
  - `src/backend/modelCatalog/helpers.ts`
  - `src/backend/catalog/catalogData/catalogData.ts`
  - `src/backend/catalog/catalogData/helpers.ts`
  - `src/backend/catalog/catalogData/types.ts`
  - `src/backend/catalog/endpointRefresher.ts`
  - `src/backend/intelligence/modelHealthService.ts`
* **Exports**:
  - `ModelCatalogService`, `modelCatalog`
  - `STATIC_MODELS_CATALOG`, `fetchRemoteModels()`
  - `ModelHealthService`, `modelHealthService`
  - `EndpointRefresher`
* **Dependencies**: `@kloks/backend/ai-provider`

### A.4 AI Failover & Routing Runtime (`@kloks/backend/ai-routing` or `@kloks/ai-routing`)
* **Source Files**:
  - `src/backend/failoverEngine/failoverEngine.ts`
  - `src/backend/failoverEngine/types.ts`
  - `src/backend/failoverEngine/helpers.ts`
  - `src/backend/healthCheckService.ts`
  - `src/backend/metricsLogger.ts`
* **Exports**:
  - `FailoverExecutionEngine`, `failoverExecutionEngine`
  - `HealthCheckService`, `healthCheckService`
  - `MetricsLogger`, `metricsLogger`
  - Generic Route Primitives: `RouteCandidate`, `RoutingStrategy`, `RetryPolicy`
* **Dependencies**: `@kloks/backend/ai-provider`, `@kloks/backend/ai-inference`, `@kloks/backend/ai-models`

### A.5 AI Key Lifecycle Management (`@kloks/backend/ai-keys` or `@kloks/ai-keys`)
* **Source Files**:
  - `src/backend/keyStore/keyStore.ts`
  - `src/backend/keyStore/helpers.ts`
  - `src/backend/keyValidator/keyValidator.ts`
  - `src/backend/keyValidator/types.ts`
  - `src/backend/keyValidator/helpers.ts`
  - `src/backend/storage/keysStorage.ts`
* **Exports**:
  - `KeyStoreService`, `keyStore`
  - `validateApiKey()`
  - `keysStorage`
  - `ApiKeyEntry`, `RotationStrategy`, `ValidationResult`
* **Dependencies**: `@kloks/backend/auth`, `@kloks/backend/srkl`

### A.6 MCP Tool Runtime Kernel (`@kloks/backend/ai-tools` or `@kloks/ai-tools`)
* **Source Files**:
  - `src/backend/mcp/mcpEngine.ts`
  - `src/backend/mcp/helpers.ts`
  - `src/backend/agentic/toolManager/ToolManagerService.ts`
  - `src/backend/agentic/toolValidationLoop/*`
  - `src/backend/types/mcpTypes.ts`
* **Exports**:
  - `MCPEngine`, `mcpEngine`
  - `ToolManagerService`
  - `ToolValidationLoop`
  - `MCPTool`, `MCPServerConfig`, `ToolExecutionResult`

---

## List B: Aiko → Floks (Reusable UI Components)

Target namespace: `@ultrst-armada/floks` (specifically `@floks/ui` or `@floks/canvas-ui`).

### B.1 AI Model Catalog & Badging
* **Source Files**:
  - `src/frontend/components/views/catalog/ModelCard.tsx`
  - `src/frontend/components/views/catalog/ModelCardHeader.tsx`
  - `src/frontend/components/views/catalog/ModelCardFooter.tsx`
  - `src/frontend/components/views/catalog/providerIconHelper.ts`
* **Target**: `@floks/ui` -> `components/ai/model-card/`
* **Contract**: Displays model details, benchmarks, context windows, and pricing against `ModelInfo` interface.

### B.2 AI Key Management UI Suite
* **Source Files**:
  - `src/frontend/components/views/keymanager/KeyListContainer.tsx`
  - `src/frontend/components/views/keymanager/SingleKeyCard.tsx`
  - `src/frontend/components/views/keymanager/SingleKeyForm.tsx`
  - `src/frontend/components/views/keymanager/KeyProviderFilterBar.tsx`
  - `src/frontend/components/views/keymanager/KeyModelVerificationSuite.tsx`
  - `src/frontend/components/views/keymanager/KeyBackupModal.tsx`
  - `src/frontend/components/views/keymanager/KeyBackupExportTab.tsx`
  - `src/frontend/components/views/keymanager/KeyBackupImportTab.tsx`
  - `src/frontend/components/views/keymanager/EmailProfileCard.tsx`
  - `src/frontend/components/views/keymanager/EmailProfileRegistrationForm.tsx`
  - `src/frontend/components/views/keymanager/EmailProviderRow.tsx`
  - `src/frontend/components/views/keymanager/ExistingKeyControl.tsx`
* **Target**: Service UI (via Kult-origination pipeline into Floks)
* **Contract**: Consumes Kloks `KeyStoreService` / `ApiKeyEntry` schema.

### B.3 Reusable Chat & Tool Execution Cards
* **Source Files**:
  - `src/frontend/components/views/DirectChatView/DirectChatMessageList.tsx`
  - `src/frontend/components/views/DirectChatView/DirectChatInput.tsx`
  - `src/frontend/components/views/DirectChatView/DirectChatHeader.tsx`
  - `src/frontend/components/views/DirectChatView/AgentExecutionCard.tsx`
  - `src/frontend/components/views/metrics/TimelineScrubber.tsx`
* **Target**: `@floks/ui` -> `components/ai/chat/`
* **Contract**: Standard chat streaming message protocol, tool call execution status display.

---

## List C: Aiko → KEEP (Aiko Specific Product Identity)

These components define the Aiko AI collaboration application and will remain in `dinilmusick/Aiko`:

### C.1 Aiko Agent Hierarchy & Prompts
* `src/backend/agentic/aikoAgent/*` (AikoAgent, aikoAgentPrompt, aikoMessageExecution, etc.)
* `src/backend/agentic/endpointAgent/*` (EndpointAgent, endpointAgentPrompt, etc.)
* `src/backend/agentic/router/*` (RouterSubAgent, routerPrompt, etc.)
* `src/backend/agentic/enricher/*` (EnricherSubAgent, enricherPrompt, etc.)
* `src/backend/agentic/agentNetwork/*` (Solar system network graph builder)

### C.2 Aiko Intelligence Spec & 15D Policy
* `src/backend/intelligence/matchingEngine.ts` (15-dimensional policy & scoring weights)
* `src/backend/intelligence/presets/*` (Aiko intelligence presets & storage)
* `src/backend/profileSolver.ts`
* `src/frontend/components/views/intelligence/*` (TactileKnob, CategoryRotaryStage, IntelSpecTabContent, etc.)

### C.3 Aiko Learning & Memory System
* `src/backend/agentic/learning/*` (learningEngine, deduplication, relevanceFilter, sanitizer)
* `src/backend/storage/learningStore.ts`
* `src/backend/storage/memoryStore.ts`
* `src/backend/storage/subAgentLearningStore.ts`

### C.4 Aiko Solar System Visualizer & Domain Nodes
* `src/frontend/components/solarSystem/*` (SolarSystemVisualizer, solarSystemRenderer, etc.)
* `src/frontend/components/nodes/*` (ClientIngressNode, ProfileSolverNode, ProviderGroupNode)
* `src/frontend/components/chat/galaxy/*` (Galaxy execution visualizer)
* `src/frontend/components/views/metrics/BrainNerveGraph/*` (BrainNerveGraph)

---

## List D: Aiko → REPLACE (Delete Legacy / Local Copies)

### D.1 Embedded Skipo (`src/libraries/skipo/`)
* **Action**: PURGE ENTIRE 274 FILES.
* **Replacement**: Import directly from `@dinilmusick/gutts`, `@ultrst-armada/krnl`, `@ultrst-armada/frnlts`, `@ultrst-armada/kloks`, `@ultrst-armada/floks`.

### D.2 Local Workspace & File Storage
* `src/backend/storage/workspaceRepository.ts` -> Replace with `@kloks/backend` `WorkspaceService`
* `src/backend/storage/workspaceFileSystem.ts` -> Replace with `@kloks/backend` `WorkspaceFS`
* `src/backend/storage/workspaceStorage.ts` -> Replace with `@kloks/backend` `WorkingWorkspaceService`
* `src/backend/storageRoutes.ts` -> Replace with Kloks canonical routes

### D.3 Local Auth & System Database
* `src/backend/authRoutes/*` -> Replace with `@kloks/backend` `UnifiedAuthCore`, `SessionManager`
* `src/backend/dbStore.ts` -> Replace with `@kloks/backend` `unifiedDb`
* `src/backend/systemDatabaseService.ts` -> Replace with Kloks database engine
* `src/backend/systemDb*.ts` -> Replace with Kloks database engine

### D.4 Local SRKL & S3
* `src/backend/srkl/*` -> Replace with `@kloks/backend/srkl`
* `src/backend/storage/credentialStore.ts` -> Replace with `@kloks/backend` `SrklCredentialRegistry`

### D.5 Duplicate Frontend Shell & Workspace UI
* `src/frontend/components/workspace/*` -> Replace with `@floks/ui` workspace components (`WorkspaceTilesMenu`, `WorkspaceCreateDialog`, `StorageOptionTiles`, etc.)
* `src/frontend/components/auth/*` -> Replace with `@floks/ui` auth components (`AuthPage`, `LoginModal`)
* `src/frontend-state/*` -> Eliminate plane; integrate into page orchestrations and React hooks.
