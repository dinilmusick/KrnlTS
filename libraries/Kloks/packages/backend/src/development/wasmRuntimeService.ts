import type {
  BrowserWasmRuntimeOptions,
  RuntimeExecuteRequest,
  RuntimeResult,
  WasmRuntime,
} from "@kloks/wasm-runtime";
import {
  createService,
  createServiceDefinition,
  type IService,
  type ServiceDefinition,
} from "@ultrst-armada/krnl";

let runtime: WasmRuntime | undefined;

async function getRuntime(options: BrowserWasmRuntimeOptions = {}): Promise<WasmRuntime> {
  if (!runtime) {
    const { createWasmRuntime } = await import("@kloks/wasm-runtime");
    runtime = await createWasmRuntime(options);
  }
  return runtime;
}

export const WasmRuntimeServiceDefinition: ServiceDefinition = createServiceDefinition({
  id: "kloks.backend.wasmRuntime",
  name: "WasmRuntimeService",
  version: "1.0.0",
  operations: {
    execute: {
      id: "WasmRuntimeService.execute",
      name: "execute",
      handler: async (input: RuntimeExecuteRequest): Promise<RuntimeResult> => {
        return (await getRuntime()).execute(input);
      },
    },
    dispose: {
      id: "WasmRuntimeService.dispose",
      name: "dispose",
      handler: async () => {
        runtime?.dispose();
        runtime = undefined;
        return { disposed: true };
      },
    },
  },
});

export interface WasmRuntimeServiceFacade {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly definition: ServiceDefinition;
  createInstance(): IService;
  execute<TIn = RuntimeExecuteRequest, TOut = RuntimeResult>(
    operation: string,
    input?: TIn,
  ): Promise<TOut>;
}

export const WasmRuntimeServiceFacade: WasmRuntimeServiceFacade = {
  id: WasmRuntimeServiceDefinition.id,
  name: WasmRuntimeServiceDefinition.name,
  version: WasmRuntimeServiceDefinition.version,
  definition: WasmRuntimeServiceDefinition,
  createInstance: () => createService(WasmRuntimeServiceDefinition),
  execute: async <TIn = RuntimeExecuteRequest, TOut = RuntimeResult>(
    operation: string,
    input?: TIn,
  ) => {
    const instance = createService(WasmRuntimeServiceDefinition);
    await instance.start();
    return instance.call<TIn, TOut>(operation, input);
  },
};
