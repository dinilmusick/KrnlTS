import {describe, expect, it} from "vitest";
import {
  SmolLM2,
  Needle3,
  Whistle,
  MiniLM,
  EttinReranker17M,
  EttinReranker32M,
  EttinReranker68M,
  EttinReranker150M,
} from "../src/models/index.js";
import {nodeCactusNeedle3Runtime,nodeCactusWhistleRuntime} from "../src/server/models.js";

describe("Real Model Runtime Verification", () => {
  it("SmolLM2 generates text and manages residency", async () => {
    const smol = new SmolLM2();
    expect(smol.residency.isLoaded).toBe(false);
    const result = await smol.generate({prompt: "Explain this error briefly.", maxNewTokens: 10});
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
    expect(smol.residency.isLoaded).toBe(false);
  }, 60000);

  it("Needle3 completes structured task and produces embeddings", async () => {
    const needle = new Needle3(nodeCactusNeedle3Runtime);
    expect(needle.residency.isLoaded).toBe(false);
    const completion = await needle.complete({prompt: "lookup system metrics"});
    expect(completion).toBeDefined();
    expect(needle.residency.isLoaded).toBe(false);

    const embedding = await needle.embed("GutTS utility model");
    expect(embedding).toBeInstanceOf(Float32Array);
    expect((embedding as Float32Array).length).toBe(3072);
    expect(needle.residency.isLoaded).toBe(false);
  }, 60000);

  it("MiniLM computes semantic similarity between texts", async () => {
    const minilm = new MiniLM();
    expect(minilm.residency.isLoaded).toBe(false);
    const identicalSim = await minilm.similarity({left: "TypeScript models", right: "TypeScript models"});
    expect(identicalSim).toBeCloseTo(1.0, 2);
    expect(minilm.residency.isLoaded).toBe(false);

    const differentSim = await minilm.similarity({left: "TypeScript models", right: "banana peel"});
    expect(differentSim).toBeLessThan(0.8);
    expect(minilm.residency.isLoaded).toBe(false);
  }, 60000);

  it("Ettin reranker models resolve to intended model identifiers and rank correctly", async () => {
    const ettin17 = new EttinReranker17M();
    const ettin32 = new EttinReranker32M();
    const ettin68 = new EttinReranker68M();
    const ettin150 = new EttinReranker150M();

    expect(ettin17.metadata.modelUri).toBe("cross-encoder/ettin-reranker-17m-v1");
    expect(ettin32.metadata.modelUri).toBe("cross-encoder/ettin-reranker-32m-v1");
    expect(ettin68.metadata.modelUri).toBe("cross-encoder/ettin-reranker-68m-v1");
    expect(ettin150.metadata.modelUri).toBe("cross-encoder/ettin-reranker-150m-v1");

    expect(ettin17.residency.isLoaded).toBe(false);
    const scores = await ettin17.rerank({
      query: "cat",
      candidates: ["feline kitten", "dump truck"],
    });
    expect(scores).toHaveLength(2);
    expect(scores[0]).toBeGreaterThan(scores[1]!);
    expect(ettin17.residency.isLoaded).toBe(false);
  }, 60000);

  it("Whistle transcribes audio buffer without error", async () => {
    const whistle = new Whistle(nodeCactusWhistleRuntime);
    expect(whistle.residency.isLoaded).toBe(false);
    const sampleRate = 16000;
    const numSamples = 16000;
    const dataSize = numSamples * 2;
    const wav = Buffer.alloc(44 + dataSize);
    wav.write("RIFF", 0);
    wav.writeUInt32LE(36 + dataSize, 4);
    wav.write("WAVE", 8);
    wav.write("fmt ", 12);
    wav.writeUInt32LE(16, 16);
    wav.writeUInt16LE(1, 20);
    wav.writeUInt16LE(1, 22);
    wav.writeUInt32LE(sampleRate, 24);
    wav.writeUInt32LE(sampleRate * 2, 28);
    wav.writeUInt16LE(2, 32);
    wav.writeUInt16LE(16, 34);
    wav.write("data", 36);
    wav.writeUInt32LE(dataSize, 40);

    const transcript = await whistle.transcribe({audio: wav});
    expect(typeof transcript).toBe("string");
    expect(whistle.residency.isLoaded).toBe(false);
  }, 60000);

  it("shares load across concurrent operations and unloads after all complete", async () => {
    const minilm = new MiniLM();
    let loadCount = 0;
    let unloadCount = 0;
    const orig = minilm.runtime;
    const instrumented = {
      load: async (m: any, c: any) => {
        loadCount += 1;
        return orig.load(m, c);
      },
      unload: async (m: any) => {
        unloadCount += 1;
        return orig.unload(m);
      },
    };
    const trackedModel = new MiniLM(instrumented);
    const [res1, res2] = await Promise.all([
      trackedModel.similarity({left: "dog", right: "puppy"}),
      trackedModel.similarity({left: "car", right: "automobile"}),
    ]);
    expect(typeof res1).toBe("number");
    expect(typeof res2).toBe("number");
    expect(loadCount).toBe(1);
    expect(unloadCount).toBe(1);
    expect(trackedModel.residency.isLoaded).toBe(false);
  }, 60000);

  it("releases residency upon failed inference and allows subsequent reload", async () => {
    const minilm = new MiniLM();
    await expect(
      minilm.withModel(async () => {
        throw new Error("simulated failure");
      }),
    ).rejects.toThrow("simulated failure");
    expect(minilm.residency.isLoaded).toBe(false);

    const sim = await minilm.similarity({left: "hello", right: "hello"});
    expect(sim).toBeCloseTo(1.0, 2);
    expect(minilm.residency.isLoaded).toBe(false);
  }, 60000);
});
