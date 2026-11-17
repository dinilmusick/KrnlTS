export function formatDrivePercent(drive: number): string {
  return `${Math.round(drive * 20)}%`;
}

export function getSaturationTypeDescription(type: string): string {
  switch (type) {
    case 'tape':
      return 'Smooth analog tape compression';
    case 'tube':
      return 'Warm asymmetric vacuum tube harmonics';
    case 'soft_clip':
      return 'Gentle musical soft clipping';
    case 'hard_clip':
      return 'Aggressive modern digital edge';
    case 'foldback':
      return 'Wavefolded complex acoustic harmonics';
    default:
      return 'Harmonic saturation';
  }
}
