import { SpaceNode, NodeConnection } from '@kloks/state-graph';
import { AudioEngineConfig } from '../synthEngine/types';
import { BaseAudioGraphNode, createAudioGraphNode } from '../AudioGraphNodes';
import { audioEffectsEntity } from '../entities/AudioEffects/AudioEffects.js';
import { DEFAULT_AUDIO_CONFIG, STORAGE_KEY_AUDIO_CONFIG } from './constants';

export class SynthConfigManager {
  private config: AudioEngineConfig = this.loadAudioConfig();

  private loadAudioConfig(): AudioEngineConfig {
    if (typeof localStorage === 'undefined') return { ...DEFAULT_AUDIO_CONFIG };
    try {
      const raw = localStorage.getItem(STORAGE_KEY_AUDIO_CONFIG);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          sampleRate: typeof parsed.sampleRate === 'number' ? parsed.sampleRate : DEFAULT_AUDIO_CONFIG.sampleRate,
          bufferSize: typeof parsed.bufferSize === 'number' ? parsed.bufferSize : DEFAULT_AUDIO_CONFIG.bufferSize,
        };
      }
    } catch (e) {
      console.warn('Failed to load audio engine config:', e);
    }
    return { ...DEFAULT_AUDIO_CONFIG };
  }

  public getConfig(): AudioEngineConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<AudioEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_AUDIO_CONFIG, JSON.stringify(this.config));
      } catch (e) {}
    }
  }
}
