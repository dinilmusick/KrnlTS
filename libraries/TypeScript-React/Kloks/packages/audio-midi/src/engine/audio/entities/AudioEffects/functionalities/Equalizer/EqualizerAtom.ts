export const EqualizerAtom = {
  name: 'Equalizer',
  version: '1.0.0',
  description: 'Multi-band parametric equalizer supporting peaking, shelving, and pass filters',
  signalType: 'audio_stereo',
  category: 'audio_effect',
  capabilities: ['parametric_filtering', 'biquad_cascade', 'visual_curve'],
};
