export const CompressorAtom = {
  name: 'Compressor',
  version: '1.0.0',
  description: 'Studio dynamic range compressor with external audio sidechain key ducking',
  signalType: 'audio_stereo',
  category: 'audio_effect',
  capabilities: ['dynamic_compression', 'sidechain_key_ducking', 'gain_reduction_metering'],
};
