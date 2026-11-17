import {
  RecorderNode,
  ContainerNode,
  StoredPacket,
  MidiNote,
  AudioTrackData,
} from '@kloks/state-graph';
import { MidiEventPayload } from '../../midi/midiManager';
import {
  BufferedMidiEvent,
  BufferedAudioPeak,
  BufferedCurvePoint,
  RetrospectiveCycleInfo,
  SnapshotListener,
} from './types';

export class RetrospectiveBufferEngine {
  // In-memory rolling ring-buffer histories keyed by recorder node ID
  private midiHistory: Map<string, BufferedMidiEvent[]> = new Map();
  private audioHistory: Map<string, BufferedAudioPeak[]> = new Map();
  private curveHistory: Map<string, BufferedCurvePoint[]> = new Map();
  private snapshotListeners: Set<SnapshotListener> = new Set();

  /**
   * Subscribes to capture snapshots for visual feedback
   */
  public onSnapshotCaptured(listener: SnapshotListener): () => void {
    this.snapshotListeners.add(listener);
    return () => {
      this.snapshotListeners.delete(listener);
    };
  }

  private notifySnapshotCaptured(recorderId: string, packet: StoredPacket, containerId?: string) {
    this.snapshotListeners.forEach((fn) => {
      try {
        fn(recorderId, packet, containerId);
      } catch (err) {
        console.error('Error in snapshot listener:', err);
      }
    });
  }

  /**
   * Calculates effective buffer duration entirely in musical clock units:
   * buffer_length = bars * 4 + beats + (beat_fractions / 64)
   */
  public getEffectiveBufferLengthBeats(node: RecorderNode): number {
    const bars = node.bufferBars ?? node.bufferLengthBars ?? 4;
    const beatsPart = node.bufferBeatsPart ?? 0;
    const fractions = node.bufferBeatFractions ?? 0;
    const totalBeats = bars * 4 + beatsPart + fractions / 64;
    return Math.max(0.0625, totalBeats);
  }

  /**
   * Calculates capture boundary in beats within a cycle
   */
  public getCaptureBoundaryBeats(node: RecorderNode, bufferBeats: number): number {
    if (node.captureBoundaryBeats != null && node.captureBoundaryBeats >= 0) {
      return Math.min(bufferBeats, node.captureBoundaryBeats);
    }
    const ratio = node.captureBoundaryRatio ?? 0.333;
    return Math.max(0, Math.min(bufferBeats, ratio * bufferBeats));
  }

  /**
   * Evaluates the rolling ring-buffer cycle state and boundary determination for a recorder
   */
  public getCycleInfo(node: RecorderNode, currentBeat: number): RetrospectiveCycleInfo {
    const bufferBeats = this.getEffectiveBufferLengthBeats(node);
    const safeBeat = Math.max(0, currentBeat);
    const currentCycleIndex = Math.floor(safeBeat / bufferBeats);
    const beatInCurrentCycle = safeBeat % bufferBeats;
    const cycleProgress = Math.max(0, Math.min(1, beatInCurrentCycle / bufferBeats));

    const captureBoundaryBeats = this.getCaptureBoundaryBeats(node, bufferBeats);
    const captureBoundaryRatio = captureBoundaryBeats / bufferBeats;

    // Boundary rule:
    // If Capture Trigger occurs at/after the boundary -> capture the CURRENT completed buffer window.
    // If Capture Trigger occurs before the boundary -> capture the PRECEDING completed buffer window.
    const isAfterBoundary = beatInCurrentCycle >= captureBoundaryBeats;
    let targetedCycleIndex = currentCycleIndex;
    if (!isAfterBoundary && currentCycleIndex > 0) {
      targetedCycleIndex = currentCycleIndex - 1;
    }

    const midiEvents = this.midiHistory.get(node.id) || [];
    const currentCycleStartBeat = currentCycleIndex * bufferBeats;
    const currentCycleEndBeat = currentCycleStartBeat + bufferBeats;
    const prevCycleStartBeat = (currentCycleIndex - 1) * bufferBeats;
    const prevCycleEndBeat = currentCycleStartBeat;

    const activeEventsInCurrentCycle = midiEvents.filter(
      (e) => e.beat >= currentCycleStartBeat && e.beat < currentCycleEndBeat
    ).length;

    const activeEventsInPreviousCycle = currentCycleIndex > 0
      ? midiEvents.filter((e) => e.beat >= prevCycleStartBeat && e.beat < prevCycleEndBeat).length
      : 0;

    return {
      bufferBeats,
      currentCycleIndex,
      beatInCurrentCycle,
      cycleProgress,
      captureBoundaryBeats,
      captureBoundaryRatio,
      isAfterBoundary,
      targetedCycleIndex,
      isPreviousCycleAvailable: currentCycleIndex > 0,
      activeEventsInCurrentCycle,
      activeEventsInPreviousCycle,
    };
  }

