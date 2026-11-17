export type SynthType = 'poly' | 'bass' | 'lead' | 'pad' | 'plucked' | 'drums';

export interface MidiNote {
  note: number; // 0-127 MIDI pitch (e.g. 60 = C4)
  name: string; // e.g. "C4"
  velocity: number; // 0.0 to 1.0
  time: number; // position in beats relative to pattern start (0 to patternLength)
  duration: number; // duration in beats
}

export interface SynthPreset {
  synthType: SynthType;
  attack: number; // seconds (0.005 - 2.0)
  decay: number; // seconds (0.05 - 2.0)
  sustain: number; // level (0.0 - 1.0)
  release: number; // seconds (0.05 - 4.0)
  cutoff: number; // Hz (100 - 16000)
  resonance: number; // Q factor (0.1 - 20)
  reverb: number; // wet mix (0.0 - 1.0)
  delay: number; // wet mix (0.0 - 1.0)
}

export interface MidiPattern {
  id: string;
  name: string;
  lengthInBeats: number; // e.g. 4, 8, 16
  tempo: number;
  notes: MidiNote[];
}

/**
 * Fundamental Trigger Pulse Data Packet (Analogous to MIDI Note)
 * Carries timing in bars, beats, and beat fractions with an optional custom code payload.
 */
export interface TriggerPulse {
  id: string;
  bar: number; // 0-indexed or 1-indexed bar number
  beat: number; // beat within bar (0, 1, 2, 3...)
  beatFraction: number; // fraction within beat (0, 1, 2, 3... for subdivisions or fractional)
  totalBeat?: number; // continuous absolute beat time across DAW timeline
  intensity: number; // 0.0 to 1.0 (analogous to strike velocity / amplitude)
  duration: number; // gate length in beats or beat fractions (e.g. 0.25)
  division?: string; // timing division, e.g. "every_bar", "every_beat", "divisions", "16th"
  codePayload?: string; // custom standard JavaScript code payload stored in pulse
  payloadData?: any; // arbitrary runtime structured payload
  executedResult?: any; // evaluation result from code execution
  sourceNodeId?: string;
  timestamp?: number;
}

/**
 * Trigger Packet (Similar to MIDI Clip)
 * A discrete series of trigger pulses placed across a defined quantity of time
 * in terms of bars, beats, and beat fractions (not in seconds or minutes).
 */
export interface TriggerPacketData {
  id: string;
  name: string;
  totalBars: number; // defined quantity of time in bars
  beatsPerBar: number; // beats per bar (e.g. 4)
  divisionsPerBeat: number; // beat subdivisions per beat (e.g. 4 for 16ths, 8 for 32nds)
  pulses: TriggerPulse[];
}

export type SamplePresetType =
  | 'ambient_drone'
  | 'pulsar_synth'
  | 'cosmic_warp'
  | 'starlight_vox'
  | 'cyber_808'
  | 'space_percussion'
  | 'kick'
  | 'snare'
  | 'hihat'
  | 'shaker'
  | 'adlib'
  | 'vocal'
  | '808'
  | 'chime'
  | 'custom'
  | (string & {});

export interface AudioTrackData {
  id: string;
  name: string;
  sampleType: SamplePresetType | string;
  durationBeats: number;
  gain: number; // 0.0 to 2.0
  pan: number; // -1.0 to 1.0
  pitchShift: number; // -24 to +24 semitones
  filterCutoff: number; // 100 to 16000 Hz
  fadeInBeats: number;
  fadeOutBeats: number;
  trimStartBeats: number;
  trimEndBeats: number;
  isReversed: boolean;
  waveformData?: number[]; // pre-computed waveform peak heights (0.0 - 1.0)
  customAudioUrl?: string;
  sampleScope?: 'global' | 'project' | 'preset' | 'custom';
  sampleFilename?: string;
}

export interface AudioSampleItem {
  filename: string;
  name: string;
  category: string;
  format: string;
  url: string;
  size: number;
  scope: 'global' | 'project';
  projectId?: string;
  createdAt?: number;
}

export type AssetDataType = 'audio' | 'midi';
export type AssetChannelType = 'stereo' | 'mono';
export type AssetPoolScope = 'workspace' | 'project';

export interface AssetFolderInfo {
  name: string;
  dataType: AssetDataType;
  channelType?: AssetChannelType;
  fileCount: number;
  isSystemDefault?: boolean;
}

export interface AssetPoolItem {
  id: string;
  filename: string;
  name: string;
  scope: AssetPoolScope;
  projectId?: string;
  dataType: AssetDataType;
  channelType?: AssetChannelType;
  subfolder: string;
  relativePath: string;
  url: string;
  size: number;
  format: string;
  createdAt: number;
}

export type MapChannelType = 'audio' | 'midi' | 'osc' | 'trigger';
export type MapChannelDirection = 'input' | 'output';

