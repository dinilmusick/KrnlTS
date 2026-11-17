import {describe, expect, it} from "vitest";
import {
  ettinRerankApi,
  guttsApiById,
  guttsModelById,
  guttsModelDefinitions,
  EttinReranker17M,
  EttinReranker32M,
  EttinReranker68M,
  EttinReranker150M,
  MiniLM,
  Needle3,
  SmolLM2,
  Whistle,
  miniLMSimilarityApi,
  needle3CompleteApi,
  smolLM2GenerateApi,
  whistleTranscribeApi,
} from "../src/index.js";

describe("model API contracts", () => {
  it("exposes every named model operation through the semantic registry", () => {
    for (const api of [
      smolLM2GenerateApi,
      needle3CompleteApi,
      whistleTranscribeApi,
      ettinRerankApi,
      miniLMSimilarityApi,
    ]) {
      expect(guttsApiById[api.id]).toBe(api);
      expect(api.inputSchema.type).toBe("object");
      expect(api.description.length).toBeGreaterThan(0);
    }
  });
});


describe("model metadata registry", () => {
  it("contains named models with selection guidance", () => {
    expect(guttsModelDefinitions.length).toBe(8);
    for (const model of guttsModelDefinitions) {
      expect(guttsModelById[model.id]).toBe(model);
      expect(model.whenToUse.length).toBeGreaterThan(0);
      expect(model.avoidWhen.length).toBeGreaterThan(0);
      expect(model.examples.length).toBeGreaterThan(0);
    }
  });
});


describe("named model libraries", () => {
  it("construct without runtime configuration", () => {
    expect(new SmolLM2()).toBeInstanceOf(SmolLM2);
    expect(new Needle3()).toBeInstanceOf(Needle3);
    expect(new Whistle()).toBeInstanceOf(Whistle);
    expect(new MiniLM()).toBeInstanceOf(MiniLM);
    expect(new EttinReranker17M()).toBeInstanceOf(EttinReranker17M);
    expect(new EttinReranker32M()).toBeInstanceOf(EttinReranker32M);
    expect(new EttinReranker68M()).toBeInstanceOf(EttinReranker68M);
    expect(new EttinReranker150M()).toBeInstanceOf(EttinReranker150M);
  });
});