  /**
   * Ingests continuous live audio peak into the continuous rolling ring buffer
   */
  public recordAudioPeak(
    recorderId: string,
    peakL: number,
    peakR: number,
    currentBeat: number,
    bufferBeats = 16
  ): void {
    if (!this.audioHistory.has(recorderId)) {
      this.audioHistory.set(recorderId, []);
    }
    const history = this.audioHistory.get(recorderId)!;
    const cycleIndex = Math.floor(currentBeat / bufferBeats);

    history.push({
      beat: currentBeat,
      peakL,
      peakR,
      cycleIndex,
      timestamp: performance.now(),
    });

    // Prune entries older than 8 cycles to maintain low memory footprint
    const minRetainBeat = Math.max(0, currentBeat - bufferBeats * 8);
    const pruned = history.filter((p) => p.beat >= minRetainBeat);
    this.audioHistory.set(recorderId, pruned);
  }

  /**
   * Gets live audio peaks for circular ring display
   */
  public getAudioPeaksForRecorder(recorderId: string): BufferedAudioPeak[] {
    return this.audioHistory.get(recorderId) || [];
  }

  /**
   * Ingests a live MIDI note event into the continuous rolling ring buffer
   */
  public recordMidiEvent(
    recorderId: string,
    evt: MidiEventPayload,
    currentBeat: number,
    durationBeats = 0.5,
    bufferBeats = 16
  ): void {
    if (!this.midiHistory.has(recorderId)) {
      this.midiHistory.set(recorderId, []);
    }
    const history = this.midiHistory.get(recorderId)!;
    const cycleIndex = Math.floor(currentBeat / bufferBeats);

    history.push({
      note: evt.note,
      name: evt.noteName,
      velocity: evt.velocity || 0.85,
      beat: currentBeat,
      duration: durationBeats,
      cycleIndex,
      timestamp: performance.now(),
    });

    // Prune events older than 8 cycles
    const minRetainBeat = Math.max(0, currentBeat - bufferBeats * 8);
    const pruned = history.filter((e) => e.beat >= minRetainBeat);
    this.midiHistory.set(recorderId, pruned);
  }

  /**
   * Gets live MIDI events for circular ring display
   */
  public getMidiEventsForRecorder(recorderId: string): BufferedMidiEvent[] {
    return this.midiHistory.get(recorderId) || [];
  }

  /**
   * Ingests a live CV curve point into the continuous rolling ring buffer
   */
  public recordCurvePoint(
    recorderId: string,
    value: number,
    currentBeat: number,
    bufferBeats = 16
  ): void {
    if (!this.curveHistory.has(recorderId)) {
      this.curveHistory.set(recorderId, []);
    }
    const history = this.curveHistory.get(recorderId)!;
    const cycleIndex = Math.floor(currentBeat / bufferBeats);
    const cycleStartBeat = cycleIndex * bufferBeats;
    const relX = currentBeat - cycleStartBeat;

    history.push({
      id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      x: relX,
      y: Math.max(0, Math.min(1, value)),
      tension: 0,
      cycleIndex,
      beat: currentBeat,
    });

    const minRetainBeat = Math.max(0, currentBeat - bufferBeats * 8);
    const pruned = history.filter((p) => p.beat >= minRetainBeat);
    this.curveHistory.set(recorderId, pruned);
  }

