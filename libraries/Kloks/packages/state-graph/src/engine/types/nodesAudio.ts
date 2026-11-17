// ═══════════════════════════════════════════════════════════════════
// AUDIO & GENERATOR SPACE NODES
// ═══════════════════════════════════════════════════════════════════
import {
  MidiNote,
  MidiPattern,
  SynthPreset,
  AudioTrackData,
  TriggerPacketData,
  SamplePresetType,
  AssetPoolScope,
} from "./audio";
import { CurveTrackData } from "./sceneData";
import {
  SampleZoneConfig,
  QuantizeDivision,
  QuantizeStatus,
  AudioPadItem,
} from "./hardwareBus";
import {
  TriggerDivisionMode,
  TriggerType,
  SignalType,
  UniversalSocketDefinition,
} from "./signals";
import {
  EffectType,
  AffectableNodeType,
  RepeaterEffectConfig,
  DelayEffectConfig,
  GainEffectConfig,
  PanEffectConfig,
  VelocityEffectConfig,
  EqEffectConfig,
  CompressorEffectConfig,
  MultibandCompressorEffectConfig,
  LimiterEffectConfig,
  ReverbEffectConfig,
  SaturationEffectConfig,
} from "./effects";

export interface EffectNode {
  id: string;
  type: 'effect';
  effectType: EffectType;
  signalType: SignalType; // Canonical signal protocol this effect manipulates
  name: string;
  position: [number, number, number]; // [x, y, z] - y is elevated for flying orbs
  radius: number; // Settable Area of Effect radius in world units
  active: boolean;
  color: string;
  label: string;
  affectsNodeTypes?: AffectableNodeType[];
  repeaterConfig?: RepeaterEffectConfig;
  delayConfig?: DelayEffectConfig;
  gainConfig?: GainEffectConfig;
  panConfig?: PanEffectConfig;
  velocityConfig?: VelocityEffectConfig;
  eqConfig?: EqEffectConfig;
  compressorConfig?: CompressorEffectConfig;
  multibandCompressorConfig?: MultibandCompressorEffectConfig;
  limiterConfig?: LimiterEffectConfig;
  reverbConfig?: ReverbEffectConfig;
  saturationConfig?: SaturationEffectConfig;
  dryMix?: number; // 0.0 to 1.0 (default 1.0)
  wetMix?: number; // 0.0 to 1.0 (default 1.0)
  intensity?: number; // 0.0 to 2.0 (default 1.0)
}

export interface TriggerNode {
  id: string;
  type: 'trigger';
  name: string;
  position: [number, number, number];
  triggerType: TriggerType;
  intervalBeats: number; // base interval in beats
  // Advanced Global Clock timing & division
  divisionMode?: TriggerDivisionMode;
  divisionsPerBeat?: number; // 1 to 64 divisions of a single beat
  stepsPerCycle?: number; // total steps in pattern grid (e.g. 4, 8, 16, 32, 64)
  activeSteps?: boolean[]; // beat selection mask
  activeFractions?: boolean[]; // beat fraction selection mask
  timeSignature?: '4/4' | '2/4' | '3/4' | 'custom';
  midiTriggerNote?: number;
  active: boolean;
  color: string;
  label: string;
  lastFired?: number;
  // Formal definition: what effect types can affect this trigger node
  acceptedEffects?: EffectType[];
}

export type ContainerType = 'midi' | 'audio' | 'curve' | 'instrument' | 'trigger';

export interface ContainerNode {
  id: string;
  type: 'container';
  containerType: ContainerType; // 'midi' | 'audio' | 'curve' | 'instrument'
  audioFormat?: 'mono' | 'stereo';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  active?: boolean;
  isLooping?: boolean;
  isPlaying?: boolean;
  isRecording?: boolean; // Active recording state
  pausedBeat?: number; // Beat position where playback was paused
  playheadBeats?: number;
  volume?: number;
  // MIDI Routing source (deprecated on container, handled by MidiInputNode connected to capture input)
  midiInputSourceId?: string;
  synthPreset?: SynthPreset;
  pattern?: MidiPattern;
  audioTrack?: AudioTrackData;
  curveData?: CurveTrackData;
  triggerPacket?: TriggerPacketData;
  lastTriggered?: number;
  acceptedEffects?: EffectType[];
  selectedPluginId?: string; // e.g. 'grand_piano', 'juno_pad', 'moog_bass' etc. for instrument
  triggerNote?: number; // MIDI note triggered on trigger pulse input (default 60 / C4)
  sampleZones?: SampleZoneConfig[];
  exportFileName?: string;
  targetUserFolder?: string;
  targetPoolScope?: AssetPoolScope;
  activePage?: number;
}

