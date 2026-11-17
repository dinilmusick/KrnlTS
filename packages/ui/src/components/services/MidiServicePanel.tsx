'use client';
import React, { useState } from 'react';
import { BaseButton } from '../base/BaseButton.js';

export interface MidiUiDevice {
  id:string; name:string; origin:'physical'|'logical'; state:'connected'|'disconnected'; inputState?:'connected'|'disconnected'; outputState?:'connected'|'disconnected';
  direction:'input'|'output'|'duplex'; capabilities:{input:boolean;output:boolean;virtualDeviceCreation:boolean};
}
export interface MidiUiMessage { type:string; channel?:number; noteOrController?:number; value?:number; }
export interface MidiServicePanelProps {
  devices:MidiUiDevice[]; messages:MidiUiMessage[];
  onRefresh:()=>void; onConnect:(id:string,direction:'input'|'output')=>void;
  onDisconnect:(id:string)=>void; onSend:(id:string,message:MidiUiMessage)=>void;
  onCreateLogicalDevice:(name:string)=>void;
}
export function MidiServicePanel({devices,messages,onRefresh,onConnect,onDisconnect,onSend,onCreateLogicalDevice}:MidiServicePanelProps){
  const [name,setName]=useState('Internal MIDI');
  const [selected,setSelected]=useState('');
  const [note,setNote]=useState(60);
  const [velocity,setVelocity]=useState(100);const [channel,setChannel]=useState(0);const [controller,setController]=useState(1);const [controlValue,setControlValue]=useState(64);const [program,setProgram]=useState(0);const [pitchBend,setPitchBend]=useState(8192);
  const selectedDevice=devices.find(device=>device.id===selected);
  const outputConnected=Boolean(selectedDevice?.capabilities.output&&(selectedDevice.origin==='logical'||selectedDevice.outputState==='connected'));
  return <section className="floks-service-panel floks-midi-panel" aria-label="MIDI Service">
    <header><h3>MIDI Devices</h3><BaseButton onClick={onRefresh}>Discover devices</BaseButton></header>
    <p>Physical devices are discovered from the runtime. Logical endpoints are in-process routes and are not OS virtual MIDI ports.</p>
    <ul>{devices.map(device=><li key={device.id}>
      <label><input type="radio" name="midi-device" checked={selected===device.id} onChange={()=>setSelected(device.id)}/>{device.name}</label>
      <span>{device.origin} · {device.state} · {device.direction}</span>
      <span>{device.capabilities.input?'Input '+(device.inputState??device.state):''}{device.capabilities.output?' · Output '+(device.outputState??(device.origin==='logical'?device.state:'disconnected')):''}</span>
      {device.origin==='physical'&&device.capabilities.input&&(device.inputState??device.state)!=='connected'&&<BaseButton onClick={()=>onConnect(device.id,'input')}>Connect input</BaseButton>}
      {device.origin==='physical'&&device.capabilities.output&&(device.outputState??'disconnected')!=='connected'&&<BaseButton onClick={()=>onConnect(device.id,'output')}>Connect output</BaseButton>}
      {device.origin==='physical'&&(device.inputState==='connected'||device.outputState==='connected'||(!device.inputState&&!device.outputState&&device.state==='connected'))&&<BaseButton onClick={()=>onDisconnect(device.id)}>Disconnect</BaseButton>}
    </li>)}</ul>
    <form onSubmit={event=>{event.preventDefault();onCreateLogicalDevice(name);}}>
      <label>Create logical endpoint<input value={name} onChange={event=>setName(event.currentTarget.value)} /></label>
      <BaseButton type="submit">Create logical MIDI endpoint</BaseButton>
    </form>
    <div><h4>Send note</h4><label>Note<input type="number" min="0" max="127" value={note} onChange={event=>setNote(Number(event.currentTarget.value))}/></label>
      <label>Velocity<input type="number" min="0" max="127" value={velocity} onChange={event=>setVelocity(Number(event.currentTarget.value))}/></label>
      <BaseButton disabled={!selectedDevice?.capabilities.output||!outputConnected} onClick={()=>selected&&onSend(selected,{type:'noteOn',channel,noteOrController:note,value:velocity})}>Send Note On</BaseButton>
      <BaseButton disabled={!selectedDevice?.capabilities.output||!outputConnected} onClick={()=>selected&&onSend(selected,{type:'noteOff',channel,noteOrController:note,value:0})}>Send Note Off</BaseButton>
    </div>
    <div><h4>Send Control Change</h4>
      <label>Channel<input type="number" min="0" max="15" value={channel} onChange={event=>setChannel(Number(event.currentTarget.value))}/></label>
      <label>Controller<input type="number" min="0" max="127" value={controller} onChange={event=>setController(Number(event.currentTarget.value))}/></label>
      <label>Value<input type="number" min="0" max="127" value={controlValue} onChange={event=>setControlValue(Number(event.currentTarget.value))}/></label>
      <BaseButton disabled={!selectedDevice?.capabilities.output||!outputConnected} onClick={()=>selected&&onSend(selected,{type:'controlChange',channel,noteOrController:controller,value:controlValue})}>Send Control Change</BaseButton>
    </div>
    <div><h4>Program Change</h4><label>Program<input type="number" min="0" max="127" value={program} onChange={event=>setProgram(Number(event.currentTarget.value))}/></label>
      <BaseButton disabled={!selectedDevice?.capabilities.output||!outputConnected} onClick={()=>selected&&onSend(selected,{type:'programChange',channel,value:program})}>Send Program Change</BaseButton>
    </div>
    <div><h4>Pitch Bend</h4><label>14-bit value<input type="number" min="0" max="16383" value={pitchBend} onChange={event=>setPitchBend(Number(event.currentTarget.value))}/></label>
      <BaseButton disabled={!selectedDevice?.capabilities.output||!outputConnected} onClick={()=>selected&&onSend(selected,{type:'pitchBend',channel,value:pitchBend})}>Send Pitch Bend</BaseButton>
    </div>
    <div aria-label="MIDI receive monitor"><h4>Received MIDI</h4><ol>{messages.slice(-20).map((message,index)=><li key={index}>{message.type} · ch {message.channel??'—'} · {message.noteOrController??''} · {message.value??''}</li>)}</ol></div>
  </section>;
}
