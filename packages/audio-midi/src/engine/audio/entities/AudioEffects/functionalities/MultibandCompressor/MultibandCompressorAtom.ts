export const MultibandCompressorAtom = {
  name: 'MultibandCompressor',
  version: '1.0.0',
  description: '3-Band Dynamic Range Compressor with Linkwitz-Riley Crossovers and Selective Sidechain Ducking',
  signalType: 'audio_stereo',
  category: 'audio_effect',
  capabilities: ['3_band_crossover', 'per_band_compression', 'multiband_sidechain_ducking', 'solo_mute'],
};
