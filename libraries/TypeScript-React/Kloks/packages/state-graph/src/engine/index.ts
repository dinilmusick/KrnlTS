// ══════════════════════════════════════════════════════════════════════════════════════════
// KLOKS STATE-GRAPH: GENERALIZED GRAPH ENGINE, HIERARCHY, REGISTRIES & PREDICTIVE ENGINE
// ══════════════════════════════════════════════════════════════════════════════════════════

// 1. Domain & Graph Types
export * from "./types/legacyTypes.js";
export * from "./types/stripsTypes.js";
export * from "./types/auth.js";
export * from "./types/storage.js";
export * from "./AudioConcepts.js";
export * from "./BufferConcepts.js";
export * from "./GraphConcepts.js";
export * from "./UIConcepts.js";

// 2. Core Object Hierarchy (GraphEntityParent, GraphNodeParent, GraphSocketParent, GraphWireParent, MagneticGraphManager)
export * from "./core/hierarchy/index.js";

// 3. Node, Socket, Asset & Graph Registries
export * from "./core/nodeArchetypeRegistry.js";
export * from "./core/nodeAssetRegistry.js";
export * from "./core/nodeSocketRegistry.js";
export * from "./core/exposedSocketsManager.js";
export * from "./core/subgraphIoTransform.js";
export * from "./core/workspaceGraphRegistry.js";
export * from "./core/graphDataService.js";
export * from "./core/graphDependencyValidator.js";
export * from "./core/graphTypeSystem.js";
export * from "./core/controlDispatcher.js";
export * from "./core/canonicalIo/topLevelIoRegistry.js";
export * from "./core/canonicalIo/CanonicalAudioInputEndpoint.js";
export * from "./core/canonicalIo/CanonicalMidiInputEndpoint.js";
export * from "./core/l2_drivers/audioBusDriver.js";
export * from "./core/l2_drivers/audioDeviceDriver.js";
export * from "./core/l2_drivers/audioStreamDriver.js";

// 4. Graph, Signal, Factory & Parser Functions
export * from "./functions/canonicalSignalTable.js";
export * from "./functions/universalConnectionEngine.js";
export * from "./functions/socketCompatibilitySpawner.js";
export * from "./functions/nodeFactory.js";
export * from "./functions/containerFactory.js";
export * from "./functions/arrangementFactory.js";
export * from "./functions/containerClipSync.js";
export * from "./functions/spawnNodeFactory.js";
export * from "./functions/spawningMechanism.js";
export * from "./functions/graphManager.js";
export * from "./functions/codeNodeParser.js";
export * from "./functions/codeLinter.js";
export * from "./functions/componentSocketRegistry.js";
export * from "./functions/musicTheory.js";
export * from "./functions/effectLogic.js";
export * from "./functions/triggerLogic.js";
export * from "./functions/rotaryGeometry.js";
export * from "./functions/clientWavEncoder.js";
export * from "./functions/sampleContainerExtractor.js";
export * from "./functions/midiDeviceRegistry.js";
export * from "./functions/nodePerformanceTracker.js";

// 5. Predictive / Auto-Complete Ghost Node Graph Engine
export * from "./predictive/index.js";

// Resolve explicit re-exports
export {
  type NodeSocketDescriptor,
  type UniversalSocketDefinition,
  type SignalType,
  type DawProject,
  type GraphType,
} from "./types/legacyTypes.js";
export {
  calculateNextQuantizeBeat,
  formatBeatToBarBeat,
  formatQuantizeDivisionLabel,
  getDivisionBeatLength,
} from "./AudioConcepts.js";
