import {describe,expect,it} from 'vitest';
import {decodeOscMessage,decodeOscPacket,encodeOscBundle,encodeOscMessage,type OscBundle,type OscMessage} from '../src/osc/codec.js';
import {matchesOscAddress,OscService,type OscTransport} from '../src/osc/service.js';
import {DEFAULT_OSC_DEVICES} from '../src/engine/osc/types.js';
import {OscManager} from '../src/engine/osc/oscManager.js';
import {createNodeUdpOscTransport} from '../src/osc/node-udp.js';
import {createSocket} from 'node:dgram';
describe('OSC protocol and service',()=>{
 it('round-trips standard scalar, blob, 64-bit and extended argument types',()=>{
  const message:OscMessage={address:'/synth/voice',args:[42,0.25,'hello',true,false,null,1234567890123n,new Uint8Array([1,2,3]),{type:'double',value:0.123456789},{type:'timetag',value:0xf123456789abcdefn},{type:'impulse'}]};
  const decoded=decodeOscMessage(encodeOscMessage(message));expect(decoded.address).toBe(message.address);expect(decoded.args).toEqual(message.args);
 });
 it('round-trips nested OSC bundles with unsigned time tags',()=>{
  const bundle:OscBundle={bundle:true,timetag:0xf123456789abcdefn,elements:[{address:'/clock/tick',args:[1]},{bundle:true,timetag:1n,elements:[{address:'/nested',args:[true]}]}]};
  expect(decodeOscPacket(encodeOscBundle(bundle))).toEqual(bundle);
 });
 it('rejects malformed packets and invalid addresses',()=>{const badString=encodeOscMessage({address:'/x',args:['hi']});badString[badString.length-1]=1;expect(()=>decodeOscPacket(badString)).toThrow(/padding/);const badBlob=encodeOscMessage({address:'/x',args:[new Uint8Array([1])]});badBlob[badBlob.length-1]=1;expect(()=>decodeOscPacket(badBlob)).toThrow(/padding/);
  expect(()=>encodeOscMessage({address:'missing-slash',args:[]})).toThrow();expect(()=>decodeOscPacket(new Uint8Array([47,0,0,0]))).toThrow();
 });
 it('matches patterns and models client/server state and packet subscriptions',async()=>{
  expect(matchesOscAddress('/synth/voice/12','/synth/voice/*')).toBe(true);expect(matchesOscAddress('/synth/voice/left','/synth/voice/{left,right}')).toBe(true);expect(matchesOscAddress('/note/7','/note/[0-9]')).toBe(true);expect(matchesOscAddress('/synth/a+b','/synth/a\\+b')).toBe(true);expect(matchesOscAddress('/synth/voice/left','/synth/voice/{right,other}')).toBe(false);
  let receive:((packet:Uint8Array)=>void)|null=null;let transportError:((error:Error)=>void)|null=null;let sent:Uint8Array|null=null,stopped=0;
  const transport:OscTransport={send:async(_e,packet)=>{sent=packet;},listen:async(_e,fn,onError)=>{receive=fn;transportError=onError??null;return async()=>{stopped++;};}};
  const service=new OscService(transport);service.addClient({id:'out',host:'127.0.0.1',port:9000,transport:'udp'});
  expect(service.getClients()[0].state).toBe('configured');
  await service.send('out',{address:'/ping',args:[1]});expect(decodeOscMessage(sent!)).toEqual({address:'/ping',args:[1]});
  const bundle:OscBundle={bundle:true,timetag:10n,elements:[{address:'/ping',args:[]}]};
  await service.sendPacket('out',bundle);expect(decodeOscPacket(sent!)).toEqual(bundle);
  const messages:string[]=[],packets:string[]=[];
  service.subscribe('/ping',message=>messages.push(message.address));
  service.subscribePackets(packet=>packets.push('bundle'in packet?'bundle':packet.address));
  await service.startServer({id:'in',host:'0.0.0.0',port:9001,transport:'udp'});
  expect(service.getServers()[0].state).toBe('listening');transportError?.(new Error('UDP socket failed'));expect(service.getServers()[0].state).toBe('error');
  receive?.(encodeOscBundle(bundle));expect(messages).toEqual(['/ping']);expect(packets).toEqual(['bundle','/ping']);
  await service.stopServer('in');expect(service.getServers()[0].state).toBe('stopped');
  await service.dispose();expect(stopped).toBe(1);expect(()=>service.addClient({id:'x',host:'localhost',port:9,transport:'udp'})).toThrow(/disposed/);
 });
 it('sends and receives real OSC packets over the Node UDP transport',async()=>{
  const reservation=createSocket('udp4');
  await new Promise<void>(resolve=>reservation.bind(0,'127.0.0.1',resolve));
  const address=reservation.address();if(typeof address==='string')throw new Error('Unexpected UDP reservation address');
  const port=address.port;await new Promise<void>(resolve=>reservation.close(()=>resolve()));
  const service=new OscService(createNodeUdpOscTransport());
  const received=new Promise<OscMessage>((resolve,reject)=>{
   const timeout=setTimeout(()=>reject(new Error('Timed out waiting for OSC UDP packet')),3000);
   service.subscribe('/integration/ping',message=>{clearTimeout(timeout);resolve(message);});
  });
  try{
   await service.startServer({id:'loopback-server',host:'127.0.0.1',port,transport:'udp'});
   service.addClient({id:'loopback-client',host:'127.0.0.1',port,transport:'udp'});
   await service.send('loopback-client',{address:'/integration/ping',args:[123,'udp']});
   await expect(received).resolves.toEqual({address:'/integration/ping',args:[123,'udp']});
  }finally{await service.dispose();}
 });
 it('rejects non-UDP endpoints in the Node UDP transport',async()=>{const transport=createNodeUdpOscTransport();const endpoint={id:'ws',host:'127.0.0.1',port:9000,transport:'websocket' as const};await expect(transport.send(endpoint,new Uint8Array())).rejects.toThrow(/only supports udp/);await expect(transport.listen(endpoint,()=>{})).rejects.toThrow(/only supports udp/);await transport.dispose();});
 it('does not advertise simulated legacy OSC endpoints as live devices',()=>{expect(DEFAULT_OSC_DEVICES).toEqual([]);const legacy=new OscManager();const device=legacy.addDevice({name:'local fake',type:'network_udp',host:'127.0.0.1',port:9000,status:'listening',enabled:true});expect(device.status).toBe('simulated');});
});
