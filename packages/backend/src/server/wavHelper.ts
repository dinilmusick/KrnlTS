// Standard 16-bit PCM WAV encoder helper
export function createWavBuffer(
  sampleRate: number,
  numChannels: number,
  samples: Float32Array[]
): Buffer {
  const numSamples = samples[0].length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF Chunk Descriptor
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // 'fmt ' sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size for PCM
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // BitsPerSample = 16

  // 'data' sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Interleave channel samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const s = Math.max(-1, Math.min(1, samples[channel][i]));
      const intSample = s < 0 ? s * 0x8000 : s * 0x7fff;
      buffer.writeInt16LE(Math.floor(intSample), offset);
      offset += 2;
    }
  }

  return buffer;
}
