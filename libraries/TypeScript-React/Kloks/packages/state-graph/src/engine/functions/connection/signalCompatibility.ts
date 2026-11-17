import { UniversalSocketDefinition, SignalType } from '../../types/legacyTypes';

export interface SignalCompatibilityResult {
  isCompatible: boolean;
  canonicalSignalType: SignalType;
  reason?: string;
}

function checkDataTypeMatch(
  outSocket: UniversalSocketDefinition,
  inSocket: UniversalSocketDefinition
): SignalCompatibilityResult | null {
  if (
    outSocket.medium === 'data' ||
    inSocket.medium === 'data' ||
    ['string', 'number', 'boolean', 'object', 'array'].includes(outSocket.signalType) ||
    ['string', 'number', 'boolean', 'object', 'array'].includes(inSocket.signalType)
  ) {
    return null;
  }

  if (outSocket.dataType === inSocket.dataType) return null;

  if (outSocket.dataType === 'packet' && inSocket.dataType === 'stream') {
    return {
      isCompatible: false,
      canonicalSignalType: outSocket.signalType,
      reason: 'Data type mismatch: Output is a discrete Packet (Clip), but Input requires a continuous Stream. Use a Player (Packet ➔ Stream).',
    };
  }
  if (outSocket.dataType === 'stream' && inSocket.dataType === 'packet') {
    return {
      isCompatible: false,
      canonicalSignalType: outSocket.signalType,
      reason: 'Data type mismatch: Output is a continuous Stream, but Input requires a discrete Packet. Use a Recorder (Stream ➔ Packet).',
    };
  }
  if (outSocket.dataType === 'pulse' || inSocket.dataType === 'pulse') {
    // Both are trigger medium: trigger stream is a continuous stream of trigger pulses
    if (outSocket.medium === 'trigger' && inSocket.medium === 'trigger') {
      return null;
    }
    return {
      isCompatible: false,
      canonicalSignalType: outSocket.signalType,
      reason: `Data type mismatch: Trigger pulses cannot connect to ${inSocket.dataType} sockets directly.`,
    };
  }
  return null;
}

function checkAudioCompatibility(
  outSocket: UniversalSocketDefinition,
  inSocket: UniversalSocketDefinition
): SignalCompatibilityResult | null {
  const isOutAudio = outSocket.medium === 'audio_stereo' || outSocket.medium === 'audio_mono' || (outSocket.medium as string) === 'audio';
  const isInAudio = inSocket.medium === 'audio_stereo' || inSocket.medium === 'audio_mono' || (inSocket.medium as string) === 'audio';
  if (!isOutAudio || !isInAudio) return null;

  if (outSocket.dataType === 'packet' && inSocket.dataType === 'packet') {
    if (
      outSocket.medium === inSocket.medium ||
      inSocket.customMeta?.acceptsAnyAudioFormat ||
      outSocket.customMeta?.acceptsAnyAudioFormat ||
      (outSocket.medium as string) === 'audio' ||
      (inSocket.medium as string) === 'audio'
    ) {
      return { isCompatible: true, canonicalSignalType: 'audio_packet' };
    }
    return {
      isCompatible: false,
      canonicalSignalType: outSocket.signalType,
      reason: `Audio format mismatch: Cannot connect ${outSocket.medium === 'audio_stereo' ? 'Stereo' : 'Mono'} packet to ${inSocket.medium === 'audio_stereo' ? 'Stereo' : 'Mono'} packet.`,
    };
  }

  if (
    inSocket.customMeta?.acceptsAnyAudioFormat ||
    outSocket.customMeta?.acceptsAnyAudioFormat ||
    (outSocket.medium as string) === 'audio' ||
    (inSocket.medium as string) === 'audio'
  ) {
    return { isCompatible: true, canonicalSignalType: 'audio_stereo' };
  }

  if (outSocket.medium === 'audio_stereo' && inSocket.medium === 'audio_stereo') {
    return { isCompatible: true, canonicalSignalType: 'audio_stereo' };
  }
  if (outSocket.medium === 'audio_mono' && inSocket.medium === 'audio_mono') {
    return { isCompatible: true, canonicalSignalType: 'audio_mono' };
  }
  if (outSocket.medium === 'audio_stereo' && inSocket.medium === 'audio_mono') {
    return {
      isCompatible: false,
      canonicalSignalType: outSocket.signalType,
      reason: 'Audio format mismatch: Stereo audio output cannot connect directly to Mono audio input. Use a Stereo-to-Mono Converter node.',
    };
  }
  if (outSocket.medium === 'audio_mono' && inSocket.medium === 'audio_stereo') {
    return {
      isCompatible: false,
      canonicalSignalType: outSocket.signalType,
      reason: 'Audio format mismatch: Mono audio output cannot connect directly to Stereo audio input. Use a Mono-to-Stereo Converter node.',
    };
  }
  return null;
}

