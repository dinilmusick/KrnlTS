import { createForgeWasmExecutor, type ForgeWasmExecutor } from "./executor.js";
import { resolveLanguage } from "./languageResolver.js";
import type {
  BrowserWasmRuntimeOptions,
  RuntimeEnvironment,
  RuntimeExecuteRequest,
  RuntimeResult,
  SupportedLanguage,
  WasmRuntime,
} from "./types.js";

const DEFAULT_TOOLCHAIN_BASE_URL = "/toolchains/";

export * from "./types.js";
export * from "./executor.js";
export * from "./languageResolver.js";
export * from "./toolchainResolver.js";

export function supportedRuntimeEnvironments(): Record<RuntimeEnvironment, boolean> {
  return {
    browser: true,
    node: false,
    vercel: false,
    "cloudflare-worker": false,
  };
}

export function supportedLanguages(): readonly SupportedLanguage[] {
  return Object.freeze(["rust", "go"]);
}

export async function createBrowserWasmRuntime(
  options?: BrowserWasmRuntimeOptions | string,
): Promise<WasmRuntime> {
  const toolchainBaseUrl =
    typeof options === "string"
      ? options
      : options?.toolchainBaseUrl ?? DEFAULT_TOOLCHAIN_BASE_URL;
  const executor = await createForgeWasmExecutor(toolchainBaseUrl);
  return createRuntime(executor);
}

export async function createWasmRuntime(
  options?: BrowserWasmRuntimeOptions | string,
): Promise<WasmRuntime> {
  return createBrowserWasmRuntime(options);
}

function createRuntime(executor: ForgeWasmExecutor): WasmRuntime {
  return {
    execute: async (request: RuntimeExecuteRequest): Promise<RuntimeResult> => {
      const resolution = resolveLanguage(request);
      return executor.execute(request, resolution.language);
    },
    dispose: () => executor.dispose(),
  };
}
