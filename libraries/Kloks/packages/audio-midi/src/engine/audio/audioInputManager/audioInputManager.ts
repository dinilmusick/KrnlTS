export * from './types';

import { NamedAudioBus, ConnectionsConfig, HardwareChannelInfo, SpaceNode, NodeConnection } from '@kloks/state-graph';
import { synthEngine } from '../synthEngine';
import { detectHardwareProfile, buildInputChannelList, buildOutputChannelList, HardwareProfileResult, OutputChannelInfo } from '../deviceProfiles';
import { multiChannelOutputRouter } from '../outputRouter';
import { topLevelIoRegistry } from '@kloks/state-graph';
import {
  AudioDeviceInfo,
  loadStoredConfig,
  saveStoredConfig,
  enumerateSystemAudioDevices,
} from '@kloks/state-graph';
import { acquireAudioInputStream, stopAudioMediaStream } from '@kloks/state-graph';
import { AudioBusDriver } from '@kloks/state-graph';
import { DEFAULT_NAMED_BUSSES } from './types';

export const DEFAULT_NAMED_INPUTS = DEFAULT_NAMED_BUSSES;

export class AudioInputManager {
  private audioCtx: AudioContext | null = null;
  public mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private busDriver = new AudioBusDriver();
  private isListening = false;
  private listeners: Set<() => void> = new Set();
  private initialized = false;

  public namedInputs: NamedAudioBus[] = [...DEFAULT_NAMED_BUSSES];
  public selectedDeviceId: string = 'default';
  public selectedOutputDeviceId: string = 'default';
  public hardwareChannelCount: number = 6;
  public detectedTrackChannelCount: number = 2;
  public isHardwareAutoDetected: boolean = false;
  public detectedInterfaceName: string = '';
  public activeProfile: HardwareProfileResult | null = null;
  public availableDevices: AudioDeviceInfo[] = [];
  public availableOutputDevices: AudioDeviceInfo[] = [];
  public lastError: string | null = null;

  constructor() {}