export interface MapChannelConfig {
  id: string;
  sourceId: string;
  name: string;
  type: MapChannelType;
  direction: MapChannelDirection;
  enabled: boolean;
  gain?: number; // 0.0 to 2.0 (for audio channels)
  isMuted?: boolean;
  color?: string;
  audioFormat?: 'mono' | 'stereo';
  signalType?: SignalType;
  ioLevel?: 'physical' | 'typed'; // 'physical' for top-level map external IO, 'typed' for nested map signal ports
  portType?: 'external_endpoint' | 'typed_port';
  metadata?: Record<string, any>;
}

export interface MapIoConfig {
  inputs: MapChannelConfig[];
  outputs: MapChannelConfig[];
  level?: 'physical' | 'typed';
}

export interface DawProject {
  id: string;
  name: string;
  description: string;
  folderPath: string;
  createdAt: number;
  updatedAt: number;
  sampleCount?: number;
  nodeCount?: number;
  bpm: number;
  masterVolume?: number;
  currentBiome?: string;
  nodes?: SpaceNode[];
  connections?: NodeConnection[];
  mapIoConfig?: MapIoConfig;
}

export interface CurvePoint {
  id: string;
  x: number; // beat position (0 to lengthInBeats)
  y: number; // normalized value (0.0 to 1.0)
  tension?: number; // bezier curvature (-1.0 to 1.0)
}

export type CurveModTarget = 'cutoff' | 'volume' | 'pan' | 'reverb' | 'pitch' | 'delay';

export interface CurveTrackData {
  id: string;
  name: string;
  lengthInBeats: number;
  points: CurvePoint[];
  targetParam: CurveModTarget;
  targetNodeId?: string; // specific node ID, or 'all'
  minValue: number;
  maxValue: number;
}

export type ContainerType = 'midi' | 'audio' | 'curve' | 'instrument' | 'trigger';

export type TriggerDivisionMode =
  | 'every_bar'
  | 'every_beat'
  | 'divisions'
  | 'selected_beats'
  | '4_4'
  | '2_4'
  | '16th'
  | '32nd'
  | '64th'
  | 'custom';

export type TriggerType = 'beats' | 'beat_fractions' | 'euclidean' | 'random';

export type SignalMedium =
  | 'audio_stereo'
  | 'audio_mono'
  | 'midi'
  | 'curve'
  | 'trigger'
  | 'component'
  | 'omni'
  | 'data';

export type SignalDataType = 'stream' | 'packet' | 'pulse';

export type SignalPolarity = 'input' | 'output';

export type ConnectivityType = 'single' | 'multi';

export type SignalType =
  | 'trigger'
  | 'trigger_stream'
  | 'trigger_packet'
  | 'audio_stream'
  | 'audio_packet'
  | 'midi_stream'
  | 'midi_packet'
  | 'curve_stream'
  | 'curve_packet'
  | 'omni_packet'
  | 'omni_stream'
  | 'omni'
  | 'audio'
  | 'audio_mono'
  | 'audio_stereo'
  | 'midi'
  | 'curve'
  | 'component'
  | 'effect'
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array';

export type SignalFormat = 'packet' | 'stream' | 'pulse';

export interface UniversalSocketDefinition {
  socketId: string;
  label: string;
  polarity: SignalPolarity;
  medium: SignalMedium;
  dataType: SignalDataType;
  signalType: SignalType;
  connectivity: ConnectivityType;
  socketIndex: number;
  description: string;
  colorHex?: number;
  colorStr?: string;
  bgStr?: string;
  iconName?: string;
  isCustom?: boolean;
  isOmni?: boolean;
  customMeta?: Record<string, any>;
}

export type NodeSocketDescriptor = UniversalSocketDefinition;

export interface StoredPacket {
  id: string;
  index: number;
  name: string;
  type: 'audio' | 'midi' | 'curve' | 'trigger';
  createdAt: number;
  durationBeats?: number;
  signalFormat?: SignalFormat;
  signalType?: SignalType;
  audioTrack?: AudioTrackData;
  pattern?: MidiPattern;
  curveData?: CurveTrackData;
  triggerPacket?: TriggerPacketData;
  sampleType?: SamplePresetType | string;
  customAudioUrl?: string;
  audioFormat?: 'mono' | 'stereo';
  waveformData?: number[];
  gain?: number;
  pan?: number;
  pitchShift?: number;
  filterCutoff?: number;
  fadeInBeats?: number;
  fadeOutBeats?: number;
  trimStartBeats?: number;
  trimEndBeats?: number;
  isReversed?: boolean;
}

export type EffectType =
  | 'repeater'
  | 'delay'
  | 'gain'
  | 'pan'
  | 'velocity'
  | 'eq'
  | 'compressor'
  | 'multiband_compressor'
  | 'limiter'
  | 'reverb'
  | 'saturation';

export type AffectableNodeType = 'trigger' | 'container';

