import {decodeMidiMessage,encodeMidiMessage,type MidiMessage} from './message.js';
import {MidiManager as LegacyMidiManager} from '../midiManager.js';
export interface MidiDevice{id:string;name:string;manufacturer?:string;direction:'input'|'output'|'duplex';origin:'physical'|'logical';state:'connected'|'disconnected';inputState?:'connected'|'disconnected';outputState?:'connected'|'disconnected';capabilities:{input:boolean;output:boolean;virtualDeviceCreation:boolean};}
export interface MidiBackend{
 readonly capabilities:{physicalInput:boolean;physicalOutput:boolean;virtualDeviceCreation:boolean;systemExclusive?:boolean};
 discover():Promise<MidiDevice[]>;
 connectInput(id:string,listener:(message:MidiMessage)=>void):Promise<void>;
 connectOutput(id:string):Promise<void>;
 send(id:string,bytes:Uint8Array):Promise<void>;
 disconnect(id:string):Promise<void>;
 dispose():Promise<void>;
 subscribeDevices?(listener:(devices:MidiDevice[])=>void):()=>void;
}
export class MidiService{
 private devices=new Map<string,MidiDevice>();private listeners=new Set<(message:MidiMessage,deviceId:string)=>void>();
 private deviceListeners=new Set<(devices:MidiDevice[])=>void>();private logical=new Map<string,Set<(message:MidiMessage)=>void>>();private disposed=false;private unsubscribeBackend?:()=>void;
 constructor(private readonly backend:MidiBackend){
  this.unsubscribeBackend=backend.subscribeDevices?.(devices=>{
   const next=new Map(devices.map(device=>[device.id,this.normalizeDevice(device)]));
   for(const [id,device] of this.devices)if(device.origin==='logical')next.set(id,device);
   this.devices=next;this.publishDevices();
  });
 }
 getCapabilities(){return {...this.backend.capabilities,logicalEndpoints:true};}
 getDevices(){return [...this.devices.values()];}
 async discover(){this.assertActive();const found=await this.backend.discover();const ids=new Set(found.map(d=>d.id));
  for(const [id,device] of this.devices)if(device.origin==='physical'&&!ids.has(id))this.devices.delete(id);
  for(const device of found)this.devices.set(device.id,this.normalizeDevice(device));this.publishDevices();return this.getDevices();}
 createLogicalDevice(name:string,direction:'input'|'output'|'duplex'='duplex'):MidiDevice{
  this.assertActive();if(!name.trim())throw new TypeError('Logical MIDI device name is required');
  const id='logical-midi-'+Math.random().toString(36).slice(2);
  const device:MidiDevice={id,name:name.trim(),direction,origin:'logical',state:'connected',inputState:direction!=='output'?'connected':'disconnected',outputState:direction!=='input'?'connected':'disconnected',capabilities:{input:direction!=='output',output:direction!=='input',virtualDeviceCreation:false}};
  this.devices.set(id,device);this.logical.set(id,new Set());this.publishDevices();return device;}
 async connectInput(id:string){this.assertActive();const d=this.requireDevice(id);if(!d.capabilities.input)throw new Error('Device does not support MIDI input');if(d.origin==='logical'){this.setDirectionState(id,'input','connected');return;}await this.backend.connectInput(id,m=>this.publishMessage(m,id));this.setDirectionState(id,'input','connected');}
 async connectOutput(id:string){this.assertActive();const d=this.requireDevice(id);if(!d.capabilities.output)throw new Error('Device does not support MIDI output');if(d.origin==='logical'){this.setDirectionState(id,'output','connected');return;}await this.backend.connectOutput(id);this.setDirectionState(id,'output','connected');}
 async send(id:string,message:MidiMessage){this.assertActive();const d=this.requireDevice(id);if(!d.capabilities.output)throw new Error('Device does not support MIDI output');if(d.outputState!=='connected')throw new Error('MIDI output is not connected');if(d.origin==='physical'&&message.type==='system'&&message.status===0xf0&&!this.backend.capabilities.systemExclusive)throw new Error('System exclusive output is not enabled by this backend');const bytes=encodeMidiMessage(message);if(d.origin==='logical'){this.publishMessage(message,id);this.logical.get(id)?.forEach(fn=>{try{fn(message);}catch{/* isolate logical subscriber failures */}});return;}await this.backend.send(id,bytes);}
 subscribe(fn:(message:MidiMessage,deviceId:string)=>void){this.assertActive();this.listeners.add(fn);return()=>this.listeners.delete(fn);}
 subscribeDevices(fn:(devices:MidiDevice[])=>void){this.assertActive();this.deviceListeners.add(fn);fn(this.getDevices());return()=>this.deviceListeners.delete(fn);}
 subscribeLogicalInput(id:string,fn:(message:MidiMessage)=>void){this.assertActive();const set=this.logical.get(id);if(!set)throw new Error('Unknown logical MIDI device');set.add(fn);return()=>set.delete(fn);}
 async disconnect(id:string){this.assertActive();const d=this.requireDevice(id);if(d.origin==='physical')await this.backend.disconnect(id);this.devices.set(id,{...d,state:'disconnected',inputState:'disconnected',outputState:'disconnected'});this.publishDevices();}
 async dispose(){if(this.disposed)return;this.unsubscribeBackend?.();this.unsubscribeBackend=undefined;await this.backend.dispose();this.listeners.clear();this.deviceListeners.clear();this.logical.clear();this.devices.clear();this.disposed=true;}
 private publishMessage(message:MidiMessage,id:string){this.listeners.forEach(fn=>{try{fn(message,id);}catch{/* isolate subscriber failures */}});}
 private setDirectionState(id:string,direction:'input'|'output',state:'connected'|'disconnected'){const device=this.requireDevice(id);const next={...device,[direction==='input'?'inputState':'outputState']:state};next.state=next.inputState==='connected'||next.outputState==='connected'?'connected':'disconnected';this.devices.set(id,next);this.publishDevices();}
 private publishDevices(){const snapshot=this.getDevices();this.deviceListeners.forEach(fn=>{try{fn(snapshot);}catch{/* isolate subscriber failures */}});}
 private requireDevice(id:string){const d=this.devices.get(id);if(!d)throw new Error('Unknown MIDI device: '+id);return d;}
 private normalizeDevice(device:MidiDevice):MidiDevice{
  const inputState=device.inputState??(device.capabilities.input?device.state:'disconnected');
  const outputState=device.outputState??(device.capabilities.output?device.state:'disconnected');
  return {...device,inputState,outputState,state:inputState==='connected'||outputState==='connected'?'connected':'disconnected'};
 }
 private assertActive(){if(this.disposed)throw new Error('MidiService has been disposed');}
}
/**
 * Adapts the existing Kloks MidiManager to the capability-based service contract.
 * Device discovery, hot-plug handling and physical I/O remain owned by one canonical manager.
 */
