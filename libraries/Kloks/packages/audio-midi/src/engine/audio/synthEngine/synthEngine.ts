export * from './types';
import { AudioEngineConfig } from './types';

import { MidiNote, SynthPreset, SpaceNode, NodeConnection, ContainerNode, AudioTrackData, EffectNode, SamplerNode, INodeVisuals } from '@kloks/state-graph';
import { midiToFreq } from '@kloks/state-graph';
import { multiChannelOutputRouter } from '../outputRouter';
import { createCosmicImpulseBuffer, playSyntheticDrumVoice } from '../synthVoiceHelper';
import { BaseAudioGraphNode, createAudioGraphNode } from '../AudioGraphNodes';
import { getActiveEffectsForNode } from '@kloks/state-graph';
import { audioEffectsEntity } from '../entities/AudioEffects/AudioEffects.js';
import { audioInputManager } from '../audioInputManager';


const STORAGE_KEY_AUDIO_CONFIG = 'celestial_audio_engine_config';

const DEFAULT_AUDIO_CONFIG: AudioEngineConfig = {
  sampleRate: 0,
  bufferSize: 256,
};

export class SynthEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private delayGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  public analyser: AnalyserNode | null = null;
  public analyserL: AnalyserNode | null = null;
  public analyserR: AnalyserNode | null = null;
  private analyserBuffer: Uint8Array = new Uint8Array(256);
  private analyserBufferL: Uint8Array = new Uint8Array(256);
  private analyserBufferR: Uint8Array = new Uint8Array(256);
  public masterSplitter: ChannelSplitterNode | null = null;
  public nodeVisuals: INodeVisuals | null = null;
  private isInitialized = false;
  private nodeActiveUntilMap: Map<string, number> = new Map();

  private audioEngineConfig: AudioEngineConfig = this.loadAudioConfig();
  private graphNodeMap: Map<string, BaseAudioGraphNode> = new Map();

  private loadAudioConfig(): AudioEngineConfig {
    if (typeof localStorage === 'undefined') return { ...DEFAULT_AUDIO_CONFIG };
    try {
      const raw = localStorage.getItem(STORAGE_KEY_AUDIO_CONFIG);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          sampleRate: typeof parsed.sampleRate === 'number' ? parsed.sampleRate : DEFAULT_AUDIO_CONFIG.sampleRate,
          bufferSize: typeof parsed.bufferSize === 'number' ? parsed.bufferSize : DEFAULT_AUDIO_CONFIG.bufferSize,
        };
      }
    } catch (e) {
      console.warn('Failed to load audio engine config:', e);
    }
    return { ...DEFAULT_AUDIO_CONFIG };
  }

  public getAudioEngineConfig(): AudioEngineConfig {
    return { ...this.audioEngineConfig };
  }

  public async updateAudioSettings(newConfig: Partial<AudioEngineConfig>): Promise<void> {
    this.audioEngineConfig = { ...this.audioEngineConfig, ...newConfig };
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_AUDIO_CONFIG, JSON.stringify(this.audioEngineConfig));
      } catch (e) {}
    }

    await this.reinitContext();
  }

  public async reinitContext(): Promise<void> {
    if (this.ctx) {
      try {
        await this.ctx.close();
      } catch (e) {}
      this.ctx = null;
      this.isInitialized = false;
    }
    this.init(true);

    try {
      const { audioInputManager } = await import('../audioInputManager');
      await audioInputManager.reconnectStream();
    } catch (e) {}
  }

  public activeNodes: SpaceNode[] = [];
  public activeConnections: NodeConnection[] = [];
  public lastPlayedMidiNote: { note: number; velocity: number; timestamp: number } | null = null;

  public updateActiveGraph(nodes: SpaceNode[], connections: NodeConnection[]) {
    this.activeNodes = nodes;
    this.activeConnections = connections;

    // Sync OOP Audio Graph Node Instances
    this.graphNodeMap.clear();
    nodes.forEach((node) => {
      this.graphNodeMap.set(node.id, createAudioGraphNode(node));
    });

    // Prune obsolete effect processors from audioEffectsEntity
    const currentEffectIds = new Set(nodes.filter((n) => n.type === 'effect').map((n) => n.id));
    for (const effId of audioEffectsEntity.getActiveEffectIds()) {
      if (!currentEffectIds.has(effId)) {
        audioEffectsEntity.removeProcessor(effId);
      }
    }
  }

  /**
   * Evaluates reachability from a given nodeId to an active, unmuted AudioOutputNode.
   * Traverses activeConnections, effect/routing chains, and module boundaries.
   */
  public checkGraphReachabilityToOutput(nodeId: string): boolean {
    const startNode = this.activeNodes.find((n) => n.id === nodeId);
    if (!startNode || startNode.active === false) return false;

    // Output strip itself is the terminal authority
    if (startNode.id === 'output-strip-node' || startNode.type === 'output_strip') {
      return true;
    }

    // Check if an active output strip exists in the scene
    const outputStripNode = this.activeNodes.find(
      (n) => (n.id === 'output-strip-node' || n.type === 'output_strip') && n.active !== false
    );
    if (!outputStripNode) return false;

    // Breadth-first search traversing active connections to verify a physical path to output strip
    const visited = new Set<string>([nodeId]);
    const queue: string[] = [nodeId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      for (const conn of this.activeConnections) {
        if (conn.fromNodeId === currentId) {
          const nextId = conn.toNodeId;
          if (nextId === outputStripNode.id) {
            return true;
          }
          const nextNode = this.activeNodes.find((n) => n.id === nextId);
          if (nextNode && nextNode.active !== false && !visited.has(nextId)) {
            if (nextNode.id === 'output-strip-node' || nextNode.type === 'output_strip') {
              return true;
            }
            visited.add(nextId);
            queue.push(nextId);
          }
        }
      }
    }

    return false;
  }

  /**
   * Authority Check:
   * Queries the BaseAudioGraphNode instance. Structural rule enforces that no node
   * is allowed to emit sound to master unless authorized via an active connection to AudioOutputNode.
   */
  public isNodeConnectedToOutput(nodeId: string): boolean {
    let graphNode = this.graphNodeMap.get(nodeId);
    if (!graphNode) {
      const spaceNode = this.activeNodes.find((n) => n.id === nodeId);
      if (spaceNode) {
        graphNode = createAudioGraphNode(spaceNode);
        this.graphNodeMap.set(nodeId, graphNode);
      }
    }
    if (!graphNode) return false;

    return graphNode.isAuthorizedToEmit((id) => this.checkGraphReachabilityToOutput(id));
  }

  public init(forceRecreate = false) {
    if (!forceRecreate && this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }

    const browserWindow = typeof window === 'undefined'
      ? undefined
      : window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const AudioCtx = browserWindow?.AudioContext || browserWindow?.webkitAudioContext;
    if (typeof AudioCtx !== 'function') {
      throw new Error('Web Audio API is unavailable in this runtime.');
    }

    const options: AudioContextOptions = {};
    if (typeof this.audioEngineConfig.sampleRate === 'number' && isFinite(this.audioEngineConfig.sampleRate) && this.audioEngineConfig.sampleRate > 0) {
      options.sampleRate = this.audioEngineConfig.sampleRate;
    }

    if (typeof this.audioEngineConfig.bufferSize === 'number' && isFinite(this.audioEngineConfig.bufferSize) && this.audioEngineConfig.bufferSize > 0) {
      const targetRate = (typeof this.audioEngineConfig.sampleRate === 'number' && isFinite(this.audioEngineConfig.sampleRate) && this.audioEngineConfig.sampleRate > 0)
        ? this.audioEngineConfig.sampleRate
        : 44100;
      const hint = this.audioEngineConfig.bufferSize / targetRate;
      if (typeof hint === 'number' && isFinite(hint) && hint > 0) {
        options.latencyHint = hint;
      }
    }

    try {
      this.ctx = new AudioCtx(options);
    } catch (err) {
      console.warn('Could not instantiate AudioContext with custom options, falling back to defaults:', err);
      this.ctx = new AudioCtx();
    }

    this.masterGain = this.ctx.createGain();
    const curTime = isFinite(this.ctx.currentTime) ? this.ctx.currentTime : 0;
    this.masterGain.gain.setValueAtTime(0.8, curTime);

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;

    this.masterSplitter = this.ctx.createChannelSplitter(2);
    this.analyserL = this.ctx.createAnalyser();
    this.analyserL.fftSize = 256;
    this.analyserR = this.ctx.createAnalyser();
    this.analyserR.fftSize = 256;

    this.delayNode = this.ctx.createDelay();
    this.delayNode.delayTime.value = 0.35;
    this.delayFeedback = this.ctx.createGain();
    this.delayFeedback.gain.value = 0.45;
    this.delayGain = this.ctx.createGain();
    this.delayGain.gain.value = 0.3;

    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayNode.connect(this.delayGain);
    this.delayGain.connect(this.masterGain);

    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = createCosmicImpulseBuffer(this.ctx, 2.5, 2.0);
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.value = 0.35;
    this.reverbNode.connect(this.reverbGain);
    this.reverbGain.connect(this.masterGain);

    this.masterGain.connect(this.analyser);
    this.masterGain.connect(this.masterSplitter);
    this.masterSplitter.connect(this.analyserL, 0);
    this.masterSplitter.connect(this.analyserR, 1);

    multiChannelOutputRouter.init(this.ctx, 6);
    multiChannelOutputRouter.connectInput(this.masterGain);

    this.isInitialized = true;
    void audioInputManager.initialize();
  }

  public playAuditionTestPulse() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.3, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  public getAudioLevel(): number {
    if (!this.analyser) return 0;
    const binCount = this.analyser.frequencyBinCount || 128;
    if (this.analyserBuffer.length !== binCount) {
      this.analyserBuffer = new Uint8Array(binCount);
    }
    const data = this.analyserBuffer;
    this.analyser.getByteFrequencyData(data as any);
    let sum = 0;
    let max = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
      if (data[i] > max) max = data[i];
    }
    const avg = sum / data.length;
    const peak = max / 255;
    const norm = (avg / 128) * 0.4 + peak * 0.6;
    return Math.min(1.0, Math.max(0, norm));
  }

  public getStereoLevels(): { left: number; right: number } {
    if (!this.analyserL || !this.analyserR) {
      if (this.analyser) {
        const lvl = this.getAudioLevel();
        return { left: lvl, right: lvl };
      }
      return { left: 0, right: 0 };
    }

    const binCountL = this.analyserL.frequencyBinCount || 128;
    const binCountR = this.analyserR.frequencyBinCount || 128;
    if (this.analyserBufferL.length !== binCountL) {
      this.analyserBufferL = new Uint8Array(binCountL);
    }
    if (this.analyserBufferR.length !== binCountR) {
      this.analyserBufferR = new Uint8Array(binCountR);
    }

    const dataL = this.analyserBufferL;
    const dataR = this.analyserBufferR;

    this.analyserL.getByteFrequencyData(dataL as any);
    this.analyserR.getByteFrequencyData(dataR as any);

    let sumL = 0;
    let maxL = 0;
    for (let i = 0; i < dataL.length; i++) {
      sumL += dataL[i];
      if (dataL[i] > maxL) maxL = dataL[i];
    }
    const avgL = sumL / dataL.length;

    let sumR = 0;
    let maxR = 0;
    for (let i = 0; i < dataR.length; i++) {
      sumR += dataR[i];
      if (dataR[i] > maxR) maxR = dataR[i];
    }
    const avgR = sumR / dataR.length;

    // Hard clamp to 0 if under digital noise floor
    if (maxL < 2 && avgL < 0.5 && maxR < 2 && avgR < 0.5) {
      return { left: 0, right: 0 };
    }

    const peakL = maxL / 255;
    const peakR = maxR / 255;
    const normAvgL = avgL / 128;
    const normAvgR = avgR / 128;

    const leftVal = normAvgL * 0.35 + peakL * 0.65;
    const rightVal = normAvgR * 0.35 + peakR * 0.65;

    return {
      left: leftVal > 0.01 ? Math.min(1.0, leftVal) : 0,
      right: rightVal > 0.01 ? Math.min(1.0, rightVal) : 0,
    };
  }

  public isNodeActive(nodeId: string): boolean {
    if (!this.ctx) return false;
    const until = this.nodeActiveUntilMap.get(nodeId) || 0;
    return this.ctx.currentTime < until;
  }

  public markNodeActive(nodeId: string, durationSec: number = 0.5) {
    if (!this.ctx) this.init();
    const now = this.ctx?.currentTime || performance.now() / 1000;
    this.nodeActiveUntilMap.set(nodeId, now + durationSec);
  }

  private audioInputLevelProvider: ((busId: string) => number) | null = null;

  public registerAudioInputLevelProvider(provider: (busId: string) => number) {
    this.audioInputLevelProvider = provider;
  }

  public getWireSignalLevel(sourceNode: any, fromPort?: string): { left: number; right: number } {
    if (!sourceNode) return { left: 0, right: 0 };
    if (sourceNode.id === 'input-strip-node' || sourceNode.type === 'input_strip') {
      const inputs = sourceNode.mapIoConfig?.inputs || [];
      const matchedChannel = inputs.find((c: any) =>
        fromPort ? fromPort === `out-${c.id}` || fromPort === c.id : c.type === 'audio'
      );
      const busId = matchedChannel?.sourceId || 'bus-in-1';
      const lvl = this.audioInputLevelProvider
        ? this.audioInputLevelProvider(busId)
        : audioInputManager.getInputLevel(busId);
      return { left: lvl, right: matchedChannel?.audioFormat === 'mono' ? 0 : lvl };
    }
    if (sourceNode.type === 'output_strip') {
      return this.getStereoLevels();
    }
    // Return audio levels if this node is actively playing audio or connected to active sound source
    if (this.isNodeActive(sourceNode.id)) {
      return this.getStereoLevels();
    }
    return { left: 0, right: 0 };
  }

  public setOutputRouting(routingId: string) {
    this.init();
    multiChannelOutputRouter.applyRouting(routingId);
  }

  public async setOutputDevice(deviceId: string): Promise<boolean> {
    this.init();
    return multiChannelOutputRouter.setOutputSinkId(deviceId);
  }

  public setMasterVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      const safeVol = typeof vol === 'number' && isFinite(vol) ? Math.max(0, Math.min(1, vol)) : 0.8;
      const safeTime = isFinite(this.ctx.currentTime) ? this.ctx.currentTime : 0;
      this.masterGain.gain.setValueAtTime(safeVol, safeTime);
    }
  }

  public getContext(): AudioContext {
    this.init();
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx!;
  }

  public getMasterNode(): GainNode {
    this.init();
    return this.masterGain!;
  }

  public getGainAndPanForNode(nodeId: string): { volumeScale: number; panOffset: number; effectIds: string[] } {
    let volumeScale = 1.0;
    let panOffset = 0.0;
    const effectIds: string[] = [];

    const container = this.activeNodes.find((n) => n.id === nodeId);
    if (!container) return { volumeScale, panOffset, effectIds };

    const activeEffects = getActiveEffectsForNode(container, this.activeNodes, this.activeConnections);
    const gainEffects = activeEffects.filter((e) => e.effectType === 'gain' && e.active !== false);
    for (const eff of gainEffects) {
      if (eff.gainConfig?.gain !== undefined) {
        volumeScale *= eff.gainConfig.gain;
        effectIds.push(eff.id);
      }
    }

    const panEffects = activeEffects.filter((e) => e.effectType === 'pan' && e.active !== false);
    for (const eff of panEffects) {
      if (eff.panConfig?.pan !== undefined) {
        panOffset += eff.panConfig.pan;
        effectIds.push(eff.id);
      }
    }

    panOffset = Math.max(-1.0, Math.min(1.0, panOffset));
    return { volumeScale, panOffset, effectIds };
  }

  /**
   * Chains audio through all active DSP effect nodes (EQ, Compressor, Multiband, Limiter, Reverb, Delay, Saturation)
   * and fans out to any compressors/multiband compressors that have sidechain active with this node as source.
   */
  public routeAudioThroughNodeEffects(audioNode: AudioNode, nodeId?: string): AudioNode {
    if (!this.ctx || !nodeId) return audioNode;

    const container = this.activeNodes.find((n) => n.id === nodeId);
    if (!container) return audioNode;

    const activeEffects = getActiveEffectsForNode(container, this.activeNodes, this.activeConnections);
    const dspEffects = activeEffects.filter(
      (e) =>
        e.active !== false &&
        ['eq', 'compressor', 'multiband_compressor', 'limiter', 'reverb', 'delay', 'saturation'].includes(
          e.effectType
        )
    );

    let currentOut: AudioNode = audioNode;

    // Chain through DSP processors
    for (const eff of dspEffects) {
      const proc = audioEffectsEntity.getOrCreateProcessor(this.ctx, eff);
      currentOut.connect(proc.input);
      currentOut = proc.output;
      this.nodeVisuals?.triggerNodeFlash(eff.id);
    }

    // Dynamic Sidechain Tap:
    // If this node is connected to the sidechain_in socket of a compressor/multiband compressor
    // OR configured as sidechainSourceId in that compressor's settings, send audio to its sidechain input!
    for (const node of this.activeNodes) {
      if (node.type === 'effect') {
        const eff = node as EffectNode;
        if (
          (eff.effectType === 'compressor' || eff.effectType === 'multiband_compressor') &&
          eff.active !== false
        ) {
          const hasSidechainWire = this.activeConnections.some(
            (c) =>
              c.fromNodeId === nodeId &&
              c.toNodeId === eff.id &&
              (c.toPort === 'sidechain_in' || c.toSocketIndex === 1)
          );
          const hasConfigMatch =
            (eff.compressorConfig?.sidechainEnabled && eff.compressorConfig?.sidechainSourceId === nodeId) ||
            (eff.multibandCompressorConfig?.sidechainEnabled &&
              eff.multibandCompressorConfig?.sidechainSourceId === nodeId);

          if (hasSidechainWire || hasConfigMatch) {
            const proc = audioEffectsEntity.getOrCreateProcessor(this.ctx, eff);
            if (proc.sidechainInput) {
              audioNode.connect(proc.sidechainInput);
            }
          }
        }
      }
    }

    return currentOut;
  }

  public playNote(note: MidiNote, preset: SynthPreset, startTimeOffset = 0, containerId?: string) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    if (!containerId || !this.isNodeConnectedToOutput(containerId)) return;

    this.lastPlayedMidiNote = { note: note.note, velocity: note.velocity, timestamp: Date.now() };

    const triggeredNode = containerId
      ? this.activeNodes.find((n) => n.id === containerId)
      : undefined;

    if (triggeredNode && triggeredNode.type === 'sampler') {
      this.playSamplerNote(note, triggeredNode as SamplerNode, startTimeOffset);
      return;
    }

    const container = triggeredNode && triggeredNode.type === 'container'
      ? triggeredNode as ContainerNode
      : undefined;

    if (container && container.containerType === 'instrument') {
      this.playInstrumentNote(note, container, startTimeOffset);
      return;
    }

    const now = this.ctx.currentTime + startTimeOffset;
    const freq = midiToFreq(note.note);
    const duration = Math.max(0.05, note.duration * 0.45);
    const att = Math.max(0.005, preset.attack || 0.02);
    const dec = Math.max(0.05, preset.decay || 0.2);
    const sus = Math.max(0.01, preset.sustain || 0.5);
    const rel = Math.max(0.05, preset.release || 0.5);

    let volumeScale = 1.0;
    let panOffset = 0.0;
    if (containerId) {
      this.markNodeActive(containerId, duration + rel + 0.1);
      const recordEvent = (this.nodeVisuals as any)?.recordSocketSignalEvent;
      if (typeof recordEvent === 'function') {
        recordEvent(containerId, 'in_midi', { velocity: note.velocity, note: note.note });
        recordEvent(containerId, 'out-audio', { velocity: note.velocity, note: note.note });
        recordEvent(containerId, 'midi', { velocity: note.velocity, note: note.note });
        recordEvent(containerId, 'audio', { velocity: note.velocity, note: note.note });
      }
      const g = this.getGainAndPanForNode(containerId);
      volumeScale = g.volumeScale;
      panOffset = g.panOffset;
      g.effectIds.forEach((id) => this.nodeVisuals?.triggerNodeFlash(id));
    }

    if (preset.synthType === 'drums') {
      playSyntheticDrumVoice(this.ctx, this.masterGain, note.note, note.velocity * volumeScale, now);
      return;
    }

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const voiceGain = this.ctx.createGain();

    const isPlucked = preset.synthType === 'plucked';
    const isBass = preset.synthType === 'bass';
    const isPad = preset.synthType === 'pad';

    osc1.type = isBass ? 'triangle' : isPad ? 'sine' : isPlucked ? 'triangle' : 'sawtooth';
    osc2.type = isBass ? 'sine' : isPad ? 'triangle' : 'square';

    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 1.004, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(preset.cutoff || 2000, now);
    filter.Q.setValueAtTime(preset.resonance || 2, now);

    const peakGain = note.velocity * 0.4 * volumeScale;
    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.gain.exponentialRampToValueAtTime(peakGain, now + att);
    voiceGain.gain.exponentialRampToValueAtTime(peakGain * sus, now + att + dec);
    voiceGain.gain.setValueAtTime(peakGain * sus, now + duration);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + duration + rel);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(voiceGain);
    const routedVoice = this.routeAudioThroughNodeEffects(voiceGain, containerId);
    if (panOffset !== 0 && this.ctx.createStereoPanner) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, panOffset)), now);
      routedVoice.connect(panner);
      panner.connect(this.masterGain);
    } else {
      routedVoice.connect(this.masterGain);
    }

    if (this.delayNode && preset.delay > 0.05) {
      const sendGain = this.ctx.createGain();
      sendGain.gain.value = preset.delay * 0.7;
      voiceGain.connect(sendGain);
      sendGain.connect(this.delayNode);
    }
    if (this.reverbNode && preset.reverb > 0.05) {
      const revSend = this.ctx.createGain();
      revSend.gain.value = preset.reverb * 0.8;
      voiceGain.connect(revSend);
      revSend.connect(this.reverbNode);
    }

    osc1.start(now);
    osc2.start(now);
    const stopTime = now + duration + rel + 0.1;
    osc1.stop(stopTime);
    osc2.stop(stopTime);
  }

  private async playSamplerNote(note: MidiNote, container: SamplerNode, startTimeOffset = 0) {
    if (!this.ctx || !this.masterGain) return;
    if (!this.isNodeConnectedToOutput(container.id)) return;

    // 1. Find ALL connected Audio Containers connected to STORE IN / COMP IN socket
    const compConns = this.activeConnections.filter(
      (c) =>
        c.toNodeId === container.id &&
        (c.toPort === 'component_in' ||
          c.toPort === 'store_in' ||
          c.signalType === 'audio_packet' ||
          c.signalType === 'component' ||
          c.toSocketIndex === 0 ||
          c.toSocketIndex === 2)
    );

    const connectedContainers = compConns
      .map((c) => this.activeNodes.find((n) => n.id === c.fromNodeId && n.type === 'container' && (n as ContainerNode).containerType === 'audio') as ContainerNode | undefined)
      .filter((n): n is ContainerNode => !!n);

    // Requirement: If no container is connected, the node won't work
    if (connectedContainers.length === 0) return;

    let targetTrack: AudioTrackData | undefined = undefined;
    let centerNote = 60; // Default Middle C

    const zones = container.sampleZones || [];
    const matchingZone = zones.find(
      (z) => note.note >= z.minNote && note.note <= z.maxNote
    );

    if (matchingZone) {
      const matchingContainer = connectedContainers.find((c) => c.id === matchingZone.containerId);
      if (matchingContainer && matchingContainer.audioTrack) {
        targetTrack = matchingContainer.audioTrack;
        centerNote = matchingZone.centerNote ?? 60;
      } else if (matchingZone.sampleType) {
        targetTrack = {
          id: matchingZone.id,
          name: matchingZone.sampleName,
          sampleType: matchingZone.sampleType,
          durationBeats: 1,
          gain: 1.0,
          pan: 0,
          pitchShift: 0,
          filterCutoff: 20000,
          fadeInBeats: 0,
          fadeOutBeats: 0,
          trimStartBeats: 0,
          trimEndBeats: 1,
          isReversed: false,
        };
        centerNote = matchingZone.centerNote ?? 60;
      }
    } else {
      // Pick first connected container or map proportionally
      const fallbackContainer = connectedContainers[0];
      if (fallbackContainer && fallbackContainer.audioTrack) {
        targetTrack = fallbackContainer.audioTrack;
        centerNote = 60;
      }
    }

    if (!targetTrack) return;
    try {
      const { audioClipEngine } = await import('../audioClipEngine');
      const buffer = await audioClipEngine.getOrLoadBuffer(
        targetTrack.sampleType,
        targetTrack.customAudioUrl
      );
      if (!buffer) return;

      const now = this.ctx.currentTime + startTimeOffset;
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;

      // Extract optional start/end times from the selected/matching zone
      const startOffsetSec = Math.max(0, Math.min(buffer.duration, matchingZone?.startTime ?? 0));
      const endOffsetSec = Math.max(startOffsetSec + 0.01, Math.min(buffer.duration, matchingZone?.endTime ?? buffer.duration));
      const sampleDurationSec = endOffsetSec - startOffsetSec;

      // Pitch shifting derived relative to centerNote (original pitch of sample)
      const semitonesFromCenter = note.note - centerNote;
      const rate = Math.pow(2, semitonesFromCenter / 12);
      source.playbackRate.setValueAtTime(Math.max(0.05, Math.min(8.0, rate)), now);

      const playbackDurationSec = sampleDurationSec / rate;
      const noteCutoffSec = Math.min(playbackDurationSec, Math.max(0.1, (note.duration || 0.5) * 0.6));

      const { volumeScale, panOffset, effectIds } = this.getGainAndPanForNode(container.id);
      this.markNodeActive(container.id, noteCutoffSec + 0.1);
      effectIds.forEach((id) => this.nodeVisuals?.triggerNodeFlash(id));

      const voiceGain = this.ctx.createGain();
      const peakGain = (note.velocity || 0.85) * (targetTrack.gain || 1.0) * volumeScale * 0.75;

      voiceGain.gain.setValueAtTime(0.001, now);
      voiceGain.gain.exponentialRampToValueAtTime(Math.max(0.001, peakGain), now + 0.005);

      voiceGain.gain.setValueAtTime(peakGain, now + Math.max(0.01, noteCutoffSec - 0.02));
      voiceGain.gain.exponentialRampToValueAtTime(0.001, now + noteCutoffSec);

      source.connect(voiceGain);
      const routedSampler = this.routeAudioThroughNodeEffects(voiceGain, container.id);
      if (panOffset !== 0 && this.ctx.createStereoPanner) {
        const panner = this.ctx.createStereoPanner();
        panner.pan.setValueAtTime(Math.max(-1, Math.min(1, panOffset)), now);
        routedSampler.connect(panner);
        panner.connect(this.masterGain);
      } else {
        routedSampler.connect(this.masterGain);
      }

      source.start(now, startOffsetSec, sampleDurationSec);
      source.stop(now + noteCutoffSec);

      // Dispatch event so sampler UI can display active playing notes and animate playheads
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('sampler-note-triggered', {
          detail: {
            containerId: container.id,
            note: note.note,
            velocity: note.velocity || 0.85,
            duration: noteCutoffSec, // real playback time in seconds
            startTime: startOffsetSec,
            endTime: endOffsetSec,
            playbackRate: rate,
          },
        });
        window.dispatchEvent(event);
      }
    } catch (err) {
      console.warn('Sampler playback failed:', err);
    }
  }

  private playInstrumentNote(note: MidiNote, container: ContainerNode, startTimeOffset = 0) {
    if (!this.ctx || !this.masterGain) return;
    if (!this.isNodeConnectedToOutput(container.id)) return;

    const now = this.ctx.currentTime + startTimeOffset;
    const freq = midiToFreq(note.note);
    const duration = Math.max(0.1, note.duration * 0.55);
    const velocity = note.velocity || 0.85;
    const pluginId = container.selectedPluginId || 'grand_piano';

    const { volumeScale, panOffset, effectIds } = this.getGainAndPanForNode(container.id);
    this.markNodeActive(container.id, duration + 0.3);
    effectIds.forEach((id) => this.nodeVisuals?.triggerNodeFlash(id));

    const volumeCoeff = (container.volume !== undefined ? container.volume : 1.0) * volumeScale;

    const connectToOutput = (vGainNode: GainNode) => {
      const routedInstr = this.routeAudioThroughNodeEffects(vGainNode, container.id);
      if (panOffset !== 0 && this.ctx?.createStereoPanner) {
        const panner = this.ctx.createStereoPanner();
        panner.pan.setValueAtTime(Math.max(-1, Math.min(1, panOffset)), now);
        routedInstr.connect(panner);
        panner.connect(this.masterGain!);
      } else {
        routedInstr.connect(this.masterGain!);
      }
    };

    if (pluginId === 'grand_piano') {
      const carrier = this.ctx.createOscillator();
      const overtone1 = this.ctx.createOscillator();
      const overtone2 = this.ctx.createOscillator();
      const vGain = this.ctx.createGain();

      carrier.type = 'triangle';
      overtone1.type = 'sine';
      overtone2.type = 'sine';

      carrier.frequency.setValueAtTime(freq, now);
      overtone1.frequency.setValueAtTime(freq * 2.0, now);
      overtone2.frequency.setValueAtTime(freq * 3.0, now);

      const peak = velocity * volumeCoeff * 0.45;
      vGain.gain.setValueAtTime(0.001, now);
      vGain.gain.linearRampToValueAtTime(peak, now + 0.004);
      vGain.gain.exponentialRampToValueAtTime(peak * 0.4, now + 0.12);
      vGain.gain.exponentialRampToValueAtTime(peak * 0.05, now + duration);
      vGain.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.2);

      carrier.connect(vGain);
      overtone1.connect(vGain);
      overtone2.connect(vGain);
      connectToOutput(vGain);

      if (this.reverbNode) {
        const pianoHall = this.ctx.createGain();
        pianoHall.gain.value = 0.5;
        vGain.connect(pianoHall);
        pianoHall.connect(this.reverbNode);
      }

      carrier.start(now);
      overtone1.start(now);
      overtone2.start(now);

      carrier.stop(now + duration + 0.25);
      overtone1.stop(now + duration + 0.25);
      overtone2.stop(now + duration + 0.25);

    } else if (pluginId === 'juno_pad') {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      const vGain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      lfo.type = 'sine';

      osc1.frequency.setValueAtTime(freq * 0.996, now);
      osc2.frequency.setValueAtTime(freq * 1.004, now);

      lfo.frequency.setValueAtTime(4.8, now);
      lfoGain.gain.setValueAtTime(1.8, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.exponentialRampToValueAtTime(1800, now + 0.8);
      filter.frequency.exponentialRampToValueAtTime(1200, now + duration);
      filter.Q.setValueAtTime(4, now);

      const peak = velocity * volumeCoeff * 0.25;
      vGain.gain.setValueAtTime(0.001, now);
      vGain.gain.linearRampToValueAtTime(peak, now + 0.4);
      vGain.gain.setValueAtTime(peak, now + duration);
      vGain.gain.exponentialRampToValueAtTime(0.001, now + duration + 1.2);

      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(vGain);
      connectToOutput(vGain);

      if (this.reverbNode) {
        const revSend = this.ctx.createGain();
        revSend.gain.value = 0.65;
        vGain.connect(revSend);
        revSend.connect(this.reverbNode);
      }
      if (this.delayNode) {
        const delSend = this.ctx.createGain();
        delSend.gain.value = 0.45;
        vGain.connect(delSend);
        delSend.connect(this.delayNode);
      }

      lfo.start(now);
      osc1.start(now);
      osc2.start(now);

      lfo.stop(now + duration + 1.3);
      osc1.stop(now + duration + 1.3);
      osc2.stop(now + duration + 1.3);

    } else if (pluginId === 'moog_bass') {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const subOsc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const vGain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      subOsc.type = 'square';

      osc1.frequency.setValueAtTime(freq * 0.991, now);
      osc2.frequency.setValueAtTime(freq * 1.009, now);
      subOsc.frequency.setValueAtTime(freq * 0.5, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2800, now);
      filter.frequency.exponentialRampToValueAtTime(250, now + 0.14);
      filter.Q.setValueAtTime(6.0, now);

      const peak = velocity * volumeCoeff * 0.38;
      vGain.gain.setValueAtTime(0.001, now);
      vGain.gain.linearRampToValueAtTime(peak, now + 0.005);
      vGain.gain.exponentialRampToValueAtTime(peak * 0.6, now + 0.15);
      vGain.gain.setValueAtTime(peak * 0.6, now + duration);
      vGain.gain.exponentialRampToValueAtTime(0.001, now + duration + 0.1);

      osc1.connect(filter);
      osc2.connect(filter);
      subOsc.connect(filter);
      filter.connect(vGain);
      connectToOutput(vGain);

      osc1.start(now);
      osc2.start(now);
      subOsc.start(now);

      osc1.stop(now + duration + 0.15);
      osc2.stop(now + duration + 0.15);
      subOsc.stop(now + duration + 0.15);

    } else if (pluginId === 'dx7_tines') {
      const carrier = this.ctx.createOscillator();
      const modulator = this.ctx.createOscillator();
      const modGain = this.ctx.createGain();
      const vGain = this.ctx.createGain();

      carrier.type = 'sine';
      modulator.type = 'sine';

      carrier.frequency.setValueAtTime(freq, now);
      modulator.frequency.setValueAtTime(freq * 5.0, now);

      modGain.gain.setValueAtTime(2500, now);
      modGain.gain.exponentialRampToValueAtTime(10, now + 0.08);

      const peak = velocity * volumeCoeff * 0.45;
      vGain.gain.setValueAtTime(0.001, now);
      vGain.gain.linearRampToValueAtTime(peak, now + 0.006);
      vGain.gain.exponentialRampToValueAtTime(peak * 0.2, now + 0.6);
      vGain.gain.exponentialRampToValueAtTime(0.001, now + duration + 0.15);

      modulator.connect(modGain);
      modGain.connect(carrier.frequency);

      carrier.connect(vGain);
      connectToOutput(vGain);

      if (this.reverbNode) {
        const revSend = this.ctx.createGain();
        revSend.gain.value = 0.45;
        vGain.connect(revSend);
        revSend.connect(this.reverbNode);
      }

      modulator.start(now);
      carrier.start(now);

      modulator.stop(now + duration + 0.2);
      carrier.stop(now + duration + 0.2);

    } else if (pluginId === 'orchestral_strings') {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const osc3 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      const vGain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc3.type = 'sawtooth';
      lfo.type = 'sine';

      lfo.frequency.setValueAtTime(5.5, now);
      lfoGain.gain.setValueAtTime(2.2, now);

      osc1.frequency.setValueAtTime(freq * 0.995, now);
      osc2.frequency.setValueAtTime(freq * 1.005, now);
      osc3.frequency.setValueAtTime(freq * 2.0 * 1.001, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(1.0, now);

      const peak = velocity * volumeCoeff * 0.22;
      vGain.gain.setValueAtTime(0.001, now);
      vGain.gain.linearRampToValueAtTime(peak, now + 0.25);
      vGain.gain.setValueAtTime(peak, now + duration);
      vGain.gain.exponentialRampToValueAtTime(0.001, now + duration + 0.7);

      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);

      osc1.connect(filter);
      osc2.connect(filter);
      osc3.connect(filter);
      filter.connect(vGain);
      connectToOutput(vGain);

      if (this.reverbNode) {
        const stringsHall = this.ctx.createGain();
        stringsHall.gain.value = 0.6;
        vGain.connect(stringsHall);
        stringsHall.connect(this.reverbNode);
      }

      lfo.start(now);
      osc1.start(now);
      osc2.start(now);
      osc3.start(now);

      lfo.stop(now + duration + 0.85);
      osc1.stop(now + duration + 0.85);
      osc2.stop(now + duration + 0.85);
      osc3.stop(now + duration + 0.85);

    } else if (pluginId === 'cyber_lead') {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const vGain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';

      osc1.frequency.setValueAtTime(freq * 0.994, now);
      osc2.frequency.setValueAtTime(freq * 1.006, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, now);
      filter.Q.setValueAtTime(4, now);

      const peak = velocity * volumeCoeff * 0.28;
      vGain.gain.setValueAtTime(0.001, now);
      vGain.gain.linearRampToValueAtTime(peak, now + 0.02);
      vGain.gain.exponentialRampToValueAtTime(peak * 0.7, now + 0.25);
      vGain.gain.setValueAtTime(peak * 0.7, now + duration);
      vGain.gain.exponentialRampToValueAtTime(0.001, now + duration + 0.35);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(vGain);
      connectToOutput(vGain);

      if (this.delayNode) {
        const delaySend = this.ctx.createGain();
        delaySend.gain.value = 0.55;
        vGain.connect(delaySend);
        delaySend.connect(this.delayNode);
      }

      osc1.start(now);
      osc2.start(now);

      osc1.stop(now + duration + 0.4);
      osc2.stop(now + duration + 0.4);
    }
  }
}

export const synthEngine = new SynthEngine();