export function areSignalsCompatible(
  outSocket: UniversalSocketDefinition,
  inSocket: UniversalSocketDefinition
): SignalCompatibilityResult {
  if (outSocket.polarity !== 'output' || inSocket.polarity !== 'input') {
    return {
      isCompatible: false,
      canonicalSignalType: 'trigger',
      reason: `Polarity mismatch: Cannot connect ${outSocket.polarity} socket to ${inSocket.polarity} socket.`,
    };
  }

  // 1. Check Data Type compatibility first (Packet vs Stream vs Pulse)
  const typeMismatch = checkDataTypeMatch(outSocket, inSocket);
  if (typeMismatch) return typeMismatch;

  // 2. Omni Handle Semantics:
  // Omni input handles accept any incoming signal matching their dataType (e.g. Omni Packet accepts any discrete Packet)
  const isTargetOmni =
    inSocket.medium === 'omni' ||
    Boolean(inSocket.isOmni) ||
    Boolean(inSocket.customMeta?.isOmni) ||
    inSocket.signalType === 'omni_packet' ||
    inSocket.signalType === 'omni_stream' ||
    inSocket.signalType === 'omni' ||
    Boolean(inSocket.customMeta?.isArrangementIngest) ||
    Boolean(inSocket.customMeta?.acceptsAnySignal);

  if (isTargetOmni) {
    if (inSocket.dataType === 'packet') {
      if (outSocket.dataType === 'packet') {
        return { isCompatible: true, canonicalSignalType: outSocket.signalType };
      }
      return {
        isCompatible: false,
        canonicalSignalType: outSocket.signalType,
        reason: 'Omni Packet handle requires a discrete Packet (Clip) input. Use a Recorder to convert Stream ➔ Packet.',
      };
    }
    if (inSocket.dataType === 'stream') {
      if (outSocket.dataType === 'stream') {
        return { isCompatible: true, canonicalSignalType: outSocket.signalType };
      }
      return {
        isCompatible: false,
        canonicalSignalType: outSocket.signalType,
        reason: 'Omni Stream handle requires a continuous Stream input. Use a Player to convert Packet ➔ Stream.',
      };
    }
    return { isCompatible: true, canonicalSignalType: outSocket.signalType };
  }

  // Omni output handles can feed any matching dataType input
  const isSourceOmni =
    outSocket.medium === 'omni' ||
    Boolean(outSocket.isOmni) ||
    Boolean(outSocket.customMeta?.isOmni) ||
    outSocket.signalType === 'omni_packet' ||
    outSocket.signalType === 'omni_stream' ||
    outSocket.signalType === 'omni';

  if (isSourceOmni) {
    return { isCompatible: true, canonicalSignalType: inSocket.signalType };
  }

  // 3. Data Primitives & Parameters Compatibility
  const isDataSignal =
    outSocket.medium === 'data' ||
    inSocket.medium === 'data' ||
    ['string', 'number', 'boolean', 'object', 'array'].includes(outSocket.signalType) ||
    ['string', 'number', 'boolean', 'object', 'array'].includes(inSocket.signalType) ||
    inSocket.socketId === 'folder_path_in' ||
    inSocket.socketId === 'file_name_in' ||
    inSocket.socketId === 'select_in';

  if (isDataSignal) {
    // Container folder path input: accepts String, Object, or Array
    if (inSocket.socketId === 'folder_path_in') {
      if (outSocket.signalType === 'string' || outSocket.signalType === 'object' || outSocket.signalType === 'array') {
        return { isCompatible: true, canonicalSignalType: 'string' };
      }
      return { isCompatible: false, canonicalSignalType: 'string', reason: 'Folder Path input accepts String or Object data wires.' };
    }

    // Container file name input: accepts String or Number
    if (inSocket.socketId === 'file_name_in') {
      if (outSocket.signalType === 'string' || outSocket.signalType === 'number') {
        return { isCompatible: true, canonicalSignalType: 'string' };
      }
      return { isCompatible: false, canonicalSignalType: 'string', reason: 'File Name input accepts String data wires.' };
    }

    // Folder selection input: accepts String or Object
    if (inSocket.socketId === 'select_in') {
      if (outSocket.signalType === 'string' || outSocket.signalType === 'object') {
        return { isCompatible: true, canonicalSignalType: 'string' };
      }
    }

    // Direct match
    if (outSocket.signalType === inSocket.signalType) {
      return { isCompatible: true, canonicalSignalType: inSocket.signalType };
    }

    // Number into String input
    if (outSocket.signalType === 'number' && inSocket.signalType === 'string') {
      return { isCompatible: true, canonicalSignalType: 'string' };
    }

    // Boolean into String input
    if (outSocket.signalType === 'boolean' && inSocket.signalType === 'string') {
      return { isCompatible: true, canonicalSignalType: 'string' };
    }

    // Object and Array cross-talk
    if (
      (outSocket.signalType === 'object' || outSocket.signalType === 'array') &&
      (inSocket.signalType === 'object' || inSocket.signalType === 'array')
    ) {
      return { isCompatible: true, canonicalSignalType: inSocket.signalType };
    }

    return {
      isCompatible: false,
      canonicalSignalType: outSocket.signalType,
      reason: `Cannot connect ${outSocket.signalType} parameter to ${inSocket.signalType} input.`,
    };
  }

  // 4. Medium-Specific Compatibility Checks
  if (outSocket.medium === 'trigger' || inSocket.medium === 'trigger') {
    if (outSocket.medium === 'trigger' && inSocket.medium === 'trigger') {
      const canonical: SignalType =
        outSocket.dataType === 'packet' || inSocket.dataType === 'packet'
          ? 'trigger_packet'
          : 'trigger_stream';
      return { isCompatible: true, canonicalSignalType: canonical };
    }
    return { isCompatible: false, canonicalSignalType: 'trigger', reason: `Cannot route ${outSocket.medium} into ${inSocket.medium}.` };
  }

  if (outSocket.medium === 'midi' || inSocket.medium === 'midi') {
    if (outSocket.medium === 'midi' && inSocket.medium === 'midi') {
      const sigType: SignalType = outSocket.dataType === 'packet' ? 'midi_packet' : 'midi_stream';
      return { isCompatible: true, canonicalSignalType: sigType };
    }
    return { isCompatible: false, canonicalSignalType: outSocket.signalType, reason: 'MIDI data can only route to MIDI inputs.' };
  }

  if (outSocket.medium === 'curve' || inSocket.medium === 'curve') {
    if (outSocket.medium === 'curve' && inSocket.medium === 'curve') {
      const sigType: SignalType = outSocket.dataType === 'packet' ? 'curve_packet' : 'curve_stream';
      return { isCompatible: true, canonicalSignalType: sigType };
    }
    return { isCompatible: false, canonicalSignalType: outSocket.signalType, reason: 'Curve signals can only route to Curve inputs.' };
  }

  if (outSocket.medium === 'component' || inSocket.medium === 'component') {
    if (outSocket.medium === 'component' && inSocket.medium === 'component') {
      return { isCompatible: true, canonicalSignalType: 'component' };
    }
    return { isCompatible: false, canonicalSignalType: 'component', reason: 'Component links can only route to Component inputs.' };
  }

  const audioRes = checkAudioCompatibility(outSocket, inSocket);
  if (audioRes) return audioRes;

  return {
    isCompatible: false,
    canonicalSignalType: outSocket.signalType,
    reason: `Incompatible signal mediums: cannot route ${outSocket.medium} into ${inSocket.medium}.`,
  };
}
