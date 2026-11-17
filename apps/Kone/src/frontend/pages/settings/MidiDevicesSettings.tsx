'use client';

import { useEffect, useState } from 'react';
import { BaseButton } from '@ultrst-armada/floks/ui';
import type { MidiDevice } from '@ultrst-armada/kloks/midi';
import { discoverMidiDevices, getKoneMidiService, subscribeMidiDevices } from '../../components/performance/midiDevices.js';

export function MidiDevicesSettings() {
  const [devices, setDevices] = useState<MidiDevice[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const midi = getKoneMidiService();
    setDevices(midi.getDevices());
    const stop = subscribeMidiDevices(setDevices);
    void discoverMidiDevices().catch((cause) => setError(cause instanceof Error ? cause.message : String(cause)));
    return stop;
  }, []);

  const physical = devices.filter((device) => device.origin === 'physical');
  const connect = async (device: MidiDevice, direction: 'input' | 'output') => {
    try { if (direction === 'input') await getKoneMidiService().connectInput(device.id); else await getKoneMidiService().connectOutput(device.id); setError(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
  };

  return <section aria-label="MIDI Devices" style={{ padding: 24, maxWidth: 900 }}>
    <h2>MIDI Devices</h2>
    <p style={{ fontSize: 12 }}>MIDI devices are discovered through Kloks MIDI. Sound Groups route onto these stable devices and do not create devices themselves.</p>
    {error && <p role="alert">{error}</p>}
    <h3>Discovered MIDI Inputs / Outputs</h3>
    <ul>{physical.map((device) => <li key={device.id} style={{ marginBottom: 8 }}>{device.name} · {device.direction} · {device.state} {device.capabilities.input && device.inputState !== 'connected' && <BaseButton size="sm" variant="secondary" onClick={() => void connect(device, 'input')}>Connect input</BaseButton>} {device.capabilities.output && device.outputState !== 'connected' && <BaseButton size="sm" variant="secondary" onClick={() => void connect(device, 'output')}>Connect output</BaseButton>}</li>)}</ul>
    {physical.length === 0 && <p style={{ fontSize: 11 }}>No physical MIDI devices discovered in this runtime.</p>}
  </section>;
}
