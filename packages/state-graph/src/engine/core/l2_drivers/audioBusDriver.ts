import { NamedAudioBus, SpaceNode, NodeConnection } from "../../types/index.js";

export class AudioBusDriver {
  public channelSplitter: ChannelSplitterNode | null = null;
  public channelAnalysers: Map<number, AnalyserNode> = new Map();
  public namedAnalyserMap: Map<string, AnalyserNode> = new Map();
  public namedGainMap: Map<string, GainNode> = new Map();
  public activeMonitorGains: Map<string, GainNode> = new Map();
  private sharedAnalyserBuffer: Uint8Array = new Uint8Array(64);

  public setupSplitter(
    ctx: AudioContext,
    sourceNode: MediaStreamAudioSourceNode,
    channelCount: number
  ): ChannelSplitterNode | null {
    const splitCount = Math.min(32, Math.max(2, channelCount));
    try {
      this.channelSplitter = ctx.createChannelSplitter(splitCount);
      sourceNode.connect(this.channelSplitter);

      this.channelAnalysers.clear();
      for (let i = 0; i < splitCount; i++) {
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        this.channelSplitter.connect(analyser, i);
        this.channelAnalysers.set(i + 1, analyser);
      }
      return this.channelSplitter;
    } catch (e) {
      console.warn('Could not set up multi-channel splitter:', e);
      return null;
    }
  }

  public setupNamedAnalysers(ctx: AudioContext, inputs: NamedAudioBus[]) {
    this.namedAnalyserMap.clear();
    this.namedGainMap.clear();
    if (!this.channelSplitter) return;

    inputs.forEach((input) => {
      if (input.busType !== 'input' || !this.channelSplitter) return;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      const gain = ctx.createGain();
      const rawGain = input.gain ?? 1.0;
      const safeGain = (typeof rawGain === 'number' && isFinite(rawGain)) ? rawGain : 1.0;
      gain.gain.value = input.isMuted ? 0 : safeGain;

      const ch = input.channel ?? 1;
      let targetOutputIndex = 0;
      if (ch > 0 && ch <= 32) {
        targetOutputIndex = ch - 1;
      } else if (ch > 100) {
        targetOutputIndex = Math.floor(ch / 100) - 1;
      }

      try {
        this.channelSplitter.connect(gain, targetOutputIndex);
        gain.connect(analyser);
        this.namedAnalyserMap.set(input.id, analyser);
        this.namedGainMap.set(input.id, gain);
      } catch (e) {
        console.warn(`Could not connect bus ${input.name} to channel output ${targetOutputIndex}:`, e);
      }
    });
  }

  public getChannelLevel(channelNum: number): number {
    const analyser = this.channelAnalysers.get(channelNum);
    if (!analyser) return 0;
    return this.readAnalyserLevel(analyser);
  }

  public getNamedBusLevel(busId: string, fallbackChannelNum: number): number {
    const analyser = this.namedAnalyserMap.get(busId);
    if (analyser) {
      return this.readAnalyserLevel(analyser);
    }
    return this.getChannelLevel(fallbackChannelNum);
  }

  private readAnalyserLevel(analyser: AnalyserNode): number {
    const binCount = analyser.frequencyBinCount || 32;
    if (this.sharedAnalyserBuffer.length !== binCount) {
      this.sharedAnalyserBuffer = new Uint8Array(binCount);
    }
    const data = this.sharedAnalyserBuffer;
    analyser.getByteFrequencyData(data as any);
    let sum = 0;
    let maxVal = 0;
    for (let i = 0; i < data.length; i++) {
      const v = data[i];
      sum += v;
      if (v > maxVal) maxVal = v;
    }
    if (maxVal === 0) return 0;
    const maxNorm = maxVal / 255;
    const avgNorm = (sum / data.length) / 255;
    return Math.min(1.0, (maxNorm * 0.75 + avgNorm * 0.25) * 1.8);
  }

  public updateMonitoring(
    ctx: AudioContext,
    masterGainNode: GainNode,
    nodes: SpaceNode[],
    _connections: NodeConnection[],
    isNodeConnectedToOutput: (nodeId: string) => boolean
  ) {
    if (!this.channelSplitter) return;

    // All audio input signals strictly pass through the Input Strip node via the graph topology.
    // Non-strip nodes cannot directly hook into the raw hardware splitter.
    this.activeMonitorGains.forEach((gain, id) => {
      try {
        gain.disconnect();
      } catch {
        // ignore
      }
      this.activeMonitorGains.delete(id);
    });
  }

  public cleanup() {
    this.activeMonitorGains.forEach((g) => {
      try {
        g.disconnect();
      } catch {
        // ignore
      }
    });
    this.activeMonitorGains.clear();
    this.namedAnalyserMap.clear();
    this.namedGainMap.clear();
    this.channelAnalysers.clear();
    this.channelSplitter = null;
  }
}
