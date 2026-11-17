import { browserSource as goSource } from "../vendor/forge/toolchain-go/dist/index.js";
import { browserSource as rustSource } from "../vendor/forge/toolchain-rust/dist/index.js";
import type { SupportedLanguage } from "./types.js";

export interface ToolchainResolver {
  resolve(language: SupportedLanguage, baseUrl: string): unknown;
}

export class ForgeToolchainResolver implements ToolchainResolver {
  resolve(language: SupportedLanguage, baseUrl: string): unknown {
    return language === "rust" ? rustSource(baseUrl) : goSource(baseUrl);
  }
}
