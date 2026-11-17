import {describe, expect, it} from "vitest";
import {CommandVerificationProvider} from "./verification-provider.js";

describe("CommandVerificationProvider", () => {
  it("runs verification steps sequentially", async () => {
    const report = await new CommandVerificationProvider().verify([{id: "one", name: "one", command: "printf ok"}]);
    expect(report.status).toBe("passed");
    expect(report.checks[0]?.stdout).toBe("ok");
  });

  it("stops at the first failed step", async () => {
    const report = await new CommandVerificationProvider().verify([{id: "fail", name: "fail", command: "exit 3"}, {id: "never", name: "never", command: "exit 0"}]);
    expect(report.status).toBe("failed");
    expect(report.checks).toHaveLength(1);
  });
});
