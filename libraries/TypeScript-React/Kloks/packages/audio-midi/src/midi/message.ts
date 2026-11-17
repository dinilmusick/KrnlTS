export type MidiMessage =
  | { type: 'noteOn'; channel: number; noteOrController: number; value: number }
  | { type: 'noteOff'; channel: number; noteOrController: number; value: number }
  | { type: 'polyPressure'; channel: number; noteOrController: number; value: number }
  | { type: 'controlChange'; channel: number; noteOrController: number; value: number }
  | { type: 'programChange'; channel: number; value: number }
  | { type: 'channelPressure'; channel: number; value: number }
  | { type: 'pitchBend'; channel: number; value: number }
  | { type: 'system'; status: number; data: number[] };

const byte = (value: number, label: string) => {
  if (!Number.isInteger(value) || value < 0 || value > 127) throw new RangeError(label + ' must be a 7-bit integer');
  return value;
};
const channel = (value: number) => {
  if (!Number.isInteger(value) || value < 0 || value > 15) throw new RangeError('MIDI channel must be 0..15');
  return value;
};

export function encodeMidiMessage(message: MidiMessage): Uint8Array {
  if (message.type === 'system') {
    if (!Number.isInteger(message.status) || message.status < 0xf0 || message.status > 0xff) throw new RangeError('Invalid system status');
    return new Uint8Array([message.status, ...message.data.map(value => { if (!Number.isInteger(value) || value < 0 || value > 255) throw new RangeError('System data must be a byte'); return value; })]);
  }
  const ch = channel(message.channel);
  if (message.type === 'pitchBend') {
    if (!Number.isInteger(message.value) || message.value < -8192 || message.value > 8191) throw new RangeError('Pitch bend must be -8192..8191');
    const value = message.value + 8192;
    return new Uint8Array([0xe0 | ch, value & 0x7f, (value >> 7) & 0x7f]);
  }
  if (message.type === 'programChange') return new Uint8Array([0xc0 | ch, byte(message.value, 'Program')]);
  if (message.type === 'channelPressure') return new Uint8Array([0xd0 | ch, byte(message.value, 'Pressure')]);
  const status = message.type === 'noteOff' ? 0x80
    : message.type === 'noteOn' ? 0x90
    : message.type === 'polyPressure' ? 0xa0 : 0xb0;
  return new Uint8Array([status | ch, byte(message.noteOrController, 'Note/controller'), byte(message.value, 'Value')]);
}

export function decodeMidiMessage(input: ArrayLike<number>): MidiMessage {
  if (input.length < 1) throw new TypeError('Empty MIDI message');
  const status = input[0];
  if (!Number.isInteger(status) || status < 0x80 || status > 0xff) throw new TypeError('Invalid MIDI status byte');
  if (status >= 0xf0) {
    const data = Array.from({ length: input.length - 1 }, (_, index) => {
      const value = input[index + 1];
      if (!Number.isInteger(value) || value < 0 || value > 255) throw new RangeError('System data must be a byte');
      return value;
    });
    return { type: 'system', status, data };
  }
  const data = Array.from({ length: input.length - 1 }, (_, index) => byte(input[index + 1], 'MIDI data'));
  const family = status & 0xf0;
  const ch = status & 0x0f;
  const expected = family === 0xc0 || family === 0xd0 ? 1 : 2;
  if (data.length !== expected) throw new TypeError('Incorrect MIDI message length');
  if (family === 0x80) return { type: 'noteOff', channel: ch, noteOrController: data[0], value: data[1] };
  if (family === 0x90) return { type: 'noteOn', channel: ch, noteOrController: data[0], value: data[1] };
  if (family === 0xa0) return { type: 'polyPressure', channel: ch, noteOrController: data[0], value: data[1] };
  if (family === 0xb0) return { type: 'controlChange', channel: ch, noteOrController: data[0], value: data[1] };
  if (family === 0xc0) return { type: 'programChange', channel: ch, value: data[0] };
  if (family === 0xd0) return { type: 'channelPressure', channel: ch, value: data[0] };
  if (family === 0xe0) return { type: 'pitchBend', channel: ch, value: ((data[1] << 7) | data[0]) - 8192 };
  throw new TypeError('Unsupported MIDI status byte');
}
