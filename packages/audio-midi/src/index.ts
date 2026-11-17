/**
 * @file index.ts
 * @description @kloks/audio-midi — KrnlTS-backed Pro-Audio Named Bus & Reactive Web MIDI Services.
 * Converted from Skipo audio-midi engine into first-class KrnlTS services and orchestrators.
 */

import {
  createService,
  createServiceDefinition,
  type IService,
  type ServiceDefinition,
} from '@ultrst-armada/krnl';
import {
  AudioInputManager,
  type AudioBusConfig,
  type AudioDeviceDescriptor,
  type AudioHardwareState,
  type AudioStateListener,
} from './audioInputManager.js';
import {
  MidiManager,
  type MidiCommandType,
  type MidiEventListener,
  type MidiEventPayload,
  type MidiPortDescriptor,
  type MidiStateListener,
  type MidiSubsystemState,
} from './midiManager.js';

import {
  AudioConcepts,
  BufferConcepts,
  type BufferCycleCalculation,
} from '@kloks/state-graph';

export {
  AudioInputManager,
  MidiManager,
  AudioConcepts,
  BufferConcepts,
  type BufferCycleCalculation,
  type AudioBusConfig,
  type AudioDeviceDescriptor,
  type AudioHardwareState,
  type AudioStateListener,
  type MidiCommandType,
  type MidiEventListener,
  type MidiEventPayload,
  type MidiPortDescriptor,
  type MidiStateListener,
  type MidiSubsystemState,
};


// ══════════════════════════════════════════════════════════════════════════════
// 1. AUDIO HARDWARE KRNLTS SERVICE
// ══════════════════════════════════════════════════════════════════════════════

export interface AudioServiceEvents extends Record<string, unknown> {
  stateChange: AudioHardwareState;
}

export function createAudioHardwareService(
  manager: AudioInputManager = new AudioInputManager()
): IService<AudioHardwareState & Record<string, unknown>, AudioServiceEvents> {
  let svcRef: IService<AudioHardwareState & Record<string, unknown>, AudioServiceEvents>;

  const def = createServiceDefinition<
    AudioHardwareState & Record<string, unknown>,
    AudioServiceEvents
  >({
    id: 'kloks.audio.hardware',
    name: 'AudioHardwareService',
    version: '1.0.0',
    state: {
      initial: {
        ...manager.getState(),
      },
    },
    lifecycle: {
      onInit: () => {
        manager.subscribe((nextState) => {
          if (svcRef) {
            svcRef.setState({ ...nextState });
          }
        });
      },
      onDispose: async () => {
        await manager.dispose();
      },
    },
    operations: {
      initialize: {
        id: 'AudioHardwareService.initialize',
        name: 'initialize',
        handler: async (config?: AudioBusConfig) => {
          await manager.initialize(config);
          const state = manager.getState();
          svcRef.setState({ ...state });
          return state;
        },
      },
      connectStream: {
        id: 'AudioHardwareService.connectStream',
        name: 'connectStream',
        handler: async (config: AudioBusConfig) => {
          await manager.connectAudioStream(config);
          const state = manager.getState();
          svcRef.setState({ ...state });
          return state;
        },
      },
      refreshDevices: {
        id: 'AudioHardwareService.refreshDevices',
        name: 'refreshDevices',
        handler: async () => {
          const devices = await manager.refreshDeviceList();
          const state = manager.getState();
          svcRef.setState({ ...state });
          return devices;
        },
      },
      getState: {
        id: 'AudioHardwareService.getState',
        name: 'getState',
        handler: async (input?: any) => {
          const state = manager.getState();
          return {
            ...state,
            ...(input && typeof input === 'object' ? input : {}),
            audioState: state,
          };
        },
      },
      dispose: {
        id: 'AudioHardwareService.dispose',
        name: 'dispose',
        handler: async () => {
          await manager.dispose();
          const state = manager.getState();
          svcRef.setState({ ...state });
          return state;
        },
      },
    },
  });

  svcRef = createService(def);
  return svcRef;
}

const defaultAudioService = createAudioHardwareService();
export const AudioHardwareServiceDefinition: ServiceDefinition = defaultAudioService.getDefinition();

const AudioHardwareServiceFacade = {
  id: AudioHardwareServiceDefinition.id,
  name: AudioHardwareServiceDefinition.name,
  version: AudioHardwareServiceDefinition.version,
  runtime: 'client' as const,
  deployment: 'local' as const,
  definition: AudioHardwareServiceDefinition,
  createInstance: createAudioHardwareService,
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => { await defaultAudioService.start(); return defaultAudioService.call<TIn, TOut>(op, input); },
};

// ══════════════════════════════════════════════════════════════════════════════
// 2. MIDI SUBSYSTEM KRNLTS SERVICE
// ══════════════════════════════════════════════════════════════════════════════

export interface MidiServiceEvents extends Record<string, unknown> {
  midiEvent: MidiEventPayload;
  stateChange: MidiSubsystemState;
}

