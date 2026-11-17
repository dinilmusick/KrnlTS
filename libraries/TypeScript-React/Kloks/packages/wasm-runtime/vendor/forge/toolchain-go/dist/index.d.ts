import type { BrowserToolchainSource, ServerToolchainSource, ToolchainDescriptor } from "../../contracts/dist/index.js";

export declare const descriptor: ToolchainDescriptor & { readonly id: "go"; readonly version: "1.26.5" };
export declare function browserSource(baseUrl: string): BrowserToolchainSource;
export declare function serverSource(): ServerToolchainSource;
