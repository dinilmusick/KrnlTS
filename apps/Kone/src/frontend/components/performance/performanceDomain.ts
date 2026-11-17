import type {GraphEdge,GraphNode} from '@ultrst-armada/kloks/state-graph';
import {durationFromBars,instrumentNode,midiSampleNode,multiplexerNode,selectorNode,type MusicalDuration} from './executionFlowGraph.js';
export interface InstrumentDefinition{id:string;name:string}
export interface SoundDefinition{id:string;name:string;soundGroupId?:string}
export interface SoundGroupDefinition{id:string;name:string;soundIds:string[];midiDeviceKey:string}
export interface MotifDefinition{id:string;name:string}
export interface CodeBlockDefinition{id:string;name:string;code:string;language:'javascript'}
export interface SectionDefinition{id:string;name:string;graph:{nodes:GraphNode[];edges:GraphEdge[]};duration:MusicalDuration;motifs:MotifDefinition[];codeBlocks:CodeBlockDefinition[]}
export interface SongDefinition{id:string;name:string;instruments:InstrumentDefinition[];sounds:SoundDefinition[];soundGroups:SoundGroupDefinition[];motifs:MotifDefinition[];codeBlocks:CodeBlockDefinition[];sections:SectionDefinition[]}
export interface PerformanceDefinition{id:string;name:string;songs:SongDefinition[];codeBlocks:CodeBlockDefinition[];motifs:MotifDefinition[];sounds:SoundDefinition[];soundGroups:SoundGroupDefinition[]}
export function createSectionDefinition(id:string,name:string,instruments:InstrumentDefinition[]):SectionDefinition{
 const sample=midiSampleNode('midi-sample-1','MIDI Sample 1',80,140,1);
 const instrumentNodes=instruments.map((i,index)=>instrumentNode(`instrument-${i.id}`,i.name,760,80+index*150,i.id));
 const selector=selectorNode('section-selector',420,40,2,'Section','section-selector'), multiplexer=multiplexerNode('section-multiplexer',420,280,2,'Section');
 const edges:GraphEdge[]=instrumentNodes.length?[{id:'edge-midi-instrument',source:sample.id,sourceSocket:'midi-out',target:instrumentNodes[0].id,targetSocket:'midi-in'}]:[];
 return {id,name,graph:{nodes:[sample,selector,multiplexer,...instrumentNodes],edges},duration:durationFromBars(1),motifs:[],codeBlocks:[]};
}
export function createSongDefinition(id:string,name='Song'):SongDefinition{return{id,name,instruments:[{id:'instrument-1',name:'Instrument 1'}],sounds:[],soundGroups:[],motifs:[],codeBlocks:[],sections:[]}}
export function createPerformanceDefinition(id:string,name='Performance'):PerformanceDefinition{return{id,name,songs:[createSongDefinition(`${id}-song-1`,'Song 1')],codeBlocks:[],motifs:[],sounds:[],soundGroups:[]}}
export function getSongInstrument(song:SongDefinition,instrumentId:string){return song.instruments.find(i=>i.id===instrumentId)}
