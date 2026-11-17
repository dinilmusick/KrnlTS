/**
 * @file surface.ts
 * @description Canonical export surface definitions and consumer compatibility validator.
 * Enforces: QwnsrRequiredSurface ⊆ KloksPublicContract
 */

export interface ExportSymbolEntry {
  name: string;
  subpath: string;
  category: 'state-graph' | 'audio-midi' | 'orchestrations' | 'backend' | 'services' | 'functions' | 'contracts';
  hasZodSchema: boolean;
}

/**
 * Authoritative Canonical Public Contract Surface for Kloks.
 */
export const KLOKS_PUBLIC_SURFACE: ExportSymbolEntry[] = [
  // ── state-graph ──
  { name: 'GraphEntityParent', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'GraphEntityMetadata', subpath: 'state-graph', category: 'state-graph', hasZodSchema: true },
  { name: 'GraphSocketParent', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'SocketDirection', subpath: 'state-graph', category: 'state-graph', hasZodSchema: true },
  { name: 'SocketPosition2D', subpath: 'state-graph', category: 'state-graph', hasZodSchema: true },
  { name: 'SocketGeometryConfig', subpath: 'state-graph', category: 'state-graph', hasZodSchema: true },
  { name: 'SocketStyleConfig', subpath: 'state-graph', category: 'state-graph', hasZodSchema: true },
  { name: 'AudioStereoSocket', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'AudioMonoSocket', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'AudioPacketSocket', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'TriggerSocket', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'MidiStreamSocket', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'MidiPacketSocket', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'CurveStreamSocket', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'CurvePacketSocket', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'ComponentSocket', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'PrimitiveSocket', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'createSocketInstance', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'createQwnsrSocketInstance', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'GraphWireParent', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'WireEndpoint2D', subpath: 'state-graph', category: 'state-graph', hasZodSchema: true },
  { name: 'WireCurveStyle', subpath: 'state-graph', category: 'state-graph', hasZodSchema: true },
  { name: 'WireAnimationConfig', subpath: 'state-graph', category: 'state-graph', hasZodSchema: true },
  { name: 'WireVisualConfig', subpath: 'state-graph', category: 'state-graph', hasZodSchema: true },
  { name: 'AudioStereoWire', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'AudioMonoWire', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'AudioPacketWire', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'TriggerWire', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'MidiStreamWire', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'MidiPacketWire', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'CurveStreamWire', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'CurvePacketWire', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'ComponentWire', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'PrimitiveWire', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'createWireInstance', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'createQwnsrWireInstance', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'GraphNodeParent', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'DataProcessingNodeParent', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'SignalGeneratorNodeParent', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'RoutingNodeParent', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'ControlNodeParent', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'NodeDimensions2D', subpath: 'state-graph', category: 'state-graph', hasZodSchema: true },
  { name: 'NodeScreenRect2D', subpath: 'state-graph', category: 'state-graph', hasZodSchema: true },
  { name: 'NodeHeaderStyle', subpath: 'state-graph', category: 'state-graph', hasZodSchema: true },
  { name: 'TriggerNodeModel', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'ContainerNodeModel', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'ModuleNodeModel', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'EffectNodeModel', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'CodeNodeModel', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'ArrangementNodeModel', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'RouterNodeModel', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'StripNodeModel', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'ControlNodeModel', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'PrimitiveNodeModel', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'GroupNodeModel', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'createNodeInstance', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'createQwnsrNodeInstance', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'StateLifecycleServiceFacade', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'NodeGraphEngineServiceFacade', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },
  { name: 'PredictiveGraphServiceFacade', subpath: 'state-graph', category: 'state-graph', hasZodSchema: false },

  // ── audio-midi ──
  { name: 'AudioInputManager', subpath: 'audio-midi', category: 'audio-midi', hasZodSchema: false },
  { name: 'MidiManager', subpath: 'audio-midi', category: 'audio-midi', hasZodSchema: false },
  { name: 'AudioHardwareServiceFacade', subpath: 'audio-midi', category: 'audio-midi', hasZodSchema: false },
  { name: 'MidiServiceFacade', subpath: 'audio-midi', category: 'audio-midi', hasZodSchema: false },
  { name: 'AudioMidiOrchestratorDefinition', subpath: 'audio-midi', category: 'audio-midi', hasZodSchema: false },
  { name: 'AudioBusConfig', subpath: 'audio-midi', category: 'audio-midi', hasZodSchema: true },
  { name: 'AudioHardwareState', subpath: 'audio-midi', category: 'audio-midi', hasZodSchema: true },
  { name: 'MidiCommandType', subpath: 'audio-midi', category: 'audio-midi', hasZodSchema: true },
  { name: 'MidiEventPayload', subpath: 'audio-midi', category: 'audio-midi', hasZodSchema: true },

  // ── orchestrations ──
  { name: 'OrchestratorADefinition', subpath: 'orchestrations', category: 'orchestrations', hasZodSchema: false },
  { name: 'OrchestratorBDefinition', subpath: 'orchestrations', category: 'orchestrations', hasZodSchema: false },
  { name: 'AudioMidiOrchestratorDefinition', subpath: 'orchestrations', category: 'orchestrations', hasZodSchema: false },

  // ── backend ──
  { name: 'AuthServiceFacade', subpath: 'backend', category: 'backend', hasZodSchema: false },
  { name: 'StorageServiceFacade', subpath: 'backend', category: 'backend', hasZodSchema: false },
  { name: 'WorkspaceServiceFacade', subpath: 'backend', category: 'backend', hasZodSchema: false },
  { name: 'ControlPlaneServiceFacade', subpath: 'backend', category: 'backend', hasZodSchema: false },

  // ── services ──
  { name: 'ServiceAFacade', subpath: 'services', category: 'services', hasZodSchema: false },
  { name: 'ServiceBFacade', subpath: 'services', category: 'services', hasZodSchema: false },
  { name: 'ServiceCFacade', subpath: 'services', category: 'services', hasZodSchema: false },
  { name: 'ServiceDFacade', subpath: 'services', category: 'services', hasZodSchema: false },

  // ── functions ──
  { name: 'FunctionsServiceFacade', subpath: 'functions', category: 'functions', hasZodSchema: false },
  { name: 'toKebabCase', subpath: 'functions', category: 'functions', hasZodSchema: false },
  { name: 'safeJsonParse', subpath: 'functions', category: 'functions', hasZodSchema: false },

  // ── contracts ──
  { name: 'KLOKS_CANONICAL_CONTRACT', subpath: 'contracts', category: 'contracts', hasZodSchema: true },
  { name: 'createKloksSnapshot', subpath: 'contracts', category: 'contracts', hasZodSchema: true },
  { name: 'diffContractSnapshots', subpath: 'contracts', category: 'contracts', hasZodSchema: true },
  { name: 'validateConsumerSurfaceCompatibility', subpath: 'contracts', category: 'contracts', hasZodSchema: true },
];

