/**
 * @file index.ts
 * @description @kloks/orchestrations — Canonical pure Orchestration Definitions A & B.
 * STRICT INVARIANT: Kloks is a pure distribution catalog and NEVER owns execution,
 * queues, workers, schedulers, or dispatchers. Kloks exports pure serializable definitions
 * conforming to OrchestrationDefinition<TInput, TOutput>.
 */

import type { OrchestrationDefinition } from '@ultrst-armada/krnl';

export interface OrchestratorAInput {
  a: number;
  b: number;
  operation?: 'add' | 'multiply';
}

export interface OrchestratorAOutput {
  computed: number;
  state: { count: number };
}

/**
 * Pure serializable definition for Orchestrator A.
 * Sequences Service A (Pure Math) -> Service B (Stateful Counter).
 * Free from execution machinery. To be instantiated and executed by Skipo/runtime.
 */
export const OrchestratorADefinition: OrchestrationDefinition<OrchestratorAInput, OrchestratorAOutput> = {
  id: 'kloks.orchestrator.a',
  name: 'OrchestratorA',
  version: '1.0.0',
  description: 'Pure serializable orchestration definition: Service A -> Service B',
  scope: 'service',
  dependencies: ['kloks.service.a', 'kloks.service.b'],
  steps: [
    {
      id: 'step_math',
      name: 'Execute Math Operation',
      type: 'task',
      target: 'kloks.service.a',
      operation: 'add',
      retryPolicy: {
        maxAttempts: 2,
        backoff: 'exponential',
        backoffMs: 50,
      },
    },
    {
      id: 'step_counter',
      name: 'Increment Counter',
      type: 'task',
      target: 'kloks.service.b',
      operation: 'increment',
      dependsOn: ['step_math'],
    },
  ],
};

export interface OrchestratorBInput {
  delta?: number;
  metricName?: string;
}

export interface OrchestratorBOutput {
  state: { count: number };
  emitted: { metric: string; value: number; timestamp: number };
}

/**
 * Pure serializable definition for Orchestrator B.
 * Sequences Service B (Stateful Counter) -> Service C (Event-Emitting Telemetry).
 * Free from execution machinery. To be instantiated and executed by Skipo/runtime.
 */
export const OrchestratorBDefinition: OrchestrationDefinition<OrchestratorBInput, OrchestratorBOutput> = {
  id: 'kloks.orchestrator.b',
  name: 'OrchestratorB',
  version: '1.0.0',
  description: 'Pure serializable orchestration definition: Service B -> Service C',
  scope: 'service',
  dependencies: ['kloks.service.b', 'kloks.service.c'],
  steps: [
    {
      id: 'step_counter',
      name: 'Increment Counter',
      type: 'task',
      target: 'kloks.service.b',
      operation: 'increment',
    },
    {
      id: 'step_telemetry',
      name: 'Publish Telemetry Reading',
      type: 'task',
      target: 'kloks.service.c',
      operation: 'publishReading',
      dependsOn: ['step_counter'],
    },
  ],
};

/**
 * Pure serializable definition for Audio-Midi Orchestrator.
 * Sequences MidiService -> AudioHardwareService.
 */
export const AudioMidiOrchestratorDefinition: OrchestrationDefinition = {
  id: 'kloks.orchestrator.audioMidi',
  name: 'AudioMidiOrchestrator',
  version: '1.0.0',
  description: 'Pure serializable orchestration definition: Midi -> AudioHardware',
  scope: 'service',
  dependencies: ['kloks.midi.subsystem', 'kloks.audio.hardware'],
  steps: [
    {
      id: 'step_midi',
      name: 'Emit Virtual MIDI',
      type: 'task',
      target: 'kloks.midi.subsystem',
      operation: 'emitVirtualMidi',
    },
    {
      id: 'step_audio',
      name: 'Get Audio Hardware State',
      type: 'task',
      target: 'kloks.audio.hardware',
      operation: 'getState',
      dependsOn: ['step_midi'],
    },
  ],
};

// ══════════════════════════════════════════════════════════════════════════════
// KRNL CANONICAL ORCHESTRATION EXPORTS (Standardized krnl* Prefix Rule)
// ══════════════════════════════════════════════════════════════════════════════
export const krnlOrchestratorADefinition = OrchestratorADefinition;
export const krnlOrchestratorBDefinition = OrchestratorBDefinition;
export const krnlAudioMidiOrchestratorDefinition = AudioMidiOrchestratorDefinition;

