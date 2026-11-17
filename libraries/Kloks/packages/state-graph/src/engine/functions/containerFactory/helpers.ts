// ════ CONTAINERFACTORY EXTRACTED HELPERS ══════════════════════════════════════════
import {
  ContainerNode,
  ContainerType,
  RecorderNode,
  PlayerNode,
  SamplerNode,
  AudioPadsNode,
} from "../../types/index.js";

export function createContainerNode(
  type: ContainerType,
  index: number,
  bpm: number,
  position?: [number, number, number],
  audioFormat?: 'mono' | 'stereo'
): ContainerNode {
  const id = `cont-${Date.now()}`;
  const pos: [number, number, number] = position || [
    (Math.random() - 0.5) * 8,
    0.5,
    (Math.random() - 0.5) * 8,
  ];

  // Default audio formats if unspecified
  const finalAudioFormat = audioFormat || (type === 'audio' ? 'mono' : undefined);

  const base: ContainerNode = {
    id,
    type: 'container',
    containerType: type,
    audioFormat: finalAudioFormat,
    name: type === 'midi'
      ? `MIDI Container ${index}`
      : type === 'audio'
      ? (finalAudioFormat === 'stereo' ? `Audio Container (Stereo) ${index}` : `Audio Container (Mono) ${index}`)
      : type === 'instrument'
      ? `Instrument Nexus ${index}`
      : `Curve Container ${index}`,
    position: pos,
    color: type === 'midi'
      ? '#38bdf8'
      : type === 'audio'
      ? '#f43f5e'
      : type === 'instrument'
      ? '#a855f7'
      : '#22d3ee',
    radius: 1.5,
    isLooping: true,
    acceptedEffects: ['repeater', 'delay'],
    synthPreset: {
      synthType: type === 'audio' ? 'bass' : 'poly',
      attack: 0.05,
      decay: 0.4,
      sustain: 0.5,
      release: 0.8,
      cutoff: 3000,
      resonance: 2,
      reverb: 0.4,
      delay: 0.3,
    },
    pattern: {
      id: `pat-${Date.now()}`,
      name: `${type.toUpperCase()} Pattern`,
      lengthInBeats: 4,
      tempo: bpm,
      notes: (type === 'midi' || type === 'instrument')
        ? [
            { note: 60, name: 'C4', velocity: 0.85, time: 0, duration: 0.5 },
            { note: 67, name: 'G4', velocity: 0.8, time: 1, duration: 0.5 },
            { note: 64, name: 'E4', velocity: 0.8, time: 2, duration: 0.5 },
            { note: 71, name: 'B4', velocity: 0.8, time: 3, duration: 0.5 },
          ]
        : [],
    },
  };

  if (type === 'audio') {
    base.audioTrack = {
      id: `aud-${Date.now()}`,
      name: `Audio Track ${index}`,
      sampleType: 'custom',
      durationBeats: 4,
      gain: 1.0,
      pan: 0,
      pitchShift: 0,
      filterCutoff: 16000,
      fadeInBeats: 0,
      fadeOutBeats: 0,
      trimStartBeats: 0,
      trimEndBeats: 4,
      isReversed: false,
    };
  }
  
  if (type === 'curve') {
    base.curveData = {
      id: `crv-${Date.now()}`,
      name: `Curve Track ${index}`,
      lengthInBeats: 4,
      targetParam: 'cutoff',
      minValue: 0,
      maxValue: 1,
      points: [
        { id: 'p0', x: 0, y: 0.2, tension: 0 },
        { id: 'p1', x: 1, y: 0.9, tension: 0 },
        { id: 'p2', x: 2, y: 0.4, tension: 0 },
        { id: 'p3', x: 3, y: 0.85, tension: 0 },
        { id: 'p4', x: 4, y: 0.2, tension: 0 },
      ],
    };
  }

  return base;
}

