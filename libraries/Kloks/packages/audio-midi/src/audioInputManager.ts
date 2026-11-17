/**
 * Pro-Audio Hardware Input/Output Manager (Named Bus Architecture)
 * Enforces raw pro-audio streams, channel splitting, output sink routing, and hot-plugging.
 */

export interface AudioDeviceDescriptor {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
  groupId: string;
}

export interface AudioBusConfig {
  name: string;
  targetDeviceId?: string;
  channelCount?: number;
  sampleRate?: number;
}

export interface AudioHardwareState {
  isInitialized: boolean;
  activeDeviceId: string | null;
  channelCount: number;
  availableDevices: AudioDeviceDescriptor[];
  sampleRate: number;
  state: AudioContextState;
}

export type AudioStateListener = (state: AudioHardwareState) => void;

export class AudioInputManager {
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private channelSplitter: ChannelSplitterNode | null = null;
  private namedBuses: Map<string, AudioNode> = new Map();
  private listeners: Set<AudioStateListener> = new Set();
  private availableDevices: AudioDeviceDescriptor[] = [];
  private activeDeviceId: string | null = null;
  private isDeviceChangeBound = false;

  constructor() {
    this.handleDeviceChange = this.handleDeviceChange.bind(this);
  }

  /**
   * Initializes audio hardware. MUST be gated behind explicit user gesture.
   */
  public async initialize(config: AudioBusConfig = { name: 'master-in' }): Promise<void> {
    this.assertIframePermissions();

    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioContextClass({
          latencyHint: 'interactive',
          sampleRate: config.sampleRate
        });
      }

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      await this.connectAudioStream(config);
      await this.refreshDeviceList();

      if (!this.isDeviceChangeBound && navigator.mediaDevices) {
        navigator.mediaDevices.addEventListener('devicechange', this.handleDeviceChange);
        this.isDeviceChangeBound = true;
      }

      this.notifyListeners();
    } catch (err) {
      this.handleAudioError(err);
      throw err;
    }
  }

  /**
   * Connects raw pro-audio input stream strictly disabling consumer audio processing.
   */
  public async connectAudioStream(config: AudioBusConfig): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('navigator.mediaDevices.getUserMedia is unsupported in this environment.');
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
    }

    // Strict pro-audio constraints: echoCancellation, noiseSuppression, autoGainControl MUST be false
    const constraints: MediaStreamConstraints = {
      audio: {
        deviceId: config.targetDeviceId ? { exact: config.targetDeviceId } : undefined,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: config.channelCount ?? 2
      },
      video: false
    };

    this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    this.activeDeviceId = config.targetDeviceId ?? 'default';

    if (!this.audioCtx) return;

    this.sourceNode = this.audioCtx.createMediaStreamSource(this.mediaStream);

    const trackSettings = this.mediaStream.getAudioTracks()[0]?.getSettings();
    const resolvedChannels = trackSettings?.channelCount ?? config.channelCount ?? 2;

    // Multi-channel interface support (channel splitter)
    this.channelSplitter = this.audioCtx.createChannelSplitter(resolvedChannels);
    this.sourceNode.connect(this.channelSplitter);

    this.namedBuses.set(config.name, this.channelSplitter);
  }

  /**
   * Accesses a discrete physical channel output from the channel splitter.
   */
  public getChannelOutput(channelIndex: number, busName = 'master-in'): AudioNode {
    const bus = this.namedBuses.get(busName) as ChannelSplitterNode | undefined;
    if (!bus) {
      throw new Error(`Audio bus "${busName}" not found or not initialized.`);
    }
    return {
      connect: (destinationNode: AudioNode) => bus.connect(destinationNode, channelIndex, 0)
    } as unknown as AudioNode;
  }

  /**
   * Routes audio element output to a specific device sinkId (monitors/headphones).
   */
  public async routeOutputSink(audioElement: HTMLMediaElement, deviceId: string): Promise<void> {
    const el = audioElement as HTMLMediaElement & { setSinkId?: (id: string) => Promise<void> };
    if (typeof el.setSinkId === 'function') {
      await el.setSinkId(deviceId);
    } else {
      console.warn('HTMLMediaElement.setSinkId is not supported in this browser.');
    }
  }

  /**
   * Enumerates audio input and output devices.
   */
  public async refreshDeviceList(): Promise<AudioDeviceDescriptor[]> {
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    const devices = await navigator.mediaDevices.enumerateDevices();
    this.availableDevices = devices
      .filter(d => d.kind === 'audioinput' || d.kind === 'audiooutput')
      .map(d => ({
        deviceId: d.deviceId,
        label: d.label || `${d.kind} (${d.deviceId.slice(0, 5)})`,
        kind: d.kind,
        groupId: d.groupId
      }));
    return this.availableDevices;
  }

  public getNamedBus(name: string): AudioNode | undefined {
    return this.namedBuses.get(name);
  }

  public getAudioContext(): AudioContext | null {
    return this.audioCtx;
  }

  public getState(): AudioHardwareState {
    return {
      isInitialized: this.audioCtx !== null && this.audioCtx.state === 'running',
      activeDeviceId: this.activeDeviceId,
      channelCount: this.channelSplitter?.numberOfOutputs ?? 0,
      availableDevices: [...this.availableDevices],
      sampleRate: this.audioCtx?.sampleRate ?? 44100,
      state: this.audioCtx?.state ?? 'suspended'
    };
  }

  public subscribe(listener: AudioStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  public async dispose(): Promise<void> {
    if (this.isDeviceChangeBound && navigator.mediaDevices) {
      navigator.mediaDevices.removeEventListener('devicechange', this.handleDeviceChange);
      this.isDeviceChangeBound = false;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      await this.audioCtx.close();
      this.audioCtx = null;
    }
    this.namedBuses.clear();
    this.listeners.clear();
  }

  private async handleDeviceChange(): Promise<void> {
    await this.refreshDeviceList();
    this.notifyListeners();
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(fn => fn(state));
  }

  private assertIframePermissions(): void {
    if (typeof window !== 'undefined' && window.self !== window.top) {
      // Running inside an iframe
      const docWithPolicy = typeof document !== 'undefined' ? (document as unknown as { featurePolicy?: { allowsFeature?: (feature: string) => boolean } }) : null;
      const isMicrophoneAllowed = docWithPolicy?.featurePolicy?.allowsFeature?.('microphone') ?? true;
      if (!isMicrophoneAllowed) {
        console.warn('Audio Input Warning: Microphone feature may be blocked by parent iframe permissions policy.');
      }
    }
  }

  private handleAudioError(err: unknown): void {
    const error = err as DOMException;
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      console.error(
        'Audio Permission Denied: If running in an iframe, ensure allow="microphone" is present, or open the application in a new tab.'
      );
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      console.error('Audio Hardware Error: Requested audio input device could not be found.');
    }
  }
}
