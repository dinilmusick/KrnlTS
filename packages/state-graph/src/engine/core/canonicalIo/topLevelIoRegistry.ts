import { DebugTraceEntry, MidiEventPayload } from "./types";
import { CanonicalAudioInputEndpoint } from "./CanonicalAudioInputEndpoint";
import { CanonicalMidiInputEndpoint } from "./CanonicalMidiInputEndpoint";

export * from "./types";
export { CanonicalAudioInputEndpoint } from "./CanonicalAudioInputEndpoint";
export { CanonicalMidiInputEndpoint } from "./CanonicalMidiInputEndpoint";

export class TopLevelIoRegistry {
  private audioEndpoints: Map<string, CanonicalAudioInputEndpoint> = new Map();
  private midiEndpoints: Map<string, CanonicalMidiInputEndpoint> = new Map();
  private registryListeners: Set<() => void> = new Set();
  public debugTraceLog: DebugTraceEntry[] = [];

  constructor() {
    this.initDefaultEndpoints();
  }

  private initDefaultEndpoints(): void {
    // Default hardware physical audio endpoints
    this.getOrCreateAudioEndpoint('bus-in-1', 'Physical Audio In 1', 1);
    this.getOrCreateAudioEndpoint('bus-in-2', 'Physical Audio In 2', 2);

    // Default physical MIDI endpoints
    this.getOrCreateMidiEndpoint('midi-profile-1', 'Main Stage Synth / Keyboard');
    this.getOrCreateMidiEndpoint('midi-profile-2', 'External MIDI Controller / Pads');
    this.getOrCreateMidiEndpoint('virtual-keyboard', 'Virtual MIDI Keyboard');
    this.getOrCreateMidiEndpoint('all', 'All Physical MIDI Inputs (Omni)');
  }

  public subscribeRegistry(fn: () => void): () => void {
    this.registryListeners.add(fn);
    return () => this.registryListeners.delete(fn);
  }

  public notifyRegistry(): void {
    this.registryListeners.forEach((fn) => fn());
  }

  public getOrCreateAudioEndpoint(id: string, name: string, channel = 1): CanonicalAudioInputEndpoint {
    let ep = this.audioEndpoints.get(id);
    if (!ep) {
      ep = new CanonicalAudioInputEndpoint(id, name, channel);
      this.audioEndpoints.set(id, ep);
      this.notifyRegistry();
    }
    return ep;
  }

  public getAudioEndpoint(id: string): CanonicalAudioInputEndpoint | undefined {
    return this.audioEndpoints.get(id);
  }

  public getAllAudioEndpoints(): CanonicalAudioInputEndpoint[] {
    return Array.from(this.audioEndpoints.values());
  }

  public getOrCreateMidiEndpoint(id: string, name: string): CanonicalMidiInputEndpoint {
    let ep = this.midiEndpoints.get(id);
    if (!ep) {
      ep = new CanonicalMidiInputEndpoint(id, name);
      this.midiEndpoints.set(id, ep);
      this.notifyRegistry();
    }
    return ep;
  }

  public getMidiEndpoint(id: string): CanonicalMidiInputEndpoint | undefined {
    return this.midiEndpoints.get(id);
  }

  public getAllMidiEndpoints(): CanonicalMidiInputEndpoint[] {
    return Array.from(this.midiEndpoints.values());
  }

  /**
   * Dispatches a canonical MIDI event from device adapter into matching endpoints.
   */
  public dispatchMidiEvent(evt: MidiEventPayload): void {
    const devId = evt.deviceId || 'virtual-keyboard';

    // 1. Specific endpoint matching device ID
    const directEp = this.midiEndpoints.get(devId);
    if (directEp) {
      directEp.handleMidiEvent(evt);
    }

    // 2. Named profiles matching this device ID or 'all'
    this.midiEndpoints.forEach((ep) => {
      if (ep.id === devId) return; // already handled
      if (ep.id === 'all' || ep.id.startsWith('midi-profile-')) {
        ep.handleMidiEvent(evt);
      }
    });

    this.logTrace('MIDI', 'EVENT_PARSED', {
      type: evt.type,
      note: evt.note,
      noteName: evt.noteName,
      velocity: evt.velocity,
      deviceId: devId,
    });
  }

  public logTrace(category: 'AUDIO' | 'MIDI', stage: string, data: Record<string, any>, assertionsPassed = true): void {
    const entry: DebugTraceEntry = {
      category,
      stage,
      timestamp: performance.now ? performance.now() : Date.now(),
      data,
      assertionsPassed,
    };
    this.debugTraceLog.push(entry);
    if (this.debugTraceLog.length > 500) {
      this.debugTraceLog.shift();
    }
  }

  public clearTraceLog(): void {
    this.debugTraceLog = [];
  }
}

export const topLevelIoRegistry = new TopLevelIoRegistry();