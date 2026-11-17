// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. SPECIALIZED SOCKET CLASSES
// ══════════════════════════════════════════════════════════════════════════════════════════
import { GraphSocketParent, SocketDirection } from './GraphSocketParent';

export class QwnsrTriggerSocket extends GraphSocketParent {
  constructor(portId: string, label: string, direction: SocketDirection, index: number = 0, description?: string) {
    super({
      portId,
      label,
      signalType: 'trigger',
      socketIndex: index,
      direction,
      description: description || 'High-precision clock pulse or trigger event',
    });
  }
}

export class QwnsrMidiSocket extends GraphSocketParent {
  constructor(portId: string, label: string, direction: SocketDirection, index: number = 0, description?: string) {
    super({
      portId,
      label,
      signalType: 'midi',
      socketIndex: index,
      direction,
      description: description || 'Polyphonic note pitch, velocity, and CC message stream',
    });
  }
}

export class QwnsrAudioSocket extends GraphSocketParent {
  constructor(
    portId: string,
    label: string,
    direction: SocketDirection,
    index: number = 0,
    isStereo: boolean = true,
    description?: string
  ) {
    super({
      portId,
      label,
      signalType: isStereo ? 'audio_stereo' : 'audio_mono',
      socketIndex: index,
      direction,
      description: description || (isStereo ? 'Stereo multi-channel audio buffer' : 'Mono audio buffer stream'),
    });
  }
}

export class QwnsrCurveSocket extends GraphSocketParent {
  constructor(portId: string, label: string, direction: SocketDirection, index: number = 0, description?: string) {
    super({
      portId,
      label,
      signalType: 'curve',
      socketIndex: index,
      direction,
      description: description || 'Continuous modulation voltage / automation curve',
    });
  }
}

export class QwnsrComponentSocket extends GraphSocketParent {
  constructor(portId: string, label: string, direction: SocketDirection, index: number = 0, description?: string) {
    super({
      portId,
      label,
      signalType: 'component',
      socketIndex: index,
      direction,
      description: description || 'Direct structural asset link to audio buffer container or stem',
    });
  }
}

export class QwnsrEffectSocket extends GraphSocketParent {
  constructor(portId: string, label: string, direction: SocketDirection, index: number = 0, description?: string) {
    super({
      portId,
      label,
      signalType: 'effect',
      socketIndex: index,
      direction,
      description: description || 'Modifier field signal passing through effect AoE radius',
    });
  }
}

// Standard Socket Archetypes & Variants
export class TriggerSocket extends QwnsrTriggerSocket {}
export class MidiStreamSocket extends QwnsrMidiSocket {}
export class MidiPacketSocket extends QwnsrMidiSocket {}

export class AudioStereoSocket extends GraphSocketParent {
  constructor(portId: string, label: string, direction: SocketDirection, index: number = 0, description?: string) {
    super({
      portId,
      label,
      signalType: 'audio_stereo',
      socketIndex: index,
      direction,
      description: description || 'Stereo multi-channel audio buffer',
    });
  }
}

export class AudioMonoSocket extends GraphSocketParent {
  constructor(portId: string, label: string, direction: SocketDirection, index: number = 0, description?: string) {
    super({
      portId,
      label,
      signalType: 'audio_mono',
      socketIndex: index,
      direction,
      description: description || 'Mono audio buffer stream',
    });
  }
}

export class AudioPacketSocket extends AudioStereoSocket {}
export class CurveStreamSocket extends QwnsrCurveSocket {}
export class CurvePacketSocket extends QwnsrCurveSocket {}
export class ComponentSocket extends QwnsrComponentSocket {}

export class PrimitiveSocket extends GraphSocketParent {
  constructor(portId: string, label: string, direction: SocketDirection, index: number = 0, description?: string) {
    super({
      portId,
      label,
      signalType: 'trigger',
      socketIndex: index,
      direction,
      description: description || 'Primitive data value socket',
    });
  }
}

export function createSocketInstance(descriptor: {
  portId: string;
  label: string;
  direction: SocketDirection;
  signalType?: string;
  index?: number;
  description?: string;
}): GraphSocketParent {
  switch (descriptor.signalType) {
    case 'trigger':
      return new TriggerSocket(descriptor.portId, descriptor.label, descriptor.direction, descriptor.index, descriptor.description);
    case 'midi':
      return new MidiStreamSocket(descriptor.portId, descriptor.label, descriptor.direction, descriptor.index, descriptor.description);
    case 'audio_mono':
      return new AudioMonoSocket(descriptor.portId, descriptor.label, descriptor.direction, descriptor.index, descriptor.description);
    case 'audio':
    case 'audio_stereo':
      return new AudioStereoSocket(descriptor.portId, descriptor.label, descriptor.direction, descriptor.index, descriptor.description);
    case 'curve':
      return new CurveStreamSocket(descriptor.portId, descriptor.label, descriptor.direction, descriptor.index, descriptor.description);
    case 'component':
      return new ComponentSocket(descriptor.portId, descriptor.label, descriptor.direction, descriptor.index, descriptor.description);
    default:
      return new PrimitiveSocket(descriptor.portId, descriptor.label, descriptor.direction, descriptor.index, descriptor.description);
  }
}
export const createQwnsrSocketInstance = createSocketInstance;

export interface SocketPosition2D {
  x: number;
  y: number;
}

export interface SocketGeometryConfig {
  radius?: number;
  pitch?: number;
  clearance?: number;
}

export interface SocketStyleConfig {
  color?: string;
  strokeWidth?: number;
  highlightGlow?: string;
}

