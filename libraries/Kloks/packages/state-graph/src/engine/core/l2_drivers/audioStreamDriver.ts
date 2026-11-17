export interface StreamAcquisitionResult {
  mediaStream: MediaStream;
  detectedTrackChannelCount: number;
}

export async function acquireAudioInputStream(targetDeviceId?: string): Promise<StreamAcquisitionResult | null> {
  if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return null;
  }

  const constraints: MediaStreamConstraints = {
    audio: {
      ...(targetDeviceId && targetDeviceId !== 'default' ? { deviceId: { exact: targetDeviceId } } : {}),
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      channelCount: { ideal: 32 },
    },
    video: false,
  };

  const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
  let detectedTrackChannelCount = 2;

  const track = mediaStream.getAudioTracks()[0];
  if (track) {
    const settings = track.getSettings();
    const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as any;
    const count = settings.channelCount || capabilities?.channelCount?.max || 2;
    detectedTrackChannelCount = Math.max(2, count);
  }

  return { mediaStream, detectedTrackChannelCount };
}

export function stopAudioMediaStream(stream: MediaStream | null): void {
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
  }
}
