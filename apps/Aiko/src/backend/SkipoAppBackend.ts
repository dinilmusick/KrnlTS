// ══════════════════════════════════════════════════════════════════════════════
// SKIPO APP BACKEND BARREL FACADE
// Re-exports AikoBackend conforming to Skipo Architecture Spec
// ══════════════════════════════════════════════════════════════════════════════

import { AikoBackend, WorkerExecutionBoundary, aikoWorkerBoundary, executableFacade } from './AikoBackend.js';

export { AikoBackend as SkipoAppBackend, WorkerExecutionBoundary, aikoWorkerBoundary, executableFacade };
export { AikoBackend };
export default AikoBackend;