import {
  UniversalSocketDefinition,
  SignalMedium,
  SignalDataType,
  SignalPolarity,
  ConnectivityType,
  SignalType,
} from "../../types/index.js";
import { SIGNAL_TYPES } from '../../functions/canonicalSignalTable';

/**
 * Universal Factory for building standardized, packaged socket descriptors.
 */
export function createPackagedSocket(options: {
  socketId: string;
  label: string;
  polarity: SignalPolarity;
  medium: SignalMedium;
  dataType: SignalDataType;
  signalType?: SignalType;
  connectivity?: ConnectivityType;
  socketIndex?: number;
  description: string;
  iconName?: string;
  isCustom?: boolean;
  isOmni?: boolean;
  customMeta?: Record<string, any>;
}): UniversalSocketDefinition {
  let canonicalSig: SignalType = options.signalType || 'trigger';
  if (!options.signalType) {
    if (options.medium === 'trigger') {
      canonicalSig = 'trigger';
    } else if (options.medium === 'midi') {
      canonicalSig = options.dataType === 'packet' ? 'midi_packet' : 'midi_stream';
    } else if (options.medium === 'curve') {
      canonicalSig = options.dataType === 'packet' ? 'curve_packet' : 'curve_stream';
    } else if (options.medium === 'audio_mono') {
      canonicalSig = options.dataType === 'packet' ? 'audio_packet' : 'audio_mono';
    } else if (options.medium === 'audio_stereo') {
      canonicalSig = options.dataType === 'packet' ? 'audio_packet' : 'audio_stereo';
    } else if (options.medium === 'component') {
      canonicalSig = 'component';
    } else if (options.medium === 'omni') {
      canonicalSig = options.dataType === 'packet' ? 'omni_packet' : 'omni_stream';
    }
  }

  const visualDef = SIGNAL_TYPES[canonicalSig] || SIGNAL_TYPES.trigger;

  return {
    socketId: options.socketId,
    label: options.label,
    polarity: options.polarity,
    medium: options.medium,
    dataType: options.dataType,
    signalType: canonicalSig,
    connectivity: options.connectivity || (options.polarity === 'input' ? 'single' : 'multi'),
    socketIndex: options.socketIndex ?? 0,
    description: options.description,
    colorHex: visualDef.colorHex,
    colorStr: visualDef.colorStr,
    bgStr: visualDef.bgStr,
    iconName: options.iconName || visualDef.iconName,
    isCustom: options.isCustom ?? false,
    isOmni: options.isOmni ?? (options.medium === 'omni' || canonicalSig === 'omni_packet' || canonicalSig === 'omni_stream' || canonicalSig === 'omni'),
    customMeta: options.customMeta,
  };
}