export interface RepeaterEffectConfig {
  repeats: number; // 1 to 16 repeat pulses (default 3)
  repeatIntervalBeats: number; // in beats, e.g. 0.125, 0.25, 0.5, 1.0 (default 0.25)
  decay: number; // 0.0 to 1.0 velocity/gain decay per repeat (default 0.8)
}

export interface DelayEffectConfig {
  delayBeats: number; // in beats, e.g. 0.25, 0.5, 1.0, 2.0 (default 0.5)
  feedback: number; // 0.0 to 0.95 feedback decay (default 0.4)
  wetMix: number; // 0.0 to 1.0 (default 0.6)
  highCut?: number; // lowpass filter cutoff on feedback in Hz (default 6000)
  lowCut?: number; // highpass filter cutoff on feedback in Hz (default 120)
  pingPong?: boolean; // stereo bouncing delay
  syncToBpm?: boolean;
}

export interface GainEffectConfig {
  gain: number; // 0.0 to 2.0 amplitude scaling (default 1.0 = 100%)
  pan?: number; // -1.0 to 1.0 stereo balance (legacy field)
}

export interface PanEffectConfig {
  pan: number; // -1.0 to 1.0 stereo balance (default 0.0)
}

export interface VelocityEffectConfig {
  multiplier: number; // 0.0 to 2.0 velocity multiplier (default 1.0 = 100%)
  offset: number; // -64 to +64 velocity offset (default 0)
  randomize?: number; // 0 to 32 velocity randomization jitter (default 0)
}

export interface EqBandConfig {
  id: string;
  type: 'lowshelf' | 'peaking' | 'highshelf' | 'notch' | 'highpass' | 'lowpass';
  frequency: number; // 20 to 20000 Hz
  gain: number; // -18 to +18 dB
  q: number; // 0.1 to 18
  enabled: boolean;
  label?: string;
}

export interface EqEffectConfig {
  bands: EqBandConfig[];
  outputGain?: number; // -12 to +12 dB
}

export interface CompressorEffectConfig {
  threshold: number; // -60 to 0 dB (default -20)
  ratio: number; // 1 to 20 (default 4)
  attack: number; // 0.001 to 0.5 sec (default 0.01 = 10ms)
  release: number; // 0.01 to 1.0 sec (default 0.15 = 150ms)
  knee: number; // 0 to 40 dB (default 5)
  makeupGain: number; // 0 to 24 dB (default 0)
  mix: number; // 0.0 to 1.0 (default 1.0)
  // Sidechain routing
  sidechainEnabled?: boolean;
  sidechainSourceId?: string | null;
  sidechainGain?: number; // 0.0 to 2.0
}

export interface MultibandBandConfig {
  threshold: number; // -60 to 0 dB
  ratio: number; // 1 to 20
  attack: number; // 0.001 to 0.5s
  release: number; // 0.01 to 1.0s
  knee?: number;
  makeupGain: number; // -12 to +18 dB
  muted?: boolean;
  solo?: boolean;
}

export interface MultibandCompressorEffectConfig {
  crossoverLow: number; // default 150 Hz
  crossoverHigh: number; // default 2500 Hz
  lowBand: MultibandBandConfig;
  midBand: MultibandBandConfig;
  highBand: MultibandBandConfig;
  outputGain: number; // 0.0 to 2.0
  mix: number; // 0.0 to 1.0
  // Multiband sidechain routing
  sidechainEnabled?: boolean;
  sidechainSourceId?: string | null;
  sidechainBands?: 'all' | 'low' | 'mid' | 'high';
}

export interface LimiterEffectConfig {
  ceiling: number; // -12 to 0 dB (default -0.1 dB)
  threshold: number; // -24 to 0 dB (default -2 dB)
  release: number; // 0.005 to 0.5 sec (default 0.05s)
  lookaheadMs?: number; // 0 to 10 ms (default 3ms)
  softClip?: boolean;
  makeupGain?: number; // 0 to 12 dB
}

export interface ReverbEffectConfig {
  decayTime: number; // 0.1 to 10.0 sec (default 2.5)
  predelay: number; // 0 to 100 ms (default 20ms)
  damping: number; // 1000 to 20000 Hz (default 6000)
  roomSize: number; // 0.1 to 1.0 (default 0.7)
  stereoWidth?: number; // 0.0 to 1.0 (default 1.0)
  wetMix: number; // 0.0 to 1.0 (default 0.4)
  dryMix: number; // 0.0 to 1.0 (default 1.0)
}

export type SaturationType = 'tape' | 'tube' | 'soft_clip' | 'hard_clip' | 'foldback';

export interface SaturationEffectConfig {
  drive: number; // 0.0 to 10.0 (default 1.5)
  saturationType: SaturationType;
  tone: number; // 500 to 16000 Hz lowpass tone filter (default 8000)
  outputGain: number; // 0.0 to 2.0 (default 1.0)
  wetMix: number; // 0.0 to 1.0 (default 1.0)
}

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

