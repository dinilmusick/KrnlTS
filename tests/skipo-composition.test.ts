// ══════════════════════════════════════════════════════════════════════════════
// 1. SKIPO MINIMAL APPLICATION COMPOSITION TEST
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { SkipoBackend } from '../src/backend/SkipoBackend.js';
import { App } from '../src/frontend/App.js';
import { FrnlEditableNodeGraph } from '../src/frontend/components/components.js';

describe('Skipo Minimal Application Composition (@kloks/* + @floks/*)', () => {
  it('composes @kloks/* services and orchestrators in SkipoBackend without local source duplication', async () => {
    expect(SkipoBackend.services.serviceA).toBeDefined();
    expect(SkipoBackend.services.audioHardware).toBeDefined();
    expect(SkipoBackend.services.midi).toBeDefined();
    expect(SkipoBackend.services.workspace).toBeDefined();
    expect(SkipoBackend.orchestrations.orchestratorA).toBeDefined();
    expect(SkipoBackend.orchestrations.audioMidi).toBeDefined();
    expect(SkipoBackend.backendFacade).toBeDefined();
    expect(SkipoBackend.backendFacade.namespaces['serviceA']).toBeDefined();
    expect(SkipoBackend.libraries).toBeDefined();
    expect(SkipoBackend.functionalities).toBeDefined();

    const sum = await SkipoBackend.services.serviceA.execute<
      { a: number; b: number },
      { result: number }
    >('add', { a: 21, b: 21 });
    expect(sum.result).toBe(42);

    const midiOut = await SkipoBackend.orchestrations.audioMidi.execute({
      midiCommand: 'NOTE_ON',
      note: 72,
      velocity: 120,
      channel: 1,
    });
    expect(midiOut.midiEvent.note).toBe(72);
  });

  it('resolves the node-graph frontend and registers its required backend service', () => {
    expect(typeof FrnlEditableNodeGraph).toBe('function');
    expect(SkipoBackend.services.nodeGraphEngine).toBeDefined();
    expect(SkipoBackend.services.nodeGraphEngine.id).toContain('graph');
  });

  it('composes @floks/* UI components in App.tsx', () => {
    expect(typeof App).toBe('function');
  });
});