export function createMidiService(
  manager: MidiManager = new MidiManager()
): IService<MidiSubsystemState & Record<string, unknown>, MidiServiceEvents> {
  let svcRef: IService<MidiSubsystemState & Record<string, unknown>, MidiServiceEvents>;

  const def = createServiceDefinition<
    MidiSubsystemState & Record<string, unknown>,
    MidiServiceEvents
  >({
    id: 'kloks.midi.subsystem',
    name: 'MidiService',
    version: '1.0.0',
    state: {
      initial: {
        ...manager.getState(),
      },
    },
    lifecycle: {
      onInit: () => {
        manager.subscribeState((st) => {
          if (svcRef) {
            svcRef.setState({ ...st });
          }
        });
      },
      onDispose: async () => {
        await manager.dispose();
      },
    },
    operations: {
      initialize: {
        id: 'MidiService.initialize',
        name: 'initialize',
        handler: async (options?: { sysex?: boolean; software?: boolean }) => {
          await manager.initialize(options);
          const st = manager.getState();
          svcRef.setState({ ...st });
          return st;
        },
      },
      emitVirtualMidi: {
        id: 'MidiService.emitVirtualMidi',
        name: 'emitVirtualMidi',
        handler: async (payload: any) => {
          let captured: MidiEventPayload | null = null;
          const unsub = manager.subscribeEvents((ev) => {
            captured = ev;
          });
          const cmd = payload.command || payload.midiCommand || 'NOTE_ON';
          manager.emitVirtualMidi({ ...payload, command: cmd });
          unsub();
          return { midiEvent: captured, success: true };
        },
      },
      parseRawBytes: {
        id: 'MidiService.parseRawBytes',
        name: 'parseRawBytes',
        handler: async (input: {
          bytes: Uint8Array;
          sourceId?: string;
          sourceName?: string;
          timestamp?: number;
        }) => {
          return manager.parseRawMidiBytes(
            input.bytes,
            input.sourceId ?? 'hardware',
            input.sourceName ?? 'MIDI Port',
            input.timestamp ?? Date.now()
          );
        },
      },
      getState: {
        id: 'MidiService.getState',
        name: 'getState',
        handler: async () => manager.getState(),
      },
      dispose: {
        id: 'MidiService.dispose',
        name: 'dispose',
        handler: async () => {
          await manager.dispose();
          const st = manager.getState();
          svcRef.setState({ ...st });
          return st;
        },
      },
    },
  });

  svcRef = createService(def);
  return svcRef;
}

const defaultMidiService = createMidiService();
export const MidiServiceDefinition: ServiceDefinition = defaultMidiService.getDefinition();

const MidiServiceFacade = {
  id: MidiServiceDefinition.id,
  name: MidiServiceDefinition.name,
  version: MidiServiceDefinition.version,
  runtime: 'client' as const,
  deployment: 'local' as const,
  definition: MidiServiceDefinition,
  createInstance: createMidiService,
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => { await defaultMidiService.start(); return defaultMidiService.call<TIn, TOut>(op, input); },
};

// ══════════════════════════════════════════════════════════════════════════════
// 3. AUDIO-MIDI ORCHESTRATION DEFINITION (Pure serializable asset)
// ══════════════════════════════════════════════════════════════════════════════

import type { OrchestrationDefinition } from '@ultrst-armada/krnl';

const AudioMidiOrchestratorDefinition: OrchestrationDefinition = {
  id: 'kloks.orchestrator.audioMidi',
  name: 'AudioMidiOrchestrator',
  version: '1.0.0',
  description: 'Pure serializable orchestration definition: Midi -> AudioHardware',
  scope: 'service',
  dependencies: [AudioHardwareServiceFacade.id, MidiServiceFacade.id],
  steps: [
    {
      id: 'step_midi',
      name: 'Emit Virtual MIDI',
      type: 'task',
      target: MidiServiceFacade.id,
      operation: 'emitVirtualMidi',
    },
    {
      id: 'step_audio',
      name: 'Get Audio Hardware State',
      type: 'task',
      target: AudioHardwareServiceFacade.id,
      operation: 'getState',
      dependsOn: ['step_midi'],
    },
  ],
};

// ══════════════════════════════════════════════════════════════════════════════
// KRNL CANONICAL SERVICE EXPORTS (Standardized krnl* Prefix Rule)
// ══════════════════════════════════════════════════════════════════════════════
export const krnlAudioHardwareServiceDefinition = AudioHardwareServiceDefinition;
export const krnlAudioHardwareServiceFacade = AudioHardwareServiceFacade;
export const krnlMidiServiceDefinition = MidiServiceDefinition;
export const krnlMidiServiceFacade = MidiServiceFacade;
export const krnlAudioMidiOrchestratorDefinition = AudioMidiOrchestratorDefinition;

export * from './engine/index.js';




// Explicit public exports preserve the canonical facade names alongside engine re-exports.
export { AudioHardwareServiceFacade, MidiServiceFacade, AudioMidiOrchestratorDefinition };
