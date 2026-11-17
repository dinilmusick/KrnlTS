import { CanonicalMidiEndpointState, MidiEventPayload, midiToNoteName } from "./types";

export class CanonicalMidiInputEndpoint {
  public id: string;
  public name: string;
  public connected: boolean = true;
  public active: boolean = false;
  public currentNote: number | null = null;
  public currentNoteName: string | null = null;
  public velocity: number = 0;
  public activeNotes: Set<number> = new Set();
  public lastEventTimestamp: number = 0;
  private noteHistory: number[] = [];

  private listeners: Set<(state: CanonicalMidiEndpointState) => void> = new Set();
  private eventListeners: Set<(evt: MidiEventPayload) => void> = new Set();

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  public subscribe(fn: (state: CanonicalMidiEndpointState) => void): () => void {
    this.listeners.add(fn);
    fn(this.getState());
    return () => this.listeners.delete(fn);
  }

  public addEventListener(fn: (evt: MidiEventPayload) => void): () => void {
    this.eventListeners.add(fn);
    return () => this.eventListeners.delete(fn);
  }

  public getState(): CanonicalMidiEndpointState {
    return {
      id: this.id,
      name: this.name,
      connected: this.connected,
      active: this.active,
      currentNote: this.currentNote,
      currentNoteName: this.currentNoteName,
      velocity: this.velocity,
      activeNotes: new Set(this.activeNotes),
      lastEventTimestamp: this.lastEventTimestamp,
    };
  }

  public handleMidiEvent(evt: MidiEventPayload): void {
    if (!this.connected) return;

    this.lastEventTimestamp = evt.timestamp || Date.now();

    if (evt.type === 'noteon' && (evt.velocity ?? 0) > 0) {
      this.activeNotes.add(evt.note);
      // Update note history for last-note priority
      this.noteHistory = this.noteHistory.filter((n) => n !== evt.note);
      this.noteHistory.push(evt.note);

      this.currentNote = evt.note;
      this.currentNoteName = evt.noteName || midiToNoteName(evt.note);
      this.velocity = evt.velocity ?? 0.8;
      this.active = true;
    } else if (evt.type === 'noteoff' || (evt.type === 'noteon' && (evt.velocity ?? 0) === 0)) {
      this.activeNotes.delete(evt.note);
      this.noteHistory = this.noteHistory.filter((n) => n !== evt.note);

      if (this.activeNotes.size > 0) {
        // Priority rule: most recent remaining active note
        const lastRemaining = this.noteHistory[this.noteHistory.length - 1];
        this.currentNote = lastRemaining;
        this.currentNoteName = midiToNoteName(lastRemaining);
        this.active = true;
      } else {
        this.active = false;
        this.currentNote = null;
        this.currentNoteName = null;
        this.velocity = 0;
      }
    }

    this.notify();
    this.eventListeners.forEach((fn) => fn(evt));
  }

  public setConnected(connected: boolean): void {
    this.connected = connected;
    if (!connected) {
      this.active = false;
      this.currentNote = null;
      this.currentNoteName = null;
      this.velocity = 0;
      this.activeNotes.clear();
      this.noteHistory = [];
    }
    this.notify();
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((fn) => fn(state));
  }
}

let canonicalMidiBridgeRef: any = null;
export function configureCanonicalMidiBridge(midiManagerInstance: any): void {
  canonicalMidiBridgeRef = midiManagerInstance;
  (globalThis as any).__KLOKS_MIDI_MANAGER__ = midiManagerInstance;
}
export function getCanonicalMidiBridge(): any {
  return canonicalMidiBridgeRef || (globalThis as any).__KLOKS_MIDI_MANAGER__;
}
