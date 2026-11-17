// ════ EFFECTPROCESSORMANAGER IMPLEMENTATION ══════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════════════
import { EffectNode } from '@kloks/state-graph';
import { generateSaturationCurve } from '../saturationCurves';
import { generateReverbImpulse } from '../reverbImpulse';
import { createSidechainCompressor, SidechainCompressorInstance } from '../sidechainCompressor';
import { createMultibandCompressor, MultibandCompressorInstance } from '../sidechainMultibandCompressor';
import { AudioEffectProcessorInstance } from './types';

/**
 * Unified DSP Audio Effect Processor Factory
 * Instantiates real Web Audio graph pipelines for EQ, Compressor, Multiband, Limiter, Reverb, Delay, Saturation.
 */
export function createAudioEffectProcessor(
  ctx: AudioContext,
  effect: EffectNode
): AudioEffectProcessorInstance {
  const masterIn = ctx.createGain();
  const masterOut = ctx.createGain();

  let sidechainInputNode: GainNode | undefined;
  let sidechainComp: SidechainCompressorInstance | null = null;
  let multibandComp: MultibandCompressorInstance | null = null;
  const nodesToClean: AudioNode[] = [masterIn, masterOut];

  let eqFilters: { bandId: string; filter: BiquadFilterNode }[] = [];
  let limiterComp: DynamicsCompressorNode | null = null;
  let limiterCeiling: GainNode | null = null;
  let reverbWetGain: GainNode | null = null;
  let reverbDryGain: GainNode | null = null;
  let delayNode: DelayNode | null = null;
  let delayFeedbackGain: GainNode | null = null;
  let delayFilter: BiquadFilterNode | null = null;
  let delayWetGain: GainNode | null = null;
  let delayDryGain: GainNode | null = null;
  let satShaper: WaveShaperNode | null = null;
  let satTone: BiquadFilterNode | null = null;
  let satOut: GainNode | null = null;
  let gainNode: GainNode | null = null;

  switch (effect.effectType) {
    case 'eq': {
      const defaultBands = effect.eqConfig?.bands || [
        { id: 'b1', type: 'lowshelf', frequency: 100, gain: 0, q: 0.7, enabled: true },
        { id: 'b2', type: 'peaking', frequency: 500, gain: 0, q: 1.0, enabled: true },
        { id: 'b3', type: 'peaking', frequency: 2500, gain: 0, q: 1.0, enabled: true },
        { id: 'b4', type: 'highshelf', frequency: 8000, gain: 0, q: 0.7, enabled: true },
      ];

      eqFilters = defaultBands.map((band) => {
        const f = ctx.createBiquadFilter();
        f.type = band.type as BiquadFilterType;
        f.frequency.value = band.frequency;
        f.gain.value = band.enabled ? band.gain : 0;
        f.Q.value = band.q;
        nodesToClean.push(f);
        return { bandId: band.id, filter: f };
      });

      let prev: AudioNode = masterIn;
      eqFilters.forEach((item) => {
        prev.connect(item.filter);
        prev = item.filter;
      });
      prev.connect(masterOut);
      break;
    }

    case 'compressor': {
      sidechainComp = createSidechainCompressor(ctx, effect.compressorConfig);
      sidechainInputNode = sidechainComp.sidechainInput;
      masterIn.connect(sidechainComp.input);
      sidechainComp.output.connect(masterOut);
      break;
    }

    case 'multiband_compressor': {
      multibandComp = createMultibandCompressor(ctx, effect.multibandCompressorConfig);
      sidechainInputNode = multibandComp.sidechainInput;
      masterIn.connect(multibandComp.input);
      multibandComp.output.connect(masterOut);
      break;
    }

    case 'limiter': {
      limiterComp = ctx.createDynamicsCompressor();
      limiterComp.threshold.value = effect.limiterConfig?.threshold ?? -2;
      limiterComp.knee.value = 0;
      limiterComp.ratio.value = 20;
      limiterComp.attack.value = 0.002;
      limiterComp.release.value = effect.limiterConfig?.release ?? 0.05;

      const shaper = ctx.createWaveShaper();
      shaper.curve = generateSaturationCurve('soft_clip', 1.0) as any;
      shaper.oversample = '2x';

      limiterCeiling = ctx.createGain();
      const ceilingDb = effect.limiterConfig?.ceiling ?? -0.1;
      limiterCeiling.gain.value = Math.pow(10, ceilingDb / 20);

      masterIn.connect(limiterComp);
      limiterComp.connect(shaper);
      shaper.connect(limiterCeiling);
      limiterCeiling.connect(masterOut);
      nodesToClean.push(limiterComp, shaper, limiterCeiling);
      break;
    }

    case 'reverb': {
      const convolver = ctx.createConvolver();
      const impulse = generateReverbImpulse(
        ctx,
        effect.reverbConfig?.decayTime ?? 2.5,
        2.0,
        effect.reverbConfig?.damping ?? 6000
      );
      convolver.buffer = impulse;

      reverbWetGain = ctx.createGain();
      reverbDryGain = ctx.createGain();
      const wetMix = effect.reverbConfig?.wetMix ?? 0.4;
      reverbWetGain.gain.value = wetMix;
      reverbDryGain.gain.value = 1.0 - wetMix;

      masterIn.connect(reverbDryGain);
      reverbDryGain.connect(masterOut);

      masterIn.connect(convolver);
      convolver.connect(reverbWetGain);
      reverbWetGain.connect(masterOut);
      nodesToClean.push(convolver, reverbWetGain, reverbDryGain);
      break;
    }

    case 'delay': {
      delayNode = ctx.createDelay(5.0);
      const delaySec = (effect.delayConfig?.delayBeats ?? 0.5) * 0.5;
      delayNode.delayTime.value = delaySec;

      delayFeedbackGain = ctx.createGain();
      delayFeedbackGain.gain.value = Math.min(0.9, effect.delayConfig?.feedback ?? 0.4);

      delayFilter = ctx.createBiquadFilter();
      delayFilter.type = 'lowpass';
      delayFilter.frequency.value = effect.delayConfig?.highCut ?? 6000;

      delayWetGain = ctx.createGain();
      delayDryGain = ctx.createGain();
      const wetMix = effect.delayConfig?.wetMix ?? 0.5;
      delayWetGain.gain.value = wetMix;
      delayDryGain.gain.value = 1.0 - wetMix;

      masterIn.connect(delayDryGain);
      delayDryGain.connect(masterOut);

      masterIn.connect(delayNode);
      delayNode.connect(delayFilter);
      delayFilter.connect(delayFeedbackGain);
      delayFeedbackGain.connect(delayNode);

      delayFilter.connect(delayWetGain);
      delayWetGain.connect(masterOut);
      nodesToClean.push(delayNode, delayFeedbackGain, delayFilter, delayWetGain, delayDryGain);
      break;
    }

    case 'saturation': {
      satShaper = ctx.createWaveShaper();
      const satType = effect.saturationConfig?.saturationType || 'tape';
      const drive = effect.saturationConfig?.drive ?? 1.5;
      satShaper.curve = generateSaturationCurve(satType, drive) as any;
      satShaper.oversample = '4x';

      satTone = ctx.createBiquadFilter();
      satTone.type = 'lowpass';
      satTone.frequency.value = effect.saturationConfig?.tone ?? 8000;

      satOut = ctx.createGain();
      satOut.gain.value = effect.saturationConfig?.outputGain ?? 1.0;

      masterIn.connect(satShaper);
      satShaper.connect(satTone);
      satTone.connect(satOut);
      satOut.connect(masterOut);
      nodesToClean.push(satShaper, satTone, satOut);
      break;
    }

    case 'gain':
    default: {
      gainNode = ctx.createGain();
      gainNode.gain.value = effect.gainConfig?.gain ?? 1.0;
      masterIn.connect(gainNode);
      gainNode.connect(masterOut);
      nodesToClean.push(gainNode);
      break;
    }
  }

  const updateEffect = (updated: EffectNode) => {
    if (sidechainComp && updated.compressorConfig) {
      sidechainComp.updateConfig(updated.compressorConfig);
    }
    if (multibandComp && updated.multibandCompressorConfig) {
      multibandComp.updateConfig(updated.multibandCompressorConfig);
    }
    if (updated.eqConfig?.bands && eqFilters.length > 0) {
      updated.eqConfig.bands.forEach((b) => {
        const found = eqFilters.find((f) => f.bandId === b.id);
        if (found) {
          found.filter.frequency.setValueAtTime(b.frequency, ctx.currentTime);
          found.filter.gain.setValueAtTime(b.enabled ? b.gain : 0, ctx.currentTime);
          found.filter.Q.setValueAtTime(b.q, ctx.currentTime);
        }
      });
    }
    if (limiterComp && updated.limiterConfig) {
      limiterComp.threshold.setValueAtTime(updated.limiterConfig.threshold ?? -2, ctx.currentTime);
      limiterComp.release.setValueAtTime(updated.limiterConfig.release ?? 0.05, ctx.currentTime);
      if (limiterCeiling) {
        const ceilingDb = updated.limiterConfig.ceiling ?? -0.1;
        limiterCeiling.gain.setValueAtTime(Math.pow(10, ceilingDb / 20), ctx.currentTime);
      }
    }
    if (updated.reverbConfig && reverbWetGain && reverbDryGain) {
      const wet = updated.reverbConfig.wetMix ?? 0.4;
      reverbWetGain.gain.setValueAtTime(wet, ctx.currentTime);
      reverbDryGain.gain.setValueAtTime(1.0 - wet, ctx.currentTime);
    }
    if (updated.delayConfig && delayNode && delayFeedbackGain && delayFilter && delayWetGain && delayDryGain) {
      delayNode.delayTime.setValueAtTime((updated.delayConfig.delayBeats ?? 0.5) * 0.5, ctx.currentTime);
      delayFeedbackGain.gain.setValueAtTime(Math.min(0.9, updated.delayConfig.feedback ?? 0.4), ctx.currentTime);
      delayFilter.frequency.setValueAtTime(updated.delayConfig.highCut ?? 6000, ctx.currentTime);
      const wet = updated.delayConfig.wetMix ?? 0.5;
      delayWetGain.gain.setValueAtTime(wet, ctx.currentTime);
      delayDryGain.gain.setValueAtTime(1.0 - wet, ctx.currentTime);
    }
    if (updated.saturationConfig && satShaper && satTone && satOut) {
      const satType = updated.saturationConfig.saturationType || 'tape';
      const drive = updated.saturationConfig.drive ?? 1.5;
      satShaper.curve = generateSaturationCurve(satType, drive) as any;
      satTone.frequency.setValueAtTime(updated.saturationConfig.tone ?? 8000, ctx.currentTime);
      satOut.gain.setValueAtTime(updated.saturationConfig.outputGain ?? 1.0, ctx.currentTime);
    }
    if (updated.gainConfig && gainNode) {
      gainNode.gain.setValueAtTime(updated.gainConfig.gain ?? 1.0, ctx.currentTime);
    }
  };

  const getReductionDb = () => {
    if (sidechainComp) return sidechainComp.getReductionDb();
    if (multibandComp) return multibandComp.getReductionDb();
    return 0;
  };

  const dispose = () => {
    sidechainComp?.dispose();
    multibandComp?.dispose();
    nodesToClean.forEach((n) => {
      try {
        n.disconnect();
      } catch {
        // ignore
      }
    });
  };

  return {
    input: masterIn,
    output: masterOut,
    sidechainInput: sidechainInputNode,
    updateEffect,
    getReductionDb,
    dispose,
  };
}
