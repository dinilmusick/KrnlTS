'use client';

import { useEffect, useState } from 'react';
import { BaseButton, BaseSelect } from '@ultrst-armada/floks/ui';
import type { MidiDevice } from '@ultrst-armada/kloks/midi';
import { getKoneMidiService } from './midiDevices.js';

export function MidiInputControls({ onAdd }: { onAdd: (deviceId: string, channel: number) => void }) {
  const [devices, setDevices] = useState<MidiDevice[]>([]);
  const [deviceId, setDeviceId] = useState('');
  const [channel, setChannel] = useState(0);

  useEffect(() => {
    const midi = getKoneMidiService();
    setDevices(midi.getDevices());
    const stop = midi.subscribeDevices(setDevices);
    void midi.discover().catch(() => undefined);
    return () => {
      stop();
    };
  }, []);

  const inputs = devices.filter((device) => device.capabilities.input);
  const deviceOptions = [{ label: 'MIDI Input Device', value: '' }, ...inputs.map((device) => ({ label: device.name, value: device.id }))];
  const channelOptions = Array.from({ length: 16 }, (_, index) => ({ label: `Channel ${index}`, value: String(index) }));
  return <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
    <BaseSelect aria-label="MIDI input device" options={deviceOptions} value={deviceId} onChange={(event) => setDeviceId(event.target.value)} />
    <BaseSelect aria-label="MIDI input channel" options={channelOptions} value={String(channel)} onChange={(event) => setChannel(Number(event.target.value))} />
    <BaseButton size="sm" variant="secondary" disabled={!deviceId} onClick={() => onAdd(deviceId, channel)}>Add MIDI Input</BaseButton>
  </div>;
}
