/* @ts-self-types="./runtime-core.d.ts" */

/**
 * Process-local browser Go compiler session. Construction transfers and
 * hydrates the immutable package/stdlib exactly once; later calls carry only
 * monotonic source deltas and pipeline requests.
 */
export class GoCompilerSession {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GoCompilerSessionFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_gocompilersession_free(ptr, 0);
    }
    /**
     * @param {any} request
     * @returns {Promise<any>}
     */
    compilePipeline(request) {
        const ret = wasm.gocompilersession_compilePipeline(this.__wbg_ptr, request);
        return ret;
    }
    /**
     * @returns {string}
     */
    get digest() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.gocompilersession_digest(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {number}
     */
    get generation() {
        const ret = wasm.gocompilersession_generation(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0] >>> 0;
    }
    /**
     * @param {any} config
     */
    constructor(config) {
        const ret = wasm.gocompilersession_new(config);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        GoCompilerSessionFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) GoCompilerSession.prototype[Symbol.dispose] = GoCompilerSession.prototype.free;

/**
 * A struct representing a Trap
 */
export class Trap {
    static __wrap(ptr) {
        const obj = Object.create(Trap.prototype);
        obj.__wbg_ptr = ptr;
        TrapFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TrapFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_trap_free(ptr, 0);
    }
    /**
     * A marker method to indicate that an object is an instance of the `Trap`
     * class.
     */
    static __wbg_wasmer_trap() {
        wasm.trap___wbg_wasmer_trap();
    }
}
if (Symbol.dispose) Trap.prototype[Symbol.dispose] = Trap.prototype.free;

/**
 * Runs one side of an interactive session in the calling Worker. `read`,
 * `wait` and `write` block on the session's shared ring buffers; `poll`
 * checks the input without blocking; `close(fd)` closes the input (0) or
 * output (1) end when the guest drops it.
 * @param {any} request
 * @param {Function} read
 * @param {Function} poll
 * @param {Function} wait
 * @param {Function} write
 * @param {Function} close
 * @param {Function} on_execution
 * @returns {any}
 */
export function run_interactive_side(request, read, poll, wait, write, close, on_execution) {
    const ret = wasm.run_interactive_side(request, read, poll, wait, write, close, on_execution);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * @param {any} request
 * @param {Function} on_execution
 * @returns {any}
 */
export function run_wasm_oj(request, on_execution) {
    const ret = wasm.run_wasm_oj(request, on_execution);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg_BigInt_54837260f97b6890: function(arg0) {
            const ret = BigInt(arg0);
            return ret;
        },
        __wbg_Error_408e67f47ca7b58b: function(arg0, arg1) {
            const ret = Error(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_Number_3890faa6d3ff057d: function(arg0) {
            const ret = Number(arg0);
            return ret;
        },
        __wbg_String_8564e559799eccda: function(arg0, arg1) {
            const ret = String(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_bigint_get_as_i64_c4ecf48528083721: function(arg0, arg1) {
            const v = arg1;
            const ret = typeof(v) === 'bigint' ? v : undefined;
            getDataViewMemory0().setBigInt64(arg0 + 8 * 1, isLikeNone(ret) ? BigInt(0) : ret, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
        },
        __wbg___wbindgen_boolean_get_c9c83ebd41b34df3: function(arg0) {
            const v = arg0;
            const ret = typeof(v) === 'boolean' ? v : undefined;
            return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
        },
        __wbg___wbindgen_debug_string_a57024b9c6e4a48b: function(arg0, arg1) {
            const ret = debugString(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_function_table_cad76479cff6555c: function() {
            const ret = wasm.__wbindgen_export;
            return ret;
        },
        __wbg___wbindgen_in_ac983077f137f2e6: function(arg0, arg1) {
            const ret = arg0 in arg1;
            return ret;
        },
        __wbg___wbindgen_is_bigint_8ffbbef442139384: function(arg0) {
            const ret = typeof(arg0) === 'bigint';
            return ret;
        },
        __wbg___wbindgen_is_function_5e4570eb24ffa122: function(arg0) {
            const ret = typeof(arg0) === 'function';
            return ret;
        },
        __wbg___wbindgen_is_object_a2790eb24c211ea0: function(arg0) {
            const val = arg0;
            const ret = typeof(val) === 'object' && val !== null;
            return ret;
        },
        __wbg___wbindgen_is_string_e6f02f0ea5f20a32: function(arg0) {
            const ret = typeof(arg0) === 'string';
            return ret;
        },
        __wbg___wbindgen_is_undefined_6cff064c44e0d823: function(arg0) {
            const ret = arg0 === undefined;
            return ret;
        },
        __wbg___wbindgen_jsval_eq_0a18949a61670320: function(arg0, arg1) {
            const ret = arg0 === arg1;
            return ret;
        },
        __wbg___wbindgen_jsval_loose_eq_acf2776254a8d832: function(arg0, arg1) {
            const ret = arg0 == arg1;
            return ret;
        },
        __wbg___wbindgen_lt_94fbb50645571f95: function(arg0, arg1) {
            const ret = arg0 < arg1;
            return ret;
        },
        __wbg___wbindgen_neg_8a39375bffed95b1: function(arg0) {
            const ret = -arg0;
            return ret;
        },
        __wbg___wbindgen_number_get_136b9679cab35cfb: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'number' ? obj : undefined;
            getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
        },
        __wbg___wbindgen_rethrow_fbd2dcd7d2b9ac5f: function(arg0) {
            throw arg0;
        },
        __wbg___wbindgen_shr_cf84c7eeac93e2e0: function(arg0, arg1) {
            const ret = arg0 >> arg1;
            return ret;
        },
        __wbg___wbindgen_string_get_d154f1e671052120: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'string' ? obj : undefined;
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_throw_bb96b2010945f0bc: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg__wbg_cb_unref_be22cc64ae6946a0: function(arg0) {
            arg0._wbg_cb_unref();
        },
        __wbg_apply_6cd9daeacef161ce: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = Reflect.apply(arg0, arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_apply_cb180996ed7fdae9: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.apply(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_arrayBuffer_16433f17fbd74397: function() { return handleError(function (arg0) {
            const ret = arg0.arrayBuffer();
            return ret;
        }, arguments); },
        __wbg_bind_ba1d91a55e59341a: function(arg0, arg1, arg2) {
            const ret = arg0.bind(arg1, arg2);
            return ret;
        },
        __wbg_bind_f0a9af73583d6566: function(arg0, arg1, arg2, arg3) {
            const ret = arg0.bind(arg1, arg2, arg3);
            return ret;
        },
        __wbg_buffer_8117fe4dab119813: function(arg0) {
            const ret = arg0.buffer;
            return ret;
        },
        __wbg_buffer_bc63d6f0ff4af1fc: function(arg0) {
            const ret = arg0.buffer;
            return ret;
        },
        __wbg_byteLength_031910aabf3577e0: function(arg0) {
            const ret = arg0.byteLength;
            return ret;
        },
        __wbg_byteLength_dfbb09ce977c0dad: function(arg0) {
            const ret = arg0.byteLength;
            return ret;
        },
        __wbg_call_1c5886ab9c57d1c7: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.call(arg1);
            return ret;
        }, arguments); },
        __wbg_call_35dba3c747ad7521: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.call(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_constructor_aaf603909746f45e: function(arg0) {
            const ret = arg0.constructor;
            return ret;
        },
        __wbg_customSections_b6ef655bf3ceaeb6: function(arg0, arg1, arg2) {
            const ret = WebAssembly.Module.customSections(arg0, getStringFromWasm0(arg1, arg2));
            return ret;
        },
        __wbg_done_669171204c3dcae2: function(arg0) {
            const ret = arg0.done;
            return ret;
        },
        __wbg_entries_7774d489e1da5f4f: function(arg0) {
            const ret = Object.entries(arg0);
            return ret;
        },
        __wbg_error_757e9472f8410341: function(arg0, arg1) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg0;
                deferred0_1 = arg1;
                console.error(getStringFromWasm0(arg0, arg1));
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_exports_7d05caa1a0c36b86: function(arg0) {
            const ret = arg0.exports;
            return ret;
        },
        __wbg_exports_c5a4e6d954ac0ad0: function(arg0) {
            const ret = WebAssembly.Module.exports(arg0);
            return ret;
        },
        __wbg_fetch_729fad2e5272298f: function(arg0, arg1) {
            const ret = arg0.fetch(arg1);
            return ret;
        },
        __wbg_fetch_d752d93f5b259503: function(arg0, arg1) {
            const ret = arg0.fetch(arg1);
            return ret;
        },
        __wbg_from_74f3d90e0ff11240: function(arg0) {
            const ret = Array.from(arg0);
            return ret;
        },
        __wbg_getPrototypeOf_55a24d07487f0509: function() { return handleError(function (arg0) {
            const ret = Reflect.getPrototypeOf(arg0);
            return ret;
        }, arguments); },
        __wbg_getRandomValues_436a51d0629d84e1: function() { return handleError(function (arg0, arg1) {
            globalThis.crypto.getRandomValues(getArrayU8FromWasm0(arg0, arg1));
        }, arguments); },
        __wbg_getTime_63fb0332e6c4ec17: function(arg0) {
            const ret = arg0.getTime();
            return ret;
        },
        __wbg_getTimezoneOffset_4baa793e0d3962a8: function(arg0) {
            const ret = arg0.getTimezoneOffset();
            return ret;
        },
        __wbg_get_70e2ce0f7d009e1f: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.get(arg1 >>> 0);
            return ret;
        }, arguments); },
        __wbg_get_971a0c45d172643f: function() { return handleError(function (arg0, arg1) {
            const ret = Reflect.get(arg0, arg1);
            return ret;
        }, arguments); },
        __wbg_get_c0c8f8d7da0c03dd: function(arg0, arg1) {
            const ret = arg0[arg1 >>> 0];
            return ret;
        },
        __wbg_get_d173c0308df22d37: function() { return handleError(function (arg0, arg1) {
            const ret = Reflect.get(arg0, arg1);
            return ret;
        }, arguments); },
        __wbg_get_unchecked_e20b893aeafc3fca: function(arg0, arg1) {
            const ret = arg0[arg1 >>> 0];
            return ret;
        },
        __wbg_get_with_ref_key_6412cf3094599694: function(arg0, arg1) {
            const ret = arg0[arg1];
            return ret;
        },
        __wbg_grow_5344199563323c70: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.grow(arg1 >>> 0);
            return ret;
        }, arguments); },
        __wbg_grow_adf1e32e3f3bb932: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.grow(arg1 >>> 0);
            return ret;
        }, arguments); },
        __wbg_headers_6dedf39f001ae99d: function(arg0) {
            const ret = arg0.headers;
            return ret;
        },
        __wbg_headers_92567b07014384b9: function(arg0) {
            const ret = arg0.headers;
            return ret;
        },
        __wbg_imports_d64558b2dafe33b8: function(arg0) {
            const ret = WebAssembly.Module.imports(arg0);
            return ret;
        },
        __wbg_instanceof_ArrayBuffer_993d02d2d254cad1: function(arg0) {
            let result;
            try {
                result = arg0 instanceof ArrayBuffer;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Error_61d8a02a0f3383a1: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Error;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Function_f7fa7e26e46ea413: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Function;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Global_eb9f44c43679a9c6: function(arg0) {
            let result;
            try {
                result = arg0 instanceof WebAssembly.Global;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Memory_37fa5d38ff0dd2f3: function(arg0) {
            let result;
            try {
                result = arg0 instanceof WebAssembly.Memory;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Object_80ad464782e2bd73: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Object;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_RangeError_b306483892e8598c: function(arg0) {
            let result;
            try {
                result = arg0 instanceof RangeError;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Response_8f49efbd4bfd76d6: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Response;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_SharedArrayBuffer_c734e76df6d827cb: function(arg0) {
            let result;
            try {
                result = arg0 instanceof SharedArrayBuffer;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Table_01ff4017eccbeab8: function(arg0) {
            let result;
            try {
                result = arg0 instanceof WebAssembly.Table;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Tag_21ca531473671582: function(arg0) {
            let result;
            try {
                result = arg0 instanceof WebAssembly.Tag;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Uint8Array_f935dbb0aa7cdeed: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Uint8Array;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_WorkerGlobalScope_8c58a6d74926b578: function(arg0) {
            let result;
            try {
                result = arg0 instanceof WorkerGlobalScope;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_isArray_6339f732981044bf: function(arg0) {
            const ret = Array.isArray(arg0);
            return ret;
        },
        __wbg_isSafeInteger_f3d6cd19ccfe4512: function(arg0) {
            const ret = Number.isSafeInteger(arg0);
            return ret;
        },
        __wbg_iterator_5cebbb86e33c6dd6: function() {
            const ret = Symbol.iterator;
            return ret;
        },
        __wbg_length_1368b9bb66f6a6aa: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_length_36bd29c6848c2144: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_length_ecfa2c63d3d0d82c: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_message_c141d5e68716b595: function(arg0) {
            const ret = arg0.message;
            return ret;
        },
        __wbg_new_0_f117d868b403dc07: function() {
            const ret = new Date();
            return ret;
        },
        __wbg_new_116be93542d39019: function() {
            const ret = new Array();
            return ret;
        },
        __wbg_new_227d7c05414eb861: function() {
            const ret = new Error();
            return ret;
        },
        __wbg_new_3867db84790e6cb4: function(arg0) {
            const ret = new SharedArrayBuffer(arg0 >>> 0);
            return ret;
        },
        __wbg_new_52e39b693b131692: function() { return handleError(function (arg0) {
            const ret = new WebAssembly.Tag(arg0);
            return ret;
        }, arguments); },
        __wbg_new_77cc4f4f472aeb81: function(arg0) {
            const ret = new Uint8Array(arg0);
            return ret;
        },
        __wbg_new_82966bafe01b664f: function() { return handleError(function (arg0) {
            const ret = new WebAssembly.Table(arg0);
            return ret;
        }, arguments); },
        __wbg_new_bd7a161a1b96dc2a: function() { return handleError(function (arg0, arg1) {
            const ret = new WebAssembly.Global(arg0, arg1);
            return ret;
        }, arguments); },
        __wbg_new_cdf041679ded4c5f: function() {
            const ret = new Map();
            return ret;
        },
        __wbg_new_d1599c9e69d35606: function() { return handleError(function (arg0, arg1) {
            const ret = new WebAssembly.Instance(arg0, arg1);
            return ret;
        }, arguments); },
        __wbg_new_e3fb27841b78e4f4: function() { return handleError(function (arg0) {
            const ret = new WebAssembly.Module(arg0);
            return ret;
        }, arguments); },
        __wbg_new_ebe3e0f6837f0879: function() {
            const ret = new Object();
            return ret;
        },
        __wbg_new_f545e2e1ea609f29: function(arg0) {
            const ret = new Int32Array(arg0);
            return ret;
        },
        __wbg_new_f9d6489212f3b2b3: function(arg0) {
            const ret = new Date(arg0);
            return ret;
        },
        __wbg_new_fee1181bcca662c4: function() { return handleError(function (arg0) {
            const ret = new WebAssembly.Memory(arg0);
            return ret;
        }, arguments); },
        __wbg_new_from_slice_3eea173078478cfe: function(arg0, arg1) {
            const ret = new Uint8Array(getArrayU8FromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_new_typed_cceaf62d8d95e9f2: function(arg0, arg1) {
            try {
                var state0 = {a: arg0, b: arg1};
                var cb0 = (arg0, arg1) => {
                    const a = state0.a;
                    state0.a = 0;
                    try {
                        return wasm_bindgen_68458880a41dd4bb___convert__closures_____invoke___js_sys_c11fba41208799d1___Function_fn_wasm_bindgen_68458880a41dd4bb___JsValue_____wasm_bindgen_68458880a41dd4bb___sys__Undefined___js_sys_c11fba41208799d1___Function_fn_wasm_bindgen_68458880a41dd4bb___JsValue_____wasm_bindgen_68458880a41dd4bb___sys__Undefined_______true_(a, state0.b, arg0, arg1);
                    } finally {
                        state0.a = a;
                    }
                };
                const ret = new Promise(cb0);
                return ret;
            } finally {
                state0.a = 0;
            }
        },
        __wbg_new_with_args_75f20e1087b74fa8: function(arg0, arg1, arg2, arg3) {
            const ret = new Function(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
            return ret;
        },
        __wbg_new_with_length_2ccc5dbfb4541247: function(arg0) {
            const ret = new Array(arg0 >>> 0);
            return ret;
        },
        __wbg_new_with_length_3ffc1c56427c525c: function(arg0) {
            const ret = new Uint8Array(arg0 >>> 0);
            return ret;
        },
        __wbg_new_with_str_and_init_5a37d576dec75a86: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = new Request(getStringFromWasm0(arg0, arg1), arg2);
            return ret;
        }, arguments); },
        __wbg_next_42cf16ee0dafc9e2: function() { return handleError(function (arg0) {
            const ret = arg0.next();
            return ret;
        }, arguments); },
        __wbg_next_8f26b64fa5e9f64b: function(arg0) {
            const ret = arg0.next;
            return ret;
        },
        __wbg_now_8b265300afd5f2b9: function() {
            const ret = Date.now();
            return ret;
        },
        __wbg_prototypesetcall_de8e0d9553586985: function(arg0, arg1, arg2) {
            Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
        },
        __wbg_push_adb0107829f02d75: function(arg0, arg1) {
            const ret = arg0.push(arg1);
            return ret;
        },
        __wbg_queueMicrotask_ac694eae12e92dfb: function(arg0) {
            queueMicrotask(arg0);
        },
        __wbg_queueMicrotask_be5fe34a8f4cad4d: function(arg0) {
            const ret = arg0.queueMicrotask;
            return ret;
        },
        __wbg_redirected_38edd6189354296c: function(arg0) {
            const ret = arg0.redirected;
            return ret;
        },
        __wbg_resolve_020f95d838c6ef25: function(arg0) {
            const ret = Promise.resolve(arg0);
            return ret;
        },
        __wbg_set_014226dfeca53178: function(arg0, arg1, arg2) {
            const ret = arg0.set(arg1, arg2);
            return ret;
        },
        __wbg_set_14811fdb285b1915: function() { return handleError(function (arg0, arg1, arg2) {
            arg0.set(arg1 >>> 0, arg2);
        }, arguments); },
        __wbg_set_6be42768c690e380: function(arg0, arg1, arg2) {
            arg0[arg1] = arg2;
        },
        __wbg_set_8155bb79a948541b: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = Reflect.set(arg0, arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_set_a80955eb93b145c6: function(arg0, arg1, arg2) {
            arg0[arg1 >>> 0] = arg2;
        },
        __wbg_set_b9b5b5cb7b495037: function(arg0, arg1, arg2) {
            arg0.set(getArrayU8FromWasm0(arg1, arg2));
        },
        __wbg_set_body_f301b68bff45f419: function(arg0, arg1) {
            arg0.body = arg1;
        },
        __wbg_set_e92392c4b44c5de1: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.set(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        }, arguments); },
        __wbg_set_method_cf2b992b9a610bc3: function(arg0, arg1, arg2) {
            arg0.method = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_mode_d6479dfd6696c8d3: function(arg0, arg1) {
            arg0.mode = __wbindgen_enum_RequestMode[arg1];
        },
        __wbg_set_value_1b7bd2bc4ef248bb: function(arg0, arg1) {
            arg0.value = arg1;
        },
        __wbg_stack_3b0d974bbf31e44f: function(arg0, arg1) {
            const ret = arg1.stack;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg_static_accessor_GLOBAL_THIS_466428f93b4eaa76: function() {
            const ret = typeof globalThis === 'undefined' ? null : globalThis;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_GLOBAL_c7aea38d4de089bc: function() {
            const ret = typeof global === 'undefined' ? null : global;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_SELF_42d4fae05e59267a: function() {
            const ret = typeof self === 'undefined' ? null : self;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_WINDOW_e0db14a0eba6a812: function() {
            const ret = typeof window === 'undefined' ? null : window;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_status_b0de02a07fd7d927: function(arg0) {
            const ret = arg0.status;
            return ret;
        },
        __wbg_subarray_a4cc58201c7359fd: function(arg0, arg1, arg2) {
            const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
            return ret;
        },
        __wbg_then_7026b513a94278a8: function(arg0, arg1) {
            const ret = arg0.then(arg1);
            return ret;
        },
        __wbg_then_72819b8d4e081fb5: function(arg0, arg1, arg2) {
            const ret = arg0.then(arg1, arg2);
            return ret;
        },
        __wbg_toString_2f0b0aec069cb718: function(arg0) {
            const ret = arg0.toString();
            return ret;
        },
        __wbg_toString_effe882d0e9af91c: function(arg0, arg1, arg2) {
            const ret = arg1.toString(arg2);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg_trap_new: function(arg0) {
            const ret = Trap.__wrap(arg0);
            return ret;
        },
        __wbg_value_1e2369fab29b420e: function(arg0) {
            const ret = arg0.value;
            return ret;
        },
        __wbg_value_728796e3a1723ff8: function(arg0) {
            const ret = arg0.value;
            return ret;
        },
        __wbg_wait_5f03a1b29e76c8cb: function() { return handleError(function (arg0, arg1, arg2, arg3) {
            const ret = Atomics.wait(arg0, arg1 >>> 0, arg2, arg3);
            return ret;
        }, arguments); },
        __wbindgen_cast_0000000000000001: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [Externref], shim_idx: 6915, ret: Result(Unit), inner_ret: Some(Result(Unit)) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm_bindgen_68458880a41dd4bb___convert__closures_____invoke___wasm_bindgen_68458880a41dd4bb___JsValue__core_9b3796e30d99ddb7___result__Result_____wasm_bindgen_68458880a41dd4bb___JsError___true_);
            return ret;
        },
        __wbindgen_cast_0000000000000002: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [Ref(NamedExternref("Array<any>"))], shim_idx: 2326, ret: Result(Externref), inner_ret: Some(Result(Externref)) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm_bindgen_68458880a41dd4bb___convert__closures________invoke___js_sys_c11fba41208799d1___Array__core_9b3796e30d99ddb7___result__Result_js_sys_c11fba41208799d1___Array__wasm_bindgen_68458880a41dd4bb___JsValue___true_);
            return ret;
        },
        __wbindgen_cast_0000000000000003: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [Ref(NamedExternref("Array<any>"))], shim_idx: 2326, ret: Result(NamedExternref("Array<any>")), inner_ret: Some(Result(NamedExternref("Array<any>"))) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm_bindgen_68458880a41dd4bb___convert__closures________invoke___js_sys_c11fba41208799d1___Array__core_9b3796e30d99ddb7___result__Result_js_sys_c11fba41208799d1___Array__wasm_bindgen_68458880a41dd4bb___JsValue___true__2);
            return ret;
        },
        __wbindgen_cast_0000000000000004: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [Ref(NamedExternref("Array<any>"))], shim_idx: 2327, ret: Result(Unit), inner_ret: Some(Result(Unit)) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm_bindgen_68458880a41dd4bb___convert__closures________invoke___js_sys_c11fba41208799d1___Array__core_9b3796e30d99ddb7___result__Result_____wasm_bindgen_68458880a41dd4bb___JsValue___true_);
            return ret;
        },
        __wbindgen_cast_0000000000000005: function(arg0) {
            // Cast intrinsic for `F64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_cast_0000000000000006: function(arg0) {
            // Cast intrinsic for `I64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_cast_0000000000000007: function(arg0, arg1) {
            // Cast intrinsic for `Ref(Slice(U8)) -> NamedExternref("Uint8Array")`.
            const ret = getArrayU8FromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_cast_0000000000000008: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_cast_0000000000000009: function(arg0, arg1) {
            // Cast intrinsic for `U128 -> Externref`.
            const ret = (BigInt.asUintN(64, arg0) | (BigInt.asUintN(64, arg1) << BigInt(64)));
            return ret;
        },
        __wbindgen_cast_000000000000000a: function(arg0) {
            // Cast intrinsic for `U64 -> Externref`.
            const ret = BigInt.asUintN(64, arg0);
            return ret;
        },
        __wbindgen_cast_000000000000000b: function(arg0, arg1) {
            var v0 = getArrayJsValueFromWasm0(arg0, arg1);
            wasm.__wbindgen_free(arg0, arg1 * 4, 4);
            // Cast intrinsic for `Vector(NamedExternref("string")) -> Externref`.
            const ret = v0;
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./runtime-core_bg.js": import0,
    };
}

function wasm_bindgen_68458880a41dd4bb___convert__closures_____invoke___wasm_bindgen_68458880a41dd4bb___JsValue__core_9b3796e30d99ddb7___result__Result_____wasm_bindgen_68458880a41dd4bb___JsError___true_(arg0, arg1, arg2) {
    const ret = wasm.wasm_bindgen_68458880a41dd4bb___convert__closures_____invoke___wasm_bindgen_68458880a41dd4bb___JsValue__core_9b3796e30d99ddb7___result__Result_____wasm_bindgen_68458880a41dd4bb___JsError___true_(arg0, arg1, arg2);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

function wasm_bindgen_68458880a41dd4bb___convert__closures________invoke___js_sys_c11fba41208799d1___Array__core_9b3796e30d99ddb7___result__Result_____wasm_bindgen_68458880a41dd4bb___JsValue___true_(arg0, arg1, arg2) {
    const ret = wasm.wasm_bindgen_68458880a41dd4bb___convert__closures________invoke___js_sys_c11fba41208799d1___Array__core_9b3796e30d99ddb7___result__Result_____wasm_bindgen_68458880a41dd4bb___JsValue___true_(arg0, arg1, arg2);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

function wasm_bindgen_68458880a41dd4bb___convert__closures________invoke___js_sys_c11fba41208799d1___Array__core_9b3796e30d99ddb7___result__Result_js_sys_c11fba41208799d1___Array__wasm_bindgen_68458880a41dd4bb___JsValue___true_(arg0, arg1, arg2) {
    const ret = wasm.wasm_bindgen_68458880a41dd4bb___convert__closures________invoke___js_sys_c11fba41208799d1___Array__core_9b3796e30d99ddb7___result__Result_js_sys_c11fba41208799d1___Array__wasm_bindgen_68458880a41dd4bb___JsValue___true_(arg0, arg1, arg2);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

function wasm_bindgen_68458880a41dd4bb___convert__closures________invoke___js_sys_c11fba41208799d1___Array__core_9b3796e30d99ddb7___result__Result_js_sys_c11fba41208799d1___Array__wasm_bindgen_68458880a41dd4bb___JsValue___true__2(arg0, arg1, arg2) {
    const ret = wasm.wasm_bindgen_68458880a41dd4bb___convert__closures________invoke___js_sys_c11fba41208799d1___Array__core_9b3796e30d99ddb7___result__Result_js_sys_c11fba41208799d1___Array__wasm_bindgen_68458880a41dd4bb___JsValue___true__2(arg0, arg1, arg2);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

function wasm_bindgen_68458880a41dd4bb___convert__closures_____invoke___js_sys_c11fba41208799d1___Function_fn_wasm_bindgen_68458880a41dd4bb___JsValue_____wasm_bindgen_68458880a41dd4bb___sys__Undefined___js_sys_c11fba41208799d1___Function_fn_wasm_bindgen_68458880a41dd4bb___JsValue_____wasm_bindgen_68458880a41dd4bb___sys__Undefined_______true_(arg0, arg1, arg2, arg3) {
    wasm.wasm_bindgen_68458880a41dd4bb___convert__closures_____invoke___js_sys_c11fba41208799d1___Function_fn_wasm_bindgen_68458880a41dd4bb___JsValue_____wasm_bindgen_68458880a41dd4bb___sys__Undefined___js_sys_c11fba41208799d1___Function_fn_wasm_bindgen_68458880a41dd4bb___JsValue_____wasm_bindgen_68458880a41dd4bb___sys__Undefined_______true_(arg0, arg1, arg2, arg3);
}


const __wbindgen_enum_RequestMode = ["same-origin", "no-cors", "cors", "navigate"];
const GoCompilerSessionFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_gocompilersession_free(ptr, 1));
const TrapFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_trap_free(ptr, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(state => wasm.__wbindgen_destroy_closure(state.a, state.b));

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function getArrayJsValueFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    const mem = getDataViewMemory0();
    const result = [];
    for (let i = ptr; i < ptr + 4 * len; i += 4) {
        result.push(wasm.__wbindgen_externrefs.get(mem.getUint32(i, true)));
    }
    wasm.__externref_drop_slice(ptr, len);
    return result;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function makeMutClosure(arg0, arg1, f) {
    const state = { a: arg0, b: arg1, cnt: 1 };
    const real = (...args) => {

        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            state.a = a;
            real._wbg_cb_unref();
        }
    };
    real._wbg_cb_unref = () => {
        if (--state.cnt === 0) {
            wasm.__wbindgen_destroy_closure(state.a, state.b);
            state.a = 0;
            CLOSURE_DTORS.unregister(state);
        }
    };
    CLOSURE_DTORS.register(real, state, state);
    return real;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (!module.ok) {
            throw new Error(`failed to fetch Wasm: ${module.status} ${module.statusText} fetching '${module.url}'`);
        }

        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('runtime-core_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
