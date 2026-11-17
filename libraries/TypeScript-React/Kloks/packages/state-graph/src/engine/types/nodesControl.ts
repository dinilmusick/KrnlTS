// ═══════════════════════════════════════════════════════════════════
// CONTROL, STRIP & INTERACTIVE UI NODES
// ═══════════════════════════════════════════════════════════════════
import {
  SignalType,
  SignalMedium,
  SignalDataType,
  UniversalSocketDefinition,
} from "./signals";
import { MapIoConfig, MapChannelConfig } from "./sceneData";

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
