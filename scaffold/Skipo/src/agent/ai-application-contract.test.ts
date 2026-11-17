import {describe, expect, it} from "vitest";
import {skipoAIApplicationContract} from "./ai-application-contract.js";

describe("Skipo AI application contract", () => {
  it("declares the complete application lifecycle", () => {
    expect(skipoAIApplicationContract.operations).toEqual(["discover", "compose", "modify", "verify", "package", "promote"]);
  });

  it("declares the canonical asset producers", () => {
    expect(skipoAIApplicationContract.producers).toEqual(["kult", "theta", "kelt"]);
  });
});
