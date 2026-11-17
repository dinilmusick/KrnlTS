export {
  areSignalsCompatible,
  type SignalCompatibilityResult,
} from './connection/signalCompatibility.js';

export {
  findCompatibleSocketPair,
  type SocketPairMatch,
} from './connection/portMatching.js';

export {
  validateUniversalConnection,
  createUniversalWire,
  type UniversalConnectionValidationResult,
} from './connection/wireValidation.js';
