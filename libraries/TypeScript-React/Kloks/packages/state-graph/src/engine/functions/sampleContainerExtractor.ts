import { ContainerNode, NodeConnection, SpaceNode, AudioTrackData, SamplePresetType } from "../types/index.js";

export interface ExtractedSampleItem {
  id: string;
  clipId: string;
  name: string;
  containerId: string;
  containerName: string;
  audioFormat: 'mono' | 'stereo';
  sampleType: SamplePresetType;
  customAudioUrl?: string;
  waveformData?: number[];
  audioTrack: AudioTrackData;
}

export const GM_DRUM_NOTES = [
  36, // C1: Bass Drum 1
  38, // D1: Acoustic Snare
  42, // F#1: Closed Hi-Hat
  46, // A#1: Open Hi-Hat
  37, // C#1: Side Stick
  39, // D#1: Hand Clap
  41, // F1: Low Floor Tom
  43, // G1: High Floor Tom
  45, // A1: Low Tom
  47, // B1: Low-Mid Tom
  48, // C2: High-Mid Tom
  50, // D2: High Tom
  49, // C#2: Crash Cymbal 1
  51, // D#2: Ride Cymbal 1
  52, // E2: Chinese Cymbal
  53, // F2: Ride Bell
];

export function getDefaultPadMidiNote(index: number): number {
  if (index < GM_DRUM_NOTES.length) {
    return GM_DRUM_NOTES[index];
  }
  return 36 + (index % 48);
}

export function extractSamplesFromConnectedContainers(
  targetNodeId: string,
  connections: NodeConnection[] = [],
  allNodes: SpaceNode[] = []
): { samples: ExtractedSampleItem[]; connectedContainers: ContainerNode[] } {
  // Find all connections to targetNodeId at store_in or packet_in sockets
  const relevantConns = connections.filter(
    (c) =>
      c.toNodeId === targetNodeId &&
      (c.toPort === 'store_in' ||
        c.toPort === 'packet_in' ||
        c.toSocketId === 'store_in' ||
        c.toSocketId === 'packet_in' ||
        c.signalType === 'audio_packet' ||
        c.toSocketIndex === 0)
  );

  const connectedContainerIds = new Set(relevantConns.map((c) => c.fromNodeId));
  const connectedContainers = allNodes.filter(
    (n): n is ContainerNode =>
      n.type === 'container' &&
      (n as ContainerNode).containerType === 'audio' &&
      connectedContainerIds.has(n.id)
  );

  const samples: ExtractedSampleItem[] = [];

  connectedContainers.forEach((container) => {
    const containerFormat = container.audioFormat === 'mono' ? 'mono' : 'stereo';
    if (container.audioTrack) {
      const clip = container.audioTrack;
      const clipId = clip.id || `clip-${container.id}`;
      samples.push({
        id: `${container.id}_${clipId}`,
        clipId,
        name: clip.name || container.name || 'Audio Container',
        containerId: container.id,
        containerName: container.name || 'Audio Container',
        audioFormat: containerFormat,
        sampleType: clip.sampleType || 'kick',
        customAudioUrl: clip.customAudioUrl,
        waveformData: clip.waveformData,
        audioTrack: {
          ...clip,
          id: clipId,
          name: clip.name || container.name || 'Audio Container',
        },
      });
    }
  });

  return { samples, connectedContainers };
}
