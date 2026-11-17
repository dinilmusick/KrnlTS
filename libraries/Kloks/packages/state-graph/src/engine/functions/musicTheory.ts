const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function noteNameToMidi(name: string): number {
  const match = name.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) return 60;
  const noteIndex = NOTE_NAMES.indexOf(match[1]);
  const octave = parseInt(match[2], 10);
  return (octave + 1) * 12 + noteIndex;
}

export const PRESET_SCALES: Record<string, number[]> = {
  'Major Pentatonic': [0, 2, 4, 7, 9],
  'Minor Pentatonic': [0, 3, 5, 7, 10],
  'Cosmic Lydian': [0, 2, 4, 6, 7, 9, 11],
  'Dorian Myst': [0, 2, 3, 5, 7, 9, 10],
  'Aeolian Dark': [0, 2, 3, 5, 7, 8, 10],
  'Chromatic Universe': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
};

export const COLOR_PALETTES = [
  '#f59e0b', // Amber / Gold Star
  '#38bdf8', // Celestial Sky
  '#c084fc', // Nebula Violet
  '#f43f5e', // Quasar Crimson
  '#34d399', // Aurora Emerald
  '#fb7185', // Coral Supernova
  '#a78bfa', // Pulsar Indigo
  '#2dd4bf'  // Cyan Comet
];