export type AudioBusType = 'input' | 'output';

export interface NamedAudioBus {
  id: string;
  busType: AudioBusType;
  deviceId: string;
  name: string; // user-defined name e.g. "Main Mic", "Lead Vocal", "Master Monitors"
  channel?: number; // For input: 1 = Left/Mono, 2 = Right, 0 = Stereo, etc.
  outputChannels?: string; // For output: 'Ch 1 / 2 (Main L/R)', 'Ch 3 / 4 (Sub / Cue)', etc.
  gain: number; // 0.0 to 2.0
  isMuted: boolean;
  color?: string;
}

export type NamedAudioInput = NamedAudioBus;

export interface MidiDeviceConfig {
  id: string;
  customName?: string;
  enabled: boolean;
  channelFilter: number; // 0 = all channels, 1-16
}

export interface ConnectionsConfig {
  selectedAudioDeviceId: string;
  selectedAudioOutputDeviceId?: string;
  hardwareChannelCount?: number;
  namedAudioInputs: NamedAudioBus[];
  selectedMidiDeviceId: string | null;
  midiConfigs: Record<string, MidiDeviceConfig>;
}

export interface HardwareChannelInfo {
  id: number;
  label: string;
  shortLabel: string;
  isStereo: boolean;
  channels: number[]; // 1-indexed audio channels
}

export interface ComponentSocketConstraint {
  allowedNodeTypes: Array<'container' | 'module' | 'effect' | 'trigger' | 'combiner' | 'multiplexer'>;
  allowedContainerTypes?: Array<'audio' | 'midi' | 'curve' | 'instrument'>;
  allowedAudioFormats?: Array<'mono' | 'stereo'>;
  allowedModuleArchetypes?: string[];
  description: string;
}

export interface SampleZoneConfig {
  id: string;
  containerId?: string; // Connected Audio Container node ID
  sampleName: string;
  sampleType?: SamplePresetType | string;
  customAudioUrl?: string;
  minNote: number; // 0..127
  maxNote: number; // 0..127
  centerNote: number; // 0..127 (Root note of sample)
  startTime?: number; // start offset in seconds
  endTime?: number; // end offset in seconds
}

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

export type QuantizeDivision =
  | 'none'
  | '1/16'
  | '1/8'
  | '1/4'
  | '1/2'
  | '1_bar'
  | '2_bars'
  | '4_bars';

export type QuantizeStatus =
  | 'idle'
  | 'armed_waiting'
  | 'recording'
  | 'playing'
  | 'stopping_waiting';

export type RecorderType = 'audio' | 'audio_mono' | 'audio_stereo' | 'midi' | 'curve';

export type RecordingMode = 'standard' | 'retrospective';
export type BufferLengthType = 'bars_beats' | 'time_seconds';

export type PlayerType = 'audio' | 'audio_mono' | 'audio_stereo' | 'midi' | 'curve';

export interface RecorderNode {
  id: string;
  type: 'recorder';
  recorderType: RecorderType;
  recordingMode?: RecordingMode; // 'standard' (punch-in) or 'retrospective' (continuous rolling buffer capture)
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label?: string;
  active?: boolean;
  isRecording?: boolean;
  isArmed?: boolean;
  armMode?: 'auto' | 'manual' | 'quantized';
  quantizeEnabled?: boolean;
  quantizeDivision?: QuantizeDivision;
  quantizeStatus?: QuantizeStatus;
  pendingTriggerBeat?: number | null;
  pendingAction?: 'start_record' | 'stop_record' | null;
  recordingStartBeat?: number;
  targetPacketName?: string;
  recordingLengthBeats?: number;
  autoStoreOnStop?: boolean;
  currentDurationBeats?: number;
  recordedPacketsCount?: number;
  gain?: number;
  silenceThreshold?: number;
  targetContainerId?: string;
  isClipping?: boolean;
  lastTransferredAt?: number;
  // Retrospective Buffer Configuration (derived entirely from Bars, Beats, Beat Fractions: 1 beat = 64 fractions)
  bufferBars?: number; // e.g. 1, 2, 4, 6, 8 bars (default 4)
  bufferBeatsPart?: number; // 0..3 beats (default 0)
  bufferBeatFractions?: number; // 0..63 fractions (default 0)
  captureBoundaryRatio?: number; // 0..1 boundary marker position around the ring (default 0.33 or bar 2 / buffer)
  captureBoundaryBeats?: number; // threshold beat within cycle
  bufferLengthType?: BufferLengthType; // 'bars_beats' (mandatory musical clock)
  bufferLengthBars?: number; // backwards compatibility
  bufferLengthBeats?: number; // total beats computed from bars + beats + fractions/64
  bufferLengthSeconds?: number;
  captureToleranceBeatsBefore?: number;
  captureToleranceBeatsAfter?: number;
  lastCapturedTakeBeat?: number;
  lastCapturedPacketId?: string;
}

