import {createService,createServiceDefinition,type IService} from '@ultrst-armada/krnl';
import {ClockService,type ClockOptions,type ClockPosition} from './clock.js';
export type ClockState=ClockPosition&Record<string,unknown>;
export function createClockKernelService(clock=new ClockService()):IService<ClockState>{
 let service:IService<ClockState>|undefined;let unsubscribe:(()=>void)|undefined;
 const definition=createServiceDefinition<ClockState>({
  id:'kloks.clock',name:'ClockService',version:'1.0.0',state:{initial:{...clock.getSnapshot()}},
  lifecycle:{onInit:()=>{unsubscribe=clock.subscribe(position=>{if(service)service.setState({...position});});},onStart:()=>clock.start(),onStop:()=>clock.stop(),onDispose:()=>{unsubscribe?.();clock.dispose();}},
  operations:{
   getPosition:{id:'ClockService.getPosition',name:'getPosition',handler:async()=>clock.getSnapshot()},
   setTempo:{id:'ClockService.setTempo',name:'setTempo',handler:async(input:{tempo:number})=>{clock.setTempo(input.tempo);return clock.getSnapshot();}},
   setResolution:{id:'ClockService.setResolution',name:'setResolution',handler:async(input:{resolution:number})=>{clock.setResolution(input.resolution);return clock.getSnapshot();}},
   setTimeSignature:{id:'ClockService.setTimeSignature',name:'setTimeSignature',handler:async(input:{numerator:number;denominator:number})=>{clock.setTimeSignature(input.numerator,input.denominator);return clock.getSnapshot();}},
   pause:{id:'ClockService.pause',name:'pause',handler:async()=>{clock.pause();return clock.getSnapshot();}},
   resume:{id:'ClockService.resume',name:'resume',handler:async()=>{clock.resume();return clock.getSnapshot();}},
   reset:{id:'ClockService.reset',name:'reset',handler:async()=>{clock.reset();return clock.getSnapshot();}},
  },
 });
 service=createService(definition);return service;
}
export function createClockService(options:ClockOptions={}):ClockService{return new ClockService(options);}
