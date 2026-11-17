import { createSocket, type Socket } from 'node:dgram';
import type { OscEndpoint, OscTransport } from './service.js';

export function createNodeUdpOscTransport():OscTransport{
 const sockets=new Set<Socket>();
 return {
  send(endpoint:OscEndpoint,packet:Uint8Array){
   if(endpoint.transport!=='udp')return Promise.reject(new Error('Node UDP transport only supports udp endpoints'));
   return new Promise<void>((resolve,reject)=>{
    const socket=createSocket(endpoint.host.includes(':')?'udp6':'udp4');sockets.add(socket);
    socket.send(packet,endpoint.port,endpoint.host,error=>{socket.close();sockets.delete(socket);if(error)reject(error);else resolve();});
   });
  },
  listen(endpoint:OscEndpoint,listener:(packet:Uint8Array)=>void,onError?:(error:Error)=>void){
   if(endpoint.transport!=='udp')return Promise.reject(new Error('Node UDP transport only supports udp endpoints'));
   return new Promise<()=>Promise<void>>((resolve,reject)=>{
    const socket=createSocket(endpoint.host.includes(':')?'udp6':'udp4');sockets.add(socket);
    let listening=false,closed=false;
    const close=()=>new Promise<void>(done=>{if(closed){done();return;}closed=true;try{socket.close(()=>{sockets.delete(socket);done();});}catch{sockets.delete(socket);done();}});
    socket.on('error',(error:Error)=>{if(!listening){void close();reject(error);return;}onError?.(error);void close();});
    socket.on('message',message=>listener(new Uint8Array(message)));
    socket.bind(endpoint.port,endpoint.host,()=>{listening=true;resolve(close);});
   });
  },
  async dispose(){await Promise.all([...sockets].map(socket=>new Promise<void>(resolve=>{try{socket.close(()=>resolve());}catch{resolve();}})));sockets.clear();}
 };
}
