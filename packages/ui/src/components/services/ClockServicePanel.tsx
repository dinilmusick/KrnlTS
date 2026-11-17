'use client';
import React from 'react';
import { BaseButton } from '../base/BaseButton.js';

export interface ClockUiSnapshot {
  state:'stopped'|'running'|'paused'; tempo:number; beat:number; bar:number; beatInBar:number;
  tick:number; subdivision:number; elapsedMs:number; resolution:number; timeSignature?:readonly [number,number];
}
export interface ClockServicePanelProps {
  snapshot:ClockUiSnapshot;
  onStart:()=>void; onStop:()=>void; onPause:()=>void; onResume:()=>void; onReset:()=>void;
  onTempoChange:(tempo:number)=>void;
  onResolutionChange?:(resolution:number)=>void;
  onTimeSignatureChange?:(numerator:number,denominator:number)=>void;
  title?:string;
}
export function ClockServicePanel({snapshot,onStart,onStop,onPause,onResume,onReset,onTempoChange,onResolutionChange,onTimeSignatureChange,title='Application Clock'}:ClockServicePanelProps){
  const running=snapshot.state==='running';
  const beatProgress=((snapshot.beat%1)+1)%1;
  return <section className="floks-service-panel floks-clock-panel" aria-label={title}>
    <header><h3>{title}</h3><span role="status" data-state={snapshot.state}>{snapshot.state}</span></header>
    <div className="floks-clock-position" aria-live="polite">
      <strong>{snapshot.bar}:{snapshot.beatInBar.toFixed(2)}</strong>
      <span>Beat {snapshot.beat.toFixed(3)} · Tick {snapshot.tick}</span>
      <progress aria-label="Beat progress" max={1} value={beatProgress}/>
      <span>{Math.floor(snapshot.elapsedMs/1000)}s elapsed</span>
    </div>
    <label>Tempo (BPM)
      <input aria-label="Tempo BPM" type="number" min="1" max="1000" value={snapshot.tempo}
        onChange={event=>onTempoChange(Number(event.currentTarget.value))}/>
    </label>
    <label>Resolution (ticks/beat)
      <input aria-label="Clock resolution" type="number" min="1" max="960" value={snapshot.resolution}
        disabled={!onResolutionChange} onChange={event=>onResolutionChange?.(Number(event.currentTarget.value))}/>
    </label>
    {snapshot.timeSignature&&<fieldset><legend>Time signature</legend>
      <label>Numerator<input aria-label="Time signature numerator" type="number" min="1" max="32" value={snapshot.timeSignature[0]}
        disabled={!onTimeSignatureChange} onChange={event=>onTimeSignatureChange?.(Number(event.currentTarget.value),snapshot.timeSignature![1])}/></label>
      <label>Denominator<select aria-label="Time signature denominator" value={snapshot.timeSignature[1]}
        disabled={!onTimeSignatureChange} onChange={event=>onTimeSignatureChange?.(snapshot.timeSignature![0],Number(event.currentTarget.value))}>
        {[1,2,4,8,16,32].map(value=><option key={value} value={value}>{value}</option>)}
      </select></label>
    </fieldset>}
    <div className="floks-clock-controls">
      <BaseButton variant="accent" onClick={onStart} disabled={snapshot.state!=='stopped'}>Start</BaseButton>
      <BaseButton onClick={onPause} disabled={!running}>Pause</BaseButton>
      <BaseButton onClick={onResume} disabled={snapshot.state!=='paused'}>Resume</BaseButton>
      <BaseButton onClick={onStop} disabled={snapshot.state==='stopped'}>Stop</BaseButton>
      <BaseButton variant="danger" onClick={onReset}>Reset</BaseButton>
    </div>
    <small>Resolution: {snapshot.resolution} ticks/beat · Subdivision: {snapshot.subdivision}</small>
  </section>;
}