/**
 * Surface required by Qwnsr consumer according to docs/01_CONTRACT_FOUNDATION.md & docs/03_LIBRARY_CONTRACT_MIGRATION.md.
 */
export const QWNSR_REQUIRED_SURFACE: string[] = [
  'GraphEntityMetadata',
  'SocketPosition2D',
  'SocketDirection',
  'SocketGeometryConfig',
  'SocketStyleConfig',
  'AudioStereoSocket',
  'AudioMonoSocket',
  'TriggerSocket',
  'createSocketInstance',
  'GraphWireParent',
  'WireEndpoint2D',
  'WireVisualConfig',
  'createWireInstance',
  'GraphNodeParent',
  'NodeDimensions2D',
  'createNodeInstance',
  'StateLifecycleServiceFacade',
  'NodeGraphEngineServiceFacade',
  'AudioHardwareServiceFacade',
  'MidiServiceFacade',
  'AudioMidiOrchestratorDefinition',
];

export interface CompatibilityCheckResult {
  compatible: boolean;
  missingSymbols: string[];
  totalRequired: number;
  totalPresent: number;
}

/**
 * Verifies that all symbols in requiredSurface are exported by Kloks.
 * Enforces Invariant: QwnsrRequiredSurface ⊆ KloksPublicContract
 */
export function validateConsumerSurfaceCompatibility(
  requiredSymbols: string[] = QWNSR_REQUIRED_SURFACE,
  publicSurface: ExportSymbolEntry[] = KLOKS_PUBLIC_SURFACE
): CompatibilityCheckResult {
  const publicNames = new Set(publicSurface.map((s) => s.name));
  const missingSymbols = requiredSymbols.filter((s) => !publicNames.has(s));

  return {
    compatible: missingSymbols.length === 0,
    missingSymbols,
    totalRequired: requiredSymbols.length,
    totalPresent: requiredSymbols.length - missingSymbols.length,
  };
}
