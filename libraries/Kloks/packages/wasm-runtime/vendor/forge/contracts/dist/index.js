//#region src/core/contract.ts
/**
* The single compatibility boundary shared by WASM-OJ compilers, runners,
* artifacts, judge specifications, caches, and conformance evidence.
*
* Package and upstream toolchain versions remain independent release metadata;
* they do not define WASM-OJ protocol compatibility.
*/
var WASM_OJ_CONTRACT_VERSION = 2;
var WASM_OJ_CONTRACT_ID = `wasm-oj-v2`;
var WASM_OJ_SCHEMAS = Object.freeze({
	clangPins: `${WASM_OJ_CONTRACT_ID}/clang-pins`,
	clangLibcxxPch: `${WASM_OJ_CONTRACT_ID}/clang-libcxx-pch`,
	clangToolchain: `${WASM_OJ_CONTRACT_ID}/clang-toolchain`,
	compileBatch: `${WASM_OJ_CONTRACT_ID}/compile-batch`,
	compileTrace: `${WASM_OJ_CONTRACT_ID}/compile-trace`,
	conformance: `${WASM_OJ_CONTRACT_ID}/conformance`,
	conformanceEvidence: `${WASM_OJ_CONTRACT_ID}/conformance-evidence`,
	conformanceMatrix: `${WASM_OJ_CONTRACT_ID}/conformance-matrix`,
	cppDependencyLock: `${WASM_OJ_CONTRACT_ID}/cpp-dependency-lock`,
	dependencyLock: `${WASM_OJ_CONTRACT_ID}/dependency-lock`,
	dependencyOfflineBundle: `${WASM_OJ_CONTRACT_ID}/dependency-offline-bundle`,
	incrementalBuildGraph: `${WASM_OJ_CONTRACT_ID}/incremental-build-graph`,
	interactiveRequest: `${WASM_OJ_CONTRACT_ID}/interactive-request`,
	goToolchain: `${WASM_OJ_CONTRACT_ID}/go-toolchain`,
	objectCache: `${WASM_OJ_CONTRACT_ID}/object-cache`,
	pythonToolchain: `${WASM_OJ_CONTRACT_ID}/python-toolchain`,
	replayBundle: `${WASM_OJ_CONTRACT_ID}/replay-bundle`,
	rustToolchain: `${WASM_OJ_CONTRACT_ID}/rust-toolchain`,
	runRequest: `${WASM_OJ_CONTRACT_ID}/run-request`,
	runtimeBundle: `${WASM_OJ_CONTRACT_ID}/runtime-bundle`,
	runtimeCoreLicenses: `${WASM_OJ_CONTRACT_ID}/runtime-core-licenses`,
	thirdPartyComponents: `${WASM_OJ_CONTRACT_ID}/third-party-components`,
	wasmerSdkLicenses: `${WASM_OJ_CONTRACT_ID}/wasmer-sdk-licenses`,
	toolchainPackage: `${WASM_OJ_CONTRACT_ID}/toolchain-package`
});
var WASM_OJ_STORAGE = Object.freeze({
	database: `${WASM_OJ_CONTRACT_ID}:storage`,
	databaseVersion: 2,
	dependencyCache: `${WASM_OJ_CONTRACT_ID}:dependencies`,
	incrementalBuildCache: `${WASM_OJ_CONTRACT_ID}:incremental-build-cache`,
	runtimeFilesCache: `${WASM_OJ_CONTRACT_ID}:runtime-files`,
	toolchainCache: `${WASM_OJ_CONTRACT_ID}:toolchains`
});
//#endregion
//#region src/core/types.ts
var LANGUAGES = Object.freeze([
	"c",
	"cpp",
	"rust",
	"python",
	"javascript",
	"typescript",
	"go"
]);
function assertLanguageIdentifier(language) {
	if (typeof language !== "string" || !language || language !== language.trim() || language.length > 128) throw new Error("Language identifiers must be non-empty, trimmed, and at most 128 characters.");
}
function isBuiltinLanguage(language) {
	return LANGUAGES.includes(language);
}
var DEPENDENCY_ECOSYSTEMS = Object.freeze([
	"cargo",
	"npm",
	"pypi",
	"go",
	"cpp"
]);
//#endregion
//#region src/core/errors.ts
var WASM_OJ_ERROR_CODES = Object.freeze([
	"operation-cancelled",
	"operation-conflict",
	"invalid-input",
	"unsupported",
	"integrity-failure",
	"compiler-failure",
	"runner-failure",
	"judge-failure",
	"replay-failure",
	"dependency-failure",
	"storage-failure",
	"initialization-failure",
	"disposed",
	"internal-failure"
]);
var WASM_OJ_ERROR_STAGES = Object.freeze([
	"operation",
	"compile",
	"prepare",
	"run",
	"judge",
	"replay",
	"dependency",
	"storage",
	"initialize"
]);
/** Stable infrastructure failure exposed at public asynchronous boundaries. */
var WasmOjError = class extends Error {
	code;
	stage;
	retryable;
	operationId;
	details;
	constructor(message, options) {
		super(message, options);
		if (!WASM_OJ_ERROR_CODES.includes(options.code)) throw new TypeError(`Invalid WASM-OJ error code '${String(options.code)}'.`);
		if (!WASM_OJ_ERROR_STAGES.includes(options.stage)) throw new TypeError(`Invalid WASM-OJ error stage '${String(options.stage)}'.`);
		if (options.retryable !== void 0 && typeof options.retryable !== "boolean") throw new TypeError("WASM-OJ error retryable must be a boolean.");
		if (options.operationId !== void 0 && (typeof options.operationId !== "string" || !options.operationId || options.operationId !== options.operationId.trim() || options.operationId.length > 128)) throw new TypeError("WASM-OJ error operationId must be non-empty, trimmed, and at most 128 characters.");
		this.name = "WasmOjError";
		this.code = options.code;
		this.stage = options.stage;
		this.retryable = options.retryable ?? false;
		this.operationId = options.operationId;
		this.details = validatedDetails(options.details);
	}
	toJSON() {
		return {
			name: "WasmOjError",
			message: this.message,
			code: this.code,
			stage: this.stage,
			retryable: this.retryable,
			...this.operationId === void 0 ? {} : { operationId: this.operationId },
			...this.details === void 0 ? {} : { details: { ...this.details } }
		};
	}
};
function validatedDetails(value) {
	if (value === void 0) return void 0;
	if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError("WASM-OJ error details must be a plain object.");
	const prototype = Object.getPrototypeOf(value);
	if (prototype !== Object.prototype && prototype !== null) throw new TypeError("WASM-OJ error details must be a plain object.");
	const entries = Object.entries(value);
	if (entries.length > 32) throw new RangeError("WASM-OJ error details may contain at most 32 entries.");
	const details = {};
	for (const [key, detail] of entries) {
		if (!key || key !== key.trim() || key.length > 128) throw new TypeError("WASM-OJ error detail keys must be non-empty, trimmed, and at most 128 characters.");
		if (typeof detail === "string" && detail.length <= 4096) details[key] = detail;
		else if (typeof detail === "number" && Number.isFinite(detail)) details[key] = detail;
		else if (typeof detail === "boolean" || detail === null) details[key] = detail;
		else throw new TypeError(`WASM-OJ error detail '${key}' has an unsupported value.`);
	}
	return Object.freeze(details);
}
function asWasmOjError(error, options) {
	if (error instanceof WasmOjError) {
		if (error.operationId !== void 0 || options.operationId === void 0) return error;
		return new WasmOjError(error.message, {
			code: error.code,
			stage: error.stage,
			retryable: error.retryable,
			operationId: options.operationId,
			details: error.details,
			cause: error
		});
	}
	return new WasmOjError(error instanceof Error ? error.message : String(error), {
		...options,
		cause: error
	});
}
//#endregion
export { DEPENDENCY_ECOSYSTEMS, LANGUAGES, WASM_OJ_CONTRACT_ID, WASM_OJ_CONTRACT_VERSION, WASM_OJ_ERROR_CODES, WASM_OJ_ERROR_STAGES, WASM_OJ_SCHEMAS, WASM_OJ_STORAGE, WasmOjError, asWasmOjError, assertLanguageIdentifier, isBuiltinLanguage };
