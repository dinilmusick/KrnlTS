export * from './types';
import { ActiveTrackPlayback, ActiveAuditionPlayback } from './types';

import { AudioTrackData, SamplePresetType } from '@kloks/state-graph';
import { synthEngine } from '../synthEngine';
import { generatePresetAudioBuffer } from '../clipWaveforms';



export class AudioClipEngine {
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private maxCacheSize: number = 32;
  private loadingPromises: Map<string, Promise<{ buffer: AudioBuffer; peaks: number[] }>> = new Map();
  private activeSources: Map<string, AudioBufferSourceNode> = new Map();
  private activePlaybacks: Map<string, ActiveTrackPlayback> = new Map();
  private activeAudition: ActiveAuditionPlayback | null = null;

  public getContext(): AudioContext {
    return synthEngine.getContext();
  }

  private setBufferCacheEntry(key: string, buffer: AudioBuffer) {
    if (this.bufferCache.has(key)) {
      this.bufferCache.delete(key);
    } else if (this.bufferCache.size >= this.maxCacheSize) {
      // Evict oldest entry (first key in map)
      const oldestKey = this.bufferCache.keys().next().value;
      if (oldestKey) {
        this.bufferCache.delete(oldestKey);
      }
    }
    this.bufferCache.set(key, buffer);
  }

  public getOrCreatePresetBuffer(sampleType: SamplePresetType): AudioBuffer {
    if (this.bufferCache.has(sampleType)) {
      const buffer = this.bufferCache.get(sampleType)!;
      // Refresh LRU order
      this.bufferCache.delete(sampleType);
      this.bufferCache.set(sampleType, buffer);
      return buffer;
    }
    const buffer = generatePresetAudioBuffer(this.getContext(), sampleType);
    this.setBufferCacheEntry(sampleType, buffer);
    return buffer;
  }

  public extractWaveformData(buffer: AudioBuffer, numPoints = 100): number[] {
    const channelData = buffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / numPoints);
    const peaks: number[] = [];

