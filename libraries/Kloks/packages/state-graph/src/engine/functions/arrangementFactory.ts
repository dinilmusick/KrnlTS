import { ArrangementNode, ArrangementTrack, ArrangementClip, ArrangementSignalType, ContainerNode } from '../types/legacyTypes';

export function createDefaultArrangementTracks(): ArrangementTrack[] {
  return [];
}

export function createArrangementNode(
  index: number,
  position?: [number, number, number]
): ArrangementNode {
  return {
    id: `arr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'arrangement',
    name: `Timeline ${index}`,
    position: position || [(Math.random() - 0.5) * 8, 0, (Math.random() - 0.5) * 8],
    color: '#818cf8',
    radius: 2.0,
    label: 'DAW Arrangement Timeline',
    active: true,
    width: 600,
    height: 300,
    tracks: [],
    totalBars: 4,
    timeSignature: [4, 4],
    currentBeat: 0,
    isPlaying: false,
    isLooping: true,
    loopStartBeat: 0,
    loopEndBeat: 16,
    snapSetting: '1/4',
    zoom: 1.0,
  };
}

export function createTrackForSignalType(
  signalType: ArrangementSignalType,
  count = 1
): ArrangementTrack {
  const isAudio = signalType.includes('audio');
  const isMidi = signalType.includes('midi');
  const isTrig = signalType === 'trigger';

  const typeName = isAudio
    ? (signalType === 'audio_mono' ? 'Mono Audio' : 'Stereo Audio')
    : isMidi
    ? 'MIDI'
    : isTrig
    ? 'Trigger'
    : 'Curve';

  const color = isAudio
    ? (signalType === 'audio_mono' ? '#06b6d4' : '#00ffff')
    : isMidi
    ? '#ec4899'
    : isTrig
    ? '#fbbf24'
    : '#10b981';

  return {
    id: `trk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: `${typeName} ${count}`,
    signalType,
    color,
    isMuted: false,
    isSolo: false,
    volume: 0.85,
    pan: 0,
    clips: [],
  };
}

export function createClipFromContainer(
  container: ContainerNode,
  startBeat = 0,
  targetDurationBeats?: number
): ArrangementClip {
  const cType = container.containerType || 'midi';
  const isAudio = cType === 'audio';
  const isCurve = cType === 'curve';
  const isMidi = !isAudio && !isCurve;

  let computedDuration = 8;
  if (targetDurationBeats != null) {
    computedDuration = targetDurationBeats;
  } else if (isAudio) {
    computedDuration = container.audioTrack?.durationBeats || 8;
  } else if (isCurve) {
    computedDuration = container.curveData?.lengthInBeats || 8;
  } else if (isMidi) {
    computedDuration = container.pattern?.lengthInBeats || 8;
  }

  const signalType: ArrangementSignalType = isAudio
    ? (container.audioFormat === 'mono' ? 'audio_mono' : 'audio_stereo')
    : isCurve
    ? 'curve'
    : 'midi';

  const clipDefaultName = isAudio
    ? (container.audioFormat === 'mono' ? 'Mono Audio Take' : 'Stereo Audio Take')
    : isMidi
    ? 'MIDI Pattern'
    : 'Curve Loop';

  const clipDefaultColor = isAudio
    ? (container.audioFormat === 'mono' ? '#06b6d4' : '#00ffff')
    : isMidi
    ? '#ec4899'
    : '#10b981';

  return {
    id: `clip-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: container.name || clipDefaultName,
    containerId: container.id,
    signalType,
    startBeat,
    durationBeats: Math.max(1, computedDuration),
    color: container.color || clipDefaultColor,
    audioTrack: container.audioTrack ? { ...container.audioTrack } : undefined,
    sampleType: container.audioTrack?.sampleType || 'cosmic_warp',
    customAudioUrl: container.audioTrack?.customAudioUrl,
    audioFormat: container.audioFormat || (isAudio ? (container.audioFormat === 'mono' ? 'mono' : 'stereo') : undefined),
    pattern: container.pattern ? JSON.parse(JSON.stringify(container.pattern)) : undefined,
    notes: container.pattern?.notes ? [...container.pattern.notes] : undefined,
    curveData: container.curveData ? JSON.parse(JSON.stringify(container.curveData)) : undefined,
  };
}
