/**
 * @role skeleton
 * AudioEffects Entity Orchestrator
 * Groups, orchestrates, and manages audio effect DSP lifecycles and domain events.
 */
import { EffectNode, EffectType } from '@kloks/state-graph';
import { createAudioEffectProcessor, AudioEffectProcessorInstance } from '../../dsp/effectProcessorManager.js';

export interface AudioEffectsState {
  activeEffectIds: string[];
  processors: Map<string, AudioEffectProcessorInstance>;
}

export class AudioEffects {
  private state: AudioEffectsState = {
    activeEffectIds: [],
    processors: new Map(),
  };

  private eventListeners: Map<string, Set<(payload: any) => void>> = new Map();

  public on(event: string, listener: (payload: any) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  public off(event: string, listener: (payload: any) => void): void {
    this.eventListeners.get(event)?.delete(listener);
  }

  public emit(event: string, payload?: any): void {
    this.eventListeners.get(event)?.forEach((l) => {
      try {
        l(payload);
      } catch (err) {
        console.error(`[AudioEffects] Error in event listener '${event}':`, err);
      }
    });
  }

  public getOrCreateProcessor(ctx: AudioContext, effect: EffectNode): AudioEffectProcessorInstance {
    let proc = this.state.processors.get(effect.id);
    if (!proc) {
      proc = createAudioEffectProcessor(ctx, effect);
      this.state.processors.set(effect.id, proc);
      if (!this.state.activeEffectIds.includes(effect.id)) {
        this.state.activeEffectIds.push(effect.id);
      }
      this.emit('processor:created', { effectId: effect.id, effectType: effect.effectType });
    } else {
      proc.updateEffect(effect);
    }
    return proc;
  }

  public removeProcessor(effectId: string): void {
    const proc = this.state.processors.get(effectId);
    if (proc) {
      proc.dispose();
      this.state.processors.delete(effectId);
      this.state.activeEffectIds = this.state.activeEffectIds.filter((id) => id !== effectId);
      this.emit('processor:disposed', { effectId });
    }
  }

  public getActiveEffectIds(): string[] {
    return [...this.state.activeEffectIds];
  }

  public getReductionDb(effectId: string) {
    const proc = this.state.processors.get(effectId);
    return proc?.getReductionDb?.() ?? 0;
  }

  public disposeAll(): void {
    this.state.processors.forEach((proc) => proc.dispose());
    this.state.processors.clear();
    this.state.activeEffectIds = [];
  }
}

export const audioEffectsEntity = new AudioEffects();
