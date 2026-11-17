/**
 * Algorithmic Stereo Impulse Response Generator for ConvolverNode Reverb
 */

export function generateReverbImpulse(
  ctx: AudioContext,
  durationSec: number = 2.5,
  decayFactor: number = 2.0,
  dampingFreq: number = 6000
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * Math.max(0.2, Math.min(10, durationSec)));
  const impulse = ctx.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  // Exponential decay with slight frequency dampening
  const dampingRatio = Math.min(1, dampingFreq / (sampleRate / 2));

  let prevL = 0;
  let prevR = 0;

  for (let i = 0; i < length; i++) {
    const t = i / length;
    const env = Math.pow(1 - t, decayFactor);

    // Stereo decorrelated white noise filtered with simple recursive lowpass
    const noiseL = (Math.random() * 2 - 1) * env;
    const noiseR = (Math.random() * 2 - 1) * env;

    prevL = prevL + dampingRatio * (noiseL - prevL);
    prevR = prevR + dampingRatio * (noiseR - prevR);

    // Initial early reflection burst followed by diffuse tail
    const earlyEcho = i < sampleRate * 0.04 && i % 400 === 0 ? 0.3 * env : 0;

    left[i] = prevL + earlyEcho;
    right[i] = prevR - earlyEcho;
  }

  return impulse;
}
