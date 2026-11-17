/**
 * Pro-MIDI Subsystem (Reactive Port Binding & Virtual Loopback)
 * Translates raw byte arrays into high-level MidiEventPayloads, handles hot-plugging and virtual emitting.
 */

export type MidiCommandType =
  | 'NOTE_ON'
  | 'NOTE_OFF'
  | 'CONTROL_CHANGE'
  | 'PITCH_BEND'
  | 'PROGRAM_CHANGE'
  | 'CHANNEL_PRESSURE'
  | 'POLY_PRESSURE'
  | 'CLOCK'
  | 'START'
  | 'STOP'
  | 'CONTINUE'
  | 'SYSEX'
  | 'UNKNOWN';

export interface MidiEventPayload {
  command: MidiCommandType;
  channel: number;       // 1 - 16 (0 for system messages)
  note?: number;          // 0 - 127
  velocity?: number;      // 0 - 127
  controller?: number;    // 0 - 127
  value?: number;         // 0 - 127 (or 0 - 16383 for pitch bend)
  rawBytes: Uint8Array;
  timestamp: number;
  sourceId: string;       // Hardware port ID or 'virtual'
  sourceName: string;
}

export interface MidiPortDescriptor {
  id: string;
  name: string;
  manufacturer?: string;
  type: 'input' | 'output';
  state: string;
  connection: string;
}

export interface MidiSubsystemState {
  isSupported: boolean;
  isInitialized: boolean;
  inputs: MidiPortDescriptor[];
  outputs: MidiPortDescriptor[];
  sysexEnabled: boolean;
}

export type MidiEventListener = (event: MidiEventPayload) => void;
export type MidiStateListener = (state: MidiSubsystemState) => void;

export class MidiManager {
  private midiAccess: MIDIAccess | null = null;
  private eventListeners: Set<MidiEventListener> = new Set();
  private stateListeners: Set<MidiStateListener> = new Set();
  private boundInputs: Set<string> = new Set();
  private isInitialized = false;

  constructor() {
    this.handleStateChange = this.handleStateChange.bind(this);
  }