  /**
   * Captures a quantized snapshot take from the continuous ring buffer
   * and pushes it to connected Containers, replacing their previous packet.
   * Ring buffer CONTINUES operating normally without stopping or clearing.
   */
  public captureSnapshot(
    node: RecorderNode,
    targetContainers: ContainerNode | ContainerNode[] | null,
    triggerBeat: number,
    bpm = 120,
    onUpdateNode?: (updated: RecorderNode) => void,
    onUpdateContainer?: (updated: ContainerNode) => void
  ): { packet: StoredPacket; updatedNode: RecorderNode; updatedContainers: ContainerNode[] } {
    const cycleInfo = this.getCycleInfo(node, triggerBeat);
    const durationBeats = cycleInfo.bufferBeats;
    const targetCycle = cycleInfo.targetedCycleIndex;
    const cycleStartBeat = targetCycle * durationBeats;
    const cycleEndBeat = cycleStartBeat + durationBeats;

    const isAudioMono = node.recorderType === 'audio_mono';
    const isAudioStereo = node.recorderType === 'audio_stereo' || node.recorderType === 'audio';
    const isAudio = isAudioStereo || isAudioMono;
    const isCurve = node.recorderType === 'curve';
    const isMidi = node.recorderType === 'midi';

    const takeNumber = (node.recordedPacketsCount || 0) + 1;
    const barsCount = (durationBeats / 4).toFixed(durationBeats % 4 === 0 ? 0 : 2);
    const packetName = node.targetPacketName
      ? `${node.targetPacketName} (Take ${takeNumber})`
      : `Retrospective Take ${takeNumber} (${barsCount} Bars)`;

    const newPacket: StoredPacket = {
      id: `pkt-retro-${Date.now()}`,
      index: 0,
      name: packetName,
      type: isAudio ? 'audio' : isCurve ? 'curve' : 'midi',
      signalFormat: 'packet',
      signalType: isAudio ? 'audio_packet' : isCurve ? 'curve_packet' : 'midi_packet',
      durationBeats,
      createdAt: Date.now(),
    };

    if (isMidi) {
      const liveMidi = this.midiHistory.get(node.id) || [];
      const cycleMidi = liveMidi.filter((e) => e.beat >= cycleStartBeat && e.beat < cycleEndBeat);
      const relativeNotes: MidiNote[] = cycleMidi.map((e) => ({
        id: `n-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        note: e.note,
        name: String(e.note),
        time: e.beat - cycleStartBeat,
        velocity: e.velocity,
        startTime: e.beat - cycleStartBeat,
        duration: e.duration,
      }));
      newPacket.pattern = {
        id: `pat-retro-${Date.now()}`,
        name: packetName,
        notes: relativeNotes,
        lengthInBeats: durationBeats,
        durationBeats,
      } as any;
    } else if (isCurve) {
      const liveCurve = this.curveHistory.get(node.id) || [];
      const cycleCurve = liveCurve.filter((p) => p.beat >= cycleStartBeat && p.beat < cycleEndBeat);
      newPacket.curveData = cycleCurve.map((p) => ({
        id: p.id,
        x: p.x,
        y: p.y,
        tension: p.tension,
      })) as any;
    } else if (isAudio) {
      const liveAudio = this.audioHistory.get(node.id) || [];
      const cycleAudio = liveAudio.filter((p) => p.beat >= cycleStartBeat && p.beat < cycleEndBeat);

      const bufferLen = Math.max(128, cycleAudio.length);
      const peaksL = new Float32Array(bufferLen);
      const peaksR = new Float32Array(bufferLen);

      cycleAudio.forEach((p, idx) => {
        if (idx < bufferLen) {
          peaksL[idx] = p.peakL;
          peaksR[idx] = p.peakR;
        }
      });

      const newAudioTrack: AudioTrackData = {
        id: `aud-retro-${Date.now()}`,
        name: packetName,
        durationBeats,
        sampleRate: 44100,
        peaksL,
        peaksR,
        gain: 1.0,
      } as any;
      newPacket.audioTrack = newAudioTrack;
      newPacket.audioFormat = isAudioMono ? 'mono' : 'stereo';
    }

    const containerArray = targetContainers
      ? Array.isArray(targetContainers)
        ? targetContainers
        : [targetContainers]
      : [];

    const updatedContainersList: ContainerNode[] = [];

    containerArray.forEach((tc) => {
      const updated: ContainerNode = {
        ...tc,
        activePacket: newPacket,
        lastCapturedAt: Date.now(),
        ...(isAudio
          ? { audioTrack: newPacket.audioTrack, audioFormat: isAudioMono ? 'mono' : 'stereo' }
          : isCurve
          ? { curveData: newPacket.curveData }
          : { pattern: newPacket.pattern }),
      } as unknown as ContainerNode;
      updatedContainersList.push(updated);
      if (onUpdateContainer) onUpdateContainer(updated);
    });

    const updatedNode: RecorderNode = {
      ...node,
      recordedPacketsCount: takeNumber,
      lastCapturedTakeBeat: triggerBeat,
      lastCapturedPacketId: newPacket.id,
      targetPacketName: `Take ${takeNumber + 1}`,
      lastTransferredAt: Date.now(),
    };

    if (onUpdateNode) onUpdateNode(updatedNode);

    this.notifySnapshotCaptured(node.id, newPacket, containerArray[0]?.id);

    return { packet: newPacket, updatedNode, updatedContainers: updatedContainersList };
  }

  /**
   * Resets buffer history for a recorder (if removed or reset manually)
   */
  public clearBuffer(recorderId: string): void {
    this.midiHistory.delete(recorderId);
    this.audioHistory.delete(recorderId);
    this.curveHistory.delete(recorderId);
  }
}

export const retrospectiveBufferEngine = new RetrospectiveBufferEngine();