export function createWebMidiBackend(manager: LegacyMidiManager = new LegacyMidiManager(), options:{sysex?:boolean}={}): MidiBackend {
  const inputSubscriptions = new Map<string, () => void>();
  const mapDevices=(state:ReturnType<LegacyMidiManager['getState']>):MidiDevice[]=>{
    const devices=new Map<string,MidiDevice>();
    state.inputs.forEach(port=>devices.set(port.id,{id:port.id,name:port.name,manufacturer:port.manufacturer,direction:'input',origin:'physical',state:port.state==='connected'&&port.connection==='open'?'connected':'disconnected',inputState:port.state==='connected'&&port.connection==='open'?'connected':'disconnected',outputState:'disconnected',capabilities:{input:true,output:false,virtualDeviceCreation:false}}));
    state.outputs.forEach(port=>{const previous=devices.get(port.id);devices.set(port.id,{id:port.id,name:port.name,manufacturer:port.manufacturer??previous?.manufacturer,direction:previous?'duplex':'output',origin:'physical',state:port.state==='connected'&&port.connection==='open'||previous?.inputState==='connected'?'connected':'disconnected',inputState:previous?.inputState??'disconnected',outputState:port.state==='connected'&&port.connection==='open'?'connected':'disconnected',capabilities:{input:Boolean(previous?.capabilities.input),output:true,virtualDeviceCreation:false}});});
    return [...devices.values()];
  };
  const supported = typeof navigator !== 'undefined' && typeof navigator.requestMIDIAccess === 'function';
  const ensureInitialized = async () => {
    if (!supported) return false;
    if (!manager.getState().isInitialized) await manager.initialize({ sysex: options.sysex ?? false, software: true });
    return true;
  };
  return {
    capabilities: { physicalInput: supported, physicalOutput: supported, virtualDeviceCreation: false, systemExclusive: supported && Boolean(options.sysex) },
    async discover() {
      if (!(await ensureInitialized())) return [];
      return mapDevices(manager.getState());
    },
    subscribeDevices(listener) {
      return manager.subscribeState(state=>{if(state.isInitialized)listener(mapDevices(state));});
    },
    async connectInput(id, listener) {
      if (!(await ensureInitialized())) throw new Error('Web MIDI is unavailable in this runtime');
      if (!manager.getState().inputs.some(port => port.id === id)) throw new Error('MIDI input not discovered: ' + id);
      if (!inputSubscriptions.has(id)) {
        inputSubscriptions.set(id, manager.subscribeEvents(event => {
          if (event.sourceId === id) { try { listener(decodeMidiMessage(event.rawBytes)); } catch { /* malformed device packets are isolated */ } }
        }));
      }
      await manager.connectInput(id);
    },
    async connectOutput(id) {
      if (!(await ensureInitialized())) throw new Error('Web MIDI is unavailable in this runtime');
      await manager.connectOutput(id);
    },
    async send(id, bytes) { manager.sendRawMidiBytes(bytes, id); },
    async disconnect(id) {
      inputSubscriptions.get(id)?.();
      inputSubscriptions.delete(id);
      await Promise.all([manager.disconnectInput(id), manager.disconnectOutput(id)]);
    },
    async dispose() {
      inputSubscriptions.forEach(unsubscribe => unsubscribe());
      inputSubscriptions.clear();
      await manager.dispose();
    },
  };
}
