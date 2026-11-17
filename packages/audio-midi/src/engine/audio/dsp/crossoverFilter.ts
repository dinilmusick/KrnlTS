/**
 * 3-Band Crossover Filter Network for Multiband Dynamic Processing
 */

export interface CrossoverBandNodes {
  input: GainNode;
  lowOutput: AudioNode;
  midOutput: AudioNode;
  highOutput: AudioNode;
  sumOutput: GainNode;
  setFrequencies: (lowFreq: number, highFreq: number) => void;
  dispose: () => void;
}

export function create3BandCrossover(
  ctx: AudioContext,
  initialLowFreq: number = 150,
  initialHighFreq: number = 2500
): CrossoverBandNodes {
  const input = ctx.createGain();
  const sumOutput = ctx.createGain();

  // Low band: 24dB/oct (cascade two 12dB biquads) lowpass at initialLowFreq
  const lowFilter1 = ctx.createBiquadFilter();
  lowFilter1.type = 'lowpass';
  lowFilter1.frequency.value = initialLowFreq;
  lowFilter1.Q.value = 0.707;

  const lowFilter2 = ctx.createBiquadFilter();
  lowFilter2.type = 'lowpass';
  lowFilter2.frequency.value = initialLowFreq;
  lowFilter2.Q.value = 0.707;

  input.connect(lowFilter1);
  lowFilter1.connect(lowFilter2);

  // High band: cascade two highpass at initialHighFreq
  const highFilter1 = ctx.createBiquadFilter();
  highFilter1.type = 'highpass';
  highFilter1.frequency.value = initialHighFreq;
  highFilter1.Q.value = 0.707;

  const highFilter2 = ctx.createBiquadFilter();
  highFilter2.type = 'highpass';
  highFilter2.frequency.value = initialHighFreq;
  highFilter2.Q.value = 0.707;

  input.connect(highFilter1);
  highFilter1.connect(highFilter2);

  // Mid band: bandpass between initialLowFreq and initialHighFreq
  const midHp = ctx.createBiquadFilter();
  midHp.type = 'highpass';
  midHp.frequency.value = initialLowFreq;
  midHp.Q.value = 0.707;

  const midLp = ctx.createBiquadFilter();
  midLp.type = 'lowpass';
  midLp.frequency.value = initialHighFreq;
  midLp.Q.value = 0.707;

  input.connect(midHp);
  midHp.connect(midLp);

  const setFrequencies = (lowFreq: number, highFreq: number) => {
    const lF = Math.max(20, Math.min(highFreq - 50, lowFreq));
    const hF = Math.max(lF + 50, Math.min(20000, highFreq));

    lowFilter1.frequency.setValueAtTime(lF, ctx.currentTime);
    lowFilter2.frequency.setValueAtTime(lF, ctx.currentTime);
    midHp.frequency.setValueAtTime(lF, ctx.currentTime);

    highFilter1.frequency.setValueAtTime(hF, ctx.currentTime);
    highFilter2.frequency.setValueAtTime(hF, ctx.currentTime);
    midLp.frequency.setValueAtTime(hF, ctx.currentTime);
  };

  const dispose = () => {
    try {
      input.disconnect();
      lowFilter1.disconnect();
      lowFilter2.disconnect();
      midHp.disconnect();
      midLp.disconnect();
      highFilter1.disconnect();
      highFilter2.disconnect();
      sumOutput.disconnect();
    } catch {
      // ignore
    }
  };

  return {
    input,
    lowOutput: lowFilter2,
    midOutput: midLp,
    highOutput: highFilter2,
    sumOutput,
    setFrequencies,
    dispose,
  };
}
