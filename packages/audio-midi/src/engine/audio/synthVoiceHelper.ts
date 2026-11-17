export function createCosmicImpulseBuffer(ctx: AudioContext, duration: number, decay: number): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = rate * duration;
  const impulse = ctx.createBuffer(2, length, rate);
  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const n = i / length;
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
    }
  }
  return impulse;
}

export function playSyntheticDrumVoice(
  ctx: AudioContext,
  masterGain: GainNode,
  noteNumber: number,
  vel: number,
  time: number
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const isKick = noteNumber <= 38;

  if (isKick) {
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);
    gain.gain.setValueAtTime(vel * 0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(time);
    osc.stop(time + 0.36);
  } else {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.1);
    gain.gain.setValueAtTime(vel * 0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(time);
    osc.stop(time + 0.21);
  }
}
