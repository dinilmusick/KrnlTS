import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('audio/MIDI module initialization boundary', () => {
  it('loads and constructs managers without browser globals', async () => {
    for (const key of ['window', 'document', 'localStorage', 'navigator', 'AudioContext']) {
      vi.stubGlobal(key, undefined);
    }

    vi.resetModules();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const audioMidi = await import('../src/index.js');
    expect(audioMidi.AudioHardwareServiceDefinition).toBeDefined();
    expect(audioMidi.MidiServiceDefinition).toBeDefined();
    expect(audioMidi.synthEngine.getAudioEngineConfig()).toBeDefined();
    expect(audioMidi.audioInputManager.availableDevices).toEqual([]);
    await expect(audioMidi.audioInputManager.enumerateAudioDevices()).resolves.toEqual({ inputs: [], outputs: [] });
    expect(() => audioMidi.synthEngine.init()).toThrow('Web Audio API is unavailable in this runtime.');

    const browserGlobalLogs = [...warn.mock.calls, ...error.mock.calls]
      .flat()
      .map((entry) => String(entry))
      .filter((message) => /localStorage|window is not defined|navigator is not defined|AudioContext|document is not defined/.test(message));
    expect(browserGlobalLogs).toEqual([]);

    const audio = new audioMidi.AudioInputManager();
    const midi = new audioMidi.MidiManager();

    expect(audio.getState().isInitialized).toBe(false);
    expect(midi.getState().isInitialized).toBe(false);

    await audio.dispose();
    await midi.dispose();
  }, 30_000);
});
