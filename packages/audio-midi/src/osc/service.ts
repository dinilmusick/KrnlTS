import {decodeOscPacket,encodeOscPacket,type OscMessage,type OscPacket} from './codec.js';
export interface OscEndpoint{
 id:string;host:string;port:number;transport:'udp'|'websocket'|'custom';
 state?:'configured'|'listening'|'stopped'|'error';
}
export interface OscTransport{
 send(endpoint:OscEndpoint,packet:Uint8Array):Promise<void>;
 listen(endpoint:OscEndpoint,listener:(packet:Uint8Array)=>void,onError?:(error:Error)=>void):Promise<()=>Promise<void>>;
 dispose?():Promise<void>;
}
export type OscListener=(message:OscMessage,endpointId:string)=>void;
export type OscPacketListener=(packet:OscPacket,endpointId:string)=>void;
function escapePatternLiteral(value:string):string{
 const meta=new Set(['.','+','^','$','{','}','(',')','|','[',']','\\']);
 return [...value].map(char=>meta.has(char)?'\\'+char:char).join('');
}
function patternExpression(pattern:string):string{
 let result='';
 for(let index=0;index<pattern.length;index+=1){
  const char=pattern[index];
  if(char==='\\'&&index+1<pattern.length){result+=escapePatternLiteral(pattern[++index]);continue;}
  if(char==='*'){result+='.*';continue;}
  if(char==='?'){result+='.';continue;}
  if(char==='['){
   const end=pattern.indexOf(']',index+1);
   if(end>index+1){let content=pattern.slice(index+1,end);const negate=content.startsWith('!');if(negate)content=content.slice(1);result+='['+(negate?'^':'')+content+']';index=end;continue;}
  }
  if(char==='{'){
   const end=pattern.indexOf('}',index+1);
   if(end>index+1){const alternatives=pattern.slice(index+1,end).split(',');if(alternatives.length>1){result+='(?:'+alternatives.map(patternExpression).join('|')+')';index=end;continue;}}
  }
  result+=escapePatternLiteral(char);
 }
 return result;
}
export function matchesOscAddress(address:string,pattern:string):boolean{
 if(!address.startsWith('/')||!pattern.startsWith('/'))return false;
 return new RegExp('^'+patternExpression(pattern)+'$').test(address);
}
export class OscService{
 private readonly clients=new Map<string,OscEndpoint>();
 private readonly servers=new Map<string,{endpoint:OscEndpoint;stop:()=>Promise<void>}>();
 private readonly serverStates=new Map<string,OscEndpoint>();
 private readonly listeners=new Map<string,Set<OscListener>>();
 private readonly packetListeners=new Set<OscPacketListener>();
 private disposed=false;
 constructor(private readonly transport:OscTransport){}
 addClient(endpoint:OscEndpoint){
  this.assertActive();this.assertEndpoint(endpoint);
  this.clients.set(endpoint.id,{...endpoint,state:'configured'});
 }
 getClients(){return [...this.clients.values()];}
 getServers(){return [...this.serverStates.values()];}
 async startServer(endpoint:OscEndpoint){
  this.assertActive();this.assertEndpoint(endpoint);if(this.servers.has(endpoint.id))return;
  try{
   const stop=await this.transport.listen(endpoint,packet=>{try{this.publishPacket(decodeOscPacket(packet),endpoint.id);}catch{/* malformed packets are isolated */}},_error=>{this.serverStates.set(endpoint.id,{...endpoint,state:'error'});});
   const active={...endpoint,state:'listening' as const};
   this.servers.set(endpoint.id,{endpoint:active,stop});this.serverStates.set(endpoint.id,active);
  }catch(error){
   this.serverStates.set(endpoint.id,{...endpoint,state:'error'});
   throw error;
  }
 }
 async stopServer(id:string){
  const server=this.servers.get(id);if(!server)return;
  await server.stop();this.servers.delete(id);
  this.serverStates.set(id,{...server.endpoint,state:'stopped'});
 }
 async send(clientId:string,message:OscMessage){return this.sendPacket(clientId,message);}
 async sendPacket(clientId:string,packet:OscPacket){
  this.assertActive();const endpoint=this.clients.get(clientId);
  if(!endpoint)throw new Error('Unknown OSC client: '+clientId);
  await this.transport.send(endpoint,encodeOscPacket(packet));
 }
 subscribe(pattern:string,listener:OscListener){
  this.assertActive();
  if(!pattern.startsWith('/'))throw new TypeError('OSC address pattern must begin with /');
  try{new RegExp('^'+patternExpression(pattern)+'$');}catch{throw new TypeError('Invalid OSC address pattern');}
  const set=this.listeners.get(pattern)??new Set<OscListener>();
  set.add(listener);this.listeners.set(pattern,set);
  return()=>{set.delete(listener);if(!set.size)this.listeners.delete(pattern);};
 }
 subscribePackets(listener:OscPacketListener){
  this.assertActive();this.packetListeners.add(listener);return()=>this.packetListeners.delete(listener);
 }
 async dispose(){
  if(this.disposed)return;
  await Promise.all([...this.servers.values()].map(async server=>{await server.stop();this.serverStates.set(server.endpoint.id,{...server.endpoint,state:'stopped'});}));
  this.servers.clear();this.clients.clear();this.listeners.clear();this.packetListeners.clear();
  await this.transport.dispose?.();this.disposed=true;
 }
 private publishPacket(packet:OscPacket,id:string){
  this.packetListeners.forEach(listener=>{try{listener(packet,id);}catch{/* isolate subscriber failures */}});
  if('bundle'in packet){packet.elements.forEach(element=>this.publishPacket(element,id));return;}
  this.listeners.forEach((set,pattern)=>{
   if(matchesOscAddress(packet.address,pattern))set.forEach(listener=>{try{listener(packet,id);}catch{/* isolate subscriber failures */}});
  });
 }
 private assertEndpoint(endpoint:OscEndpoint){
  if(!endpoint.id||!endpoint.host||!Number.isInteger(endpoint.port)||endpoint.port<1||endpoint.port>65535)throw new TypeError('Invalid OSC endpoint configuration');
 }
 private assertActive(){if(this.disposed)throw new Error('OscService has been disposed');}
}
