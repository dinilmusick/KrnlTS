'use client';

import {useEffect,useMemo,useState} from 'react';
import {BaseButton} from '@ultrst-armada/floks/ui';
import type {GraphEdge,GraphNode} from '@ultrst-armada/kloks/state-graph';
import {ExecutionRuntime,type ExecutionLifecycle} from './executionRuntime.js';
import {registerDefaultTemporalHandlers} from './executionRuntimeTemporal.js';
import type {KoneTransport,KoneTransportState} from './transport.js';

function isTerminalExecutionState(state: ExecutionLifecycle): boolean {
  return state === 'COMPLETED' || state === 'FAILED' || state === 'STOPPED';
}

export function ExecutionControls({graphId,nodes,edges,entryNodeIds,transport}:{graphId:string;nodes:GraphNode[];edges:GraphEdge[];entryNodeIds:string[];transport:KoneTransport}){
 const [executionId,setExecutionId]=useState<string|null>(null);
 const [state,setState]=useState<ExecutionLifecycle>('IDLE');
 const [transportState,setTransportState]=useState<KoneTransportState>(transport.getState());
 const runtime=useMemo(()=>new ExecutionRuntime({onEvent:event=>{
   if(event.type==='started'){setExecutionId(event.executionId);setState('RUNNING');}
   else if(event.type==='paused')setState('PAUSED');
   else if(event.type==='resumed')setState('RUNNING');
   else if(event.type==='completed')setState('COMPLETED');
   else if(event.type==='stopped')setState('STOPPED');
   else if(event.type==='failed')setState('FAILED');
 }}),[]);
 useEffect(()=>{registerDefaultTemporalHandlers(runtime);runtime.registerGraph({id:graphId,nodes,edges});},[runtime,graphId,nodes,edges]);
 useEffect(()=>transport.subscribe(setTransportState),[transport]);
 useEffect(()=>()=>{
  if (!executionId) return;
  const execution = runtime.getExecution(executionId);
  if (execution && !isTerminalExecutionState(execution.state)) void runtime.stop(executionId).catch(()=>{});
},[runtime,executionId]);

 const play=async()=>{try{if(state!=='RUNNING'&&state!=='PAUSED'){const id=await runtime.trigger(graphId,entryNodeIds,{},undefined,transport);setExecutionId(id);setState(runtime.getExecution(id)?.state ?? 'FAILED');}}catch(error){console.error('[Kone] execution failed',error);setState('FAILED');}};
 const pause=async()=>{if(executionId&&state==='RUNNING')await runtime.pause(executionId);else transport.dispatch('pause');};
 const resume=async()=>{if(executionId&&state==='PAUSED')await runtime.play(executionId);else transport.dispatch('play');};
 const stop=async()=>{if(executionId){const execution=runtime.getExecution(executionId);if(execution&&!isTerminalExecutionState(execution.state))await runtime.stop(executionId);}transport.dispatch('stop');transport.dispatch('reset');setState('STOPPED');setExecutionId(null);};
 return <div role="toolbar" aria-label="Execution controls" style={{display:'flex',alignItems:'center',gap:6,padding:6,border:'var(--skipo-border)',borderRadius:'var(--skipo-radius)',background:'var(--skipo-surface)',fontSize:11}}>
   <BaseButton variant="accent" size="sm" onClick={play} disabled={state==='RUNNING'||state==='PAUSED'}>▶ Play</BaseButton>
   <BaseButton variant="secondary" size="sm" onClick={pause} disabled={state!=='RUNNING'}>Ⅱ Pause</BaseButton>
   <BaseButton variant="secondary" size="sm" onClick={resume} disabled={state!=='PAUSED'}>↻ Resume</BaseButton>
   <BaseButton variant="secondary" size="sm" onClick={stop} disabled={!executionId&&transportState.transport==='stopped'}>■ Stop</BaseButton>
   <span aria-label="Execution state">{state} · {transportState.transport} · beat {transportState.beat.toFixed(2)}</span>
 </div>;
}
