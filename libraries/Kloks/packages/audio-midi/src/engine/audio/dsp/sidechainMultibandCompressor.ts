/**
 * 3-Band Multiband Compressor with Frequency Crossover & Selective Sidechaining
 */
import { MultibandCompressorEffectConfig } from '@kloks/state-graph';
import { create3BandCrossover, CrossoverBandNodes } from './crossoverFilter';
import { createSidechainCompressor, SidechainCompressorInstance } from './sidechainCompressor';

export interface MultibandCompressorInstance {
  input: GainNode;
  output: GainNode;
  sidechainInput: GainNode;
  updateConfig: (config: MultibandCompressorEffectConfig) => void;
  getReductionDb: () => { low: number; mid: number; high: number };
  dispose: () => void;
}

export function createMultibandCompressor(
  ctx: AudioContext,
  initialConfig?: MultibandCompressorEffectConfig
): MultibandCompressorInstance {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const sidechainInput = ctx.createGain();

  const crossover: CrossoverBandNodes = create3BandCrossover(
    ctx,
    initialConfig?.crossoverLow ?? 150,
    initialConfig?.crossoverHigh ?? 2500
  );

  input.connect(crossover.input);

  // Band Compressors
  const lowComp: SidechainCompressorInstance = createSidechainCompressor(ctx, {
    threshold: initialConfig?.lowBand?.threshold ?? -20,
    ratio: initialConfig?.lowBand?.ratio ?? 3,
    attack: initialConfig?.lowBand?.attack ?? 0.02,
    release: initialConfig?.lowBand?.release ?? 0.15,
    knee: initialConfig?.lowBand?.knee ?? 4,
    makeupGain: initialConfig?.lowBand?.makeupGain ?? 0,
    mix: 1.0,
  });

  const midComp: SidechainCompressorInstance = createSidechainCompressor(ctx, {
    threshold: initialConfig?.midBand?.threshold ?? -18,
    ratio: initialConfig?.midBand?.ratio ?? 2.5,
    attack: initialConfig?.midBand?.attack ?? 0.015,
    release: initialConfig?.midBand?.release ?? 0.12,
    knee: initialConfig?.midBand?.knee ?? 4,
    makeupGain: initialConfig?.midBand?.makeupGain ?? 0,
    mix: 1.0,
  });

  const highComp: SidechainCompressorInstance = createSidechainCompressor(ctx, {
    threshold: initialConfig?.highBand?.threshold ?? -16,
    ratio: initialConfig?.highBand?.ratio ?? 2,
    attack: initialConfig?.highBand?.attack ?? 0.008,
    release: initialConfig?.highBand?.release ?? 0.08,
    knee: initialConfig?.highBand?.knee ?? 4,
    makeupGain: initialConfig?.highBand?.makeupGain ?? 0,
    mix: 1.0,
  });

  // Connect crossover outputs to band compressors
  crossover.lowOutput.connect(lowComp.input);
  crossover.midOutput.connect(midComp.input);
  crossover.highOutput.connect(highComp.input);

  // Band gain controls (for solo / mute)
  const lowGain = ctx.createGain();
  const midGain = ctx.createGain();
  const highGain = ctx.createGain();

  lowComp.output.connect(lowGain);
  midComp.output.connect(midGain);
  highComp.output.connect(highGain);

  const sumNode = ctx.createGain();
  lowGain.connect(sumNode);
  midGain.connect(sumNode);
  highGain.connect(sumNode);

  // Master output and dry/wet mix
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();
  input.connect(dryGain);
  dryGain.connect(output);

  sumNode.connect(wetGain);
  wetGain.connect(output);

  // Sidechain distribution
  const lowScGain = ctx.createGain();
  const midScGain = ctx.createGain();
  const highScGain = ctx.createGain();

  sidechainInput.connect(lowScGain);
  sidechainInput.connect(midScGain);
  sidechainInput.connect(highScGain);

  lowScGain.connect(lowComp.sidechainInput);
  midScGain.connect(midComp.sidechainInput);
  highScGain.connect(highComp.sidechainInput);

  const applyConfig = (cfg: MultibandCompressorEffectConfig) => {
    const now = ctx.currentTime;
    crossover.setFrequencies(cfg.crossoverLow, cfg.crossoverHigh);

    const hasSolo = cfg.lowBand.solo || cfg.midBand.solo || cfg.highBand.solo;

    // Low band
    const lowActive = !cfg.lowBand.muted && (!hasSolo || !!cfg.lowBand.solo);
    lowGain.gain.setValueAtTime(lowActive ? 1.0 : 0.0, now);
    lowComp.updateConfig({
      ...cfg.lowBand,
      knee: cfg.lowBand.knee ?? 4,
      mix: 1.0,
      sidechainEnabled: cfg.sidechainEnabled && (cfg.sidechainBands === 'all' || cfg.sidechainBands === 'low'),
    });

    // Mid band
    const midActive = !cfg.midBand.muted && (!hasSolo || !!cfg.midBand.solo);
    midGain.gain.setValueAtTime(midActive ? 1.0 : 0.0, now);
    midComp.updateConfig({
      ...cfg.midBand,
      knee: cfg.midBand.knee ?? 4,
      mix: 1.0,
      sidechainEnabled: cfg.sidechainEnabled && (cfg.sidechainBands === 'all' || cfg.sidechainBands === 'mid'),
    });

    // High band
    const highActive = !cfg.highBand.muted && (!hasSolo || !!cfg.highBand.solo);
    highGain.gain.setValueAtTime(highActive ? 1.0 : 0.0, now);
    highComp.updateConfig({
      ...cfg.highBand,
      knee: cfg.highBand.knee ?? 4,
      mix: 1.0,
      sidechainEnabled: cfg.sidechainEnabled && (cfg.sidechainBands === 'all' || cfg.sidechainBands === 'high'),
    });

    // Mix & Output gain
    const mix = Math.max(0, Math.min(1, cfg.mix ?? 1.0));
    wetGain.gain.setValueAtTime(mix * (cfg.outputGain ?? 1.0), now);
    dryGain.gain.setValueAtTime(1 - mix, now);
  };

  if (initialConfig) {
    applyConfig(initialConfig);
  }

  const getReductionDb = () => ({
    low: lowComp.getReductionDb(),
    mid: midComp.getReductionDb(),
    high: highComp.getReductionDb(),
  });

  const dispose = () => {
    try {
      crossover.dispose();
      lowComp.dispose();
      midComp.dispose();
      highComp.dispose();
      input.disconnect();
      output.disconnect();
      sumNode.disconnect();
      sidechainInput.disconnect();
    } catch {
      // ignore
    }
  };

  return {
    input,
    output,
    sidechainInput,
    updateConfig: applyConfig,
    getReductionDb,
    dispose,
  };
}