export interface PlayerNode {
  id: string;
  type: 'player';
  playerType: PlayerType;
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label?: string;
  active?: boolean;
  isPlaying?: boolean;
  isLooping?: boolean;
  playheadBeats?: number;
  volume?: number;
  gain?: number;
  playbackSpeed?: number;
  playbackMode?: 'forward' | 'reverse' | 'ping_pong' | 'oneshot' | 'loop';
  pitchShiftSemitones?: number;
  loopLengthBeats?: number;
  quantizeEnabled?: boolean;
  quantizeDivision?: QuantizeDivision;
  quantizeStatus?: QuantizeStatus;
  pendingTriggerBeat?: number | null;
  pendingAction?: 'start_play' | 'stop_play' | null;
  playbackStartBeat?: number;
  synthPreset?: SynthPreset;
  sampleZones?: SampleZoneConfig[];
}

export interface SamplerNode {
  id: string;
  type: 'sampler';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label?: string;
  active?: boolean;
  isPlaying?: boolean;
  volume?: number;
  rootKey?: number;
  glide?: number;
  polyphony?: number;
  zones?: any[];
  sampleZones?: SampleZoneConfig[];
  synthPreset?: SynthPreset;
}

export interface AudioPadItem {
  id: string;
  clipId?: string;
  name: string;
  containerId?: string;
  containerName?: string;
  audioFormat: 'mono' | 'stereo';
  midiNote: number;
  sampleType?: string;
  customAudioUrl?: string;
  waveformData?: number[];
  durationBeats?: number;
  gain?: number;
  pan?: number;
  audioTrack?: AudioTrackData;
}

export interface AudioPadsNode {
  id: string;
  type: 'audio_pads';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label?: string;
  active?: boolean;
  pads?: AudioPadItem[];
  padMidiMap?: Record<string, number>;
  selectedPadId?: string;
  volume?: number;
}

export type SignalKind = 'all' | 'trigger' | 'trigger_stream' | 'trigger_packet' | 'midi' | 'audio' | 'audio_mono' | 'audio_stereo' | 'curve' | 'component';

export interface ConverterNode {
  id: string;
  type: 'converter';
  converterType: 'stereo_to_mono' | 'mono_to_stereo';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label: string;
  active: boolean;
  mode?: 'sum' | 'left' | 'right'; // For stereo_to_mono: 'sum' (L+R), 'left', 'right'
  gain?: number; // 0.0 to 2.0 amplitude scaling
}

export interface CombinerNode {
  id: string;
  type: 'combiner';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label: string;
  active: boolean;
  signalType: SignalKind;
  inputCount: number; // Settable number of input sockets (2 to 8)
  combineMode: 'sum' | 'merge' | 'or' | 'average' | 'max';
  gain?: number;
}

export interface MultiplexerNode {
  id: string;
  type: 'multiplexer';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label: string;
  active: boolean;
  signalType: SignalKind;
  outputCount: number; // Settable number of output sockets (2 to 8)
  distributionMode: 'broadcast' | 'round_robin' | 'channel_select';
  activeChannel?: number;
  gain?: number;
}

export interface ModuleSocketMapping {
  id: string; // unique mapping ID
  direction: 'input' | 'output';
  innerNodeId: string;
  innerPortId?: string; // port on inner node (e.g. 'capture', 'record', 'play_stop', or specific socket)
  innerSocketIndex?: number;
  label: string; // user-visible label for the exposed module socket, e.g. "Clock In", "Audio L/R", "Mod CV", "MIDI Ch 1"
  signalType: SignalType;
  moduleSocketIndex: number; // 0, 1, 2... index on the module's outer shell
}

export interface ModuleNode {
  id: string;
  type: 'module' | 'group';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label: string;
  active: boolean;
  description?: string;
  category?: string;
  // Nested Sub-Graph Flow
  innerNodes: SpaceNode[];
  innerConnections: NodeConnection[];
  // Dynamic Sockets Exposed to Outer Graph
  exposedInputs: ModuleSocketMapping[];
  exposedOutputs: ModuleSocketMapping[];
  isPlaying?: boolean;
}

/**
 * GroupNode:
 * Collapsed UI/container representation of an existing collection of graph nodes.
 * Preserves internal node group.
 * NOT a reusable graph invocation.
 */
export interface GroupNode {
  id: string;
  type: 'group';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label: string;
  active: boolean;
  description?: string;
  category?: string;
  innerNodes: SpaceNode[];
  innerConnections: NodeConnection[];
  exposedInputs: ModuleSocketMapping[];
  exposedOutputs: ModuleSocketMapping[];
  isPlaying?: boolean;
  socketOffsets?: Record<string, { x: number; y: number }>;
}

export interface PhysicalInputDefinition {
  id?: string;
  name?: string;
  type: string;
  channels?: 'Mono' | 'Stereo' | 'mono' | 'stereo' | string;
  variant?: string;
  config?: Record<string, any>;
}

