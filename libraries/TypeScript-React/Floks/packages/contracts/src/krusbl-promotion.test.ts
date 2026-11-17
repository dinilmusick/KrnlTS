import {describe, expect, it} from "vitest";
import {floksPromotionContract} from "./krusbl-promotion.js";

describe("Floks Krusbl promotion contract", () => {
  it("requires provenance and verification evidence", () => {
    expect(floksPromotionContract.requiredEvidence).toEqual(["sourceRepository", "sourceCommit", "verificationId"]);
  });
});
