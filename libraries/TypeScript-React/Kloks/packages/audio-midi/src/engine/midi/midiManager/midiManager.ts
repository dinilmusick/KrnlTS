import { MidiInputDevice } from '@kloks/state-graph';
import { midiToNoteName } from '@kloks/state-graph';
import { topLevelIoRegistry } from '@kloks/state-graph';
import { MidiEventPayload, MidiStatus, MidiListener, DeviceListener, StatusListener } from './types';

export class MidiManager {
  private midiAccess: any = null;
  private listeners: Set<MidiListener> = new Set();
  private deviceListeners: Set<DeviceListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  public isSupported = false;
  public status: MidiStatus = 'uninitialized';
  public statusMessage = 'MIDI subsystem uninitialized';
  public devices: MidiInputDevice[] = [];
  public lastEvent: MidiEventPayload | null = null;
  private isRequesting = false;

  public async init(userTriggered = false): Promise<boolean> {
    if (this.isRequesting) return false;
    const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
    const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (!nav || !nav.requestMIDIAccess) {
      this.isSupported = false;
      const msg = isSafari
        ? 'Safari on macOS does not support native Web MIDI. Open in Chrome, Brave, or Edge on Mac to connect physical hardware controllers.'
        : 'Web MIDI API is not supported in this browser.';
      this.setStatus('unsupported', msg);
      return false;
    }

    this.isSupported = true;
    this.isRequesting = true;
    this.setStatus('requesting', 'Requesting MIDI device access...');

    const tryRequest = async (opts?: any) => {
      try {
        return await (opts !== undefined ? nav.requestMIDIAccess(opts) : nav.requestMIDIAccess());
      } catch {
        return null;
      }
    };

    try {
      let access = await tryRequest({ sysex: false, software: true });
      if (!access) access = await tryRequest({ sysex: false });
      if (!access) access = await tryRequest();
      if (!access) access = await tryRequest({ sysex: true });

      if (!access) {
        throw new Error('MIDI access request was denied or rejected');
      }

      this.midiAccess = access;
      this.refreshDevices();

      this.midiAccess.onstatechange = () => this.refreshDevices();
      if (typeof this.midiAccess.addEventListener === 'function') {
        this.midiAccess.addEventListener('statechange', () => this.refreshDevices());
      }

      if (nav.permissions && nav.permissions.query) {
        try {
          const perm = await nav.permissions.query({ name: 'midi', sysex: false });
          perm.onchange = () => this.refreshDevices();
        } catch {
          // Ignore permission query error if name is not recognized
        }
      }

      const count = this.devices.length;
      this.setStatus(
        'connected',
        count > 0 ? `Recognized ${count} MIDI device${count > 1 ? 's' : ''}` : 'MIDI subsystem active (0 devices detected)'
      );
      this.isRequesting = false;
      return true;
    } catch (err: any) {
      const isIframe = typeof window !== 'undefined' && window.self !== window.top;
      const msg = isIframe
        ? 'MIDI access blocked by iframe policy. Open in new tab or grant permissions.'
        : `MIDI access error: ${err?.message || 'Permission denied'}`;
      this.setStatus('denied', msg);
      this.isRequesting = false;
      return false;
    }
  }

  public refreshDevices(): void {
    if (!this.midiAccess) return;
    const inputs: MidiInputDevice[] = [];
    const seen = new Set<string>();

    const bindPort = (input: any) => {
      if (!input || seen.has(input.id)) return;
      seen.add(input.id);
      inputs.push({
        id: input.id,
        name: input.name || `MIDI Port (${input.id.slice(0, 6)})`,
        manufacturer: input.manufacturer || 'Standard USB/MIDI',
        state: input.state || 'connected',
      });

      input.onmidimessage = (msg: any) => this.handleMidiMessage(msg, input.id, input.name);
      if (typeof input.addEventListener === 'function') {
        input.addEventListener('midimessage', (msg: any) => this.handleMidiMessage(msg, input.id, input.name));
      }
      input.onstatechange = () => this.refreshDevices();
    };

    if (this.midiAccess.inputs) {
      if (typeof this.midiAccess.inputs.forEach === 'function') {
        this.midiAccess.inputs.forEach((input: any) => bindPort(input));
      }
      if (inputs.length === 0 && typeof this.midiAccess.inputs.values === 'function') {
        for (const input of this.midiAccess.inputs.values()) {
          bindPort(input);
        }
      }
    }

    this.devices = inputs;
    this.deviceListeners.forEach((fn) => fn(this.devices));

    // Update canonical MIDI endpoints connection status
    inputs.forEach((dev) => {
      const ep = topLevelIoRegistry.getOrCreateMidiEndpoint(dev.id, dev.name);
      ep.setConnected(dev.state === 'connected');
    });

    topLevelIoRegistry.logTrace('MIDI', 'DEVICE_DETECTED', {
      count: inputs.length,
      devices: inputs.map((d) => d.name),
    });

    if (this.status === 'connected') {
      const count = inputs.length;
      this.setStatus('connected', count > 0 ? `Connected: ${inputs.map((d) => d.name).join(', ')}` : 'MIDI Active (No devices connected)');
    }
  }

