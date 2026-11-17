export function beatsToSeconds(beats: number, bpm: number = 120): number {
  const secondsPerBeat = 60 / Math.max(20, Math.min(300, bpm));
  return beats * secondsPerBeat;
}

export function formatBeatDivision(beats: number): string {
  if (beats === 0.25) return '1/16';
  if (beats === 0.5) return '1/8';
  if (beats === 0.75) return '1/8D';
  if (beats === 1.0) return '1/4';
  if (beats === 1.5) return '1/4D';
  if (beats === 2.0) return '1/2';
  return `${beats}bt`;
}
