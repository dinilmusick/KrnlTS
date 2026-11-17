import fs from 'fs';
import path from 'path';
import { createWavBuffer } from './wavHelper';

interface SamplePresetDef {
  filename: string;
  category: 'drums' | 'synth' | 'ambient' | 'fx';
  durationSec: number;
  generator: (t: number, progress: number) => [number, number];
}

const GLOBAL_SAMPLE_DEFS: SamplePresetDef[] = [
  {
    filename: '808_sub_boom.wav',
    category: 'drums',
    durationSec: 1.8,
    generator: (t, p) => {
      const pitch = 55 * Math.exp(-p * 5) + 38;
      const sub = Math.sin(2 * Math.PI * pitch * t);
      const dist = Math.tanh(sub * 2.8) * 0.7 * Math.exp(-p * 2.2);
      return [dist, dist];
    },
  },
  {
    filename: 'kick_punch.wav',
    category: 'drums',
    durationSec: 0.6,
    generator: (t, p) => {
      const pitch = 140 * Math.exp(-p * 18) + 45;
      const body = Math.sin(2 * Math.PI * pitch * t) * Math.exp(-p * 6);
      const click = (Math.random() * 2 - 1) * Math.exp(-p * 40) * 0.4;
      const sample = Math.tanh(body + click);
      return [sample, sample];
    },
  },
  {
    filename: 'snare_snappy.wav',
    category: 'drums',
    durationSec: 0.8,
    generator: (t, p) => {
      const tone = Math.sin(2 * Math.PI * 180 * Math.exp(-p * 10) * t) * Math.exp(-p * 8) * 0.4;
      const noise = (Math.random() * 2 - 1) * Math.exp(-p * 4.5) * 0.6;
      return [tone + noise, tone + noise];
    },
  },
  {
    filename: 'hihat_closed.wav',
    category: 'drums',
    durationSec: 0.25,
    generator: (_t, p) => {
      const noise = (Math.random() * 2 - 1) * Math.exp(-p * 20);
      return [noise * 0.5, noise * 0.5];
    },
  },
  {
    filename: 'celestial_lead.wav',
    category: 'synth',
    durationSec: 2.5,
    generator: (t, p) => {
      const f = 440 + Math.sin(t * 6) * 4;
      const s1 = Math.sin(2 * Math.PI * f * t) * 0.4;
      const s2 = Math.sin(2 * Math.PI * f * 2 * t) * 0.2;
      const env = Math.sin(p * Math.PI) * 0.8;
      return [s1 * env, (s1 + s2 * 0.5) * env];
    },
  },
  {
    filename: 'ethereal_pad.wav',
    category: 'ambient',
    durationSec: 3.0,
    generator: (t, p) => {
      const chord = [261.63, 329.63, 392.0, 523.25];
      let left = 0;
      let right = 0;
      chord.forEach((freq, idx) => {
        const lfo = Math.sin(t * (2 + idx * 0.5)) * 0.04;
        left += Math.sin(2 * Math.PI * freq * (1 + lfo) * t) * 0.15;
        right += Math.sin(2 * Math.PI * freq * 1.004 * (1 - lfo) * t) * 0.15;
      });
      const env = Math.sin(p * Math.PI);
      return [left * env, right * env];
    },
  },
  {
    filename: 'forest_atmosphere.wav',
    category: 'ambient',
    durationSec: 3.5,
    generator: (t, p) => {
      const rustle = (Math.random() * 2 - 1) * 0.15 * (1 + Math.sin(t * 2) * 0.5);
      const wind = Math.sin(2 * Math.PI * (120 + Math.sin(t * 0.8) * 30) * t) * 0.2;
      const chirp = Math.sin(2 * Math.PI * (2400 + Math.sin(t * 15) * 800) * t) * (Math.sin(t * 3) > 0.8 ? 0.25 : 0);
      const env = Math.sin(p * Math.PI);
      return [(rustle + wind + chirp) * env, (rustle * 0.9 + wind + chirp * 0.8) * env];
    },
  },
  {
    filename: 'cosmic_warp_riser.wav',
    category: 'fx',
    durationSec: 2.5,
    generator: (t, p) => {
      const freq = 120 * Math.exp(p * 2.8) + Math.sin(t * 35) * 40;
      const s = Math.sin(2 * Math.PI * freq * t) * p * 0.6;
      return [s, s * 0.9];
    },
  },
];

export async function ensureGlobalSamples(globalSamplesDir: string): Promise<void> {
  if (!fs.existsSync(globalSamplesDir)) {
    fs.mkdirSync(globalSamplesDir, { recursive: true });
  }

  const sampleRate = 44100;
  for (const def of GLOBAL_SAMPLE_DEFS) {
    const filePath = path.join(globalSamplesDir, def.filename);
    if (!fs.existsSync(filePath)) {
      const numSamples = Math.floor(sampleRate * def.durationSec);
      const chL = new Float32Array(numSamples);
      const chR = new Float32Array(numSamples);

      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const progress = i / numSamples;
        const [l, r] = def.generator(t, progress);
        chL[i] = l;
        chR[i] = r;
      }

      const wavBuf = createWavBuffer(sampleRate, 2, [chL, chR]);
      await fs.promises.writeFile(filePath, wavBuf);
    }
  }
}