export interface PhysicalOutputDefinition {
  id?: string;
  name?: string;
  type: string;
  channels?: 'Mono' | 'Stereo' | 'mono' | 'stereo' | string;
  variant?: string;
  config?: Record<string, any>;
}

export interface GraphDefinition {
  id: string;
  name: string;
  description?: string;
  physicalInputs: PhysicalInputDefinition[];
  physicalOutputs: PhysicalOutputDefinition[];
  nodes?: SpaceNode[];
  connections?: NodeConnection[];
  bpm?: number;
}

export interface SubgraphHandle {
  id: string;
  name: string;
  label: string;
  direction: 'input' | 'output';
  dataType: string;
  type: string;
  channels?: 'Mono' | 'Stereo' | 'mono' | 'stereo' | string;
  variant: 'Stream' | 'STREAM';
  signalType: SignalType;
  socketIndex: number;
}

/**
 * SubgraphNode:
 * Reusable invocation of a saved graph.
 * Graph-as-node.
 * Dynamically derives exposed I/O from the invoked graph definition.
 */
export interface SubgraphNode {
  id: string;
  type: 'subgraph';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label: string;
  active: boolean;
  graphId: string;
  graphName: string;
  reference?: GraphDefinition;
  inputHandles: SubgraphHandle[];
  outputHandles: SubgraphHandle[];
  customSockets?: UniversalSocketDefinition[];
  socketOffsets?: Record<string, { x: number; y: number }>;
}

export type ControlElementType =
  | 'slider'
  | 'knob'
  | 'button'
  | 'toggle'
  | 'xy_pad'
  | 'text_input'
  | 'num_input'
  | 'dropdown'
  | 'pad_matrix'
  | 'meter';

export type ControlPayloadType =
  | 'trigger_pulse'
  | 'midi_cc'
  | 'midi_note'
  | 'synth_param'
  | 'curve_value'
  | 'raw_json'
  | 'custom_string';

export interface ControlBinding {
  targetNodeId?: string;
  targetSocketId?: string;
  targetSocketIndex?: number;
  targetDirection?: 'input' | 'output';
  payloadType: ControlPayloadType;
  synthParam?: 'cutoff' | 'resonance' | 'volume' | 'pan' | 'attack' | 'release' | 'bpm' | 'masterVolume';
  midiChannel?: number;
  midiCC?: number;
  midiNote?: number;
  midiVelocity?: number;
  staticPayload?: any;
  dynamicTemplate?: string;
  midiLearn?: {
    deviceId?: string;
    channel?: number;
    type: 'cc' | 'note' | 'pitchbend';
    controllerNumber?: number;
  };
  oscLearn?: {
    address: string;
    argIndex?: number;
    minIn?: number;
    maxIn?: number;
  };
}

export interface ControlElement {
  id: string;
  type: ControlElementType;
  label: string;
  x: number; // grid col (0..11)
  y: number; // grid row (0..7)
  w: number; // width in grid units (e.g. 2, 3, 4, 6)
  h: number; // height in grid units (e.g. 2, 3, 4)
  value: number | string | boolean | [number, number];
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: any }[];
  color?: string;
  isMomentary?: boolean;
  binding?: ControlBinding;
}

export interface ExposedSocketReference {
  id: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  socketId: string;
  socketIndex: number;
  label: string;
  direction: 'input' | 'output';
  signalType: SignalType;
  medium?: SignalMedium;
  dataType?: SignalDataType;
  isExposed: boolean;
}

export interface ControlNode {
  id: string;
  type: 'control';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label: string;
  active: boolean;
  isEditMode: boolean; // toggle: true = layout/edit widgets, false = active performance controls
  elements: ControlElement[];
  gridColumns: number; // default 12
  gridRows: number; // default 8
  theme?: 'slate' | 'cyberpunk' | 'amber_gold' | 'neon_violet';
  customSockets?: UniversalSocketDefinition[];
  exposedSockets?: ExposedSocketReference[];
}

export interface InputStripNode {
  id: string;
  type: 'input_strip';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label?: string;
  active?: boolean;
  isLocked?: boolean;
  mapIoConfig?: MapIoConfig;
  customSockets?: UniversalSocketDefinition[];
}

export interface OutputStripNode {
  id: string;
  type: 'output_strip';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label?: string;
  active?: boolean;
  isLocked?: boolean;
  mapIoConfig?: MapIoConfig;
  customSockets?: UniversalSocketDefinition[];
}

export interface ButtonNode {
  id: string;
  type: 'button';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label?: string;
  active?: boolean;
  buttonMode: 'momentary' | 'toggle';
  buttonState: boolean;
}

export type ArrangementSignalType = 'audio' | 'audio_mono' | 'audio_stereo' | 'midi' | 'trigger' | 'trigger_stream' | 'trigger_packet' | 'curve';

