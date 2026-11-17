// ══════════════════════════════════════════════════════════════════════════════════════════
// KLOKS AUDIO-MIDI: SYNTH, SEQUENCER, CLIP, DSP, MIDI & OSC SERVICES
// ══════════════════════════════════════════════════════════════════════════════════════════

import {
  createService,
  createServiceDefinition,
  type IService,
  type ServiceDefinition,
} from '@ultrst-armada/krnl';
import {
  configureCanonicalMidiBridge,
  configureControlDispatcher,
  configureNodePerformanceTracker,
  configureSolidifyExecution,
} from '@kloks/state-graph';

import { synthEngine } from './audio/synthEngine.js';
import { sequencerEngine } from './audio/sequencerEngine.js';
import { audioClipEngine } from './audio/audioClipEngine.js';
import { audioInputManager } from './audio/audioInputManager.js';
import { retrospectiveBufferEngine } from './audio/retrospectiveBufferEngine.js';
import { midiManager } from './midi/midiManager.js';
import { oscManager } from './osc/oscManager.js';

// Bridge wiring is an explicit runtime initialization step, never a module-import side effect.
let audioMidiBridgesInitialized = false;

export function initializeAudioMidiEngineBridges(): void {
  if (audioMidiBridgesInitialized) return;
  configureCanonicalMidiBridge(midiManager);
  configureControlDispatcher({
    synthEngine,
    sequencerEngine,
    audioClipEngine,
  });
  configureNodePerformanceTracker({
    synthEngine,
    sequencerEngine,
    midiManager,
    oscManager,
    audioClipEngine,
  });
  configureSolidifyExecution(synthEngine);
  audioMidiBridgesInitialized = true;
}

// Re-export all engines, DSP modules, routers, and types
export * from './audio/synthEngine.js';
export * from './audio/sequencerEngine.js';
export * from './audio/sequencerStepProcessor.js';
export * from './audio/audioClipEngine.js';
export {
  audioInputManager,
  AudioInputManager,
  DEFAULT_NAMED_BUSSES,
  DEFAULT_NAMED_INPUTS,
} from './audio/audioInputManager.js';
export * from './audio/retrospectiveBufferEngine.js';
export * from './audio/AudioGraphNodes.js';
export * from './audio/clipWaveforms.js';
export * from './audio/curveEngine.js';
export * from './audio/devicePatterns.js';
export * from './audio/deviceProfiles.js';
export * from './audio/outputRouter.js';
export * from './audio/synthVoiceHelper.js';
export * from './audio/dsp/crossoverFilter.js';
export * from './audio/dsp/effectProcessorManager.js';
export * from './audio/dsp/reverbImpulse.js';
export * from './audio/dsp/saturationCurves.js';
export * from './audio/dsp/sidechainCompressor.js';
export * from './audio/dsp/sidechainMultibandCompressor.js';
export * from './audio/synth/AudioContextManager.js';
export * from './audio/synth/SynthConfigManager.js';
export * from './audio/synth/constants.js';
export * from './audio/synth/types.js';
export * from './audio/entities/AudioEffects/AudioEffects.js';
export {
  midiManager,
  MidiManager,
  type MidiStatus,
  type MidiListener,
  type DeviceListener,
  type StatusListener,
  type MidiEventPayload as EngineMidiEventPayload,
} from './midi/midiManager.js';
export * from './osc/oscManager.js';

// ══════════════════════════════════════════════════════════════════════════════
// KRNLTS SERVICE DEFINITIONS & FACADES FOR SYNTH, SEQUENCER, CLIPS & OSC
// ══════════════════════════════════════════════════════════════════════════════

export const SynthEngineServiceDefinition: ServiceDefinition = createServiceDefinition({
  id: 'kloks.audio.synth',
  lifecycle: { onInit: initializeAudioMidiEngineBridges },
  name: 'SynthEngineService',
  version: '1.0.0',
  operations: {
    getState: {
      id: 'SynthEngineService.getState',
      name: 'getState',
      handler: async () => ({
        isInitialized: Boolean(synthEngine),
      }),
    },
    setMasterVolume: {
      id: 'SynthEngineService.setMasterVolume',
      name: 'setMasterVolume',
      handler: async (input: { volume: number }) => {
        synthEngine.setMasterVolume(input.volume);
        return { volume: input.volume };
      },
    },
  },
});

const synthServiceInstance: IService = createService(SynthEngineServiceDefinition);

export const SynthEngineServiceFacade = {
  id: SynthEngineServiceDefinition.id,
  name: SynthEngineServiceDefinition.name,
  version: SynthEngineServiceDefinition.version,
  runtime: 'client' as const,
  deployment: 'local' as const,
  definition: SynthEngineServiceDefinition,
  engine: synthEngine,
  createInstance: () => createService(SynthEngineServiceDefinition),
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => {
    await synthServiceInstance.start();
    return synthServiceInstance.call<TIn, TOut>(op, input);
  },
};

export const SequencerEngineServiceDefinition: ServiceDefinition = createServiceDefinition({
  id: 'kloks.audio.sequencer',
  lifecycle: { onInit: initializeAudioMidiEngineBridges },
  name: 'SequencerEngineService',
  version: '1.0.0',
  operations: {
    setBpm: {
      id: 'SequencerEngineService.setBpm',
      name: 'setBpm',
      handler: async (input: { bpm: number }) => {
        sequencerEngine.bpm = input.bpm;
        return { bpm: input.bpm };
      },
    },
  },
});

const sequencerServiceInstance: IService = createService(SequencerEngineServiceDefinition);

export const SequencerEngineServiceFacade = {
  id: SequencerEngineServiceDefinition.id,
  name: SequencerEngineServiceDefinition.name,
  version: SequencerEngineServiceDefinition.version,
  runtime: 'client' as const,
  deployment: 'local' as const,
  definition: SequencerEngineServiceDefinition,
  engine: sequencerEngine,
  createInstance: () => createService(SequencerEngineServiceDefinition),
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => {
    await sequencerServiceInstance.start();
    return sequencerServiceInstance.call<TIn, TOut>(op, input);
  },
};

export const OscServiceDefinition: ServiceDefinition = createServiceDefinition({
  id: 'kloks.osc.manager',
  lifecycle: { onInit: initializeAudioMidiEngineBridges },
  name: 'OscService',
  version: '1.0.0',
  operations: {
    sendMessage: {
      id: 'OscService.sendMessage',
      name: 'sendMessage',
      handler: async (input: { address: string; args: (number | string | boolean)[]; targetDeviceId?: string }) => {
        oscManager.sendOscMessage(input.address, input.args, input.targetDeviceId);
        return { sent: true, address: input.address };
      },
    },
  },
});

const oscServiceInstance: IService = createService(OscServiceDefinition);

export const OscServiceFacade = {
  id: OscServiceDefinition.id,
  name: OscServiceDefinition.name,
  version: OscServiceDefinition.version,
  runtime: 'client' as const,
  deployment: 'local' as const,
  definition: OscServiceDefinition,
  engine: oscManager,
  createInstance: () => createService(OscServiceDefinition),
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => {
    await oscServiceInstance.start();
    return oscServiceInstance.call<TIn, TOut>(op, input);
  },
};
