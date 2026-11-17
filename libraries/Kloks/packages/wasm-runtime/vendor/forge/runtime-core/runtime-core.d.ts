/* tslint:disable */
/* eslint-disable */

/**
 * Process-local browser Go compiler session. Construction transfers and
 * hydrates the immutable package/stdlib exactly once; later calls carry only
 * monotonic source deltas and pipeline requests.
 */
export class GoCompilerSession {
    free(): void;
    [Symbol.dispose](): void;
    compilePipeline(request: any): Promise<any>;
    constructor(config: any);
    readonly digest: string;
    readonly generation: number;
}

/**
 * Runs one side of an interactive session in the calling Worker. `read`,
 * `wait` and `write` block on the session's shared ring buffers; `poll`
 * checks the input without blocking; `close(fd)` closes the input (0) or
 * output (1) end when the guest drops it.
 */
export function run_interactive_side(request: any, read: Function, poll: Function, wait: Function, write: Function, close: Function, on_execution: Function): any;

export function run_wasm_oj(request: any, on_execution: Function): any;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_gocompilersession_free: (a: number, b: number) => void;
    readonly gocompilersession_compilePipeline: (a: number, b: any) => any;
    readonly gocompilersession_digest: (a: number) => [number, number];
    readonly gocompilersession_generation: (a: number) => [number, number, number];
    readonly gocompilersession_new: (a: any) => [number, number, number];
    readonly run_interactive_side: (a: any, b: any, c: any, d: any, e: any, f: any, g: any) => [number, number, number];
    readonly run_wasm_oj: (a: any, b: any) => [number, number, number];
    readonly canonical_abi_free: (a: number, b: number, c: number) => void;
    readonly canonical_abi_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbg_trap_free: (a: number, b: number) => void;
    readonly trap___wbg_wasmer_trap: () => void;
    readonly wasm_bindgen_68458880a41dd4bb___convert__closures_____invoke___wasm_bindgen_68458880a41dd4bb___JsValue__core_9b3796e30d99ddb7___result__Result_____wasm_bindgen_68458880a41dd4bb___JsError___true_: (a: number, b: number, c: any) => [number, number];
    readonly wasm_bindgen_68458880a41dd4bb___convert__closures________invoke___js_sys_c11fba41208799d1___Array__core_9b3796e30d99ddb7___result__Result_js_sys_c11fba41208799d1___Array__wasm_bindgen_68458880a41dd4bb___JsValue___true_: (a: number, b: number, c: any) => [number, number, number];
    readonly wasm_bindgen_68458880a41dd4bb___convert__closures________invoke___js_sys_c11fba41208799d1___Array__core_9b3796e30d99ddb7___result__Result_js_sys_c11fba41208799d1___Array__wasm_bindgen_68458880a41dd4bb___JsValue___true__2: (a: number, b: number, c: any) => [number, number, number];
    readonly wasm_bindgen_68458880a41dd4bb___convert__closures________invoke___js_sys_c11fba41208799d1___Array__core_9b3796e30d99ddb7___result__Result_____wasm_bindgen_68458880a41dd4bb___JsValue___true_: (a: number, b: number, c: any) => [number, number];
    readonly wasm_bindgen_68458880a41dd4bb___convert__closures_____invoke___js_sys_c11fba41208799d1___Function_fn_wasm_bindgen_68458880a41dd4bb___JsValue_____wasm_bindgen_68458880a41dd4bb___sys__Undefined___js_sys_c11fba41208799d1___Function_fn_wasm_bindgen_68458880a41dd4bb___JsValue_____wasm_bindgen_68458880a41dd4bb___sys__Undefined_______true_: (a: number, b: number, c: any, d: any) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_export: WebAssembly.Table;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_destroy_closure: (a: number, b: number) => void;
    readonly __externref_drop_slice: (a: number, b: number) => void;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
