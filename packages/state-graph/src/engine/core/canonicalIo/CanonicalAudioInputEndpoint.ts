import { CanonicalAudioEndpointState, calculateAudioMeterLevel } from "./types";

export class CanonicalAudioInputEndpoint {
  public id: string;
  public name: string;
  public channel: number;
  public gain: number = 1.0;
  public isMuted: boolean = false;
  public connected: boolean = true;
  public level: number = 0;
  public peak: number = 0;
  public rms: number = 0;
  public sampleCount: number = 0;
  public readonly noiseFloor: number = 0.0;
  public audioNode: AudioNode | null = null;
  public analyser: AnalyserNode | null = null;
  private cachedTimeData: Float32Array | null = null;
  private cachedFreqData: Uint8Array | null = null;

  private listeners: Set<(state: CanonicalAudioEndpointState) => void> = new Set();

  constructor(id: string, name: string, channel = 1) {
    this.id = id;
    this.name = name;
    this.channel = channel;
  }

  public subscribe(fn: (state: CanonicalAudioEndpointState) => void): () => void {
    this.listeners.add(fn);
    fn(this.getState());
    return () => this.listeners.delete(fn);
  }

  public getState(): CanonicalAudioEndpointState {
    return {
      id: this.id,
      name: this.name,
      channel: this.channel,
      gain: this.gain,
      isMuted: this.isMuted,
      connected: this.connected,
      level: this.level,
      peak: this.peak,
      rms: this.rms,
      sampleCount: this.sampleCount,
      noiseFloor: this.noiseFloor,
    };
  }

  public processAudioBuffer(buffer: Float32Array): void {
    if (!this.connected || this.isMuted) {
      this.peak = 0;
      this.rms = 0;
      this.level = 0;
      this.sampleCount = buffer.length;
      this.notify();
      return;
    }

    this.sampleCount = buffer.length;
    if (this.sampleCount === 0) {
      this.peak = 0;
      this.rms = 0;
      this.level = this.noiseFloor;
      this.notify();
      return;
    }

    let peak = 0;
    let sumSq = 0;
    for (let i = 0; i < buffer.length; i++) {
      const abs = Math.abs(buffer[i]);
      if (abs > peak) peak = abs;
      sumSq += abs * abs;
    }
    const rms = Math.sqrt(sumSq / buffer.length);
    this.peak = peak;
    this.rms = rms;
    this.level = calculateAudioMeterLevel(peak, rms, this.gain);

    this.notify();
  }

  public sampleFromAnalyser(): void {
    if (!this.connected || this.isMuted) {
      this.level = 0;
      this.peak = 0;
      this.rms = 0;
      this.notify();
      return;
    }

    if (!this.analyser) {
      this.level = 0;
      return;
    }

    try {
      if (typeof this.analyser.getFloatTimeDomainData === 'function') {
        const fftSize = this.analyser.fftSize || 64;
        if (!this.cachedTimeData || this.cachedTimeData.length !== fftSize) {
          this.cachedTimeData = new Float32Array(fftSize);
        }
        this.analyser.getFloatTimeDomainData(this.cachedTimeData as any);
        this.processAudioBuffer(this.cachedTimeData);
      } else {
        const binCount = this.analyser.frequencyBinCount || 32;
        if (!this.cachedFreqData || this.cachedFreqData.length !== binCount) {
          this.cachedFreqData = new Uint8Array(binCount);
        }
        this.analyser.getByteFrequencyData(this.cachedFreqData as any);
        let maxVal = 0;
        let sum = 0;
        for (let i = 0; i < this.cachedFreqData.length; i++) {
          const v = this.cachedFreqData[i];
          if (v > maxVal) maxVal = v;
          sum += v;
        }
        this.sampleCount = this.cachedFreqData.length;
        if (maxVal === 0) {
          this.peak = 0;
          this.rms = 0;
          this.level = this.noiseFloor;
        } else {
          const maxNorm = maxVal / 255;
          const avgNorm = (sum / this.cachedFreqData.length) / 255;
          this.peak = maxNorm;
          this.rms = avgNorm;
          this.level = calculateAudioMeterLevel(maxNorm, avgNorm, this.gain);
        }
        this.notify();
      }
    } catch {
      this.level = this.noiseFloor;
      this.notify();
    }
  }

  public setConnected(connected: boolean): void {
    this.connected = connected;
    if (!connected) {
      this.level = 0;
      this.peak = 0;
      this.rms = 0;
    }
    this.notify();
  }

  public setGain(gain: number): void {
    this.gain = gain;
    this.level = calculateAudioMeterLevel(this.peak, this.rms, this.gain);
    this.notify();
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.level = 0;
    } else {
      this.level = calculateAudioMeterLevel(this.peak, this.rms, this.gain);
    }
    this.notify();
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((fn) => fn(state));
  }
}
