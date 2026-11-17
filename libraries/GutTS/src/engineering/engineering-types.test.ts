import {describe, expect, it} from "vitest";
import type {ExecutionRequest, EngineeringCapability, VerificationReport} from "./engineering-types.js";

describe("universal engineering contracts", () => {
  it("represents provider-neutral execution", () => {
    const request: ExecutionRequest = {workspaceId: "ws-1", command: "pnpm test", network: "restricted"};
    expect(request.command).toBe("pnpm test");
  });

  it("keeps verification machine-readable", () => {
    const report: VerificationReport = {
      id: "verify-1",
      status: "passed",
      checks: [{id: "build", name: "build", status: "passed"}],
      artifactIds: [],
    };
    expect(report.checks[0]?.status).toBe("passed");
  });

  it("uses explicit capability names", () => {
    const capability: EngineeringCapability = "execution.run";
    expect(capability).toBe("execution.run");
  });
});