export function createRecorderNode(
  recorderType: 'audio' | 'audio_mono' | 'audio_stereo' | 'midi' | 'curve',
  index: number,
  position?: [number, number, number],
  recordingMode: 'standard' | 'retrospective' = 'standard'
): RecorderNode {
  const id = `rec-${Date.now()}`;
  const pos: [number, number, number] = position || [
    (Math.random() - 0.5) * 8,
    0.5,
    (Math.random() - 0.5) * 8,
  ];

  const effectiveType = recorderType === 'audio' ? 'audio_mono' : recorderType;
  const isAudioMono = effectiveType === 'audio_mono';
  const isAudioStereo = effectiveType === 'audio_stereo';
  const isAudio = isAudioStereo || isAudioMono;
  const isRetrospective = recordingMode === 'retrospective';

  const typeName =
    effectiveType === 'audio_stereo'
      ? `Audio Recorder Stereo`
      : effectiveType === 'audio_mono'
      ? `Audio Recorder Mono`
      : effectiveType === 'midi'
      ? `MIDI Recorder`
      : `Curve Recorder`;

  return {
    id,
    type: 'recorder',
    name: isRetrospective ? `Retrospective ${typeName} ${index}` : `${typeName} ${index}`,
    position: pos,
    color: isAudio ? '#f43f5e' : effectiveType === 'midi' ? '#c084fc' : '#10b981',
    radius: 1.2,
    recorderType: effectiveType,
    recordingMode,
    isRecording: false,
    isArmed: false,
    armMode: 'quantized',
    quantizeEnabled: true,
    quantizeDivision: '1_bar',
    quantizeStatus: 'idle',
    pendingTriggerBeat: null,
    pendingAction: null,
    targetPacketName: undefined,
    recordingLengthBeats: 4,
    autoStoreOnStop: true,
    // Retrospective Buffer defaults
    bufferLengthType: 'bars_beats',
    bufferLengthBars: 4,
    bufferLengthBeats: 16,
    bufferLengthSeconds: 8,
    captureToleranceBeatsBefore: 2.0,
    captureToleranceBeatsAfter: 2.0,
    recordedPacketsCount: 0,
  };
}

export function createPlayerNode(
  playerType: 'audio' | 'audio_mono' | 'audio_stereo' | 'midi' | 'curve',
  index: number,
  position?: [number, number, number]
): PlayerNode {
  const id = `ply-${Date.now()}`;
  const pos: [number, number, number] = position || [
    (Math.random() - 0.5) * 8,
    0.5,
    (Math.random() - 0.5) * 8,
  ];

  const effectiveType = playerType === 'audio' ? 'audio_stereo' : playerType;
  const isAudio = effectiveType === 'audio_stereo' || effectiveType === 'audio_mono';

  return {
    id,
    type: 'player',
    name:
      effectiveType === 'audio_stereo'
        ? `Audio Stereo Player ${index}`
        : effectiveType === 'audio_mono'
        ? `Audio Mono Player ${index}`
        : effectiveType === 'midi'
        ? `MIDI Player ${index}`
        : `Curve Player ${index}`,
    position: pos,
    color: isAudio ? '#fb7185' : effectiveType === 'midi' ? '#a855f7' : '#34d399',
    radius: 1.2,
    playerType: effectiveType,
    playbackMode: 'loop',
    playbackSpeed: 1.0,
    pitchShiftSemitones: 0,
    gain: 1.0,
    isPlaying: false,
    quantizeEnabled: true,
    quantizeDivision: '1_bar',
    quantizeStatus: 'idle',
    pendingTriggerBeat: null,
    pendingAction: null,
    loopLengthBeats: 4,
  };
}

export function createSamplerNode(
  index: number,
  position?: [number, number, number]
): SamplerNode {
  const id = `smp-${Date.now()}`;
  const pos: [number, number, number] = position || [
    (Math.random() - 0.5) * 8,
    0.5,
    (Math.random() - 0.5) * 8,
  ];

  return {
    id,
    type: 'sampler',
    name: `Sampler Engine ${index}`,
    position: pos,
    color: '#ec4899',
    radius: 1.3,
    rootKey: 60,
    glide: 0,
    polyphony: 8,
    zones: [
      {
        id: `z-${Date.now()}`,
        name: 'Zone 1',
        sampleUrl: 'cosmic_warp',
        lowKey: 36,
        highKey: 84,
        rootKey: 60,
        lowVelocity: 1,
        highVelocity: 127,
        gain: 1.0,
        pan: 0,
        tune: 0,
        isReversed: false,
        loop: true,
      },
    ],
  };
}

export function createAudioPadsNode(
  index: number,
  position?: [number, number, number]
): AudioPadsNode {
  const id = `pads-${Date.now()}`;
  const pos: [number, number, number] = position || [
    (Math.random() - 0.5) * 8,
    0.5,
    (Math.random() - 0.5) * 8,
  ];

  return {
    id,
    type: 'audio_pads',
    name: `Audio Pads ${index}`,
    position: pos,
    color: '#06b6d4',
    radius: 1.3,
    active: true,
    volume: 1.0,
    pads: [],
    padMidiMap: {},
  };
}
