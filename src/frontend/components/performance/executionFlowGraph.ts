'use client';

import type { GraphEdge, GraphNode } from '@ultrst-armada/kloks/state-graph';
import {
  BEAT_FRACTIONS_PER_BAR,
  BEAT_FRACTIONS_PER_BEAT,
  BEATS_PER_BAR,
  durationFromBars,
  durationFromBeatFractions,
  type MusicalDuration,
} from './musicalTiming.js';

export {
  BEAT_FRACTIONS_PER_BAR,
  BEAT_FRACTIONS_PER_BEAT,
  BEATS_PER_BAR,
  durationFromBars,
  durationFromBeatFractions,
};
export type { MusicalDuration };

export const EXECUTION_FLOW = 'ExecutionFlow';
export const MIDI = 'MIDI';
export const INTEGER = 'NUMBER';
export const selectorInput = 'execution-in';
export const selectorSelection = 'selection';
export const selectorOutput = (index: number) => `execution-out-${index}`;
export const multiplexerOutput = (index: number) => `execution-out-${index}`;

export interface MidiNoteDefinition {
  id: string;
  pitch: number;
  start: number;
  duration: number;
  velocity?: number;
}

export function socket(id: string, label: string, type: 'input' | 'output', dataType: string) {
  return {
    id,
    label,
    type,
    dataType,
    connectionMode: type === 'input' ? ('SINGLE' as const) : ('MULTI' as const),
  };
}

export function sequenceNode(
  id: string,
  label: string,
  x: number,
  y: number,
  type = 'performance-sequence',
  duration?: MusicalDuration,
): GraphNode {
  return {
    id,
    type,
    label,
    position: { x, y },
    inputs: [socket('execution-in', 'Execution In', 'input', EXECUTION_FLOW)],
    outputs: [socket('execution-out', 'Execution Out', 'output', EXECUTION_FLOW)],
    data: duration ? { execution: { duration, durationSource: 'derived' } } : undefined,
  };
}

export function sectionNode(
  id: string,
  label: string,
  x: number,
  y: number,
  duration: MusicalDuration = durationFromBars(0),
): GraphNode {
  return {
    ...sequenceNode(id, label, x, y, 'song-section', duration),
    data: {
      execution: { duration, durationSource: 'derived', manual: false },
      sectionId: id.replace(/^section-node-/, ''),
    },
  };
}

export function midiSampleNode(
  id: string,
  label: string,
  x: number,
  y: number,
  durationBars = 1,
  notes: MidiNoteDefinition[] = [],
): GraphNode {
  const duration = durationFromBars(durationBars);
  return {
    id,
    type: 'midi-sample',
    label,
    position: { x, y },
    inputs: [socket('execution-in', 'Execution In', 'input', EXECUTION_FLOW)],
    outputs: [
      socket('execution-out', 'Execution Out', 'output', EXECUTION_FLOW),
      socket('midi-out', 'MIDI Out', 'output', MIDI),
    ],
    data: {
      midiSample: {
        notes,
        duration,
        timing: { unit: 'beat-fraction', fractionsPerBeat: BEAT_FRACTIONS_PER_BEAT, beatsPerBar: BEATS_PER_BAR },
      },
      execution: { duration, durationSource: 'musical-measure', timed: true },
    },
  };
}

export function soundNode(id:string,label:string,x:number,y:number,soundId=''):GraphNode{return{id,type:'sound',label,position:{x,y},inputs:[socket('midi-in','MIDI In','input',MIDI)],outputs:[],data:{soundId,routing:'derived-from-sound-group'}}}
export function midiInputNode(id:string,label:string,x:number,y:number,deviceId='',channel=0):GraphNode{const safe=Math.max(0,Math.min(15,Math.trunc(channel)));return{id,type:'midi-input',label,position:{x,y},inputs:[],outputs:[socket('midi-out','MIDI Out','output',MIDI)],data:{midiInput:{deviceId,channel:safe,channels:Array.from({length:16},(_,i)=>i),routing:'kloks.midi'}}}}
export function instrumentNode(id: string, label: string, x: number, y: number, instrumentId: string): GraphNode {
  return {
    id,
    type: 'instrument',
    label,
    position: { x, y },
    inputs: [socket('midi-in', 'MIDI In', 'input', MIDI)],
    outputs: [],
    data: { instrumentId, midiRoute: 'song-scoped' },
  };
}

export function selectorNode(
  id: string,
  x: number,
  y: number,
  outputCount = 2,
  category = 'Performance',
  type = 'performance-selector',
): GraphNode {
  return {
    id,
    type,
    label: 'Selector',
    position: { x, y },
    inputs: [
      socket(selectorInput, 'Execution In', 'input', EXECUTION_FLOW),
      socket(selectorSelection, 'Selection', 'input', INTEGER),
    ],
    outputs: Array.from({ length: Math.max(1, outputCount) }, (_, index) =>
      socket(selectorOutput(index), `Execution ${index + 1}`, 'output', EXECUTION_FLOW),
    ),
    data: {
      category,
      executionFlow: {
        input: selectorInput,
        selection: selectorSelection,
        outputs: 'dynamic',
        selectionValue: 'integer',
        instantaneous: true,
      },
    },
  };
}

export function multiplexerNode(id: string, x: number, y: number, outputCount = 2, category = 'Section'): GraphNode {
  return {
    id,
    type: 'multiplexer',
    label: 'Multiplexer',
    position: { x, y },
    inputs: [socket('execution-in', 'Execution In', 'input', EXECUTION_FLOW)],
    outputs: Array.from({ length: Math.max(1, outputCount) }, (_, index) =>
      socket(multiplexerOutput(index), `Execution ${index + 1}`, 'output', EXECUTION_FLOW),
    ),
    data: {
      category,
      executionFlow: { input: 'execution-in', outputs: 'dynamic', fanOut: 'all', instantaneous: true },
    },
  };
}

export function selectorEdges(selectorId: string, targetNodes: Array<{ id: string }>): GraphEdge[] {
  return targetNodes.map((node, index) => ({
    id: `edge-${selectorId}-${node.id}`,
    source: selectorId,
    sourceSocket: selectorOutput(index),
    target: node.id,
    targetSocket: 'execution-in',
    locked: true,
  }));
}

export function multiplexerEdges(multiplexerId: string, targetNodes: Array<{ id: string }>): GraphEdge[] {
  return targetNodes.map((node, index) => ({
    id: `edge-${multiplexerId}-${node.id}`,
    source: multiplexerId,
    sourceSocket: multiplexerOutput(index),
    target: node.id,
    targetSocket: 'execution-in',
    locked: true,
  }));
}
