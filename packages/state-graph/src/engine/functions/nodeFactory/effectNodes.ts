import { EffectNode, EffectType, SignalType } from "../../types/index.js";

export function createEffectNode(
  type: EffectType,
  index: number,
  position?: [number, number, number],
  signalType?: SignalType
): EffectNode {
  // Enforce protocol binding for specialized effect orbs
  let effectiveSignalType: SignalType = signalType || 'trigger';
  
  if (
    type === 'gain' ||
    type === 'eq' ||
    type === 'compressor' ||
    type === 'multiband_compressor' ||
    type === 'limiter' ||
    type === 'reverb' ||
    type === 'saturation' ||
    type === 'pan' ||
    type === 'delay'
  ) {
    effectiveSignalType = 'audio_stereo';
  } else if (type === 'velocity') {
    effectiveSignalType = 'midi';
  }

  const signalColorMap: Partial<Record<SignalType, string>> = {
    trigger: type === 'repeater' ? '#c084fc' : '#a855f7',
    trigger_stream: type === 'repeater' ? '#f59e0b' : '#d97706',
    trigger_packet: '#f97316',
    midi_stream: '#a855f7',
    midi_packet: '#38bdf8',
    audio_stream: '#f43f5e',
    audio_packet: '#ec4899',
    curve_stream: '#14b8a6',
    curve_packet: '#34d399',
    midi: type === 'velocity' ? '#0ea5e9' : type === 'repeater' ? '#38bdf8' : '#0284c7',
    audio: type === 'gain' ? '#f43f5e' : type === 'repeater' ? '#fb7185' : '#e11d48',
    audio_mono: '#06b6d4',
    audio_stereo: '#ec4899',
  };

  let defaultName = `${effectiveSignalType.toUpperCase()} Effect ${index}`;
  let defaultLabel = `${effectiveSignalType.toUpperCase()} Effect`;
  
  if (type === 'repeater') {
    defaultName = `${effectiveSignalType.toUpperCase()} Repeater ${index}`;
    defaultLabel = `${effectiveSignalType.toUpperCase()} Pulse Repeater`;
  } else if (type === 'delay') {
    defaultName = `Stereo Delay ${index}`;
    defaultLabel = 'Stereo Delay / Echo';
  } else if (type === 'gain') {
    defaultName = `Audio Gain Scaler ${index}`;
    defaultLabel = 'Audio Wire Gain';
  } else if (type === 'pan') {
    defaultName = `Audio Stereo Pan ${index}`;
    defaultLabel = 'Audio Wire Pan';
  } else if (type === 'velocity') {
    defaultName = `MIDI Velocity Scaler ${index}`;
    defaultLabel = 'MIDI Wire Velocity Scaler';
  } else if (type === 'eq') {
    defaultName = `Parametric EQ ${index}`;
    defaultLabel = '4-Band Parametric EQ';
  } else if (type === 'compressor') {
    defaultName = `Studio Compressor ${index}`;
    defaultLabel = 'Compressor & Sidechain';
  } else if (type === 'multiband_compressor') {
    defaultName = `Multiband Compressor ${index}`;
    defaultLabel = '3-Band Sidechain Compressor';
  } else if (type === 'limiter') {
    defaultName = `Peak Limiter ${index}`;
    defaultLabel = 'Brickwall Peak Limiter';
  } else if (type === 'reverb') {
    defaultName = `Studio Reverb ${index}`;
    defaultLabel = 'Algorithmic Stereo Reverb';
  } else if (type === 'saturation') {
    defaultName = `Harmonic Saturation ${index}`;
    defaultLabel = 'Tape / Tube Saturation';
  }

  return {
    id: `eff-${Date.now()}`,
    type: 'effect',
    effectType: type,
    signalType: effectiveSignalType,
    name: defaultName,
    position: [
      position ? position[0] : (Math.random() - 0.5) * 8,
      3.5,
      position ? position[2] : (Math.random() - 0.5) * 8,
    ],
    radius: 6.0,
    active: true,
    color: signalColorMap[effectiveSignalType] || '#c084fc',
    label: defaultLabel,
    repeaterConfig: type === 'repeater'
      ? {
          repeats: 3,
          repeatIntervalBeats: 0.25,
          decay: 0.8,
        }
      : undefined,
    delayConfig: type === 'delay'
      ? {
          delayBeats: 0.5,
          feedback: 0.4,
          wetMix: 0.6,
        }
      : undefined,
    gainConfig: type === 'gain'
      ? {
          gain: 1.0,
        }
      : undefined,
    panConfig: type === 'pan'
      ? {
          pan: 0.0,
        }
      : undefined,
    velocityConfig: type === 'velocity'
      ? {
          multiplier: 1.0,
          offset: 0,
          randomize: 0,
        }
      : undefined,
    eqConfig: type === 'eq'
      ? {
          bands: [
            { id: 'b1', type: 'lowshelf', frequency: 100, gain: 0, q: 0.7, enabled: true, label: 'LOW' },
            { id: 'b2', type: 'peaking', frequency: 500, gain: 0, q: 1.0, enabled: true, label: 'L-MID' },
            { id: 'b3', type: 'peaking', frequency: 2500, gain: 0, q: 1.0, enabled: true, label: 'H-MID' },
            { id: 'b4', type: 'highshelf', frequency: 8000, gain: 0, q: 0.7, enabled: true, label: 'HIGH' },
          ],
          outputGain: 0,
        }
      : undefined,
    compressorConfig: type === 'compressor'
      ? {
          threshold: -20,
          ratio: 4,
          attack: 0.01,
          release: 0.15,
          knee: 5,
          makeupGain: 0,
          mix: 1.0,
          sidechainEnabled: false,
          sidechainSourceId: null,
          sidechainGain: 1.0,
        }
      : undefined,
    multibandCompressorConfig: type === 'multiband_compressor'
      ? {
          crossoverLow: 150,
          crossoverHigh: 2500,
          lowBand: { threshold: -20, ratio: 3.5, attack: 0.02, release: 0.18, makeupGain: 0 },
          midBand: { threshold: -18, ratio: 2.5, attack: 0.015, release: 0.12, makeupGain: 0 },
          highBand: { threshold: -16, ratio: 2.0, attack: 0.008, release: 0.08, makeupGain: 0 },
          outputGain: 1.0,
          mix: 1.0,
          sidechainEnabled: false,
          sidechainSourceId: null,
          sidechainBands: 'all',
        }
      : undefined,
    limiterConfig: type === 'limiter'
      ? {
          ceiling: -0.1,
          threshold: -2.0,
          release: 0.05,
          lookaheadMs: 3,
          softClip: true,
          makeupGain: 0,
        }
      : undefined,
    reverbConfig: type === 'reverb'
      ? {
          decayTime: 2.5,
          predelay: 20,
          damping: 6000,
          roomSize: 0.7,
          stereoWidth: 1.0,
          wetMix: 0.35,
          dryMix: 1.0,
        }
      : undefined,
    saturationConfig: type === 'saturation'
      ? {
          drive: 1.8,
          saturationType: 'tape',
          tone: 8500,
          outputGain: 1.0,
          wetMix: 1.0,
        }
      : undefined,
  };
}
