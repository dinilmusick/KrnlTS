import { UniversalSocketDefinition } from "../../../types/index.js";
import { SignalCompatibilityResult } from './types';

export function checkDataTypeMatch(
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

export function checkAudioCompatibility(
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
