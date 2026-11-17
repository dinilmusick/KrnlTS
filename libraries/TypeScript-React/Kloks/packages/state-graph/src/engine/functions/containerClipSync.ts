import { ArrangementNode, ArrangementClip, ArrangementTrack, ArrangementSignalType, ContainerNode, NodeConnection } from '../types/legacyTypes';
import { createClipFromContainer, createTrackForSignalType } from './arrangementFactory';

export function syncConnectedContainersToArrangement(
  arrangement: ArrangementNode,
  allNodes: any[]
): { updated: boolean; arrangement: ArrangementNode } {
  const containerMap = new Map<string, ContainerNode>();
  allNodes.forEach((n) => {
    if (n.type === 'container') containerMap.set(n.id, n as ContainerNode);
  });

  let changed = false;
  const newTracks = arrangement.tracks.map((track) => {
    let trackChanged = false;
    const newClips = track.clips.map((clip) => {
      if (!clip.containerId) return clip;
      const sourceContainer = containerMap.get(clip.containerId);
      if (!sourceContainer) return clip;

      // Check if container content changed
      const isAudio = sourceContainer.containerType === 'audio';
      const isMidi = sourceContainer.containerType !== 'audio' && sourceContainer.containerType !== 'curve';

      let needsUpdate = false;
      if (isAudio && sourceContainer.audioTrack) {
        if (
          clip.sampleType !== sourceContainer.audioTrack.sampleType ||
          clip.customAudioUrl !== sourceContainer.audioTrack.customAudioUrl ||
          clip.name !== (sourceContainer.name || clip.name)
        ) {
          needsUpdate = true;
        }
      } else if (isMidi && sourceContainer.pattern) {
        const sourceNotesCount = sourceContainer.pattern.notes?.length || 0;
        const clipNotesCount = clip.notes?.length || 0;
        if (sourceNotesCount !== clipNotesCount || clip.name !== (sourceContainer.name || clip.name)) {
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        trackChanged = true;
        changed = true;
        return {
          ...clip,
          name: sourceContainer.name || clip.name,
          audioTrack: sourceContainer.audioTrack ? { ...sourceContainer.audioTrack } : clip.audioTrack,
          sampleType: sourceContainer.audioTrack?.sampleType || clip.sampleType,
          customAudioUrl: sourceContainer.audioTrack?.customAudioUrl || clip.customAudioUrl,
          pattern: sourceContainer.pattern ? JSON.parse(JSON.stringify(sourceContainer.pattern)) : clip.pattern,
          notes: sourceContainer.pattern?.notes ? [...sourceContainer.pattern.notes] : clip.notes,
          curveData: sourceContainer.curveData ? JSON.parse(JSON.stringify(sourceContainer.curveData)) : clip.curveData,
        };
      }
      return clip;
    });

    return trackChanged ? { ...track, clips: newClips } : track;
  });

  // Check if any clip in newTracks exceeds current timeline totalBars
  let maxEndBeat = (arrangement.totalBars || 4) * 4;
  let lengthExtended = false;
  newTracks.forEach((t) => {
    t.clips.forEach((c) => {
      const end = (c.startBeat || 0) + (c.durationBeats || 0);
      if (end > maxEndBeat) {
        maxEndBeat = end;
        lengthExtended = true;
      }
    });
  });

  if (lengthExtended) {
    const newTotalBars = Math.ceil(maxEndBeat / 4);
    return {
      updated: true,
      arrangement: {
        ...arrangement,
        totalBars: newTotalBars,
        loopEndBeat: Math.max(arrangement.loopEndBeat || 0, newTotalBars * 4),
        tracks: newTracks,
      },
    };
  }

  return {
    updated: changed,
    arrangement: changed ? { ...arrangement, tracks: newTracks } : arrangement,
  };
}

export function ingestContainerIntoArrangement(
  arrangement: ArrangementNode,
  container: ContainerNode,
  targetTrackId?: string,
  targetBeat?: number
): ArrangementNode {
  const cType = container.containerType || 'midi';
  const isAudio = cType === 'audio';
  const isCurve = cType === 'curve';
  const containerSig: ArrangementSignalType = isAudio
    ? (container.audioFormat === 'mono' ? 'audio_mono' : 'audio_stereo')
    : isCurve
    ? 'curve'
    : 'midi';

  let tracks = [...arrangement.tracks];
  let targetTrack = targetTrackId ? tracks.find((t) => t.id === targetTrackId) : null;

  // Enforce track signal purity!
  if (targetTrack && !isSignalCompatibleWithTrack(containerSig, targetTrack.signalType)) {
    targetTrack = null; // Can't put incompatible signal on this track!
  }

  // 1. First search for an exact matching pure track for containerSig
  if (!targetTrack) {
    targetTrack = tracks.find((t) => t.signalType === containerSig) || null;
  }

  // 2. Fall back to first compatible track if exact match not found
  if (!targetTrack) {
    targetTrack = tracks.find((t) => isSignalCompatibleWithTrack(containerSig, t.signalType)) || null;
  }

  // 3. Create a new track for exact container signal type if none found
  if (!targetTrack) {
    const sameTypeCount = tracks.filter((t) => t.signalType === containerSig).length;
    const newTrack = createTrackForSignalType(
      containerSig,
      sameTypeCount + 1
    );
    tracks.push(newTrack);
    targetTrack = newTrack;
  }

  // Calculate start beat: if targetBeat given, use it; otherwise place after existing clips or at 0
  let startBeat = targetBeat ?? 0;
  if (targetBeat == null && targetTrack.clips.length > 0) {
    const lastClip = targetTrack.clips[targetTrack.clips.length - 1];
    startBeat = Math.ceil(lastClip.startBeat + lastClip.durationBeats);
  }

  // Check if clip for this container already exists on this track: replace if so!
  const existingIndex = targetTrack.clips.findIndex((c) => c.containerId === container.id);
  const newClip = createClipFromContainer(
    container,
    existingIndex >= 0 ? targetTrack.clips[existingIndex].startBeat : startBeat
  );

  let updatedClips: ArrangementClip[];
  if (existingIndex >= 0) {
    // In-place replacement
    updatedClips = [...targetTrack.clips];
    updatedClips[existingIndex] = {
      ...newClip,
      startBeat: targetTrack.clips[existingIndex].startBeat,
      durationBeats: targetTrack.clips[existingIndex].durationBeats || newClip.durationBeats,
    };
  } else {
    updatedClips = [...targetTrack.clips, newClip];
  }

  const updatedTracks = tracks.map((t) => (t.id === targetTrack!.id ? { ...t, clips: updatedClips } : t));

  // Auto-extend timeline if clip length exceeds current timeline totalBars
  const clipEndBeat = (existingIndex >= 0 ? targetTrack.clips[existingIndex].startBeat : startBeat) + newClip.durationBeats;
  const currentMaxBeat = (arrangement.totalBars || 4) * 4;
  let totalBars = arrangement.totalBars || 4;
  let loopEndBeat = arrangement.loopEndBeat ?? totalBars * 4;

  if (clipEndBeat > currentMaxBeat) {
    totalBars = Math.ceil(clipEndBeat / 4);
    loopEndBeat = totalBars * 4;
  }

  return {
    ...arrangement,
    totalBars,
    loopEndBeat,
    tracks: updatedTracks,
  };
}

export function isSignalCompatibleWithTrack(sourceSig: string, trackSig: string): boolean {
  if (sourceSig === trackSig) return true;
  // Mono audio and stereo audio are distinct signal types and must not be mixed across tracks
  if (sourceSig === 'audio_mono' || trackSig === 'audio_mono') return false;
  if (sourceSig === 'audio_stereo' || trackSig === 'audio_stereo') return false;
  if (sourceSig.includes('audio') && trackSig.includes('audio')) return true;
  if (sourceSig.includes('midi') && trackSig.includes('midi')) return true;
  if (sourceSig === 'trigger' && trackSig === 'trigger') return true;
  if (sourceSig.includes('curve') && trackSig.includes('curve')) return true;
  return false;
}
