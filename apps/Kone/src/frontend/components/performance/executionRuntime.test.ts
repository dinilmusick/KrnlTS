import { describe, expect, it, vi } from 'vitest';
import type { GraphEdge, GraphNode } from '@ultrst-armada/kloks/state-graph';
import {
  ExecutionRuntime,
  createExecutionTriggerBus,
  connectMidiTrigger,
  connectOscTrigger,
  bindTriggerToExecution,
  type ExecutionNodeHandler,
} from './executionRuntime.js';
const node = (id: string, type = 'immediate', data?: Record<string, unknown>): GraphNode =>
  ({ id, type, label: id, position: { x: 0, y: 0 }, inputs: [], outputs: [], data } as GraphNode);
const edge = (source: string, target: string, sourceSocket = 'execution-out-0'): GraphEdge =>
  ({
    id: `edge-${source}-${target}`,
    source,
    target,
    sourceSocket,
    targetSocket: 'execution-in',
  } as GraphEdge);
describe('Kone execution runtime', () => {
  it('propagates completion through a linear graph', async () => {
    const events: string[] = [];
    const runtime = new ExecutionRuntime({ onEvent: (event) => {
      if (event.type === 'node-completed') events.push(event.nodeId!);
    }});
    runtime.registerGraph({
      id: 'linear',
      nodes: [node('a'), node('b'), node('c')],
      edges: [edge('a', 'b'), edge('b', 'c')],
    });
    const id = await runtime.trigger('linear', ['a']);
    const execution = runtime.getExecution(id)!;
    expect(execution.state).toBe('COMPLETED');
    expect(events).toEqual(['a', 'b', 'c']);
  });
  it('fans out Multiplexer branches concurrently', async () => {
    const starts: string[] = [];
    const runtime = new ExecutionRuntime({ onEvent: (event) => {
      if (event.type === 'node-started' && event.nodeId) starts.push(event.nodeId);
    }});
    runtime.registerGraph({
      id: 'fanout',
      nodes: [node('mux', 'multiplexer'), node('a'), node('b'), node('c')],
      edges: [edge('mux', 'a'), edge('mux', 'b'), edge('mux', 'c')],
    });
    const id = await runtime.trigger('fanout', ['mux']);
    const execution = runtime.getExecution(id)!;
    expect(execution.state).toBe('COMPLETED');
    expect(starts.filter((value) => ['a', 'b', 'c'].includes(value))).toHaveLength(3);
  });
  it('routes Selector to exactly one branch', async () => {
    const completed: string[] = [];
    const runtime = new ExecutionRuntime({
      onEvent: (event) => {
        if (event.type === 'node-completed' && event.nodeId) completed.push(event.nodeId);
      },
    });
    runtime.registerGraph({
      id: 'selector',
      nodes: [node('selector', 'section-selector'), node('a'), node('b'), node('c')],
      edges: [
        edge('selector', 'a', 'execution-out-0'),
        edge('selector', 'b', 'execution-out-1'),
        edge('selector', 'c', 'execution-out-2'),
      ],
    });
    const id = await runtime.trigger('selector', ['selector'], { selection: 1 });
    expect(runtime.getExecution(id)!.state).toBe('COMPLETED');
    expect(completed).toContain('b');
    expect(completed).not.toContain('a');
    expect(completed).not.toContain('c');
  });
  it('tracks nested Performance → Song → Section execution', async () => {
    const runtime = new ExecutionRuntime();
    runtime.registerGraph({
      id: 'performance',
      nodes: [node('song', 'song-node')],
      edges: [],
    });
    runtime.registerGraph({
      id: 'song',
      nodes: [node('section', 'song-section')],
      edges: [],
    });
    runtime.registerGraph({
      id: 'section',
      nodes: [node('clip')],
      edges: [],
    });
    runtime.registerNestedNode('song-node', () => ({ graphId: 'song', entryNodeIds: ['section'] }));
    runtime.registerNestedNode('song-section', () => ({ graphId: 'section', entryNodeIds: ['clip'] }));
    const id = await runtime.trigger('performance', ['song']);
    const execution = runtime.getExecution(id)!;
    expect(execution.state).toBe('COMPLETED');
    expect([...execution.children]).toHaveLength(1);
    const songExecution = runtime.getExecution([...execution.children][0])!;
    expect(songExecution.state).toBe('COMPLETED');
    expect([...songExecution.children]).toHaveLength(1);
  });
  it('pauses, resumes and stops a waiting execution without treating stop as completion', async () => {
    let resolve!: () => void;
    const pause = vi.fn();
    const resume = vi.fn();
    const stop = vi.fn();
    const handler: ExecutionNodeHandler = () => ({
      status: 'WAITING',
      controller: { pause, resume, stop },
      completion: new Promise<void>((r) => { resolve = r; }),
    });
    const runtime = new ExecutionRuntime();
    runtime.registerNodeHandler('waiting', handler);
    runtime.registerGraph({ id: 'controls', nodes: [node('wait', 'waiting')], edges: [] });
    const id = await runtime.trigger('controls', ['wait']);
    await runtime.pause(id);
    expect(runtime.getExecution(id)!.state).toBe('PAUSED');
    expect(pause).toHaveBeenCalledTimes(1);
    await runtime.play(id);
    expect(runtime.getExecution(id)!.state).toBe('RUNNING');
    expect(resume).toHaveBeenCalledTimes(1);
    await runtime.stop(id);
    expect(runtime.getExecution(id)!.state).toBe('STOPPED');
    expect(stop).toHaveBeenCalledTimes(1);
    resolve();
    await Promise.resolve();
    expect(runtime.getExecution(id)!.state).toBe('STOPPED');
  });
  it('fails unknown node types instead of silently completing', async () => {
    const runtime = new ExecutionRuntime();
    runtime.registerGraph({ id: 'unknown', nodes: [node('mystery', 'unknown-type')], edges: [] });

    const id = await runtime.trigger('unknown', ['mystery']);
    const execution = runtime.getExecution(id)!;

    expect(execution.state).toBe('FAILED');
  });

  it('supports repeated execution instances of the same node', async () => {
    const runtime = new ExecutionRuntime();
    runtime.registerGraph({ id: 'repeat', nodes: [node('button', 'button')], edges: [] });
    const first = await runtime.trigger('repeat', ['button']);
    const second = await runtime.trigger('repeat', ['button']);
    expect(first).not.toBe(second);
    expect(runtime.getExecution(first)!.state).toBe('COMPLETED');
    expect(runtime.getExecution(second)!.state).toBe('COMPLETED');
  });
  it('converges MIDI and OSC triggers on the same execution trigger bus', async () => {
    const bus = createExecutionTriggerBus();
    const received: unknown[] = [];
    const unsubscribe = bus.subscribe('song-3', (payload) => received.push(payload.source));
    await bus.trigger('song-3', { source: 'midi' });
    await bus.trigger('song-3', { source: 'osc' });
    expect(received).toEqual(['midi', 'osc']);
    unsubscribe();
  });
});