  /**
   * Initializes Web MIDI access. MUST be gated behind explicit user gesture.
   */
  public async initialize(options: { sysex?: boolean; software?: boolean } = { sysex: true, software: true }): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
      throw new Error('Web MIDI API is not supported in this environment.');
    }

    this.assertIframePermissions();

    try {
      // Always request access supporting virtual cables and SysEx
      this.midiAccess = await navigator.requestMIDIAccess({
        sysex: options.sysex ?? true,
        software: options.software ?? true
      });

      this.isInitialized = true;

      // Bind to existing input ports
      this.bindExistingPorts();

      // Reactive port binding: hook onstatechange to automatically bind hot-plugged devices
      this.midiAccess.onstatechange = this.handleStateChange;

      this.notifyState();
    } catch (err) {
      this.handleMidiError(err);
      throw err;
    }
  }

  /**
   * Reactive hot-plug port binding handler.
   */
  private handleStateChange(event: MIDIConnectionEvent): void {
    if (event.port && event.port.type === 'input' && event.port.state === 'connected') {
      this.bindMidiPort(event.port as MIDIInput);
    }
    this.notifyState();
  }

  /**
   * Binds all existing input ports upon initialization.
   */
  private bindExistingPorts(): void {
    if (!this.midiAccess) return;
    this.midiAccess.inputs.forEach((port) => {
      this.bindMidiPort(port);
    });
  }

  /**
   * Binds onmidimessage handler to a specific MIDIInput port.
   */
  public bindMidiPort(port: MIDIInput): void {
    if (this.boundInputs.has(port.id)) return;

    port.onmidimessage = (msgEvent: MIDIMessageEvent) => {
      if (!msgEvent.data) return;
      const payload = this.parseRawMidiBytes(msgEvent.data, port.id, port.name || 'MIDI Input', msgEvent.timeStamp);
      this.dispatchEvent(payload);
    };

    this.boundInputs.add(port.id);
    void port.open().catch((error) => this.handleMidiError(error));
  }

  /**
   * Opens a discovered physical MIDI input using the manager's canonical access instance.
   */
  public async connectInput(id: string): Promise<void> {
    if (!this.midiAccess) throw new Error('MIDI manager has not been initialized');
    const port = this.midiAccess.inputs.get(id);
    if (!port) throw new Error('MIDI input not found: ' + id);
    this.bindMidiPort(port);
    await port.open();
  }

  /** Opens a discovered physical MIDI output. */
  public async connectOutput(id: string): Promise<void> {
    if (!this.midiAccess) throw new Error('MIDI manager has not been initialized');
    const port = this.midiAccess.outputs.get(id);
    if (!port) throw new Error('MIDI output not found: ' + id);
    await port.open();
  }

  /** Sends a complete MIDI message through an already-discovered output port. */
  public sendRawMidiBytes(bytes: Uint8Array, outputId: string): void {
    if (!this.midiAccess) throw new Error('MIDI manager has not been initialized');
    const output = this.midiAccess.outputs.get(outputId);
    if (!output) throw new Error('MIDI output not found: ' + outputId);
    output.send(Array.from(bytes));
  }

  /** Releases an input subscription and closes its physical port. */
  public async disconnectInput(id: string): Promise<void> {
    const port = this.midiAccess?.inputs.get(id);
    if (!port) return;
    port.onmidimessage = null;
    this.boundInputs.delete(id);
    await port.close();
  }

  /** Closes an output port without claiming to remove the physical device. */
  public async disconnectOutput(id: string): Promise<void> {
    const port = this.midiAccess?.outputs.get(id);
    if (port) await port.close();
  }

  /**
   * Virtual MIDI Loopback: On-screen UI components (virtual keyboards, sequencers)
   * can trigger the exact same event streams as physical hardware.
   */
  public emitVirtualMidi(payload: Partial<MidiEventPayload> & { command: MidiCommandType }): void {
    const defaultRaw = this.synthesizeRawBytes(payload);
    const fullPayload: MidiEventPayload = {
      command: payload.command,
      channel: payload.channel ?? 1,
      note: payload.note,
      velocity: payload.velocity,
      controller: payload.controller,
      value: payload.value,
      rawBytes: payload.rawBytes ?? defaultRaw,
      timestamp: payload.timestamp ?? (typeof performance !== 'undefined' ? performance.now() : Date.now()),
      sourceId: payload.sourceId ?? 'virtual',
      sourceName: payload.sourceName ?? 'Virtual MIDI Controller'
    };

    this.dispatchEvent(fullPayload);
  }

  /**
   * Translates raw byte arrays into high-level MidiEventPayload.
   */
  public parseRawMidiBytes(
    bytes: Uint8Array,
    sourceId: string,
    sourceName: string,
    timestamp: number
  ): MidiEventPayload {
    const status = bytes[0];
    const commandNibble = status & 0xf0;
    const channel = (status & 0x0f) + 1;

    const b1 = bytes[1] ?? 0;
    const b2 = bytes[2] ?? 0;

    let command: MidiCommandType = 'UNKNOWN';
    let note: number | undefined;
    let velocity: number | undefined;
    let controller: number | undefined;
    let value: number | undefined;

    if (commandNibble === 0x90) {
      if (b2 === 0) {
        command = 'NOTE_OFF';
      } else {
        command = 'NOTE_ON';
      }
      note = b1;
      velocity = b2;
    } else if (commandNibble === 0x80) {
      command = 'NOTE_OFF';
      note = b1;
      velocity = b2;
    } else if (commandNibble === 0xb0) {
      command = 'CONTROL_CHANGE';
      controller = b1;
      value = b2;
    } else if (commandNibble === 0xe0) {
      command = 'PITCH_BEND';
      value = b1 | (b2 << 7); // 14-bit value: 0 - 16383 (8192 center)
    } else if (commandNibble === 0xc0) {
      command = 'PROGRAM_CHANGE';
      value = b1;
    } else if (commandNibble === 0xd0) {
      command = 'CHANNEL_PRESSURE';
      value = b1;
    } else if (status === 0xf0) {
      command = 'SYSEX';
    } else if (status === 0xf8) {
      command = 'CLOCK';
    } else if (status === 0xfa) {
      command = 'START';
    } else if (status === 0xfb) {
      command = 'CONTINUE';
    } else if (status === 0xfc) {
      command = 'STOP';
    }

    return {
      command,
      channel: status >= 0xf0 ? 0 : channel,
      note,
      velocity,
      controller,
      value,
      rawBytes: bytes,
      timestamp,
      sourceId,
      sourceName
    };
  }

  private synthesizeRawBytes(payload: Partial<MidiEventPayload> & { command: MidiCommandType }): Uint8Array {
    const ch = Math.max(0, Math.min(15, (payload.channel ?? 1) - 1));
    switch (payload.command) {
      case 'NOTE_ON':
        return new Uint8Array([0x90 | ch, payload.note ?? 60, payload.velocity ?? 100]);
      case 'NOTE_OFF':
        return new Uint8Array([0x80 | ch, payload.note ?? 60, payload.velocity ?? 0]);
      case 'CONTROL_CHANGE':
        return new Uint8Array([0xb0 | ch, payload.controller ?? 1, payload.value ?? 0]);
      case 'PITCH_BEND': {
        const val = payload.value ?? 8192;
        return new Uint8Array([0xe0 | ch, val & 0x7f, (val >> 7) & 0x7f]);
      }
      case 'PROGRAM_CHANGE':
        return new Uint8Array([0xc0 | ch, payload.value ?? 0]);
      default:
        return new Uint8Array([0x90 | ch, 60, 100]);
    }
  }

  public subscribeEvents(listener: MidiEventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  public subscribeState(listener: MidiStateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.getState());
    return () => this.stateListeners.delete(listener);
  }

  public getState(): MidiSubsystemState {
    const inputs: MidiPortDescriptor[] = [];
    const outputs: MidiPortDescriptor[] = [];

    if (this.midiAccess) {
      this.midiAccess.inputs.forEach((port) => {
        inputs.push({
          id: port.id,
          name: port.name || 'Unnamed Input',
          manufacturer: port.manufacturer ?? undefined,
          type: 'input',
          state: port.state,
          connection: port.connection
        });
      });

      this.midiAccess.outputs.forEach((port) => {
        outputs.push({
          id: port.id,
          name: port.name || 'Unnamed Output',
          manufacturer: port.manufacturer ?? undefined,
          type: 'output',
          state: port.state,
          connection: port.connection
        });
      });
    }

    return {
      isSupported: typeof navigator !== 'undefined' && !!navigator.requestMIDIAccess,
      isInitialized: this.isInitialized,
      inputs,
      outputs,
      sysexEnabled: this.midiAccess?.sysexEnabled ?? false
    };
  }

  public async dispose(): Promise<void> {
    const access = this.midiAccess;
    this.midiAccess = null;
    if (access) {
      access.onstatechange = null;
      const closing: Promise<unknown>[] = [];
      access.inputs.forEach(port => { port.onmidimessage = null; closing.push(port.close().catch(() => undefined)); });
      access.outputs.forEach(port => { closing.push(port.close().catch(() => undefined)); });
      await Promise.all(closing);
    }
    this.boundInputs.clear();
    this.eventListeners.clear();
    this.stateListeners.clear();
    this.isInitialized = false;
  }

  private dispatchEvent(payload: MidiEventPayload): void {
    this.eventListeners.forEach(fn => fn(payload));
  }

  private notifyState(): void {
    const state = this.getState();
    this.stateListeners.forEach(fn => fn(state));
  }

  private assertIframePermissions(): void {
    if (typeof window !== 'undefined' && window.self !== window.top) {
      const docWithPolicy = typeof document !== 'undefined' ? (document as unknown as { featurePolicy?: { allowsFeature?: (feature: string) => boolean } }) : null;
      const isMidiAllowed = docWithPolicy?.featurePolicy?.allowsFeature?.('midi') ?? true;
      if (!isMidiAllowed) {
        console.warn('MIDI Subsystem Warning: MIDI feature may be blocked by parent iframe permissions policy.');
      }
    }
  }

  private handleMidiError(err: unknown): void {
    const error = err as DOMException;
    if (error.name === 'SecurityError' || error.name === 'NotAllowedError') {
      console.error(
        'MIDI Access Blocked: Web MIDI permissions denied or blocked by iframe policy. Ensure allow="midi" is present in iframe attributes or open in a direct browser tab.'
      );
    }
  }
}
