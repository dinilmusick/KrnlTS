/**
 * Client-side 16-bit PCM WAV Encoder and Base64 Converter
 */
export function encodeFloat32ToWavBase64(
  sampleRate: number,
  numChannels: number,
  channelData: Float32Array[]
): string {
  const numSamples = channelData[0].length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // RIFF header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');

  // fmt subchunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // BitsPerSample = 16

  // data subchunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channelData[ch][i] || 0));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, Math.floor(intSample), true);
      offset += 2;
    }
  }

  // Convert ArrayBuffer to Base64
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

/**
 * Generate a synthetic WAV base64 from a waveform array or generate audio
 */
export function generateWavBase64FromWaveform(
  peaks: number[],
  durationSec: number = 2.0,
  isMono: boolean = false
): string {
  const sampleRate = 44100;
  const numSamples = Math.floor(sampleRate * durationSec);
  const numChannels = isMono ? 1 : 2;
  const chL = new Float32Array(numSamples);
  const chR = isMono ? chL : new Float32Array(numSamples);

  const peaksLen = peaks.length || 32;
  for (let i = 0; i < numSamples; i++) {
    const progress = i / numSamples;
    const peakIdx = Math.min(peaksLen - 1, Math.floor(progress * peaksLen));
    const amp = Math.max(0.05, Math.min(1.0, peaks[peakIdx] || 0.3));

    // Synthesize warm fundamental harmonic with envelope derived from waveform peak
    const t = i / sampleRate;
    const freq = 120 + Math.sin(progress * Math.PI) * 40;
    const val = Math.sin(2 * Math.PI * freq * t) * amp * Math.exp(-progress * 1.5);

    chL[i] = val;
    if (!isMono) {
      chR[i] = val * (0.9 + Math.sin(t * 5) * 0.1);
    }
  }

  return encodeFloat32ToWavBase64(sampleRate, numChannels, isMono ? [chL] : [chL, chR]);
}
