'use client';
import React, { useState } from 'react';
import { BaseButton } from '../base/BaseButton.js';

export interface OscUiEndpoint { id:string; host:string; port:number; transport:'udp'|'websocket'|'custom'; state?:'configured'|'listening'|'stopped'|'error'; }
export interface OscUiMessage { address:string; args:Array<string|number|boolean|null>; }
export interface OscServicePanelProps {
  clients:OscUiEndpoint[]; servers:OscUiEndpoint[]; messages:OscUiMessage[];
  onAddClient:(endpoint:OscUiEndpoint)=>void; onStartServer:(endpoint:OscUiEndpoint)=>void;
  onStopServer:(id:string)=>void; onSend:(clientId:string,message:OscUiMessage)=>void;
}
export function OscServicePanel({clients,servers,messages,onAddClient,onStartServer,onStopServer,onSend}:OscServicePanelProps){
  const [id,setId]=useState('osc-local');const [host,setHost]=useState('127.0.0.1');
  const [port,setPort]=useState(9000);const [address,setAddress]=useState('/skipo/event');
  const [args,setArgs]=useState('[]');const [client,setClient]=useState('');
  const configure=()=>({id,host,port,transport:'udp' as const});
  return <section className="floks-service-panel floks-osc-panel" aria-label="OSC Service">
    <header><h3>OSC Endpoints</h3><span>Protocol endpoints are separate from MIDI devices and the application clock.</span></header>
    <div><label>Endpoint ID<input value={id} onChange={event=>setId(event.currentTarget.value)}/></label>
      <label>Host<input value={host} onChange={event=>setHost(event.currentTarget.value)}/></label>
      <label>Port<input type="number" min="1" max="65535" value={port} onChange={event=>setPort(Number(event.currentTarget.value))}/></label>
      <BaseButton onClick={()=>{onAddClient(configure());setClient(id);}}>Add OSC client</BaseButton>
      <BaseButton onClick={()=>onStartServer(configure())}>Start OSC server</BaseButton>
    </div>
    <div><h4>Clients</h4><ul>{clients.map(item=><li key={item.id}>{item.id} · {item.host}:{item.port} · {item.state??'configured'} <button onClick={()=>setClient(item.id)}>Select</button></li>)}</ul></div>
    <div><h4>Servers</h4><ul>{servers.map(item=><li key={item.id}>{item.id} · {item.host}:{item.port} · {item.state??'listening'}<BaseButton onClick={()=>onStopServer(item.id)}>Stop server</BaseButton></li>)}</ul></div>
    <form onSubmit={event=>{event.preventDefault();try{const parsed=JSON.parse(args) as OscUiMessage['args'];onSend(client,{address,args:parsed});}catch{/* invalid JSON is not sent */}}}>
      <h4>Send OSC message</h4><label>Address<input value={address} onChange={event=>setAddress(event.currentTarget.value)}/></label>
      <label>Arguments (JSON array)<input value={args} onChange={event=>setArgs(event.currentTarget.value)}/></label>
      <BaseButton type="submit" disabled={!client}>Send message</BaseButton>
    </form>
    <div aria-label="OSC receive monitor"><h4>Received messages</h4><ol>{messages.slice(-20).map((message,index)=><li key={index}>{message.address} {JSON.stringify(message.args)}</li>)}</ol></div>
  </section>;
}