  private handleMidiMessage(event: any, deviceId?: string, deviceName?: string): void {
    const data = event.data;
    if (!data || data.length < 2) return;

    const statusByte = data[0];
    const cmd = statusByte >> 4;
    const channel = (statusByte & 0x0f) + 1;
    const note = data[1];
    const rawVelocity = data[2] !== undefined ? data[2] : 0;
    const velocity = rawVelocity / 127;
    const timestamp = performance.now();

    let payload: MidiEventPayload | null = null;

    if (cmd === 9 && rawVelocity > 0) {
      payload = { type: 'noteon', note, noteName: midiToNoteName(note), velocity, channel, deviceId, deviceName, timestamp };
    } else if (cmd === 8 || (cmd === 9 && rawVelocity === 0)) {
      payload = { type: 'noteoff', note, noteName: midiToNoteName(note), velocity: 0, channel, deviceId, deviceName, timestamp };
    } else if (cmd === 11) {
      payload = { type: 'cc', note: 0, noteName: '', velocity: 0, channel, deviceId, deviceName, controller: note, value: rawVelocity, timestamp };
    } else if (cmd === 14) {
      const pbVal = ((data[2] << 7) | data[1]) - 8192;
      payload = { type: 'pitchbend', note: 0, noteName: '', velocity: 0, channel, deviceId, deviceName, value: pbVal, timestamp };
    }

    if (payload) {
      this.lastEvent = payload;
      topLevelIoRegistry.logTrace('MIDI', 'MIDI_EVENT_RECEIVED', {
        type: payload.type,
        note: payload.note,
        deviceId: payload.deviceId,
      });
      topLevelIoRegistry.dispatchMidiEvent(payload);
      this.listeners.forEach((fn) => fn(payload!));
    }
  }

  public emitVirtualMidi(payload: MidiEventPayload): void {
    this.lastEvent = payload;
    topLevelIoRegistry.logTrace('MIDI', 'MIDI_EVENT_RECEIVED', {
      type: payload.type,
      note: payload.note,
      deviceId: payload.deviceId || 'virtual-keyboard',
    });
    topLevelIoRegistry.dispatchMidiEvent(payload);
    this.listeners.forEach((fn) => fn(payload));
  }

  public addListener(fn: MidiListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public addMessageListener(fn: MidiListener): () => void {
    return this.addListener(fn);
  }

  public sendControlChange(channel: number, controller: number, value: number, outputId?: string): void {
    const ch = Math.max(0, Math.min(15, channel - 1));
    const status = 0xb0 | ch;
    const msg = [status, Math.max(0, Math.min(127, controller)), Math.max(0, Math.min(127, Math.round(value)))];

    if (this.midiAccess?.outputs) {
      this.midiAccess.outputs.forEach((output: any) => {
        if (!outputId || output.id === outputId) {
          try {
            output.send(msg);
          } catch {
            // ignore send error
          }
        }
      });
    }

    // Also mirror to virtual listeners for internal reactive loopback
    this.emitVirtualMidi({
      type: 'cc',
      channel,
      controller,
      value,
      note: 0,
      noteName: '',
      velocity: value / 127,
      timestamp: performance.now(),
      deviceId: outputId || 'internal',
    });
  }

  public sendNoteOn(channel: number, note: number, velocity = 127, outputId?: string): void {
    const ch = Math.max(0, Math.min(15, channel - 1));
    const status = 0x90 | ch;
    const msg = [status, Math.max(0, Math.min(127, note)), Math.max(0, Math.min(127, Math.round(velocity)))];

    if (this.midiAccess?.outputs) {
      this.midiAccess.outputs.forEach((output: any) => {
        if (!outputId || output.id === outputId) {
          try {
            output.send(msg);
          } catch {
            // ignore send error
          }
        }
      });
    }

    this.emitVirtualMidi({
      type: 'noteon',
      channel,
      note,
      noteName: midiToNoteName(note),
      velocity: velocity / 127,
      timestamp: performance.now(),
      deviceId: outputId || 'internal',
    });
  }

  public sendNoteOff(channel: number, note: number, outputId?: string): void {
    const ch = Math.max(0, Math.min(15, channel - 1));
    const status = 0x80 | ch;
    const msg = [status, Math.max(0, Math.min(127, note)), 0];

    if (this.midiAccess?.outputs) {
      this.midiAccess.outputs.forEach((output: any) => {
        if (!outputId || output.id === outputId) {
          try {
            output.send(msg);
          } catch {
            // ignore send error
          }
        }
      });
    }

    this.emitVirtualMidi({
      type: 'noteoff',
      channel,
      note,
      noteName: midiToNoteName(note),
      velocity: 0,
      timestamp: performance.now(),
      deviceId: outputId || 'internal',
    });
  }

  public addDeviceListener(fn: DeviceListener): () => void {
    this.deviceListeners.add(fn);
    fn(this.devices);
    return () => this.deviceListeners.delete(fn);
  }

  public addStatusListener(fn: StatusListener): () => void {
    this.statusListeners.add(fn);
    fn(this.status, this.statusMessage);
    return () => this.statusListeners.delete(fn);
  }

  private setStatus(status: MidiStatus, message: string): void {
    this.status = status;
    this.statusMessage = message;
    this.statusListeners.forEach((fn) => fn(status, message));
  }
}

export const midiManager = new MidiManager();