  /**
   * Initializes browser audio-device discovery on demand. Importing the module
   * must not touch browser globals or create an AudioContext.
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    this.loadConfig();
    this.initDeviceChangeListener();
    this.registerWithSynthEngine();
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return;
    try {
      await this.enumerateAudioDevices();
    } catch (err) {
      this.lastError = err instanceof Error ? err.message : String(err);
      console.warn('Initial enumerateAudioDevices failed:', err);
    }
  }

  private hasAudioContextSupport(): boolean {
    if (typeof window === 'undefined') return false;
    const browserWindow = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    return typeof browserWindow.AudioContext === 'function' || typeof browserWindow.webkitAudioContext === 'function';
  }

  private registerWithSynthEngine() {
    queueMicrotask(() => {
      try {
        if (typeof synthEngine !== 'undefined' && synthEngine?.registerAudioInputLevelProvider) {
          synthEngine.registerAudioInputLevelProvider((busId: string) => this.getInputLevel(busId));
        } else {
          setTimeout(() => {
            if (typeof synthEngine !== 'undefined' && synthEngine?.registerAudioInputLevelProvider) {
              synthEngine.registerAudioInputLevelProvider((busId: string) => this.getInputLevel(busId));
            }
          }, 0);
        }
      } catch (e) {
        setTimeout(() => {
          try {
            if (typeof synthEngine !== 'undefined' && synthEngine?.registerAudioInputLevelProvider) {
              synthEngine.registerAudioInputLevelProvider((busId: string) => this.getInputLevel(busId));
            }
          } catch (err) {}
        }, 0);
      }
    });
  }

  private initDeviceChangeListener() {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', async () => {
        await this.enumerateAudioDevices();
        this.notifyListeners();
      });
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public notifyListeners() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('Error in audioInputManager listener:', err);
      }
    });
  }

  public isConnected(): boolean {
    if (!this.isListening || !this.mediaStream) return false;
    const tracks = this.mediaStream.getAudioTracks();
    return tracks.length > 0 && tracks.some((t) => t.readyState === 'live');
  }

  public get isAudioActive(): boolean {
    return this.isConnected();
  }

  public loadConfig(): ConnectionsConfig {
    const config = typeof localStorage === 'undefined'
      ? {
          selectedAudioDeviceId: this.selectedDeviceId,
          selectedAudioOutputDeviceId: this.selectedOutputDeviceId,
          namedAudioInputs: this.namedInputs,
          selectedMidiDeviceId: null,
          midiConfigs: {},
        } as ConnectionsConfig
      : loadStoredConfig(this.namedInputs, this.selectedDeviceId, this.selectedOutputDeviceId);
    this.namedInputs = config.namedAudioInputs;
    this.selectedDeviceId = config.selectedAudioDeviceId;
    this.selectedOutputDeviceId = config.selectedAudioOutputDeviceId;
    return config;
  }

  public saveConfig(config?: Partial<ConnectionsConfig>) {
    if (config?.namedAudioInputs !== undefined) this.namedInputs = config.namedAudioInputs;
    if (config?.selectedAudioDeviceId !== undefined) this.selectedDeviceId = config.selectedAudioDeviceId;
    if (config?.selectedAudioOutputDeviceId !== undefined) this.selectedOutputDeviceId = config.selectedAudioOutputDeviceId;

    if (typeof localStorage === 'undefined') return;
    saveStoredConfig({
      selectedAudioDeviceId: this.selectedDeviceId,
      selectedAudioOutputDeviceId: this.selectedOutputDeviceId,
      namedAudioInputs: this.namedInputs,
      selectedMidiDeviceId: null,
      midiConfigs: {},
    });
  }

  public async enumerateAudioDevices(): Promise<{ inputs: AudioDeviceInfo[]; outputs: AudioDeviceInfo[] }> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      this.availableDevices = [];
      this.availableOutputDevices = [];
      return { inputs: [], outputs: [] };
    }
    const res = await enumerateSystemAudioDevices();
    this.availableDevices = res.inputs;
    this.availableOutputDevices = res.outputs;
    this.refreshHardwareProfile();
    return res;
  }

  public refreshHardwareProfile() {
    const inputDev = this.availableDevices.find((d) => d.deviceId === this.selectedDeviceId);
    const outputDev = this.availableOutputDevices.find((d) => d.deviceId === this.selectedOutputDeviceId);

    let trackSettings: MediaTrackSettings | undefined;
    let trackCaps: any;
    if (this.mediaStream) {
      const trk = this.mediaStream.getAudioTracks()[0];
      if (trk) {
        trackSettings = trk.getSettings();
        trackCaps = trk.getCapabilities ? trk.getCapabilities() : undefined;
      }
    }

    const ctx = this.hasAudioContextSupport() ? synthEngine.getContext() : null;
    const rawDestMax = ctx?.destination?.maxChannelCount;
    const destMax = (typeof rawDestMax === 'number' && isFinite(rawDestMax)) ? rawDestMax : 2;

    const profile = detectHardwareProfile(
      inputDev?.label || '',
      outputDev?.label || '',
      trackSettings,
      trackCaps,
      destMax
    );

    this.activeProfile = profile;
    this.detectedInterfaceName = profile.interfaceModelName;

    if (profile.isKnownInterface || (trackSettings?.channelCount && trackSettings.channelCount > 2)) {
      this.hardwareChannelCount = profile.detectedInputChannels;
      this.isHardwareAutoDetected = true;
      multiChannelOutputRouter.setMaxChannels(profile.detectedOutputChannels);
    }
  }

  public async selectNativeAudioOutput(): Promise<boolean> {
    if (typeof navigator === 'undefined') return false;
    const nav = navigator as any;
    if (nav.mediaDevices && typeof nav.mediaDevices.selectAudioOutput === 'function') {
      try {
        const device = await nav.mediaDevices.selectAudioOutput();
        if (device && device.deviceId) {
          await this.setOutputDevice(device.deviceId);
          await this.enumerateAudioDevices();
          this.notifyListeners();
          return true;
        }
      } catch (err) {
        console.warn('selectAudioOutput was cancelled or failed:', err);
      }
    }
    return false;
  }

  public getLastError(): string | null {
    return this.lastError;
  }

  public clearError(): void {
    this.lastError = null;
    this.notifyListeners();
  }

  public async initAudioStream(deviceId?: string): Promise<boolean> {
    const targetDevId = deviceId || this.selectedDeviceId;
    stopAudioMediaStream(this.mediaStream);

    try {
      this.lastError = null;
      const acquired = await acquireAudioInputStream(targetDevId);
      if (!acquired) {
        this.lastError = 'Audio hardware stream not available.';
        this.notifyListeners();
        return false;
      }

      this.mediaStream = acquired.mediaStream;
      this.detectedTrackChannelCount = acquired.detectedTrackChannelCount;
      this.selectedDeviceId = targetDevId;
      this.saveConfig({ selectedAudioDeviceId: targetDevId });

      this.audioCtx = synthEngine.getContext();
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      this.sourceNode = this.audioCtx.createMediaStreamSource(this.mediaStream);
      await this.enumerateAudioDevices();

      this.busDriver.setupSplitter(this.audioCtx, this.sourceNode, this.hardwareChannelCount);
      this.busDriver.setupNamedAnalysers(this.audioCtx, this.namedInputs);
      this.isListening = true;
      this.syncEndpointsToRegistry();

      topLevelIoRegistry.logTrace('AUDIO', 'DEVICE_DETECTED', {
        deviceId: this.selectedDeviceId,
        label: this.getActiveDeviceLabel(),
      });
      topLevelIoRegistry.logTrace('AUDIO', 'AUDIO_STREAM_OPEN', {
        channelCount: this.hardwareChannelCount,
        streamId: this.mediaStream.id,
      });

      this.lastError = null;
      this.notifyListeners();
      return true;
    } catch (err: any) {
      const errStr = String(err?.message || err?.name || err || '').toLowerCase();
      if (
        err?.name === 'NotAllowedError' ||
        err?.name === 'SecurityError' ||
        errStr.includes('permission denied') ||
        errStr.includes('not allowed') ||
        errStr.includes('blocked')
      ) {
        this.lastError = "Hardware access requires allow='microphone; midi' or new tab";
      } else {
        this.lastError = `Audio stream init failed: ${err?.message || 'Permission denied'}`;
      }
      console.warn('Audio hardware stream init failed:', this.lastError);
      this.notifyListeners();
      return false;
    }
  }

  public async reconnectStream(): Promise<void> {
    if (this.mediaStream && this.isListening) {
      try {
        if (this.sourceNode) {
          try {
            this.sourceNode.disconnect();
          } catch (e) {}
        }
        this.audioCtx = synthEngine.getContext();
        if (this.audioCtx.state === 'suspended') {
          await this.audioCtx.resume();
        }
        this.sourceNode = this.audioCtx.createMediaStreamSource(this.mediaStream);
        this.busDriver.setupSplitter(this.audioCtx, this.sourceNode, this.hardwareChannelCount);
        this.busDriver.setupNamedAnalysers(this.audioCtx, this.namedInputs);
      } catch (err) {
        console.warn('Error reconnecting stream to new AudioContext:', err);
      }
    }
  }

  public async setOutputDevice(deviceId: string): Promise<boolean> {
    this.selectedOutputDeviceId = deviceId;
    this.saveConfig({ selectedAudioOutputDeviceId: deviceId });
    await synthEngine.setOutputDevice(deviceId);
    this.refreshHardwareProfile();
    this.notifyListeners();
    return true;
  }

  public getAvailableInputChannels(): HardwareChannelInfo[] {
    return buildInputChannelList(this.hardwareChannelCount, this.activeProfile?.channelDescriptions);
  }

  public getAvailableOutputChannels(): OutputChannelInfo[] {
    const outChannels = this.activeProfile?.detectedOutputChannels || this.hardwareChannelCount;
    return buildOutputChannelList(outChannels, this.activeProfile?.outputDescriptions);
  }

  public getActiveDeviceLabel(): string {
    const dev = this.availableDevices.find((d) => d.deviceId === this.selectedDeviceId);
    return dev?.label || 'Default System Audio Interface';
  }

  public getActiveOutputDeviceLabel(): string {
    const dev = this.availableOutputDevices.find((d) => d.deviceId === this.selectedOutputDeviceId);
    return dev?.label || 'Default System Audio Output';
  }

  public getChannelLevel(channel: number): number {
    if (channel === 0) {
      return Math.max(this.busDriver.getChannelLevel(1), this.busDriver.getChannelLevel(2));
    }
    if (channel > 100) {
      const ch1 = Math.floor(channel / 100);
      const ch2 = channel % 100;
      return Math.max(this.busDriver.getChannelLevel(ch1), this.busDriver.getChannelLevel(ch2));
    }
    return this.busDriver.getChannelLevel(channel);
  }

  public syncEndpointsToRegistry(): void {
    const isLive = this.isConnected();
    this.namedInputs.forEach((bus) => {
      if (bus.busType === 'input') {
        const ep = topLevelIoRegistry.getOrCreateAudioEndpoint(bus.id, bus.name, bus.channel ?? 1);
        ep.gain = bus.gain ?? 1.0;
        ep.isMuted = !!bus.isMuted;
        ep.analyser = this.busDriver.namedAnalyserMap.get(bus.id) || null;
        ep.audioNode = this.busDriver.namedGainMap.get(bus.id) || null;
        ep.setConnected(isLive);
      }
    });
  }

  public getBusLevel(busId: string): number {
    return this.getInputLevel(busId);
  }

  public getInputLevel(inputId: string): number {
    const bus = this.namedInputs.find((b) => b.id === inputId);
    if (!bus || bus.isMuted) return 0;

    const ep = topLevelIoRegistry.getAudioEndpoint(inputId);
    if (ep) {
      ep.gain = bus.gain ?? 1.0;
      ep.isMuted = !!bus.isMuted;
      if (!ep.analyser) {
        ep.analyser = this.busDriver.namedAnalyserMap.get(inputId) || null;
      }
      if (!ep.audioNode) {
        ep.audioNode = this.busDriver.namedGainMap.get(inputId) || null;
      }
      ep.sampleFromAnalyser();

      if (ep.level > 0.005) {
        return Math.min(1.0, ep.level * (bus.gain ?? 1.0));
      }
      return 0;
    }

    const channelNum = bus.channel ?? 1;
    const rawLevel = this.busDriver.getNamedBusLevel(inputId, channelNum);
    if (rawLevel > 0.005) {
      return Math.min(1.0, rawLevel * (bus.gain ?? 1.0));
    }

    return 0;
  }

  public setNamedInputs(inputs: NamedAudioBus[]) {
    this.namedInputs = [...inputs];
    this.saveConfig();
    if (this.audioCtx) this.busDriver.setupNamedAnalysers(this.audioCtx, this.namedInputs);
    this.syncEndpointsToRegistry();
    this.notifyListeners();
  }

  public addNamedBus(bus: NamedAudioBus) {
    this.namedInputs = [...this.namedInputs, bus];
    this.saveConfig();
    if (bus.busType === 'input' && this.audioCtx) {
      this.busDriver.setupNamedAnalysers(this.audioCtx, this.namedInputs);
    }
    this.syncEndpointsToRegistry();
    this.notifyListeners();
  }

  public addNamedInput(input: NamedAudioBus) {
    this.addNamedBus(input);
  }

  public addInputBus(): NamedAudioBus {
    const existingInputs = this.namedInputs.filter((b) => b.busType === 'input');
    const nextIdx = existingInputs.length + 1;
    const availChannels = this.getAvailableInputChannels();
    const defaultCh = availChannels[(nextIdx - 1) % availChannels.length]?.id ?? 1;
    const colors = ['#f59e0b', '#06b6d4', '#10b981', '#ec4899', '#8b5cf6', '#3b82f6'];

    const newBus: NamedAudioBus = {
      id: `bus-in-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      busType: 'input',
      deviceId: this.selectedDeviceId,
      name: `Input Bus ${nextIdx}`,
      channel: defaultCh,
      gain: 1.0,
      isMuted: false,
      color: colors[(nextIdx - 1) % colors.length],
    };
    this.addNamedBus(newBus);
    return newBus;
  }

  public addOutputBus(): NamedAudioBus {
    const existingOutputs = this.namedInputs.filter((b) => b.busType === 'output');
    const nextIdx = existingOutputs.length + 1;
    const availChannels = this.getAvailableOutputChannels();
    const defaultOut = availChannels[(nextIdx - 1) % availChannels.length]?.id ?? 'Ch 1 / 2 (Main L/R)';
    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

    const newBus: NamedAudioBus = {
      id: `bus-out-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      busType: 'output',
      deviceId: this.selectedOutputDeviceId,
      name: `Output Bus ${nextIdx}`,
      outputChannels: defaultOut,
      gain: 1.0,
      isMuted: false,
      color: colors[(nextIdx - 1) % colors.length],
    };
    this.addNamedBus(newBus);
    return newBus;
  }

  public updateNamedInput(updated: NamedAudioBus) {
    this.namedInputs = this.namedInputs.map((i) => (i.id === updated.id ? { ...updated } : i));
    const gainNode = this.busDriver.namedGainMap.get(updated.id);
    if (gainNode) {
      gainNode.gain.value = updated.isMuted ? 0 : updated.gain;
    }
    this.saveConfig();
    this.notifyListeners();
  }

  public deleteNamedInput(id: string) {
    this.namedInputs = this.namedInputs.filter((i) => i.id !== id);
    this.saveConfig();
    if (this.audioCtx) this.busDriver.setupNamedAnalysers(this.audioCtx, this.namedInputs);
    this.notifyListeners();
  }

  public updateMonitoringConnections(nodes: SpaceNode[], connections: NodeConnection[]) {
    if (!this.audioCtx) return;
    this.busDriver.updateMonitoring(
      this.audioCtx,
      synthEngine.getMasterNode(),
      nodes,
      connections,
      (id) => synthEngine.isNodeConnectedToOutput(id)
    );
  }

  public stopStream() {
    stopAudioMediaStream(this.mediaStream);
    this.mediaStream = null;
    this.isListening = false;
    this.lastError = null;
    this.notifyListeners();
  }
}

export const audioInputManager = new AudioInputManager();