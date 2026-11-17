import { SamplePresetType } from '@kloks/state-graph';

export function generatePresetAudioBuffer(ctx: AudioContext, sampleType: SamplePresetType): AudioBuffer {
  const duration = 2.0;
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * duration);
  const buffer = ctx.createBuffer(2, length, rate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const t = i / rate;
    const progress = i / length;
    let sL = 0;
    let sR = 0;

    if (sampleType === 'ambient_drone') {
      const f1 = 110 + Math.sin(t * 1.5) * 5;
      const f2 = 165 + Math.cos(t * 2.2) * 8;
      sL = Math.sin(2 * Math.PI * f1 * t) * 0.4 + Math.sin(2 * Math.PI * f2 * t) * 0.3;
      sR = Math.sin(2 * Math.PI * (f1 * 1.005) * t) * 0.4 + Math.sin(2 * Math.PI * (f2 * 0.995) * t) * 0.3;
      sL *= Math.sin(progress * Math.PI);
      sR *= Math.sin(progress * Math.PI);
    } else if (sampleType === 'pulsar_synth') {
      const sweepFreq = 220 + Math.sin(t * 8) * 80 + progress * 200;
      sL = (Math.sin(2 * Math.PI * sweepFreq * t) > 0 ? 0.3 : -0.3) * (1 - progress * 0.6);
      sR = Math.sin(2 * Math.PI * sweepFreq * 1.01 * t) * 0.4 * (1 - progress * 0.6);
    } else if (sampleType === 'cosmic_warp') {
      const warpFreq = 600 * Math.exp(-progress * 2.5) + Math.sin(t * 30) * 100;
      sL = Math.sin(2 * Math.PI * warpFreq * t) * Math.exp(-progress * 1.8);
      sR = Math.cos(2 * Math.PI * warpFreq * 1.02 * t) * Math.exp(-progress * 1.8);
    } else if (sampleType === 'starlight_vox') {
      const chord = [261.63, 329.63, 392.0, 523.25];
      chord.forEach((freq, idx) => {
        const lfo = Math.sin(t * (3 + idx)) * 0.05;
        sL += Math.sin(2 * Math.PI * freq * (1 + lfo) * t) * 0.18;
        sR += Math.sin(2 * Math.PI * freq * 1.003 * (1 - lfo) * t) * 0.18;
      });
      sL *= Math.sin(progress * Math.PI);
      sR *= Math.sin(progress * Math.PI);
    } else if (sampleType === 'cyber_808') {
      const pitch = 55 * Math.exp(-progress * 6) + 35;
      const sub = Math.sin(2 * Math.PI * pitch * t);
      const dist = Math.tanh(sub * 2.5) * 0.5;
      sL = dist * Math.exp(-progress * 2.0);
      sR = dist * Math.exp(-progress * 2.0);
    } else if (sampleType === 'space_percussion') {
      const noise = Math.random() * 2 - 1;
      const tonal = Math.sin(2 * Math.PI * (180 * Math.exp(-progress * 12)) * t);
      sL = (noise * 0.3 + tonal * 0.7) * Math.exp(-progress * 5.0);
      sR = (noise * 0.3 + tonal * 0.7) * Math.exp(-progress * 5.0);
    } else {
      sL = Math.sin(2 * Math.PI * 440 * t) * (1 - progress);
      sR = sL;
    }

    left[i] = Math.max(-1, Math.min(1, sL));
    right[i] = Math.max(-1, Math.min(1, sR));
  }

  return buffer;
}
