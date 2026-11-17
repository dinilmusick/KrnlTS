import {describe,expect,it} from 'vitest';
import {ClockService,type ClockScheduler} from '../src/clock/index.js';
class FakeScheduler implements ClockScheduler{
 time=0;next=1;timers=new Map<number,{at:number;callback:()=>void}>();
 now(){return this.time;}
 setTimeout(callback:()=>void,delay:number){const id=this.next++;this.timers.set(id,{at:this.time+delay,callback});return id;}
 clearTimeout(handle:unknown){this.timers.delete(handle as number);}
 advance(ms:number){const end=this.time+ms;while(true){const due=[...this.timers.entries()].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;this.time=due[1].at;this.timers.delete(due[0]);due[1].callback();}this.time=end;}
 jump(ms:number){this.time+=ms;const due=[...this.timers.entries()].sort((a,b)=>a[1].at-b[1].at)[0];if(due){this.timers.delete(due[0]);due[1].callback();}}
}
describe('ClockService',()=>{
 it('advances musical position and emits subdivisions',()=>{const s=new FakeScheduler(),c=new ClockService({scheduler:s,tempo:120,resolution:4});const ticks:number[]=[];c.onTick(e=>ticks.push(e.tick));c.start();s.advance(1000);expect(c.getSnapshot().beat).toBeCloseTo(2);expect(ticks).toEqual([1,2,3,4,5,6,7,8]);});
 it('preserves position and elapsed time across pause, resume and tempo changes',()=>{const s=new FakeScheduler(),c=new ClockService({scheduler:s,tempo:120});c.start();s.advance(1000);c.pause();expect(c.getSnapshot().beat).toBeCloseTo(2);s.advance(5000);expect(c.getSnapshot().elapsedMs).toBeCloseTo(1000);c.resume();c.setTempo(60);s.advance(1000);expect(c.getSnapshot().beat).toBeCloseTo(3);expect(c.getSnapshot().elapsedMs).toBeCloseTo(2000);});
 it('resets, validates tempo and releases timers on dispose',()=>{const s=new FakeScheduler(),c=new ClockService({scheduler:s});c.start();s.advance(500);c.reset();expect(c.getSnapshot().beat).toBe(0);expect(()=>c.setTempo(0)).toThrow(RangeError);c.start();c.dispose();expect(s.timers.size).toBe(0);expect(()=>c.start()).toThrow(/disposed/);});
 it('catches up delayed ticks for multiple subscribers and unsubscribes cleanly',()=>{const s=new FakeScheduler(),c=new ClockService({scheduler:s,tempo:60,resolution:4,missedTickPolicy:'catch-up'});const first:number[]=[],second:number[]=[];c.onTick(e=>first.push(e.tick));const stopSecond=c.onTick(e=>second.push(e.tick));c.start();s.jump(1000);expect(first).toEqual([1,2,3,4]);expect(second).toEqual([1,2,3,4]);stopSecond();s.jump(1000);expect(first).toEqual([1,2,3,4,5,6,7,8]);expect(second).toEqual([1,2,3,4]);c.dispose();});
 it('isolates throwing state and tick subscribers without stopping the clock',()=>{const s=new FakeScheduler(),c=new ClockService({scheduler:s,tempo:60,resolution:1});const seen:number[]=[];c.subscribe(()=>{throw new Error('state listener');});c.subscribe(()=>seen.push(-1));c.onTick(()=>{throw new Error('tick listener');});c.onTick(e=>seen.push(e.tick));c.start();s.advance(2000);expect(seen).toEqual([-1,-1,1,2]);expect(c.getSnapshot().beat).toBeCloseTo(2);expect(s.timers.size).toBe(1);c.dispose();});
 it('skips missed ticks deterministically when scheduler is delayed',()=>{const s=new FakeScheduler(),c=new ClockService({scheduler:s,tempo:60,resolution:24,missedTickPolicy:'skip'});const events:number[]=[];c.onTick(e=>events.push(e.tick));c.start();s.jump(1000);expect(events).toEqual([24]);});
});
