export interface OscDouble { type:'double'; value:number; }
export interface OscTimetag { type:'timetag'; value:bigint; }
export interface OscImpulse { type:'impulse'; }
export type OscArgument=number|string|boolean|bigint|Uint8Array|null|OscDouble|OscTimetag|OscImpulse;
export interface OscMessage { address:string; args:OscArgument[]; }
export interface OscBundle { bundle:true; timetag:bigint; elements:OscPacket[]; }
export type OscPacket=OscMessage|OscBundle;
const encoder=new TextEncoder();const decoder=new TextDecoder('utf-8',{fatal:true});
function writeString(out:number[],value:string){out.push(...encoder.encode(value+'\0'));while(out.length%4)out.push(0);}
function readString(bytes:Uint8Array,state:{offset:number}):string{
 const start=state.offset;while(state.offset<bytes.length&&bytes[state.offset]!==0)state.offset++;
 if(state.offset>=bytes.length)throw new TypeError('Unterminated OSC string');
 const value=decoder.decode(bytes.subarray(start,state.offset));state.offset++;
 while(state.offset%4){if(state.offset>=bytes.length||bytes[state.offset]!==0)throw new TypeError('Invalid OSC string padding');state.offset++;}
 return value;
}
function write32(out:number[],value:number){if(!Number.isInteger(value)||value< -2147483648||value>2147483647)throw new RangeError('OSC int32 out of range');const b=new ArrayBuffer(4);new DataView(b).setInt32(0,value,false);out.push(...new Uint8Array(b));}
function writeInt64(out:number[],value:bigint){const b=new ArrayBuffer(8);new DataView(b).setBigInt64(0,value,false);out.push(...new Uint8Array(b));}
function writeUInt64(out:number[],value:bigint){if(value<0n||value>0xffffffffffffffffn)throw new RangeError('OSC timetag must be uint64');const b=new ArrayBuffer(8);new DataView(b).setBigUint64(0,value,false);out.push(...new Uint8Array(b));}
function read32(bytes:Uint8Array,offset:number){if(offset+4>bytes.length)throw new TypeError('Truncated OSC argument');return new DataView(bytes.buffer,bytes.byteOffset+offset,4).getInt32(0,false);}
export function encodeOscMessage(message:OscMessage):Uint8Array{
 if(!message.address.startsWith('/'))throw new TypeError('OSC address must begin with /');
 const out:number[]=[];writeString(out,message.address);let tags=',';
 for(const arg of message.args){
  if(typeof arg==='boolean')tags+=arg?'T':'F';
  else if(arg===null)tags+='N';
  else if(arg instanceof Uint8Array)tags+='b';
  else if(typeof arg==='string')tags+='s';
  else if(typeof arg==='bigint')tags+='h';
  else if(typeof arg==='number'&&Number.isInteger(arg))tags+='i';
  else if(typeof arg==='number')tags+='f';
  else if(arg.type==='double')tags+='d';
  else if(arg.type==='timetag')tags+='t';
  else if(arg.type==='impulse')tags+='I';
  else throw new TypeError('Unsupported OSC argument');
 }
 writeString(out,tags);
 for(const arg of message.args){
  if(typeof arg==='boolean'||arg===null||(typeof arg==='object'&&!(arg instanceof Uint8Array)&&arg.type==='impulse'))continue;
  if(typeof arg==='string')writeString(out,arg);
  else if(typeof arg==='bigint')writeInt64(out,arg);
  else if(arg instanceof Uint8Array){write32(out,arg.length);out.push(...arg);while(out.length%4)out.push(0);}
  else if(typeof arg==='number'&&Number.isInteger(arg))write32(out,arg);
  else if(typeof arg==='number'){const b=new ArrayBuffer(4);new DataView(b).setFloat32(0,arg,false);out.push(...new Uint8Array(b));}
  else if(arg.type==='double'){const b=new ArrayBuffer(8);new DataView(b).setFloat64(0,arg.value,false);out.push(...new Uint8Array(b));}
  else if(arg.type==='timetag')writeUInt64(out,arg.value);
 }
 return new Uint8Array(out);
}
export function encodeOscBundle(bundle:OscBundle):Uint8Array{
 const out:number[]=[...encoder.encode('#bundle\0')];writeUInt64(out,bundle.timetag);
 for(const element of bundle.elements){const packet=encodeOscPacket(element);write32(out,packet.length);out.push(...packet);}
 return new Uint8Array(out);
}
export function encodeOscPacket(packet:OscPacket):Uint8Array{return 'bundle'in packet?encodeOscBundle(packet):encodeOscMessage(packet);}
export function decodeOscPacket(packet:Uint8Array):OscPacket{
 if(packet.length>=8&&decoder.decode(packet.subarray(0,8))==='#bundle\0'){
  if(packet.length<16)throw new TypeError('Truncated OSC bundle');
  const timetag=new DataView(packet.buffer,packet.byteOffset+8,8).getBigUint64(0,false);
  let offset=16;const elements:OscPacket[]=[];
  while(offset<packet.length){const length=read32(packet,offset);offset+=4;if(length<=0||length%4!==0||offset+length>packet.length)throw new TypeError('Invalid OSC bundle element length');elements.push(decodeOscPacket(packet.slice(offset,offset+length)));offset+=length;}
  return{bundle:true,timetag,elements};
 }
 const state={offset:0};const address=readString(packet,state);if(!address.startsWith('/'))throw new TypeError('Invalid OSC address');
 const tags=readString(packet,state);if(!tags.startsWith(','))throw new TypeError('Missing OSC type tag string');
 const args:OscArgument[]=[];
 for(const tag of tags.slice(1)){
  if(tag==='T')args.push(true);
  else if(tag==='F')args.push(false);
  else if(tag==='N')args.push(null);
  else if(tag==='I')args.push({type:'impulse'});
  else if(tag==='i'){args.push(read32(packet,state.offset));state.offset+=4;}
  else if(tag==='f'){if(state.offset+4>packet.length)throw new TypeError('Truncated OSC float');args.push(new DataView(packet.buffer,packet.byteOffset+state.offset,4).getFloat32(0,false));state.offset+=4;}
  else if(tag==='d'){if(state.offset+8>packet.length)throw new TypeError('Truncated OSC double');args.push({type:'double',value:new DataView(packet.buffer,packet.byteOffset+state.offset,8).getFloat64(0,false)});state.offset+=8;}
  else if(tag==='s')args.push(readString(packet,state));
  else if(tag==='h'){if(state.offset+8>packet.length)throw new TypeError('Truncated OSC int64');args.push(new DataView(packet.buffer,packet.byteOffset+state.offset,8).getBigInt64(0,false));state.offset+=8;}
  else if(tag==='t'){if(state.offset+8>packet.length)throw new TypeError('Truncated OSC timetag');args.push({type:'timetag',value:new DataView(packet.buffer,packet.byteOffset+state.offset,8).getBigUint64(0,false)});state.offset+=8;}
  else if(tag==='b'){const length=read32(packet,state.offset);state.offset+=4;if(length<0||state.offset+length>packet.length)throw new TypeError('Invalid OSC blob length');args.push(packet.slice(state.offset,state.offset+length));state.offset+=length;while(state.offset%4){if(state.offset>=packet.length||packet[state.offset]!==0)throw new TypeError('Invalid OSC blob padding');state.offset++;}}
  else throw new TypeError('Unsupported OSC type tag: '+tag);
 }
 if(state.offset!==packet.length)throw new TypeError('Unexpected trailing OSC packet data');
 return{address,args};
}
export function decodeOscMessage(packet:Uint8Array):OscMessage{const decoded=decodeOscPacket(packet);if('bundle'in decoded)throw new TypeError('OSC packet is a bundle, not a message');return decoded;}
