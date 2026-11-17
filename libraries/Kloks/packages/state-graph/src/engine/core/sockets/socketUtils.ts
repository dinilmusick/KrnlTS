// ═══════════════════════════════════════════════════════════════════
// SOCKET UTILITIES & FACTORY
// ═══════════════════════════════════════════════════════════════════
import {
  SpaceNode,
  UniversalSocketDefinition,
  SignalMedium,
  SignalDataType,
  SignalPolarity,
  ConnectivityType,
  SignalType,
} from "../../types/index.js";
import { CANONICAL_SIGNAL_TYPES } from "../../functions/canonicalSignalTable";

export type { UniversalSocketDefinition };
export type NodeSocketDescriptor = UniversalSocketDefinition;

export interface NodeSocketsResult {
  inputs: UniversalSocketDefinition[];
  outputs: UniversalSocketDefinition[];
}

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
  // Derive canonical composite signalType if not explicitly passed
  let canonicalSig: SignalType = options.signalType || 'trigger';
  if (!options.signalType) {
    if (options.medium === 'trigger') {
      canonicalSig = 'trigger';
    } else if (options.medium === 'midi') {
      canonicalSig = options.dataType === 'packet' ? 'midi_packet' : 'midi_stream';
    } else if (options.medium === 'curve') {
      canonicalSig = options.dataType === 'packet' ? 'curve_packet' : 'curve_stream';
    } else if (options.medium === 'audio_stereo' || options.medium === 'audio_mono') {
      canonicalSig = options.dataType === 'packet' ? 'audio_packet' : (options.medium === 'audio_mono' ? 'audio_mono' : 'audio_stereo');
    }
  }

  // Lookup canonical metadata colors and icons from table if available
  const meta = CANONICAL_SIGNAL_TYPES[canonicalSig] || CANONICAL_SIGNAL_TYPES['trigger'];

  return {
    socketId: options.socketId,
    label: options.label,
    polarity: options.polarity,
    medium: options.medium,
    dataType: options.dataType,
    signalType: canonicalSig,
    connectivity: options.connectivity || 'multi',
    socketIndex: options.socketIndex ?? 0,
    colorHex: meta.colorHex,
    colorStr: meta.colorStr,
    bgStr: meta.bgStr,
    description: options.description || meta.description,
    iconName: options.iconName || meta.iconName,
    isCustom: options.isCustom ?? false,
    isOmni: options.isOmni ?? false,
    customMeta: options.customMeta,
  };
}
