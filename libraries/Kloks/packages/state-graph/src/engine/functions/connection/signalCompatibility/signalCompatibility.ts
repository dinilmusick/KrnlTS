import { UniversalSocketDefinition, SignalType } from "../../../types/index.js";
import { SignalCompatibilityResult } from './types';
import { checkDataTypeMatch, checkAudioCompatibility } from './helpers';

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
