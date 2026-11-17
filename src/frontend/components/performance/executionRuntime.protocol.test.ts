import { describe, expect, it } from 'vitest';
import {
  ExecutionRuntime,
  createExecutionTriggerBus,
  connectMidiTrigger,
  connectOscTrigger,
  bindTriggerToExecution,
} from './executionRuntime.js';
import type { GraphNode } from '@ultrst-armada/kloks/state-graph';

const node = (id: string, type = 'immediate'): GraphNode =>
  ({ id, type, label: id, position: { x: 0, y: 0 }, inputs: [], outputs: [] } as GraphNode);

describe('execution replay and protocol adapters', () => {
  it('creates a fresh execution instance after STOP + PLAY', async () => {
    const runtime = new ExecutionRuntime();
    runtime.registerGraph({ id: 'replay', nodes: [node('button', 'button')], edges: [] });
    const first = await runtime.trigger('replay', ['button']);
    await runtime.stop(first);
    const second = await runtime.play(first);
    expect(second).not.toBe(first);
    expect(runtime.getExecution(second)!.state).toBe('COMPLETED');
  });
  it('adapts MIDI and OSC events into ExecutionFlow triggers', async () => {
    const bus = createExecutionTriggerBus();
    const sources: string[] = [];
    const unsubscribe = bus.subscribe('target', (payload) => sources.push(String(payload.source)));
    let midiListener!: (message: never, deviceId: string) => void;
    const midiUnsubscribe = connectMidiTrigger(
      { subscribe: (listener) => { midiListener = listener; return () => {}; } },
      bus,
      'target',
    );
    midiListener({} as never, 'midi-device');
    let oscListener!: (message: never, endpointId: string) => void;
    const oscUnsubscribe = connectOscTrigger(
      { subscribe: (_pattern, listener) => { oscListener = listener; return () => {}; } },
      bus,
      'target',
      '/launch',
    );
    oscListener({} as never, 'osc-endpoint');
    await Promise.resolve();
    expect(sources).toEqual(['midi', 'osc']);
    midiUnsubscribe();
    oscUnsubscribe();
    unsubscribe();
  });
});

it('binds an external trigger to a graph entry node', async () => {
  const started: string[] = [];
  const runtime = new ExecutionRuntime({ onEvent: (event) => { if (event.type === 'started') started.push(event.executionId); } });
  runtime.registerGraph({ id: 'triggered', nodes: [node('button', 'button')], edges: [] });
  const bus = createExecutionTriggerBus();
  const unsubscribe = bindTriggerToExecution(runtime, bus, 'triggered', 'button');
  await bus.trigger('button', { source: 'midi' });
  await Promise.resolve();
  unsubscribe();
  expect(started).toHaveLength(1);
});
