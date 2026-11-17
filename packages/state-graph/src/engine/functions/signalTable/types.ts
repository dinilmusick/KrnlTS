// ═══════════════════════════════════════════════════════════════════
// SIGNAL TABLE TYPES
// ═══════════════════════════════════════════════════════════════════
import { SignalType } from "../../types/index.js";
export type { SignalType };

export interface SignalTypeDefinition {
  type: SignalType;
  name: string;
  shortName: string;
  colorHex: number;
  colorStr: string;
  bgStr: string;
  description: string;
  iconName?: string;
}

export interface CanonicalEffectDefinition {
  effectType: string;
  signalType: string;
  name: string;
  shortName: string;
  auraColor: string;
  description: string;
}