export interface ArrangementClip {
  id: string;
  name: string;
  containerId?: string;
  signalType: ArrangementSignalType;
  startBeat: number;
  durationBeats: number;
  offsetBeats?: number;
  color?: string;
  audioTrack?: AudioTrackData;
  waveformData?: number[];
  sampleType?: string;
  customAudioUrl?: string;
  audioFormat?: 'mono' | 'stereo';
  pattern?: MidiPattern;
  notes?: MidiNote[];
  triggerPulses?: TriggerPulse[];
  triggerPacket?: TriggerPacketData;
  activeSteps?: boolean[];
  stepCount?: number;
  curveData?: CurveTrackData;
}

export interface ArrangementTrack {
  id: string;
  name: string;
  signalType: ArrangementSignalType;
  color: string;
  isMuted?: boolean;
  isSolo?: boolean;
  volume?: number;
  pan?: number;
  clips: ArrangementClip[];
}

export interface ArrangementNode {
  id: string;
  type: 'arrangement';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label?: string;
  active?: boolean;
  width: number;
  height: number;
  tracks: ArrangementTrack[];
  totalBars: number;
  timeSignature: [number, number];
  currentBeat: number;
  isPlaying?: boolean;
  isLooping?: boolean;
  loopStartBeat?: number;
  loopEndBeat?: number;
  snapSetting?: 'bar' | '1/2' | '1/4' | '1/8' | 'free';
  zoom?: number;
  socketOffsets?: Record<string, { x: number; y: number }>;
}

export interface CodeNode {
  id: string;
  type: 'code';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label?: string;
  active: boolean;
  code: string; // Standard JavaScript code payload
  width: number; // Resizable width (default 380)
  height: number; // Resizable height (default 260)
  executionMode?: 'enrich' | 'eval_and_enrich' | 'on_pulse';
  lastErrorMessage?: string | null;
  lastExecutionOutput?: any;
  totalPulsesProcessed?: number;
  socketOffsets?: Record<string, { x: number; y: number }>;
}

export interface StringNode {
  id: string;
  type: 'primitive_string';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label?: string;
  active: boolean;
  value?: string;
  socketOffsets?: Record<string, { x: number; y: number }>;
}

export interface NumberNode {
  id: string;
  type: 'primitive_number';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label?: string;
  active: boolean;
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  socketOffsets?: Record<string, { x: number; y: number }>;
}

export interface BooleanNode {
  id: string;
  type: 'primitive_boolean';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label?: string;
  active: boolean;
  value: boolean;
  socketOffsets?: Record<string, { x: number; y: number }>;
}

export interface ObjectNode {
  id: string;
  type: 'primitive_object';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label?: string;
  active: boolean;
  value?: Record<string, any>;
  rawJson?: string;
  socketOffsets?: Record<string, { x: number; y: number }>;
}

export interface FolderPathNode {
  id: string;
  type: 'folder_path';
  name: string;
  position: [number, number, number];
  color: string;
  radius: number;
  label?: string;
  active: boolean;
  scope: AssetPoolScope;
  selectedFolder?: string;
  folders?: string[];
  foldersData?: Array<{
    name: string;
    dataType?: string;
    channelType?: string;
    fileCount?: number;
    path: string;
  }>;
  socketOffsets?: Record<string, { x: number; y: number }>;
}

export type SpaceNode = (
  | TriggerNode
  | ContainerNode
  | EffectNode
  | CombinerNode
  | MultiplexerNode
  | ModuleNode
  | GroupNode
  | SubgraphNode
  | ConverterNode
  | RecorderNode
  | PlayerNode
  | SamplerNode
  | AudioPadsNode
  | ControlNode
  | InputStripNode
  | OutputStripNode
  | ButtonNode
  | ArrangementNode
  | CodeNode
  | StringNode
  | NumberNode
  | BooleanNode
  | ObjectNode
  | FolderPathNode
) & {
  socketOffsets?: Record<string, { x: number; y: number }>;
};

export interface ModulePreset {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  color: string;
  author?: string;
  createdAt: number;
  innerNodes: SpaceNode[];
  innerConnections: NodeConnection[];
  exposedInputs: ModuleSocketMapping[];
  exposedOutputs: ModuleSocketMapping[];
}

export interface QwnsrProjectBundle {
  format: 'qwnsr_project';
  version: '1.0.0';
  appName: 'Qwnsr Control';
  exportedAt: number;
  project: DawProject;
  appearanceSettings?: AppearanceSettings;
}

export interface QwnsrModuleBundle {
  format: 'qwnsr_module';
  version: '1.0.0';
  appName: 'Qwnsr Control';
  exportedAt: number;
  preset: ModulePreset;
}

