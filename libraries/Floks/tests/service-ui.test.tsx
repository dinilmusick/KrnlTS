import React from 'react';
import {describe,expect,it,vi} from 'vitest';
import {fireEvent,render,screen} from '@testing-library/react';
import {ClockServicePanel,MidiServicePanel,OscServicePanel} from '@ultrst-armada/floks/ui/services';
describe('independent service UI surfaces',()=>{
 it('renders clock position and dispatches timing controls',()=>{
  const start=vi.fn(),tempo=vi.fn(),resolution=vi.fn(),signature=vi.fn();
  render(<ClockServicePanel snapshot={{state:'stopped',tempo:120,beat:0,bar:1,beatInBar:1,tick:0,subdivision:0,elapsedMs:0,resolution:24,timeSignature:[4,4]}} onStart={start} onStop={()=>{}} onPause={()=>{}} onResume={()=>{}} onReset={()=>{}} onTempoChange={tempo} onResolutionChange={resolution} onTimeSignatureChange={signature}/>);
  expect(screen.getByLabelText('Beat progress')).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Start'}));expect(start).toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Tempo BPM'),{target:{value:'128'}});expect(tempo).toHaveBeenCalledWith(128);fireEvent.change(screen.getByLabelText('Clock resolution'),{target:{value:'48'}});expect(resolution).toHaveBeenCalledWith(48);fireEvent.change(screen.getByLabelText('Time signature numerator'),{target:{value:'3'}});expect(signature).toHaveBeenCalledWith(3,4);fireEvent.change(screen.getByLabelText('Time signature denominator'),{target:{value:'8'}});expect(signature).toHaveBeenLastCalledWith(4,8);
 });
 it('distinguishes physical MIDI hardware from logical endpoints',()=>{
  const create=vi.fn(),send=vi.fn(),refresh=vi.fn();
  render(<MidiServicePanel devices={[{id:'physical',name:'Keyboard',origin:'physical',state:'connected',inputState:'connected',outputState:'disconnected',direction:'duplex',capabilities:{input:true,output:true,virtualDeviceCreation:false}},{id:'logical',name:'Logical Output',origin:'logical',state:'connected',direction:'output',capabilities:{input:false,output:true,virtualDeviceCreation:false}}]} messages={[]} onRefresh={refresh} onConnect={()=>{} } onDisconnect={()=>{}} onSend={send} onCreateLogicalDevice={create}/>);
  fireEvent.click(screen.getByRole('button',{name:'Discover devices'}));expect(refresh).toHaveBeenCalled();
  expect(screen.getByText(/physical · connected/)).toBeInTheDocument();
  expect(screen.getByText(/not OS virtual MIDI ports/)).toBeInTheDocument();expect(screen.getByRole('button',{name:'Connect output'})).toBeInTheDocument();fireEvent.click(screen.getByLabelText('Keyboard'));expect(screen.getByRole('button',{name:'Send Control Change'})).toBeDisabled();
  fireEvent.click(screen.getByRole('button',{name:'Create logical MIDI endpoint'}));expect(create).toHaveBeenCalled();fireEvent.click(screen.getByLabelText('Logical Output'));fireEvent.click(screen.getByRole('button',{name:'Send Control Change'}));expect(send).toHaveBeenCalledWith('logical',{type:'controlChange',channel:0,noteOrController:1,value:64});fireEvent.click(screen.getByRole('button',{name:'Send Program Change'}));expect(send).toHaveBeenLastCalledWith('logical',{type:'programChange',channel:0,value:0});fireEvent.click(screen.getByRole('button',{name:'Send Pitch Bend'}));expect(send).toHaveBeenLastCalledWith('logical',{type:'pitchBend',channel:0,value:8192});
 });
 it('configures OSC endpoints and sends JSON arguments',()=>{
  const send=vi.fn(),stop=vi.fn();
  render(<OscServicePanel clients={[{id:'out',host:'127.0.0.1',port:9000,transport:'udp'}]} servers={[{id:'in',host:'0.0.0.0',port:9001,transport:'udp',state:'listening'}]} messages={[]} onAddClient={()=>{}} onStartServer={()=>{}} onStopServer={stop} onSend={send}/>);
  fireEvent.click(screen.getByRole('button',{name:'Select'}));
  fireEvent.change(screen.getByLabelText('Address'),{target:{value:'/lights/1'}});
  fireEvent.click(screen.getByRole('button',{name:'Send message'}));expect(send).toHaveBeenCalledWith('out',{address:'/lights/1',args:[]});expect(screen.getByText(/listening/)).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Stop server'}));expect(stop).toHaveBeenCalledWith('in');
 });
});
