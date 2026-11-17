// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. SPECIALIZED WIRE CLASSES
// ══════════════════════════════════════════════════════════════════════════════════════════
import { GraphWireParent, QwnsrWireDescriptor } from './GraphWireParent';

export class QwnsrTriggerWire extends GraphWireParent {
  constructor(descriptor: Omit<QwnsrWireDescriptor, 'signalType'>) {
    super({ ...descriptor, signalType: 'trigger' });
    this.flowSpeedMultiplier = 1.2;
  }
}

export class QwnsrMidiWire extends GraphWireParent {
  constructor(descriptor: Omit<QwnsrWireDescriptor, 'signalType'>) {
    super({ ...descriptor, signalType: 'midi' });
    this.flowSpeedMultiplier = 1.0;
  }
}

export class QwnsrAudioWire extends GraphWireParent {
  constructor(descriptor: Omit<QwnsrWireDescriptor, 'signalType'>, isStereo: boolean = true) {
    super({ ...descriptor, signalType: isStereo ? 'audio_stereo' : 'audio_mono' });
    this.flowSpeedMultiplier = 1.5;
  }
}

export class QwnsrCurveWire extends GraphWireParent {
  constructor(descriptor: Omit<QwnsrWireDescriptor, 'signalType'>) {
    super({ ...descriptor, signalType: 'curve' });
    this.flowSpeedMultiplier = 0.8;
  }
}

export class QwnsrComponentWire extends GraphWireParent {
  constructor(descriptor: Omit<QwnsrWireDescriptor, 'signalType'>) {
    super({ ...descriptor, signalType: 'component' });
    this.flowSpeedMultiplier = 0.6;
  }
}

export class QwnsrEffectWire extends GraphWireParent {
  constructor(descriptor: Omit<QwnsrWireDescriptor, 'signalType'>) {
    super({ ...descriptor, signalType: 'effect' });
    this.flowSpeedMultiplier = 1.1;
  }
}

export function createQwnsrWireInstance(descriptor: QwnsrWireDescriptor): GraphWireParent {
  switch (descriptor.signalType) {
    case 'trigger':
      return new QwnsrTriggerWire(descriptor);
    case 'midi':
      return new QwnsrMidiWire(descriptor);
    case 'audio':
    case 'audio_mono':
      return new QwnsrAudioWire(descriptor, false);
    case 'audio_stereo':
      return new QwnsrAudioWire(descriptor, true);
    case 'curve':
      return new QwnsrCurveWire(descriptor);
    case 'component':
      return new QwnsrComponentWire(descriptor);
    case 'effect':
      return new QwnsrEffectWire(descriptor);
    default:
      return new QwnsrTriggerWire(descriptor);
  }
}

// Standard Wire Archetypes & Variants
export class TriggerWire extends QwnsrTriggerWire {}
export class MidiStreamWire extends QwnsrMidiWire {}
export class MidiPacketWire extends QwnsrMidiWire {}

export class AudioStereoWire extends GraphWireParent {
  constructor(descriptor: Omit<QwnsrWireDescriptor, 'signalType'>) {
    super({ ...descriptor, signalType: 'audio_stereo' });
    this.flowSpeedMultiplier = 1.5;
  }
}

export class AudioMonoWire extends GraphWireParent {
  constructor(descriptor: Omit<QwnsrWireDescriptor, 'signalType'>) {
    super({ ...descriptor, signalType: 'audio_mono' });
    this.flowSpeedMultiplier = 1.5;
  }
}

export class AudioPacketWire extends AudioStereoWire {}
export class CurveStreamWire extends QwnsrCurveWire {}
export class CurvePacketWire extends QwnsrCurveWire {}
export class ComponentWire extends QwnsrComponentWire {}

export class PrimitiveWire extends GraphWireParent {
  constructor(descriptor: Omit<QwnsrWireDescriptor, 'signalType'>) {
    super({ ...descriptor, signalType: 'trigger' });
    this.flowSpeedMultiplier = 1.0;
  }
}

export function createWireInstance(descriptor: QwnsrWireDescriptor): GraphWireParent {
  switch (descriptor.signalType) {
    case 'trigger':
      return new TriggerWire(descriptor);
    case 'midi':
      return new MidiStreamWire(descriptor);
    case 'audio_mono':
      return new AudioMonoWire(descriptor);
    case 'audio':
    case 'audio_stereo':
      return new AudioStereoWire(descriptor);
    case 'curve':
      return new CurveStreamWire(descriptor);
    case 'component':
      return new ComponentWire(descriptor);
    case 'effect':
      return new QwnsrEffectWire(descriptor);
    default:
      return new PrimitiveWire(descriptor);
  }
}

export interface WireEndpoint2D {
  x: number;
  y: number;
  direction?: 'in' | 'out';
}

export interface WireCurveStyle {
  curvature?: number;
  tension?: number;
  style?: 'bezier' | 'linear' | 'step';
}

export interface WireAnimationConfig {
  pulseSpeed?: number;
  flowSpeed?: number;
  particleCount?: number;
}

export interface WireVisualConfig {
  strokeWidth?: number;
  color?: string;
  glowColor?: string;
  glowBlur?: number;
}

