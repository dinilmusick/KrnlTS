/**
 * Sidechain Compressor Engine for Web Audio
 * Supports standard dynamic compression as well as external sidechain key ducking.
 */
import { CompressorEffectConfig } from '@kloks/state-graph';

export interface SidechainCompressorInstance {
  input: GainNode;
  output: GainNode;
  sidechainInput: GainNode;
  compressorNode: DynamicsCompressorNode;
  updateConfig: (config: CompressorEffectConfig) => void;
  getReductionDb: () => number;
  dispose: () => void;
}

export function createSidechainCompressor(
  ctx: AudioContext,
  initialConfig?: CompressorEffectConfig
): SidechainCompressorInstance {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const sidechainInput = ctx.createGain();

  // Primary broadband compressor
  const comp = ctx.createDynamicsCompressor();

  // VCA for Sidechain-induced gain ducking
  const vcaGain = ctx.createGain();

  // Makeup and dry/wet mix
  const makeupGainNode = ctx.createGain();
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();

  // Sidechain detector: Analyser for RMS/peak metering and automated ducking envelope
  const scAnalyser = ctx.createAnalyser();
  scAnalyser.fftSize = 256;
  scAnalyser.smoothingTimeConstant = 0.3;
  sidechainInput.connect(scAnalyser);

  let isSidechainActive = false;
  let duckAmount = 0;
  let rafId: number | null = null;
  let currentConfig: CompressorEffectConfig = {
    threshold: -20,
    ratio: 4,
    attack: 0.01,
    release: 0.15,
    knee: 5,
    makeupGain: 0,
    mix: 1.0,
    sidechainEnabled: false,
    ...initialConfig,
  };

  // Signal Routing:
  // input -> dryGain -> output
  // input -> comp -> vcaGain -> makeupGainNode -> wetGain -> output
  input.connect(dryGain);
  dryGain.connect(output);

  input.connect(comp);
  comp.connect(vcaGain);
  vcaGain.connect(makeupGainNode);
  makeupGainNode.connect(wetGain);
  wetGain.connect(output);

  const applyConfig = (cfg: CompressorEffectConfig) => {
    currentConfig = { ...currentConfig, ...cfg };
    const now = ctx.currentTime;

    comp.threshold.setValueAtTime(currentConfig.threshold, now);
    comp.ratio.setValueAtTime(Math.max(1, currentConfig.ratio), now);
    comp.attack.setValueAtTime(Math.max(0.001, currentConfig.attack), now);
    comp.release.setValueAtTime(Math.max(0.01, currentConfig.release), now);
    comp.knee.setValueAtTime(Math.max(0, currentConfig.knee), now);

    const makeupLinear = Math.pow(10, (currentConfig.makeupGain || 0) / 20);
    makeupGainNode.gain.setValueAtTime(makeupLinear, now);

    const mix = Math.max(0, Math.min(1, currentConfig.mix ?? 1.0));
    wetGain.gain.setValueAtTime(mix, now);
    dryGain.gain.setValueAtTime(1 - mix, now);

    const prevSidechain = isSidechainActive;
    isSidechainActive = !!currentConfig.sidechainEnabled;

    if (isSidechainActive && !prevSidechain) {
      startSidechainLoop();
    } else if (!isSidechainActive && prevSidechain) {
      stopSidechainLoop();
    }
  };

  // Sidechain envelope follower loop
  const pcmBuffer = new Float32Array(scAnalyser.fftSize);
  let smoothedGain = 1.0;

  const processSidechainTick = () => {
    if (!isSidechainActive) {
      stopSidechainLoop();
      return;
    }

    scAnalyser.getFloatTimeDomainData(pcmBuffer);
    let peak = 0;
    for (let i = 0; i < pcmBuffer.length; i++) {
      const abs = Math.abs(pcmBuffer[i]);
      if (abs > peak) peak = abs;
    }

    // Convert peak to dB
    const peakDb = peak > 0.0001 ? 20 * Math.log10(peak) : -100;
    const threshold = currentConfig.threshold;

    let targetGain = 1.0;
    if (peakDb > threshold) {
      const overDb = peakDb - threshold;
      const reductionDb = overDb * (1 - 1 / Math.max(1, currentConfig.ratio));
      duckAmount = reductionDb;
      targetGain = Math.max(0.01, Math.pow(10, -reductionDb / 20));
    } else {
      duckAmount = 0;
    }

    // Attack & Release smoothing coefficients
    const att = Math.max(0.005, currentConfig.attack);
    const rel = Math.max(0.02, currentConfig.release);
    const coeff = targetGain < smoothedGain ? Math.min(1, 0.05 / att) : Math.min(1, 0.05 / rel);
    smoothedGain += (targetGain - smoothedGain) * coeff;

    vcaGain.gain.setValueAtTime(smoothedGain, ctx.currentTime);

    rafId = requestAnimationFrame(processSidechainTick);
  };

  const startSidechainLoop = () => {
    if (rafId !== null) return;
    if (typeof window !== 'undefined') {
      rafId = requestAnimationFrame(processSidechainTick);
    }
  };

  const stopSidechainLoop = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    duckAmount = 0;
    smoothedGain = 1.0;
    vcaGain.gain.setValueAtTime(1.0, ctx.currentTime);
  };

  applyConfig(currentConfig);

  const getReductionDb = (): number => {
    if (isSidechainActive) {
      return duckAmount;
    }
    // Read reduction from the native compressor
    return Math.abs(comp.reduction);
  };

  const dispose = () => {
    if (rafId) cancelAnimationFrame(rafId);
    try {
      input.disconnect();
      dryGain.disconnect();
      comp.disconnect();
      vcaGain.disconnect();
      makeupGainNode.disconnect();
      wetGain.disconnect();
      output.disconnect();
      sidechainInput.disconnect();
      scAnalyser.disconnect();
    } catch {
      // ignore
    }
  };

  return {
    input,
    output,
    sidechainInput,
    compressorNode: comp,
    updateConfig: applyConfig,
    getReductionDb,
    dispose,
  };
}
