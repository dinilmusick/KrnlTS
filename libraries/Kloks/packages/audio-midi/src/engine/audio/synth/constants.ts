import { AudioEngineConfig } from '../synthEngine/types';

export const STORAGE_KEY_AUDIO_CONFIG = 'celestial_audio_engine_config';

export const DEFAULT_AUDIO_CONFIG: AudioEngineConfig = {
  sampleRate: 0,
  bufferSize: 256,
};
