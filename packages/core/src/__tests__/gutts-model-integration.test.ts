import { describe, expect, it, vi } from 'vitest';
import { createServiceFacade } from '../services/ServiceFacade.js';
import { SmolLM2, Needle3, MiniLM, EttinReranker17M } from '@dinilmusick/gutts/models';

const runRealModels = process.env.KRNLTS_REAL_MODEL_TESTS === '1';

describe.runIf(runRealModels)('KrnlTS -> GutTS model consumer integration', () => {
  it('uses SmolLM2 inside a normal KrnlTS functionality and exposes its lifecycle events', async () => {
    const model = new SmolLM2();
    const service = createServiceFacade({
      id: 'ai.consumer',
      functionalities: {
        generateText: {
          events: { generated: { name: 'generated' } },
          execute: async (input: { prompt: string }, context: any) => {
            const output = await model.generate({ prompt: input.prompt, maxNewTokens: 16 });
            context.emit('generated', { output });
            return output;
          },
        },
      },
    });

    await service.start();
    const triggered = vi.fn();
    const completed = vi.fn();
    const generated = vi.fn();
    service.namespace.functionalities.generateText.events.triggered.subscribe(triggered);
    service.namespace.functionalities.generateText.events.completed.subscribe(completed);
    service.namespace.functionalities.generateText.events.generated.subscribe(generated);

    const output = await service.call('generateText', { prompt: 'Return exactly the word hello.' });

    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
    expect(triggered).toHaveBeenCalledTimes(1);
    expect(completed).toHaveBeenCalledTimes(1);
    expect(generated).toHaveBeenCalledTimes(1);

    await service.dispose();
  }, 180_000);

  it('uses the other named GutTS models directly from a KrnlTS test consumer', async () => {
    const needle = new Needle3();
    const embedding = await needle.embed('KrnlTS can consume GutTS models like libraries.');
    expect(embedding.length).toBeGreaterThan(0);

    const mini = new MiniLM();
    const similarity = await mini.similarity({
      left: 'A service executes a functionality.',
      right: 'A functionality is executed by a service.',
    });
    expect(Number.isFinite(similarity)).toBe(true);

    const reranker = new EttinReranker17M();
    const scores = await reranker.rerank({
      query: 'KrnlTS service functionality',
      candidates: [
        'A KrnlTS service executes functionality.',
        'A recipe contains flour and water.',
      ],
    });
    expect(scores).toHaveLength(2);
    expect(scores.every(Number.isFinite)).toBe(true);
    expect(scores[0]).toBeGreaterThan(scores[1]);
  }, 180_000);
});

describe('KrnlTS GutTS model consumer contract', () => {
  it('keeps real model verification explicitly opt-in', () => {
    expect(['0', '1']).toContain(process.env.KRNLTS_REAL_MODEL_TESTS ?? '0');
  });
});