export interface WireSignalPayload {
  type: SignalType;
  timestamp: number;
  midiNote?: {
    note: number;
    name: string;
    velocity: number;
    duration: number;
  };
  audioSpec?: {
    sampleName?: string;
    sampleRate: number;
    channels: number;
    gain: number;
    durationBeats: number;
    format: string;
  };
  triggerSpec?: {
    pulseIntensity: number;
    division?: string;
    sourceName?: string;
    pulse?: TriggerPulse;
  };
  curveSpec?: {
    targetParam: string;
    value: number;
    normalizedValue: number;
  };
}

export interface NodeConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  fromPort?: string;
  fromSocketId?: string;
  fromSocketIndex?: number;
  toPort?: 'record' | 'capture' | 'play_stop' | 'play_pause' | string;
  toSocketId?: string;
  toSocketIndex?: number;
  signalType?: SignalType; // Canonical signal protocol traveling along this wire
  signalMedium?: SignalMedium;
  signalDataType?: SignalDataType;
  latencyBeats: number;
  lastPulseTime?: number;
  lastSignalPayload?: WireSignalPayload;
  effectOrder?: string[]; // IDs of effects arranged in execution precedence
  affectedByEffectIds?: string[]; // IDs of effect spheres currently enveloping this wire
  dryMix?: number; // 0.0 to 1.0 (default 1.0)
  wetMix?: number; // 0.0 to 1.0 (default 1.0)
  signalGain?: number; // 0.0 to 2.0 (default 1.0)
  controlPoint?: [number, number, number]; // Draggable middle signboard control point coordinate
  isLocked?: boolean;
}

export type UniversalWire = NodeConnection;

export interface MidiInputDevice {
  id: string;
  name: string;
  manufacturer: string;
  state: string;
}

export interface AppSceneState {
  bpm: number;
  masterVolume: number;
  isGlobalPlaying: boolean;
  nodes: SpaceNode[];
  connections: NodeConnection[];
}

export type NodeCategoryKey =
  | 'container_midi'
  | 'container_audio'
  | 'container_curve'
  | 'trigger_beats'
  | 'trigger_beat_fractions'
  | 'effect_repeater'
  | 'effect_delay'
  | 'module'
  | 'control';

export interface NodeMeshSetting {
  meshUrl: string; // 'default_pbr' or filename/url e.g. '/assets/3d_meshes/stellar_crystal.obj'
  meshName?: string;
  scale: number; // 0.2 to 3.0, default 1.0
  rotationSpeed: number; // 0.0 to 5.0, default 1.0
  wireframe: boolean;
  emissiveIntensity: number; // 0.0 to 3.0
  ringOrbit: boolean;
  colorOverride?: string;
}

export interface MeshAssetItem {
  filename: string;
  format: string;
  url: string;
  size: number;
  label: string;
  isBuiltin?: boolean;
}

export interface AppearanceSettings {
  categoryMeshes: Record<NodeCategoryKey, NodeMeshSetting>;
  nodeOverrides?: Record<string, Partial<NodeMeshSetting>>;
  particleDensity: number;
  bloomIntensity: number;
  themePreset: 'black_and_gold' | 'deep_space_blue' | 'cyber_neon' | 'coffee_theme';
}

export type BiomeType = 'verdant_forest' | 'volcanic_citadel' | 'arcane_valley' | 'autumn_highlands' | 'default';

export interface INodeVisuals {
  triggerNodeFlash: (nodeId: string) => void;
  triggerVisualFeedback?: (nodeId: string) => void;
  spawnLaserPulse?: (sourcePosition: [number, number, number], destPosition: [number, number, number], color?: any, connId?: string) => void;
  triggerPulseForNodeConnections?: (nodeId: string, payload: any) => void;
}

export interface CanvasInteractionManager {
  focusOnPosition: (pos: [number, number, number]) => void;
  resetView: () => void;
  panBy?: (dirX: number, dirZ: number, speed?: number) => void;
}

export * from './auth';



export type GraphType = "master_project" | "subgraph" | "module" | "effect_chain" | "synth_patch" | "custom";

export interface GraphFolderInfo {
  name: string;
  dataType: AssetDataType;
  channelType?: AssetChannelType;
  fileCount: number;
  path: string;
}

export interface GraphAssetItem {
  id: string;
  filename: string;
  name: string;
  dataType: AssetDataType;
  channelType?: AssetChannelType;
  folder: string;
  url: string;
  size: number;
  createdAt: number;
}

export interface GraphPackageMetadata {
  id: string;
  name: string;
  description: string;
  type: GraphType;
  customTypeTag?: string;
  version: string;
  author?: string;
  tags: string[];
  color?: string;
  createdAt: number;
  updatedAt: number;
  nodeCount: number;
  connectionCount: number;
  bpm: number;
  dependencies?: string[];
  folderPath?: string;
}

export interface GraphPackage extends GraphPackageMetadata {
  nodes: SpaceNode[];
  connections: NodeConnection[];
  mapIoConfig?: MapIoConfig;
  masterVolume?: number;
  currentBiome?: BiomeType;
  [key: string]: any;
}
