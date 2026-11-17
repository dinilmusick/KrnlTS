import { SignalType } from '../../../types/index.js';

export interface SignalCompatibilityResult {
  isCompatible: boolean;
  canonicalSignalType: SignalType;
  reason?: string;
}
