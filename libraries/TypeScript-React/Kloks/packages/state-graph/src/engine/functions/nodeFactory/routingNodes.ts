import { ConverterNode, CombinerNode, MultiplexerNode, SignalKind } from "../../types/index.js";

export function createConverterNode(
  converterType: 'stereo_to_mono' | 'mono_to_stereo',
  index: number,
  position?: [number, number, number]
): ConverterNode {
  const isStereoToMono = converterType === 'stereo_to_mono';
  return {
    id: `conv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'converter',
    converterType,
    name: isStereoToMono ? `Stereo -> Mono ${index}` : `Mono -> Stereo ${index}`,
    position: position || [(Math.random() - 0.5) * 8, 0, (Math.random() - 0.5) * 8],
    color: isStereoToMono ? '#06b6d4' : '#ec4899',
    radius: 1.5,
    label: isStereoToMono ? 'Stereo -> Mono Converter' : 'Mono -> Stereo Converter',
    active: true,
    mode: 'sum',
    gain: 1.0,
  };
}

export function createCombinerNode(
  index: number,
  inputCount = 3,
  position?: [number, number, number],
  signalType: SignalKind = 'all'
): CombinerNode {
  const colorMap: Record<SignalKind, string> = {
    all: '#ec4899',
    midi: '#06b6d4',
    audio: '#f43f5e',
    audio_mono: '#06b6d4',
    audio_stereo: '#ec4899',
    trigger: '#fbbf24',
    trigger_stream: '#f59e0b',
    trigger_packet: '#f97316',
    curve: '#22d3ee',
    component: '#10b981',
  };

  return {
    id: `comb-${Date.now()}`,
    type: 'combiner',
    name: `${signalType.toUpperCase()} Combiner ${index}`,
    position: position || [(Math.random() - 0.5) * 8, 0, (Math.random() - 0.5) * 8],
    color: colorMap[signalType] || '#ec4899',
    radius: 1.5,
    label: `${signalType.toUpperCase()} Signal Combiner`,
    active: true,
    signalType,
    inputCount: Math.max(2, Math.min(8, inputCount)),
    combineMode: 'sum',
    gain: 1.0,
  };
}

export function createMultiplexerNode(
  index: number,
  outputCount = 4,
  position?: [number, number, number],
  signalType: SignalKind = 'all'
): MultiplexerNode {
  const colorMap: Record<SignalKind, string> = {
    all: '#3b82f6',
    midi: '#06b6d4',
    audio: '#f43f5e',
    audio_mono: '#06b6d4',
    audio_stereo: '#ec4899',
    trigger: '#fbbf24',
    trigger_stream: '#f59e0b',
    trigger_packet: '#f97316',
    curve: '#22d3ee',
    component: '#10b981',
  };

  return {
    id: `mux-${Date.now()}`,
    type: 'multiplexer',
    name: `${signalType.toUpperCase()} Multiplexer ${index}`,
    position: position || [(Math.random() - 0.5) * 8, 0, (Math.random() - 0.5) * 8],
    color: colorMap[signalType] || '#06b6d4',
    radius: 1.5,
    label: `${signalType.toUpperCase()} Signal Multiplexer`,
    active: true,
    signalType,
    outputCount: Math.max(2, Math.min(8, outputCount)),
    distributionMode: 'broadcast',
    activeChannel: 0,
    gain: 1.0,
  };
}
