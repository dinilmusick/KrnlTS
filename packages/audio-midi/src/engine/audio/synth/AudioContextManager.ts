import { SpaceNode, NodeConnection } from '@kloks/state-graph';
import { multiChannelOutputRouter } from '../outputRouter';
import { createCosmicImpulseBuffer } from '../synthVoiceHelper';
import { SynthConfigManager } from './SynthConfigManager';
import { SynthEngineState } from './types';

export class AudioContextManager {
  private configManager = new SynthConfigManager();

  public initContext(state: SynthEngineState): void {
    const config = this.configManager.getConfig();
    const browserWindow = typeof window === 'undefined'
      ? undefined
      : window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const AudioCtx = browserWindow?.AudioContext || browserWindow?.webkitAudioContext;
    if (typeof AudioCtx !== 'function') {
      throw new Error('Web Audio API is unavailable in this runtime.');
    }

    const options: AudioContextOptions = {};
    if (config.sampleRate > 0) options.sampleRate = config.sampleRate;
    if (config.bufferSize > 0) {
      const targetRate = config.sampleRate > 0 ? config.sampleRate : 44100;
      options.latencyHint = config.bufferSize / targetRate;
    }

    try {
      state.ctx = new AudioCtx(options);
    } catch (err) {
      state.ctx = new AudioCtx();
    }

    state.masterGain = state.ctx.createGain();
    state.masterGain.gain.setValueAtTime(0.8, state.ctx.currentTime);

    state.analyser = state.ctx.createAnalyser();
    state.analyser.fftSize = 256;

    state.masterSplitter = state.ctx.createChannelSplitter(2);
    state.analyserL = state.ctx.createAnalyser();
    state.analyserL.fftSize = 256;
    state.analyserR = state.ctx.createAnalyser();
    state.analyserR.fftSize = 256;

    state.delayNode = state.ctx.createDelay();
    state.delayNode.delayTime.value = 0.35;
    state.delayFeedback = state.ctx.createGain();
    state.delayFeedback.gain.value = 0.45;
    state.delayGain = state.ctx.createGain();
    state.delayGain.gain.value = 0.3;

    state.delayNode.connect(state.delayFeedback);
    state.delayFeedback.connect(state.delayNode);
    state.delayNode.connect(state.delayGain);
    state.delayGain.connect(state.masterGain);

    state.reverbNode = state.ctx.createConvolver();
    state.reverbNode.buffer = createCosmicImpulseBuffer(state.ctx, 2.5, 2.0);
    state.reverbGain = state.ctx.createGain();
    state.reverbGain.gain.value = 0.35;
    state.reverbNode.connect(state.reverbGain);
    state.reverbGain.connect(state.masterGain);

    state.masterGain.connect(state.analyser);
    state.masterGain.connect(state.masterSplitter);
    state.masterSplitter.connect(state.analyserL, 0);
    state.masterSplitter.connect(state.analyserR, 1);

    multiChannelOutputRouter.init(state.ctx, 6);
    multiChannelOutputRouter.connectInput(state.masterGain);

    state.isInitialized = true;
  }
}
