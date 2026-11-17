import {describe, expect, it, vi} from "vitest";
import {ModelResidency} from "../src/models/model-residency.js";

describe("ModelResidency", () => {
  it("shares one load across concurrent operations and unloads after the last", async () => {
    const load = vi.fn(async () => ({id: "model"}));
    const unload = vi.fn(async () => {});
    const residency = new ModelResidency<{id: string}>();
    let releaseOperation!: () => void;
    const operationReleased = new Promise<void>((resolve) => {
      releaseOperation = resolve;
    });

    const first = residency.run(load, unload, async (model) => {
      expect(model.id).toBe("model");
      await operationReleased;
      return "first";
    });
    const second = residency.run(load, unload, async (model) => {
      expect(model.id).toBe("model");
      return "second";
    });

    await Promise.resolve();
    await Promise.resolve();
    expect(residency.activeUsers).toBe(2);
    expect(load).toHaveBeenCalledTimes(1);
    expect(unload).not.toHaveBeenCalled();

    releaseOperation();
    await expect(Promise.all([first, second])).resolves.toEqual(["first", "second"]);
    expect(unload).toHaveBeenCalledTimes(1);
    expect(residency.isLoaded).toBe(false);
    expect(residency.activeUsers).toBe(0);
  });

  it("reloads after an idle period", async () => {
    const load = vi.fn(async () => ({id: "model"}));
    const unload = vi.fn(async () => {});
    const residency = new ModelResidency<{id: string}>();

    await residency.run(load, unload, async (model) => model.id);
    await residency.run(load, unload, async (model) => model.id);

    expect(load).toHaveBeenCalledTimes(2);
    expect(unload).toHaveBeenCalledTimes(2);
  });

  it("unloads after an operation fails", async () => {
    const load = vi.fn(async () => ({id: "model"}));
    const unload = vi.fn(async () => {});
    const residency = new ModelResidency<{id: string}>();

    await expect(
      residency.run(load, unload, async () => {
        throw new Error("inference failed");
      }),
    ).rejects.toThrow("inference failed");

    expect(unload).toHaveBeenCalledTimes(1);
    expect(residency.isLoaded).toBe(false);
  });
});
