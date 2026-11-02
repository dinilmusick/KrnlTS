import {describe, expect, it, vi} from "vitest";
import {DefaultExecutionController} from "./execution-controller.js";
import type {ExecutionProvider} from "./execution-types.js";

describe("DefaultExecutionController", () => {
  it("routes work to a registered provider", async () => {
    const provider: ExecutionProvider = {
      id: "local",
      execute: vi.fn(async () => ({executionId: "exec-1", status: "succeeded" as const, exitCode: 0, stdout: "ok", stderr: "", artifactIds: []})),
      cancel: vi.fn(async () => undefined),
    };
    const controller = new DefaultExecutionController();
    controller.register(provider);
    const result = await controller.execute({workspaceId: "ws-1", command: "echo ok"});
    expect(result.executionId).toBe("exec-1");
    expect(provider.execute).toHaveBeenCalledOnce();
  });

  it("requires a provider", async () => {
    await expect(new DefaultExecutionController().execute({workspaceId: "ws-1", command: "echo ok"})).rejects.toThrow("No execution provider");
  });
});
