import { MidiNote, SynthPreset, SpaceNode, NodeConnection, INodeVisuals } from '@kloks/state-graph';
import { BaseAudioGraphNode } from '../AudioGraphNodes';

export interface SynthEngineState {
  ctx: AudioContext | null;
  masterGain: GainNode | null;
  delayNode: DelayNode | null;
  delayFeedback: GainNode | null;
  delayGain: GainNode | null;
  reverbNode: ConvolverNode | null;
  reverbGain: GainNode | null;
  analyser: AnalyserNode | null;
  analyserL: AnalyserNode | null;
  analyserR: AnalyserNode | null;
  masterSplitter: ChannelSplitterNode | null;
  nodeVisuals: INodeVisuals | null;
  isInitialized: boolean;
  nodeActiveUntilMap: Map<string, number>;
  graphNodeMap: Map<string, BaseAudioGraphNode>;
  activeNodes: SpaceNode[];
  activeConnections: NodeConnection[];
  lastPlayedMidiNote: { note: number; velocity: number; timestamp: number } | null;
}
