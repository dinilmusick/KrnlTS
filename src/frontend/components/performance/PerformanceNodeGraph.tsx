'use client';
import {useEffect,useMemo} from 'react';
import {FrnlEditableNodeGraph} from '@ultrst-armada/floks/canvas-ui';
import {BaseButton} from '@ultrst-armada/floks/ui';
import type {GraphEdge} from '@ultrst-armada/kloks/state-graph';
import {useKoneGraphState} from './graphState.js';
import type {SongDefinition} from './performanceDomain.js';
import {MidiInputControls} from './MidiInputControls.js';
import {ExecutionControls} from './ExecutionControls.js';
import {createKoneTransport} from './transport.js';
import {EXECUTION_FLOW,midiInputNode,multiplexerNode,multiplexerOutput,selectorEdges,selectorNode,selectorOutput,sequenceNode,socket} from './executionFlowGraph.js';
export {EXECUTION_FLOW};
export function createPerformanceGraph(songs:SongDefinition[]=[],outputCount=2,fanOutCount=2){
 const song=songs[0],songNode=sequenceNode('song',song?.name??'Song',60,120); songNode.data={...(songNode.data??{}),songId:song?.id??'song-1'};
 const nodes=[songNode,sequenceNode('intro','Intro',940,40),sequenceNode('interlude','Interlude',940,220),selectorNode('selector',620,120,outputCount),multiplexerNode('multiplexer',620,380,fanOutCount,'Performance')];
 const edges:GraphEdge[]=[{id:'edge-song-selector',source:'song',sourceSocket:'execution-out',target:'selector',targetSocket:'execution-in',locked:true},...selectorEdges('selector',nodes.filter(n=>n.id==='intro'||n.id==='interlude').slice(0,outputCount))];
 return{nodes,edges};
}
export function PerformanceNodeGraph({songs=[],onSongDoubleClick}:{songs?:SongDefinition[];onSongDoubleClick?:(id:string)=>void}){
 const initial=useMemo(()=>createPerformanceGraph(songs),[songs]);
 const graph=useKoneGraphState(initial.nodes,initial.edges);
 const transport=useMemo(()=>createKoneTransport({tempo:120,resolution:64,timeSignature:[4,4]}),[]);
 useEffect(()=>()=>transport.dispose(),[transport]);
 const selector=graph.nodes.find(n=>n.id==='selector'),multiplexer=graph.nodes.find(n=>n.id==='multiplexer');
 const outputCount=selector?.outputs?.length??2,fanOutCount=multiplexer?.outputs?.length??2;
 const setOutputCount=(next:number)=>{const count=Math.max(1,Math.min(16,next));graph.updateNode('selector',{outputs:Array.from({length:count},(_,i)=>socket(selectorOutput(i),`Execution ${i+1}`,'output',EXECUTION_FLOW))});graph.setEdges((es)=>es.filter(e=>e.source!=='selector'||Number(e.sourceSocket.replace('execution-out-',''))<count));};
 const setFanOutCount=(next:number)=>{const count=Math.max(1,Math.min(16,next));graph.updateNode('multiplexer',{outputs:Array.from({length:count},(_,i)=>socket(multiplexerOutput(i),`Execution ${i+1}`,'output',EXECUTION_FLOW))});};
 const addMidiInput=(deviceId:string,channel:number)=>graph.addNode(midiInputNode(`midi-input-${graph.nodes.filter(n=>n.type==='midi-input').length+1}`,'MIDI Input',60,340,deviceId,channel));
 return <section aria-label="Performance Node Graph" style={{height:'100%',minHeight:0,position:'relative'}}>
  <div style={{position:'absolute',top:12,left:12,zIndex:80,display:'flex',alignItems:'center',gap:6,padding:6,border:'var(--skipo-border)',borderRadius:'var(--skipo-radius)',background:'var(--skipo-surface)'}}>
   <span style={{fontSize:11}}>Selector: {outputCount}</span><BaseButton variant="secondary" size="sm" disabled={outputCount<=1} onClick={()=>setOutputCount(outputCount-1)}>−</BaseButton><BaseButton variant="secondary" size="sm" disabled={outputCount>=16} onClick={()=>setOutputCount(outputCount+1)}>+</BaseButton>
   <span style={{fontSize:11}}>Multiplexer: {fanOutCount}</span><BaseButton variant="secondary" size="sm" disabled={fanOutCount<=1} onClick={()=>setFanOutCount(fanOutCount-1)}>−</BaseButton><BaseButton variant="secondary" size="sm" disabled={fanOutCount>=16} onClick={()=>setFanOutCount(fanOutCount+1)}>+</BaseButton><MidiInputControls onAdd={addMidiInput}/>
  </div>
  <div style={{position:'absolute',top:12,right:12,zIndex:80}}><ExecutionControls graphId="performance" nodes={graph.nodes} edges={graph.edges} entryNodeIds={['song']} transport={transport}/></div>
  <FrnlEditableNodeGraph id="performance-node-graph" nodes={graph.nodes} edges={graph.edges} viewport={graph.viewport} selectedNodeIds={graph.selectedNodeIds} onNodesChange={(nodes) => graph.setNodes(nodes as any)} onEdgesChange={(edges) => graph.setEdges(edges as any)} onViewportChange={graph.updateViewport} onSelectionChange={(ids) => graph.setSelectedNodeIds(ids as any)} onNodeDoubleClick={nodeId=>{if(nodeId==='song')onSongDoubleClick?.(String(graph.nodes.find(n=>n.id==='song')?.data?.songId??'song-1'));}}/>
 </section>;
}
