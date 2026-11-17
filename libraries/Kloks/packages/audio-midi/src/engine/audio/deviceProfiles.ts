import { HardwareChannelInfo } from '@kloks/state-graph';
import { KNOWN_PATTERNS, KnownDevicePattern } from './devicePatterns';

export interface HardwareProfileResult {
  detectedInputChannels: number;
  detectedOutputChannels: number;
  interfaceModelName: string;
  isKnownInterface: boolean;
  channelDescriptions: Record<number, string>;
  outputDescriptions: Record<string, string>;
}

export interface OutputChannelInfo {
  id: string;
  label: string;
  shortLabel: string;
  isStereo: boolean;
  channels: number[];
}

export function detectHardwareProfile(
  inputLabel: string,
  outputLabel: string,
  trackSettings?: MediaTrackSettings,
  trackCapabilities?: any,
  destMaxChannels?: number
): HardwareProfileResult {
  const combinedLabel = `${inputLabel || '} ${outputLabel || '}`;
  let matchedPattern: KnownDevicePattern | null = null;

  for (const kp of KNOWN_PATTERNS) {
    if (kp.pattern.test(combinedLabel)) {
      matchedPattern = kp;
      break;
    }
  }

  const trackChannelCount = trackSettings?.channelCount || trackCapabilities?.channelCount?.max;
  let inCount = matchedPattern ? matchedPattern.inChannels : (trackChannelCount && trackChannelCount > 1 ? trackChannelCount : 2);
  let outCount = matchedPattern ? matchedPattern.outChannels : (destMaxChannels && destMaxChannels > 1 ? destMaxChannels : 2);

  if (!matchedPattern) {
    const channelMatch = combinedLabel.match(/(\d+)\s*(?:in|ch|channel|i)/i);
    if (channelMatch && channelMatch[1]) {
      const parsed = parseInt(channelMatch[1], 10);
      if (!isNaN(parsed) && parsed >= 2 && parsed <= 64) {
        inCount = Math.max(inCount, parsed);
      }
    }
  }

  return {
    detectedInputChannels: Math.max(2, inCount),
    detectedOutputChannels: Math.max(2, outCount),
    interfaceModelName: matchedPattern ? matchedPattern.name : (inputLabel || 'Standard Audio Interface'),
    isKnownInterface: !!matchedPattern,
    channelDescriptions: matchedPattern?.inNames || {},
    outputDescriptions: matchedPattern?.outNames || {},
  };
}

export function buildInputChannelList(
  totalChannels: number,
  descriptions: Record<number, string> = {}
): HardwareChannelInfo[] {
  const count = Math.max(2, totalChannels);
  const result: HardwareChannelInfo[] = [];

  for (let ch = 1; ch <= count; ch++) {
    const customDesc = descriptions[ch];
    const defaultRole = ch === 1 ? 'Mic 1 / Line In 1' : ch === 2 ? 'Inst 2 / Line In 2' : `Line In ${ch}`;
    const label = customDesc || `Input ${ch} (${defaultRole} - Mono)`;

    result.push({
      id: ch,
      label,
      shortLabel: `Ch ${ch}`,
      isStereo: false,
      channels: [ch],
    });
  }

  result.push({
    id: 0,
    label: `Stereo Pair 1+2 (${descriptions[1] ? 'Main L/R Stereo' : 'In 1/2 Stereo'})`,
    shortLabel: 'Ch 1/2 Stereo',
    isStereo: true,
    channels: [1, 2],
  });

  for (let pairStart = 3; pairStart < count; pairStart += 2) {
    const pairEnd = pairStart + 1;
    const pairId = pairStart * 100 + pairEnd;
    result.push({
      id: pairId,
      label: `Stereo Pair ${pairStart}+${pairEnd} (In ${pairStart}/${pairEnd})`,
      shortLabel: `Ch ${pairStart}/${pairEnd}`,
      isStereo: true,
      channels: [pairStart, pairEnd],
    });
  }

  return result;
}

export function buildOutputChannelList(
  totalChannels: number,
  descriptions: Record<string, string> = {}
): OutputChannelInfo[] {
  const count = Math.max(2, totalChannels);
  const list: OutputChannelInfo[] = [];

  list.push({
    id: 'Ch 1 / 2 (Main L/R)',
    label: descriptions['Ch 1 / 2 (Main L/R)'] || 'Ch 1/2 (Main Stereo Master Out)',
    shortLabel: 'Ch 1/2 Main',
    isStereo: true,
    channels: [1, 2],
  });

  if (count >= 4) {
    list.push({
      id: 'Ch 3 / 4 (Sub / Cue)',
      label: descriptions['Ch 3 / 4 (Sub / Cue)'] || 'Ch 3/4 (Sub / Cue / Line Out 3-4)',
      shortLabel: 'Ch 3/4 Cue',
      isStereo: true,
      channels: [3, 4],
    });
  }

  if (count >= 6) {
    list.push({
      id: 'Ch 5 / 6 (Aux Out)',
      label: descriptions['Ch 5 / 6 (Aux Out)'] || 'Ch 5/6 (Aux / Headphone 2 / S/PDIF Out)',
      shortLabel: 'Ch 5/6 Aux',
      isStereo: true,
      channels: [5, 6],
    });
  }

  if (count >= 8) {
    list.push({
      id: 'Ch 7 / 8 (Out 7/8)',
      label: descriptions['Ch 7 / 8 (Out 7/8)'] || 'Ch 7/8 (Line 7/8 Direct Out)',
      shortLabel: 'Ch 7/8 Out',
      isStereo: true,
      channels: [7, 8],
    });
  }

  for (let ch = 1; ch <= count; ch++) {
    const monoKey = `Ch ${ch} (Mono${ch === 1 ? ' Left' : ch === 2 ? ' Right' : ''})`;
    list.push({
      id: monoKey,
      label: descriptions[monoKey] || `Ch ${ch} (Mono ${ch === 1 ? 'Left' : ch === 2 ? 'Right' : `Direct Out ${ch}`})`,
      shortLabel: `Ch ${ch} Mono`,
      isStereo: false,
      channels: [ch],
    });
  }

  return list;
}