    for (let i = 0; i < numPoints; i++) {
      const start = i * blockSize;
      let max = 0;
      for (let j = 0; j < blockSize && start + j < channelData.length; j++) {
        const val = Math.abs(channelData[start + j] || 0);
        if (val > max) max = val;
      }
      peaks.push(Math.min(1, Math.round(max * 100) / 100));
    }
    return peaks;
  }

  public async loadSampleFromUrl(url: string): Promise<{ buffer: AudioBuffer; peaks: number[] }> {
    if (this.bufferCache.has(url)) {
      const buffer = this.bufferCache.get(url)!;
      return { buffer, peaks: this.extractWaveformData(buffer) };
    }

    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    const promise = (async () => {
      try {
        const ctx = this.getContext();
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status} fetching sample: ${url}`);
        const arrayBuf = await res.arrayBuffer();
        const audioBuf = await ctx.decodeAudioData(arrayBuf);
        this.setBufferCacheEntry(url, audioBuf);
        return { buffer: audioBuf, peaks: this.extractWaveformData(audioBuf) };
      } finally {
        this.loadingPromises.delete(url);
      }
    })();

    this.loadingPromises.set(url, promise);
    return promise;
  }

  public async getOrLoadBuffer(sampleType: SamplePresetType, customUrl?: string): Promise<AudioBuffer> {
    if (customUrl) {
      try {
        const { buffer } = await this.loadSampleFromUrl(customUrl);
        return buffer;
      } catch (err) {
        console.warn('Failed to load custom sample URL, falling back to preset:', customUrl, err);
      }
    }
    return this.getOrCreatePresetBuffer(sampleType);
  }

  public async auditionSampleUrl(url: string, onEnded?: () => void): Promise<void> {
    this.stopAudition();
    const ctx = this.getContext();
    if (ctx.state === 'suspended') await ctx.resume().catch(() => {});

    try {
      const { buffer } = await this.loadSampleFromUrl(url);
      if (ctx.state === 'suspended') await ctx.resume().catch(() => {});

      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = 0.85;
      src.connect(gain);
      gain.connect(synthEngine.getMasterNode() || ctx.destination);

      this.activeAudition = {
        url,
        startTime: ctx.currentTime,
        duration: buffer.duration,
        source: src,
      };

      src.onended = () => {
        if (this.activeAudition?.source === src) this.activeAudition = null;
        if (onEnded) onEnded();
      };

      src.start();
    } catch (err) {
      console.error('Failed to audition sample:', err);
      if (onEnded) onEnded();
    }
  }

  public stopAudition(): void {
    if (this.activeAudition) {
      try {
        this.activeAudition.source.stop();
        this.activeAudition.source.disconnect();
      } catch {
        // ignore
      }
      this.activeAudition = null;
    }
  }

  public getAuditionProgress(): { isPlaying: boolean; progress: number } {
    if (!this.activeAudition) return { isPlaying: false, progress: 0 };
    const ctx = this.getContext();
    const elapsed = ctx.currentTime - this.activeAudition.startTime;
    const progress = Math.max(0, Math.min(1, elapsed / this.activeAudition.duration));
    return { isPlaying: elapsed <= this.activeAudition.duration, progress };
  }

  public async playAudioTrack(
    track: AudioTrackData,
    bpm: number,
    destination?: AudioNode,
    containerId?: string,
    offsetBeats?: number,
    volumeScale: number = 1.0,
    panOffset: number = 0.0
  ): Promise<void> {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
    if (!containerId || !synthEngine.isNodeConnectedToOutput(containerId)) return;

    this.stopAudioTrack(track.id);
    const buffer = await this.getOrLoadBuffer(track.sampleType, track.customAudioUrl);
    if (ctx.state === 'suspended') await ctx.resume().catch(() => {});

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.setValueAtTime(Math.pow(2, (track.pitchShift || 0) / 12), ctx.currentTime);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(track.filterCutoff || 8000, ctx.currentTime);

    const gainNode = ctx.createGain();
    const effectiveGain = Math.max(0, (track.gain ?? 1.0) * volumeScale * 0.75);
    gainNode.gain.setValueAtTime(effectiveGain, ctx.currentTime);
    const outTarget = destination || synthEngine.getMasterNode() || ctx.destination;

    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (panner) {
      const effectivePan = Math.max(-1, Math.min(1, (track.pan || 0) + panOffset));
      panner.pan.setValueAtTime(effectivePan, ctx.currentTime);
      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(panner);
      panner.connect(outTarget);
    } else {
      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(outTarget);
    }

    const secPerBeat = 60 / (bpm || 120);
    const startSec = ((track.trimStartBeats || 0) + (offsetBeats || 0)) * secPerBeat;
    const endSec = Math.min(buffer.duration, ((track.trimEndBeats || track.durationBeats) || 4) * secPerBeat);
    const playDuration = Math.max(0.05, endSec - startSec);

    this.activeSources.set(track.id, source);
    if (containerId) {
      synthEngine.markNodeActive(containerId, playDuration);
    }
    this.activePlaybacks.set(track.id, {
      trackId: track.id,
      startTime: ctx.currentTime,
      startSec,
      playDuration,
      bufferDuration: buffer.duration,
      secPerBeat,
      source,
    });

    source.start(ctx.currentTime, startSec, playDuration);
    source.onended = () => {
      if (this.activeSources.get(track.id) === source) {
        this.activeSources.delete(track.id);
        this.activePlaybacks.delete(track.id);
      }
    };
  }

  public getTrackPlaybackProgress(trackId: string): { isPlaying: boolean; progress: number; currentBeat: number; elapsedSec: number } {
    const playback = this.activePlaybacks.get(trackId);
    if (!playback) return { isPlaying: false, progress: 0, currentBeat: 0, elapsedSec: 0 };
    const ctx = this.getContext();
    const elapsed = ctx.currentTime - playback.startTime;
    if (elapsed > playback.playDuration) {
      return { isPlaying: false, progress: 1, currentBeat: playback.playDuration / playback.secPerBeat, elapsedSec: playback.playDuration };
    }
    const progress = Math.max(0, Math.min(1, elapsed / playback.playDuration));
    return { isPlaying: true, progress, currentBeat: elapsed / playback.secPerBeat, elapsedSec: elapsed };
  }

  public stopAudioTrack(trackId: string): void {
    const active = this.activeSources.get(trackId);
    if (active) {
      try {
        active.stop();
        active.disconnect();
      } catch {
        // ignore
      }
      this.activeSources.delete(trackId);
      this.activePlaybacks.delete(trackId);
    }
  }

  public async loadAudioFile(file: File): Promise<{ buffer: AudioBuffer; peaks: number[]; url: string }> {
    const ctx = this.getContext();
    const arrayBuf = await file.arrayBuffer();
    const audioBuf = await ctx.decodeAudioData(arrayBuf);
    const peaks = this.extractWaveformData(audioBuf, 100);
    const url = URL.createObjectURL(file);
    this.setBufferCacheEntry(url, audioBuf);
    return { buffer: audioBuf, peaks, url };
  }

  public startRecording(
    node: any,
    currentBeat: number,
    onUpdateNode?: (updated: any) => void
  ): void {
    const updated = {
      ...node,
      isRecording: true,
      isArmed: false,
      quantizeStatus: 'recording',
      recordingStartBeat: currentBeat,
      pendingTriggerBeat: null,
      pendingAction: null,
    };
    if (onUpdateNode) onUpdateNode(updated);
  }

  public stopRecordingToContainer(
    node: any,
    targetContainer: any | any[] | null,
    onUpdateNode?: (updated: any) => void
  ): void {
    const isAudio =
      node.recorderType === 'audio' ||
      node.recorderType === 'audio_stereo' ||
      node.recorderType === 'audio_mono';
    const isCurve = node.recorderType === 'curve';
    const isMidi = node.recorderType === 'midi';

    const durationBeats = node.recordingLengthBeats || 4;
    const packetName = node.targetPacketName || `Take ${(node.recordedPacketsCount || 0) + 1}`;

    const newPacket: any = {
      id: `pkt-${Date.now()}`,
      index: Array.isArray(targetContainer) && targetContainer[0]?.packets ? targetContainer[0].packets.length : targetContainer?.packets ? targetContainer.packets.length : 0,
      name: packetName,
      type: isAudio ? 'audio' : isCurve ? 'curve' : 'midi',
      signalFormat: 'packet',
      signalType: isAudio ? 'audio_packet' : isCurve ? 'curve_packet' : 'midi_packet',
      durationBeats,
      createdAt: Date.now(),
    };

    if (isAudio) {
      newPacket.sampleType = 'cosmic_warp';
      newPacket.gain = 1.0;
      newPacket.pan = 0;
      newPacket.pitchShift = 0;
      newPacket.filterCutoff = 8000;
      newPacket.fadeInBeats = 0.05;
      newPacket.fadeOutBeats = 0.1;
      newPacket.trimStartBeats = 0;
      newPacket.trimEndBeats = durationBeats;
      newPacket.audioFormat = node.recorderType === 'audio_mono' ? 'mono' : 'stereo';
    } else if (isCurve) {
      newPacket.curveData = {
        id: `crv-${Date.now()}`,
        name: packetName,
        lengthInBeats: durationBeats,
        targetParam: 'cutoff',
        minValue: 400,
        maxValue: 8000,
        points: [
          { id: 'p0', x: 0, y: 0.2, tension: 0 },
          { id: 'p1', x: durationBeats * 0.25, y: 0.8, tension: 0 },
          { id: 'p2', x: durationBeats * 0.5, y: 0.4, tension: 0 },
          { id: 'p3', x: durationBeats * 0.75, y: 0.9, tension: 0 },
          { id: 'p4', x: durationBeats, y: 0.2, tension: 0 },
        ],
      };
    } else {
      // MIDI
      newPacket.pattern = {
        id: `pat-${Date.now()}`,
        name: packetName,
        lengthInBeats: durationBeats,
        tempo: 120,
        notes: [
          { note: 60, name: 'C4', velocity: 0.8, time: 0, duration: 1 },
          { note: 64, name: 'E4', velocity: 0.8, time: 1, duration: 1 },
          { note: 67, name: 'G4', velocity: 0.8, time: 2, duration: 1 },
          { note: 71, name: 'B4', velocity: 0.8, time: 3, duration: 1 },
        ],
      };
    }

    const defaultWaveform = [
      0.12, 0.35, 0.65, 0.8, 0.55, 0.72, 0.88, 0.6,
      0.25, 0.48, 0.75, 0.9, 0.68, 0.38, 0.58, 0.82,
      0.88, 0.58, 0.32, 0.52, 0.78, 0.89, 0.68, 0.48,
      0.62, 0.82, 0.72, 0.48, 0.28, 0.42, 0.55, 0.32,
      0.18, 0.12, 0.08, 0.06
    ];

    if (isAudio) {
      newPacket.waveformData = defaultWaveform;
    }

    const containers = Array.isArray(targetContainer) ? targetContainer : (targetContainer ? [targetContainer] : []);
    containers.forEach((cont) => {
      if (!cont || node.autoStoreOnStop === false) return;
      if (isAudio) {
        cont.audioTrack = {
          id: `aud-${Date.now()}-${cont.id}`,
          name: packetName,
          sampleType: newPacket.sampleType || 'cosmic_warp',
          durationBeats,
          gain: 1.0,
          pan: 0,
          pitchShift: 0,
          filterCutoff: 8000,
          fadeInBeats: 0.05,
          fadeOutBeats: 0.1,
          trimStartBeats: 0,
          trimEndBeats: durationBeats,
          isReversed: false,
          waveformData: defaultWaveform,
        };
      } else if (isCurve) {
        cont.curveData = newPacket.curveData;
      } else {
        cont.pattern = newPacket.pattern;
      }
    });

    const updatedNode = {
      ...node,
      isRecording: false,
      isArmed: false,
      quantizeStatus: 'idle',
      pendingTriggerBeat: null,
      pendingAction: null,
      recordedPacketsCount: (node.recordedPacketsCount || 0) + 1,
      targetPacketName: `Take ${(node.recordedPacketsCount || 0) + 2}`,
      lastTransferredAt: Date.now(),
    };

    if (onUpdateNode) onUpdateNode(updatedNode);
  }
}

export const audioClipEngine = new AudioClipEngine();