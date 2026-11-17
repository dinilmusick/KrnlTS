import { DEPENDENCY_ECOSYSTEMS, LANGUAGES, WASM_OJ_CONTRACT_ID, WASM_OJ_CONTRACT_VERSION, WASM_OJ_CONTRACT_VERSION as WASM_OJ_CONTRACT_VERSION$1, WASM_OJ_ERROR_CODES, WASM_OJ_ERROR_STAGES, WASM_OJ_SCHEMAS, WASM_OJ_SCHEMAS as WASM_OJ_SCHEMAS$1, WASM_OJ_STORAGE, WASM_OJ_STORAGE as WASM_OJ_STORAGE$1, WasmOjError, WasmOjError as WasmOjError$1, asWasmOjError, asWasmOjError as asWasmOjError$1, assertLanguageIdentifier, assertLanguageIdentifier as assertLanguageIdentifier$1, isBuiltinLanguage, isBuiltinLanguage as isBuiltinLanguage$1 } from "../../contracts/dist/index.js";
import { Gunzip, unzipSync } from "../fflate.js";
//#region src/core/determinism.ts
var DEFAULT_DETERMINISM = Object.freeze({
	randomSeed: 1592594996,
	realtimeEpochMs: Date.UTC(2e3, 0, 1),
	clockStepNs: 1e6
});
function resolveDeterminism(value) {
	const resolved = {
		...DEFAULT_DETERMINISM,
		...value
	};
	if (!Number.isInteger(resolved.randomSeed) || resolved.randomSeed < 0 || resolved.randomSeed > 4294967295) throw new RangeError("randomSeed must be an unsigned 32-bit integer.");
	if (!Number.isSafeInteger(resolved.realtimeEpochMs) || resolved.realtimeEpochMs < 0 || resolved.realtimeEpochMs > 18446744073e3) throw new RangeError("realtimeEpochMs must be a non-negative integer representable by a WASI timestamp.");
	if (!Number.isSafeInteger(resolved.clockStepNs) || resolved.clockStepNs < 1 || resolved.clockStepNs > 1e9) throw new RangeError("clockStepNs must be an integer from 1 through 1,000,000,000.");
	return resolved;
}
//#endregion
//#region src/core/canonical-json.ts
var encoder$3 = new TextEncoder();
function canonicalValue(value, path, ancestors) {
	if (value === null || typeof value === "string" || typeof value === "boolean") return value;
	if (typeof value === "number") {
		if (!Number.isSafeInteger(value)) throw new TypeError(`${path} must be a safe integer.`);
		return value;
	}
	if (typeof value !== "object" || value === void 0) throw new TypeError(`${path} is not canonical JSON data.`);
	if (ancestors.has(value)) throw new TypeError(`${path} contains a cycle.`);
	const nextAncestors = new Set(ancestors).add(value);
	if (Array.isArray(value)) return value.map((item, index) => canonicalValue(item, `${path}[${index}]`, nextAncestors));
	const prototype = Object.getPrototypeOf(value);
	if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${path} must be a plain object.`);
	const record = value;
	return Object.fromEntries(Object.keys(record).sort().map((key) => [key, canonicalValue(record[key], `${path}.${key}`, nextAncestors)]));
}
/** WASM-OJ canonical JSON: sorted object keys, safe integers, UTF-8, and one trailing newline. */
function canonicalJsonBytes(value) {
	return encoder$3.encode(`${JSON.stringify(canonicalValue(value, "$", /* @__PURE__ */ new Set()))}\n`);
}
function parseCanonicalJsonBytes(bytes, label = "value") {
	let value;
	try {
		value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
	} catch (error) {
		throw new TypeError(`${label} is not valid UTF-8 JSON.`, { cause: error });
	}
	const canonical = canonicalJsonBytes(value);
	if (canonical.byteLength !== bytes.byteLength || canonical.some((byte, index) => byte !== bytes[index])) throw new TypeError(`${label} is not encoded as WASM-OJ canonical JSON.`);
	return value;
}
//#endregion
//#region src/core/resources.ts
/** The weighted meter defined by the active WASM-OJ contract. */
var WEIGHTED_METER_MODEL = "weighted";
var MAX_LOGICAL_TIME_LIMIT_MS = Math.floor(Number.MAX_SAFE_INTEGER / 1e6);
var MAX_MEMORY_LIMIT_BYTES = 4294967296;
var MAX_WALL_TIME_LIMIT_MS = 6e5;
var DEFAULT_RESOURCE_POLICY = Object.freeze({
	instructionBudget: 1e10,
	logicalTimeLimitMs: 6e4,
	memoryLimitBytes: 268435456,
	outputLimitBytes: 4194304,
	filesystemWriteLimitBytes: 67108864,
	filesystemEntryLimit: 4096,
	wallTimeLimitMs: 6e4
});
function resolveResourcePolicy(value) {
	const policy = {
		...DEFAULT_RESOURCE_POLICY,
		...value
	};
	assertSafePositive("instructionBudget", policy.instructionBudget, Number.MAX_SAFE_INTEGER);
	assertSafePositive("logicalTimeLimitMs", policy.logicalTimeLimitMs, MAX_LOGICAL_TIME_LIMIT_MS);
	assertSafePositive("memoryLimitBytes", policy.memoryLimitBytes, MAX_MEMORY_LIMIT_BYTES);
	assertSafePositive("outputLimitBytes", policy.outputLimitBytes, 67108864);
	assertSafePositive("filesystemWriteLimitBytes", policy.filesystemWriteLimitBytes, 536870912);
	assertSafePositive("filesystemEntryLimit", policy.filesystemEntryLimit, 65536);
	assertSafePositive("wallTimeLimitMs", policy.wallTimeLimitMs, MAX_WALL_TIME_LIMIT_MS);
	if (policy.memoryLimitBytes % 65536 !== 0) throw new RangeError("memoryLimitBytes must be a multiple of the 64 KiB WebAssembly page size.");
	return policy;
}
function assertSafePositive(name, value, maximum) {
	if (!Number.isSafeInteger(value) || value < 1 || value > maximum) throw new RangeError(`${name} must be a positive safe integer no greater than ${maximum}.`);
}
//#endregion
//#region src/core/toolchains.ts
var CLANG_VERSION = "22.0.0-git20542-10";
var CLANG_PACKAGE = `wasm-oj/clang@${CLANG_VERSION}`;
var CLANG_PACKAGE_ASSET_PATH = `/toolchains/clang-${CLANG_VERSION}.webc.gz.bin`;
var CLANG_CC1_PINS_ASSET_PATH = `/toolchains/clang-${CLANG_VERSION}.cc1-pins.json`;
var CLANG_MANIFEST_ASSET_PATH = `/toolchains/clang-${CLANG_VERSION}.manifest.json`;
var CLANG_LIBCXX_PCH_MANIFEST_ASSET_PATH = `/toolchains/clang-${CLANG_VERSION}.libcxx-pch.json`;
var CLANG_LIBCXX_PCH_DEBUG_ASSET_PATH = `/toolchains/clang-${CLANG_VERSION}.cpp-debug.pch.gz.bin`;
var CLANG_LIBCXX_PCH_RELEASE_ASSET_PATH = `/toolchains/clang-${CLANG_VERSION}.cpp-release.pch.gz.bin`;
var CLANG_COMPRESSED_PACKAGE_SHA256 = "7f10d90b8e52b270f04874641a1d0bf9e94e85b4f6c7573a774cebbc6d32552a";
/** SHA-256 after browser-side gzip decompression. */
var CLANG_PACKAGE_SHA256 = "21ded33b9c6d4e1aaad5528c940bdaf6c3e84be77ea8f522f018ca7289a2a224";
/** SHA-256 of the pinned cc1/wasm-ld argv manifest; regenerated by scripts/pin-clang-cc1-argv.mjs. */
var CLANG_CC1_PINS_SHA256 = "895eee17c63b1112c84adcc4ddbcb38e0c18e53bff15f50a8689b9b82d87b1ff";
var CLANG_MANIFEST_SHA256 = "6382dcdfb6a2da49032a0e08da3b1fb490eb24432be85c3c12e3e871a5065273";
/** Updated atomically with the generated toolchain-admitted PCH assets. */
var CLANG_LIBCXX_PCH_MANIFEST_SHA256 = "9bbe41d77c786f1c36169369c909268530b05726e1581683f6edd9a2983eebd0";
var CLANG_LIBCXX_PCH = Object.freeze({
	"cpp-debug": Object.freeze({
		path: CLANG_LIBCXX_PCH_DEBUG_ASSET_PATH,
		sha256: "c420c4643c48826643e75585d5bfdc281f11883d4bda28b283e3c706f3046b3a",
		compressedSha256: "a3811351bae3289caf096f2d4bb6d2ee5db84b97e05514e87190d36b65c500cf"
	}),
	"cpp-release": Object.freeze({
		path: CLANG_LIBCXX_PCH_RELEASE_ASSET_PATH,
		sha256: "c4b2132cc6d698e97dd1386431fdb54faaaf38b35b2528c7bc854f860d1f64b1",
		compressedSha256: "ef004fc05ec50af697a37f7c9c814bf62e9676d0de162d6ac35305533939f93f"
	})
});
var PYTHON_VERSION = "3.14.7";
var PYTHON_PACKAGE_SHA256 = "a42c98f5f00582638c8e445440c506bbf94d5e55b3415d1f8d82d11c56cd4b56";
var PYTHON_PACKAGE = `${`wasm-oj/cpython@${PYTHON_VERSION}`}#sha256:${PYTHON_PACKAGE_SHA256}`;
var PYTHON_PACKAGE_ASSET_PATH = `/toolchains/python-${PYTHON_VERSION}-wasip1.webc.gz.bin`;
var PYTHON_PACKAGE_MANIFEST_ASSET_PATH = `/toolchains/python-${PYTHON_VERSION}-wasip1.manifest.json`;
var PYTHON_COMPRESSED_PACKAGE_SHA256 = "10027f0e32c77dfa0ce1c413b6cb27307d6744fe5e18e6da8cea738bd020260c";
var PYTHON_PACKAGE_MANIFEST_SHA256 = "53a24b258363a8494af164121111a34b49c85fa0e054627fe131feba6f359cd5";
var PYTHON_RUNTIME_FILES_ARCHIVE_SHA256 = "c1acac884af1c86833db5b65f8cc0a2304fce74dea0a05d9b40bde0a4e3e7c0e";
var QUICKJS_VERSION = "0.15.1";
var QUICKJS_PACKAGE = `wasm-oj/quickjs-ng@${QUICKJS_VERSION}`;
var QUICKJS_ASSET_PATH = `/toolchains/quickjs-${QUICKJS_VERSION}.wasm.gz.bin`;
var QUICKJS_ASSET_SHA256 = "dc6e02e8610269e61b341331661515616451cec929fd534fa96d1c4f47fbcc9a";
var TYPESCRIPT_VERSION = "7.0.2";
var TYPESCRIPT_ASSET_PATH = `/toolchains/typescript-${TYPESCRIPT_VERSION}.wasm.gz.bin`;
var TYPESCRIPT_ASSET_SHA256 = "29c6ee0e46151e2644049ae96162b1b1d46dcb13310e2a928114bb9030c3ea92";
var RUST_VERSION = "1.91.1-dev";
var RUST_PACKAGE_ASSET_PATH = `/toolchains/rust-${RUST_VERSION}.webc.gz.bin`;
var RUST_PACKAGE_MANIFEST_ASSET_PATH = `/toolchains/rust-${RUST_VERSION}.manifest.json`;
var RUST_COMPRESSED_PACKAGE_SHA256 = "cfbdadc67be1315e735aa55bdf8a5a0d00171982a023fefcf7ba586127753887";
/** SHA-256 after browser-side gzip decompression. */
var RUST_PACKAGE_SHA256 = "765de8d68d03078e79f69f49dec0dcab1ff96fe3bbe5e9eafebb2ce61a39d3ee";
var RUST_PACKAGE_MANIFEST_SHA256 = "d5bbdca994e61888679c5738cb9420649c0854ed0eb5d65468bc67d5d550bce1";
var GO_VERSION = "1.26.5";
var GO_PACKAGE_ASSET_PATH = `/toolchains/go-${GO_VERSION}-wasip1.webc.gz.bin`;
var GO_PACKAGE_MANIFEST_ASSET_PATH = `/toolchains/go-${GO_VERSION}-wasip1.manifest.json`;
var GO_STANDARD_LIBRARY_ASSET_PATH = `/toolchains/go-${GO_VERSION}-wasip1.stdlib.gz.bin`;
var GO_COMPRESSED_PACKAGE_SHA256 = "70a7e359884b09b2e1a622d6ac5cd6e31c334aab519e6dd80dff5e040a9e09e4";
var GO_PACKAGE_SHA256 = "c3a97934b6a83fefdea5c31f99141f70f76189eedc9ec0fa9ccd41302e50963b";
var GO_PACKAGE_MANIFEST_SHA256 = "5d784e9ca640b9525e84b598c0beb97ca110ae908568ca45f6441a441d99a262";
var GO_COMPRESSED_STANDARD_LIBRARY_SHA256 = "aeffc384fdc624544f174ba5fc3c22395717fdbc3c4387d677d20855b6be80d8";
var GO_STANDARD_LIBRARY_SHA256 = "e1ec64b08efd02b35b7ffdaf3970875aaae98325fa4795eafca94ebae2d0d192";
var GO_COMPILER_SHA256 = "9e557f5b86961fd604217d7521461c5d2b7322e383fa30dead5669b77db12201";
var GO_LINKER_SHA256 = "2eefca10af935a307ab7946447146bd30e0ea0fb5460be54dc1c55844d155580";
var JAVA_VERSION = "teavm-0.13.1-wasmgc-wasip1";
var JAVA_COMPILER_PACKAGE = `wasm-oj/java-teavm@${JAVA_VERSION}`;
var JAVA_COMPILER_ASSET_PATH = "/toolchains/java-teavm-0.13.1.compiler.wasm";
var JAVA_COMPILE_CLASSLIB_ASSET_PATH = "/toolchains/java-teavm-0.13.1.compile-classlib.bin";
var JAVA_RUNTIME_CLASSLIB_ASSET_PATH = "/toolchains/java-teavm-0.13.1.runtime-classlib.bin";
var JAVA_COMPILER_SHA256 = "8c37bce1c6fceeaffeffe93e10834309b67c8b6fb58c6f8a24547afe8be67f5d";
var JAVA_COMPILE_CLASSLIB_SHA256 = "738a82b7d7e7ff8d98b07bb076785da7035847a166afb8446fd150c4efce6103";
var JAVA_RUNTIME_CLASSLIB_SHA256 = "0ed234b66cdde19cb29e6c2865a3636d792d3cf72f102e73a7b3fdede80b79e6";
var PINNED_TOOLCHAIN_ASSET_SHA256 = Object.freeze({
	[CLANG_PACKAGE_ASSET_PATH]: CLANG_COMPRESSED_PACKAGE_SHA256,
	[CLANG_CC1_PINS_ASSET_PATH]: CLANG_CC1_PINS_SHA256,
	[CLANG_MANIFEST_ASSET_PATH]: CLANG_MANIFEST_SHA256,
	[CLANG_LIBCXX_PCH_MANIFEST_ASSET_PATH]: CLANG_LIBCXX_PCH_MANIFEST_SHA256,
	[CLANG_LIBCXX_PCH_DEBUG_ASSET_PATH]: CLANG_LIBCXX_PCH["cpp-debug"].compressedSha256,
	[CLANG_LIBCXX_PCH_RELEASE_ASSET_PATH]: CLANG_LIBCXX_PCH["cpp-release"].compressedSha256,
	[PYTHON_PACKAGE_ASSET_PATH]: PYTHON_COMPRESSED_PACKAGE_SHA256,
	[PYTHON_PACKAGE_MANIFEST_ASSET_PATH]: PYTHON_PACKAGE_MANIFEST_SHA256,
	[QUICKJS_ASSET_PATH]: QUICKJS_ASSET_SHA256,
	[TYPESCRIPT_ASSET_PATH]: TYPESCRIPT_ASSET_SHA256,
	[RUST_PACKAGE_ASSET_PATH]: RUST_COMPRESSED_PACKAGE_SHA256,
	[RUST_PACKAGE_MANIFEST_ASSET_PATH]: RUST_PACKAGE_MANIFEST_SHA256,
	[GO_PACKAGE_ASSET_PATH]: GO_COMPRESSED_PACKAGE_SHA256,
	[GO_PACKAGE_MANIFEST_ASSET_PATH]: GO_PACKAGE_MANIFEST_SHA256,
	[GO_STANDARD_LIBRARY_ASSET_PATH]: GO_COMPRESSED_STANDARD_LIBRARY_SHA256,
	[JAVA_COMPILER_ASSET_PATH]: JAVA_COMPILER_SHA256,
	[JAVA_COMPILE_CLASSLIB_ASSET_PATH]: JAVA_COMPILE_CLASSLIB_SHA256,
	[JAVA_RUNTIME_CLASSLIB_ASSET_PATH]: JAVA_RUNTIME_CLASSLIB_SHA256
});
var TOOLCHAIN_CONTENT_SHA256 = Object.freeze({
	c: Object.freeze([
		CLANG_COMPRESSED_PACKAGE_SHA256,
		CLANG_PACKAGE_SHA256,
		CLANG_CC1_PINS_SHA256,
		CLANG_MANIFEST_SHA256
	]),
	cpp: Object.freeze([
		CLANG_COMPRESSED_PACKAGE_SHA256,
		CLANG_PACKAGE_SHA256,
		CLANG_CC1_PINS_SHA256,
		CLANG_MANIFEST_SHA256
	]),
	rust: Object.freeze([
		RUST_COMPRESSED_PACKAGE_SHA256,
		RUST_PACKAGE_SHA256,
		RUST_PACKAGE_MANIFEST_SHA256
	]),
	python: Object.freeze([
		PYTHON_COMPRESSED_PACKAGE_SHA256,
		PYTHON_PACKAGE_SHA256,
		PYTHON_PACKAGE_MANIFEST_SHA256,
		PYTHON_RUNTIME_FILES_ARCHIVE_SHA256
	]),
	javascript: Object.freeze([TYPESCRIPT_ASSET_SHA256, QUICKJS_ASSET_SHA256]),
	typescript: Object.freeze([TYPESCRIPT_ASSET_SHA256, QUICKJS_ASSET_SHA256]),
	go: Object.freeze([
		GO_COMPRESSED_PACKAGE_SHA256,
		GO_PACKAGE_SHA256,
		GO_PACKAGE_MANIFEST_SHA256,
		GO_COMPRESSED_STANDARD_LIBRARY_SHA256,
		GO_STANDARD_LIBRARY_SHA256,
		GO_COMPILER_SHA256,
		GO_LINKER_SHA256
	])
});
/** Exact executable/compiler content used by cache keys and cost calibration. */
function toolchainContentIdentity(language) {
	if (language === "java") return [
		JAVA_COMPILER_SHA256,
		JAVA_COMPILE_CLASSLIB_SHA256,
		JAVA_RUNTIME_CLASSLIB_SHA256
	].join(".");
	if (!isBuiltinLanguage$1(language)) throw new Error(`WASM-OJ has no built-in toolchain for '${language}'.`);
	return TOOLCHAIN_CONTENT_SHA256[language].join(".");
}
function freezeToolchain(definition) {
	return Object.freeze({
		...definition,
		compilerPackages: Object.freeze([...definition.compilerPackages]),
		targets: Object.freeze([...definition.targets])
	});
}
var TOOLCHAINS = Object.freeze({
	c: freezeToolchain({
		language: "c",
		label: "Clang 22",
		artifact: "wasm",
		compilerPackages: [CLANG_PACKAGE],
		targets: ["wasip1", "wasix"],
		version: CLANG_VERSION,
		note: "Native wasip1 module via Clang and LLD; directly executable by WASI and WASIX runtimes."
	}),
	cpp: freezeToolchain({
		language: "cpp",
		label: "Clang++ 22 (C++20)",
		artifact: "wasm",
		compilerPackages: [CLANG_PACKAGE],
		targets: ["wasip1", "wasix"],
		version: CLANG_VERSION,
		note: "C++20/libc++ wasip1 module; directly executable by WASI and WASIX runtimes."
	}),
	rust: freezeToolchain({
		language: "rust",
		label: `Rust ${RUST_VERSION}`,
		artifact: "wasm",
		compilerPackages: [`rustc@${RUST_VERSION}#sha256:${RUST_PACKAGE_SHA256}`],
		targets: ["wasip1"],
		version: RUST_VERSION,
		note: "Real rustc, its matching standard library, and a fresh deterministic wasm-ld stage execute as one pinned WebC under Wasmer."
	}),
	python: freezeToolchain({
		language: "python",
		label: `CPython ${PYTHON_VERSION}`,
		artifact: "runtime-bundle",
		compilerPackages: [PYTHON_PACKAGE],
		runtimePackage: PYTHON_PACKAGE,
		targets: ["wasip1"],
		version: PYTHON_VERSION,
		note: "Python source files executed by the source-built CPython wasm32-wasip1 interpreter and standard library."
	}),
	javascript: freezeToolchain({
		language: "javascript",
		label: "QuickJS-ng",
		artifact: "runtime-bundle",
		compilerPackages: [`typescript@${TYPESCRIPT_VERSION}-wasi`],
		runtimePackage: QUICKJS_PACKAGE,
		targets: ["wasip1"],
		version: QUICKJS_VERSION,
		note: "JavaScript checked by TypeScript/WASI, then executed by the bundled QuickJS-ng/WASI runtime."
	}),
	typescript: freezeToolchain({
		language: "typescript",
		label: "TypeScript + QuickJS-ng",
		artifact: "runtime-bundle",
		compilerPackages: [`typescript@${TYPESCRIPT_VERSION}-wasi`],
		runtimePackage: QUICKJS_PACKAGE,
		targets: ["wasip1"],
		version: TYPESCRIPT_VERSION,
		note: "The native TypeScript compiler and QuickJS-ng runtime both execute as local WASI modules."
	}),
	go: freezeToolchain({
		language: "go",
		label: `Go ${GO_VERSION}`,
		artifact: "wasm",
		compilerPackages: [`go@${GO_VERSION}#sha256:${GO_PACKAGE_SHA256}`],
		targets: ["wasip1"],
		version: GO_VERSION,
		note: "The standard Go compiler, linker, and pinned wasip1 standard library execute locally as one WebC under Wasmer."
	})
});
function toolchainCacheIdentity(language) {
	if (language === "java") return {
		wasmOjContract: WASM_OJ_CONTRACT_VERSION$1,
		version: JAVA_VERSION,
		compilerPackages: [JAVA_COMPILER_PACKAGE],
		contentSha256: toolchainContentIdentity(language).split(".")
	};
	if (!isBuiltinLanguage$1(language)) throw new Error(`WASM-OJ has no built-in toolchain for '${language}'.`);
	const toolchain = TOOLCHAINS[language];
	return {
		wasmOjContract: WASM_OJ_CONTRACT_VERSION$1,
		version: toolchain.version,
		compilerPackages: [...toolchain.compilerPackages],
		runtimePackage: toolchain.runtimePackage,
		contentSha256: [...TOOLCHAIN_CONTENT_SHA256[language]]
	};
}
/** Pinned toolchain assets a browser host fetches to compile and run one project. */
function browserToolchainAssetPaths(selection) {
	const { language, optimization } = selection;
	switch (language) {
		case "c": return Object.freeze([CLANG_PACKAGE_ASSET_PATH, CLANG_CC1_PINS_ASSET_PATH]);
		case "cpp": return Object.freeze([
			CLANG_PACKAGE_ASSET_PATH,
			CLANG_CC1_PINS_ASSET_PATH,
			...selection.libcxxPrecompiledHeader ? [CLANG_LIBCXX_PCH_MANIFEST_ASSET_PATH, CLANG_LIBCXX_PCH[`cpp-${optimization}`].path] : []
		]);
		case "rust": return Object.freeze([RUST_PACKAGE_ASSET_PATH, RUST_PACKAGE_MANIFEST_ASSET_PATH]);
		case "go": return Object.freeze([
			GO_PACKAGE_ASSET_PATH,
			GO_PACKAGE_MANIFEST_ASSET_PATH,
			GO_STANDARD_LIBRARY_ASSET_PATH
		]);
		case "java": return Object.freeze([
			JAVA_COMPILER_ASSET_PATH,
			JAVA_COMPILE_CLASSLIB_ASSET_PATH,
			JAVA_RUNTIME_CLASSLIB_ASSET_PATH
		]);
		case "python": return Object.freeze([PYTHON_PACKAGE_ASSET_PATH]);
		case "javascript": return Object.freeze([QUICKJS_ASSET_PATH]);
		case "typescript": return Object.freeze([TYPESCRIPT_ASSET_PATH, QUICKJS_ASSET_PATH]);
		default: throw new Error(`WASM-OJ has no built-in toolchain for '${language}'.`);
	}
}
function toolchainPackageIdentities(language) {
	if (language === "java") return [JAVA_COMPILER_PACKAGE];
	if (!isBuiltinLanguage$1(language)) throw new Error(`WASM-OJ has no built-in toolchain for '${language}'.`);
	const toolchain = TOOLCHAINS[language];
	return [.../* @__PURE__ */ new Set([...toolchain.compilerPackages, ...toolchain.runtimePackage ? [toolchain.runtimePackage] : []])];
}
function extensionLanguage(path) {
	return {
		c: "c",
		h: "c",
		cc: "cpp",
		cpp: "cpp",
		cxx: "cpp",
		hpp: "cpp",
		rs: "rust",
		py: "python",
		js: "javascript",
		ts: "typescript",
		go: "go",
		java: "java"
	}[path.slice(path.lastIndexOf(".") + 1).toLowerCase()];
}
//#endregion
//#region src/core/sha256.ts
async function sha256Hex$1(value) {
	const source = typeof value === "string" ? new TextEncoder().encode(value) : value;
	const bytes = new Uint8Array(source.byteLength);
	bytes.set(source);
	const digest = await crypto.subtle.digest("SHA-256", bytes);
	return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
//#endregion
//#region src/core/runtime-identity.ts
/** Executable runtime components covered by deterministic cost calibration. */
var WASM_OJ_RUNTIME_COMPONENTS = Object.freeze({
	runtimeCoreWasmSha256: "077aa936a3382a242eee7222fc17369769cb5ad265303d730ffc45ee192367e9",
	runtimeSourceRootSha256: "c65b3bbcad41359f86b8f1d1315af8f079b44f0e9084ace0d6d50c0ec418415b",
	wasmerNativeVersion: "7.2.1",
	wasmerSdkVersion: "0.10.0",
	wasmerSdkWasmSha256: "49a6646209f5ab5e7c737eac33407d87d9a9959ac83e5ecaaab9261b2323589e",
	wasmerWasixVersion: "0.702.1"
});
/**
* SHA-256 of `runtimeIdentityBytes()`.
* Release verification independently checks the component bytes before this
* identity is admitted into a calibrated release.
*/
var WASM_OJ_RUNTIME_IDENTITY_SHA256 = "47684bee57aafd163b18a787fa16eed33cab3ec3c0005c3c46bb4f1803ffc835";
/** Exact canonical serialization hashed by `WASM_OJ_RUNTIME_IDENTITY_SHA256`. */
function runtimeIdentityBytes() {
	return canonicalJsonBytes(WASM_OJ_RUNTIME_COMPONENTS);
}
async function verifyRuntimeIdentity() {
	if (await sha256Hex$1(runtimeIdentityBytes()) !== "47684bee57aafd163b18a787fa16eed33cab3ec3c0005c3c46bb4f1803ffc835") throw new Error("WASM-OJ runtime identity declaration does not match its digest.");
}
//#endregion
//#region src/core/cost-profile.ts
function coordinates(language, target, optimization) {
	assertLanguageIdentifier$1(language);
	return [
		"wasm-oj-cost",
		`contract-${WASM_OJ_CONTRACT_VERSION$1}`,
		encodeURIComponent(language),
		target,
		optimization
	];
}
/** Stable identity for one calibrated compiler/runtime overhead profile. */
function costProfileId(language, target, optimization, downstreamToolchainContent) {
	const content = isBuiltinLanguage$1(language) ? toolchainContentIdentity(language) : downstreamToolchainContent;
	if (!content || !/^[A-Za-z0-9._-]+$/.test(content)) throw new Error(isBuiltinLanguage$1(language) ? `WASM-OJ toolchain content identity is invalid for '${language}'.` : `Downstream language '${language}' requires an explicit content identity using letters, digits, '.', '_' or '-'.`);
	return [
		...coordinates(language, target, optimization),
		`content-${content}`,
		`runtime-${WASM_OJ_RUNTIME_IDENTITY_SHA256}`,
		WEIGHTED_METER_MODEL
	].join(":");
}
function isCostProfileFor(profile, language, target, optimization) {
	const prefix = `${coordinates(language, target, optimization).join(":")}:content-`;
	const suffix = `:runtime-${WASM_OJ_RUNTIME_IDENTITY_SHA256}:${WEIGHTED_METER_MODEL}`;
	if (!profile.startsWith(prefix) || !profile.endsWith(suffix)) return false;
	const content = profile.slice(prefix.length, -suffix.length);
	return Boolean(content) && /^[A-Za-z0-9._-]+$/.test(content);
}
//#endregion
//#region src/core/cost-baselines.ts
/** Measured weighted cost of an empty Java main for the pinned TeaVM profile. */
var JAVA_EMPTY_PROGRAM_BASELINE_COST = Object.freeze({
	debug: 2907,
	release: 2419
});
var javaContent = toolchainContentIdentity("java");
/** Default baselines shipped with this exact compiler/runtime distribution. */
var DEFAULT_COST_BASELINES = Object.freeze({
	[costProfileId("java", "wasip1", "debug", javaContent)]: JAVA_EMPTY_PROGRAM_BASELINE_COST.debug,
	[costProfileId("java", "wasip1", "release", javaContent)]: JAVA_EMPTY_PROGRAM_BASELINE_COST.release
});
//#endregion
//#region src/core/cost.ts
var CostBaselineRegistry = class {
	baselines = /* @__PURE__ */ new Map();
	sealed = false;
	constructor(entries = {}) {
		for (const [profile, baseline] of Object.entries(entries)) this.register(profile, baseline);
	}
	register(profile, baseline) {
		if (this.sealed) throw new Error("CostBaselineRegistry is sealed after its first lookup.");
		if (typeof profile !== "string" || !profile || profile !== profile.trim() || profile.length > 16384) throw new Error("Cost profile IDs must be non-empty, trimmed strings of at most 16384 characters.");
		if (!Number.isSafeInteger(baseline) || baseline < 0) throw new RangeError(`Cost baseline '${profile}' must be a non-negative safe integer.`);
		if (this.baselines.has(profile)) throw new Error(`Cost profile '${profile}' is already registered.`);
		this.baselines.set(profile, baseline);
	}
	baseline(profile) {
		this.sealed = true;
		if (typeof profile !== "string" || profile.length === 0) throw new Error("Cost profile is required.");
		return this.baselines.get(profile) ?? 0;
	}
};
function createDefaultCostBaselineRegistry() {
	return new CostBaselineRegistry(DEFAULT_COST_BASELINES);
}
function createExtendedCostBaselineRegistry(additional = {}) {
	return new CostBaselineRegistry({
		...DEFAULT_COST_BASELINES,
		...additional
	});
}
function resolveCostBudget(profile, netInstructionBudget, registry = createDefaultCostBaselineRegistry()) {
	if (!Number.isSafeInteger(netInstructionBudget) || netInstructionBudget < 1) throw new RangeError("Net instruction budget must be a positive safe integer.");
	const baselineCost = registry.baseline(profile);
	const rawInstructionBudget = baselineCost + netInstructionBudget;
	if (!Number.isSafeInteger(rawInstructionBudget)) throw new RangeError(`Raw instruction budget overflows for cost profile '${profile}'.`);
	return {
		profile,
		baselineCost,
		netInstructionBudget,
		rawInstructionBudget
	};
}
function resolveArtifactCostBudget(artifact, netInstructionBudget, registry = createDefaultCostBaselineRegistry()) {
	if (!(isBuiltinLanguage$1(artifact.language) ? artifact.costProfile === costProfileId(artifact.language, artifact.target, artifact.optimization) : isCostProfileFor(artifact.costProfile, artifact.language, artifact.target, artifact.optimization))) throw new Error(`Artifact cost profile '${artifact.costProfile}' does not match ${artifact.language}/${artifact.target}/${artifact.optimization}.`);
	const budget = resolveCostBudget(artifact.costProfile, netInstructionBudget, registry);
	if (artifact.language === "java" && budget.baselineCost === 0) throw new Error(`Java cost profile '${artifact.costProfile}' has no calibrated empty-program baseline.`);
	return budget;
}
function normalizeExecutionMetrics(raw, budget) {
	if (!raw || typeof raw !== "object") throw new TypeError("Runtime metrics must be an object.");
	if (!Number.isSafeInteger(raw.cost) || raw.cost < 0) throw new RangeError("Runtime returned an invalid raw instruction cost.");
	if (raw.costModel !== "weighted") throw new Error(`Runtime returned unsupported cost model '${String(raw.costModel)}'.`);
	if (!raw.operations || typeof raw.operations !== "object" || Array.isArray(raw.operations)) throw new TypeError("Runtime operations must be a record of weighted operation counts.");
	const operations = Object.fromEntries(Object.entries(raw.operations).map(([opcode, count]) => {
		if (!opcode || opcode !== opcode.trim() || opcode.length > 128) throw new Error("Runtime operation names must be non-empty, trimmed strings of at most 128 characters.");
		assertNonNegativeMetric(count, `Runtime operation '${opcode}' count`);
		return [opcode, count];
	}).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0));
	assertNonNegativeMetric(raw.memoryBytes, "Runtime memoryBytes");
	assertNonNegativeMetric(raw.logicalTimeNs, "Runtime logicalTimeNs");
	assertNonNegativeMetric(raw.filesystemBytes, "Runtime filesystemBytes");
	assertNonNegativeMetric(raw.filesystemEntries, "Runtime filesystemEntries");
	assertNonNegativeMetric(raw.stdoutBytes, "Runtime stdoutBytes");
	assertNonNegativeMetric(raw.stderrBytes, "Runtime stderrBytes");
	return {
		cost: Math.max(0, raw.cost - budget.baselineCost),
		rawCost: raw.cost,
		baselineCost: budget.baselineCost,
		costProfile: budget.profile,
		costModel: raw.costModel,
		operations,
		memoryBytes: raw.memoryBytes,
		logicalTimeNs: raw.logicalTimeNs,
		filesystemBytes: raw.filesystemBytes,
		filesystemEntries: raw.filesystemEntries,
		stdoutBytes: raw.stdoutBytes,
		stderrBytes: raw.stderrBytes
	};
}
function unavailableExecutionMetrics(budget, costModel) {
	if (costModel !== "weighted") throw new Error(`Unsupported cost model '${String(costModel)}'.`);
	return {
		cost: null,
		rawCost: null,
		baselineCost: budget.baselineCost,
		costProfile: budget.profile,
		costModel,
		operations: null,
		memoryBytes: null,
		logicalTimeNs: null,
		filesystemBytes: null,
		filesystemEntries: null,
		stdoutBytes: null,
		stderrBytes: null
	};
}
function assertNonNegativeMetric(value, label) {
	if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(`${label} must be a non-negative safe integer.`);
}
//#endregion
//#region src/core/build-stack.ts
function assertBuildStackSize(language, value) {
	if (language !== "c" && language !== "cpp") throw new Error("stackSizeBytes is supported only for C/C++ builds.");
	if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 16 || value > 4294967280 || value % 16 !== 0) throw new Error("stackSizeBytes must be a multiple of 16 between 16 and 4294967280 bytes.");
}
//#endregion
//#region src/core/project-files.ts
var PROJECT_SOURCE_LIMITS = Object.freeze({
	files: 256,
	bytesPerFile: 4194304,
	totalBytes: 16777216
});
var UTF8_ENCODER$1 = new TextEncoder();
/** Locale-independent ordering used anywhere file order can affect build output. */
function compareCanonicalPaths(left, right) {
	return left < right ? -1 : left > right ? 1 : 0;
}
function assertSafeRelativePath(path, label = "Project path") {
	if (typeof path !== "string" || !path || path !== path.trim() || path.length > 4096) throw new Error(`${label} must be a non-empty, trimmed string of at most 4096 characters.`);
	if (path.startsWith("/") || path.includes("\\") || path.includes("\0") || path.split("/").some((segment) => !segment || segment === "." || segment === "..")) throw new Error(`${label} '${path}' must be a normalized relative path that cannot escape the project.`);
}
/**
* Validates a project file set and returns a fresh, locale-independently sorted
* array. Build hosts must use this order for filesystem creation and argv.
*/
function canonicalProjectFiles(files) {
	if (!Array.isArray(files) || files.length === 0) throw new Error("A project must contain at least one source file.");
	if (files.length > PROJECT_SOURCE_LIMITS.files) throw new Error(`A project cannot contain more than ${PROJECT_SOURCE_LIMITS.files} source files.`);
	const seen = /* @__PURE__ */ new Set();
	let totalBytes = 0;
	return files.map((file, index) => {
		if (!file || typeof file !== "object") throw new Error(`Project file ${index} is invalid.`);
		assertSafeRelativePath(file.path, `Project file ${index} path`);
		assertLanguageIdentifier$1(file.language);
		if (typeof file.content !== "string") throw new Error(`Project file '${file.path}' content must be a string.`);
		if (file.content.length > PROJECT_SOURCE_LIMITS.bytesPerFile) throw new Error(`Project file '${file.path}' exceeds the ${PROJECT_SOURCE_LIMITS.bytesPerFile} byte source limit.`);
		const contentBytes = UTF8_ENCODER$1.encode(file.content).byteLength;
		if (contentBytes > PROJECT_SOURCE_LIMITS.bytesPerFile) throw new Error(`Project file '${file.path}' exceeds the ${PROJECT_SOURCE_LIMITS.bytesPerFile} byte source limit.`);
		totalBytes += contentBytes;
		if (totalBytes > PROJECT_SOURCE_LIMITS.totalBytes) throw new Error(`Project sources exceed the ${PROJECT_SOURCE_LIMITS.totalBytes} byte total limit.`);
		if (seen.has(file.path)) throw new Error(`Duplicate project path '${file.path}'.`);
		seen.add(file.path);
		return {
			path: file.path,
			language: file.language,
			content: file.content
		};
	}).sort((left, right) => compareCanonicalPaths(left.path, right.path));
}
function canonicalFileEntries(files) {
	if (!files || typeof files !== "object" || Array.isArray(files)) throw new Error("Runtime bundle files must be a record.");
	return Object.entries(files).map(([path, contents]) => {
		assertSafeRelativePath(path, "Runtime bundle path");
		return [path, contents];
	}).sort(([left], [right]) => compareCanonicalPaths(left, right));
}
//#endregion
//#region src/core/dependencies.ts
var MIB = 1048576;
var SHA256$3 = /^[0-9a-f]{64}$/;
/** Contract-level admission limits shared by dependency hosts and compilers. */
var DEPENDENCY_RESOLUTION_LIMITS = Object.freeze({
	requirements: 128,
	sourceFiles: 128,
	sourceTextBytes: 8 * MIB,
	hosts: 32,
	roots: 512,
	packages: 512,
	referencesPerPackage: 512,
	concurrency: 16,
	metadataBytes: 8 * MIB,
	packageBytes: 256 * MIB,
	totalDownloadBytes: 512 * MIB,
	archiveFiles: 16384,
	unpackedBytes: 512 * MIB
});
var DEPENDENCY_BUILD_LIMITS = Object.freeze({
	packages: DEPENDENCY_RESOLUTION_LIMITS.packages,
	filesPerPackage: DEPENDENCY_RESOLUTION_LIMITS.archiveFiles,
	bytesPerFile: 64 * MIB,
	totalBytes: DEPENDENCY_RESOLUTION_LIMITS.unpackedBytes
});
function assertBoundedCount(count, maximum, label) {
	if (!Number.isSafeInteger(count) || count < 0 || count > maximum) throw new RangeError(`${label} exceeds the ${maximum}-item limit.`);
}
function createDependencyLock(manifestSha256, roots, packages) {
	requireSha256$2(manifestSha256, "Dependency manifest");
	assertBoundedCount(roots.length, DEPENDENCY_RESOLUTION_LIMITS.roots, "Dependency roots");
	assertBoundedCount(packages.length, DEPENDENCY_RESOLUTION_LIMITS.packages, "Dependency packages");
	const lock = {
		schema: WASM_OJ_SCHEMAS$1.dependencyLock,
		wasmOjContract: WASM_OJ_CONTRACT_VERSION$1,
		manifestSha256,
		roots: canonicalStrings(roots, "dependency root"),
		packages: packages.map(canonicalPackage).sort((left, right) => left.id.localeCompare(right.id))
	};
	assertValidDependencyLock(lock);
	return lock;
}
function assertValidDependencyLock(value) {
	if (!isRecord$4(value)) throw new TypeError("Dependency lock must be an object.");
	if (value.schema !== WASM_OJ_SCHEMAS$1.dependencyLock || value.wasmOjContract !== WASM_OJ_CONTRACT_VERSION$1) throw new Error("Dependency lock does not use the active WASM-OJ contract.");
	if (!Array.isArray(value.roots) || !Array.isArray(value.packages)) throw new TypeError("Dependency lock roots and packages must be arrays.");
	assertBoundedCount(value.roots.length, DEPENDENCY_RESOLUTION_LIMITS.roots, "Dependency lock roots");
	assertBoundedCount(value.packages.length, DEPENDENCY_RESOLUTION_LIMITS.packages, "Dependency lock packages");
	requireSha256$2(value.manifestSha256, "Dependency manifest");
	const roots = canonicalStrings(value.roots, "dependency root");
	const packages = value.packages.map(canonicalPackage);
	assertSortedUnique(roots, "dependency roots");
	assertSortedUnique(packages.map((item) => item.id), "dependency packages");
	const ids = new Set(packages.map((item) => item.id));
	for (const root of roots) if (!ids.has(root)) throw new Error(`Dependency root '${root}' is not present in the package graph.`);
	for (const item of packages) for (const dependency of item.dependencies) if (!ids.has(dependency)) throw new Error(`Dependency package '${item.id}' refers to missing package '${dependency}'.`);
}
async function dependencyLockSha256(lock) {
	assertValidDependencyLock(lock);
	return sha256Hex$1(JSON.stringify(lock));
}
async function dependencyManifestSha256(manifest) {
	assertValidDependencyManifest(manifest);
	const requirements = manifest.requirements.map((requirement) => ({
		ecosystem: requirement.ecosystem,
		name: requirement.name,
		requirement: requirement.requirement,
		features: [...requirement.features ?? []]
	})).sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
	const sourceFiles = [...manifest.sourceFiles ?? []].map((file) => ({ ...file })).sort((left, right) => `${left.ecosystem}:${left.role}:${left.path}`.localeCompare(`${right.ecosystem}:${right.role}:${right.path}`));
	return sha256Hex$1(JSON.stringify({
		requirements,
		sourceFiles
	}));
}
function assertValidDependencyManifest(value) {
	if (!isRecord$4(value) || !Array.isArray(value.requirements)) throw new TypeError("Dependency manifest requirements must be an array.");
	assertBoundedCount(value.requirements.length, DEPENDENCY_RESOLUTION_LIMITS.requirements, "Dependency requirements");
	const requirementIds = /* @__PURE__ */ new Set();
	for (const requirement of value.requirements) {
		assertDependencyRequirement(requirement);
		const identity = JSON.stringify(requirement);
		if (requirementIds.has(identity)) throw new Error(`Duplicate dependency requirement '${requirement.name}'.`);
		requirementIds.add(identity);
	}
	if (value.sourceFiles !== void 0 && !Array.isArray(value.sourceFiles)) throw new TypeError("Dependency source files must be an array.");
	const sourceFiles = value.sourceFiles ?? [];
	assertBoundedCount(sourceFiles.length, DEPENDENCY_RESOLUTION_LIMITS.sourceFiles, "Dependency source files");
	const sourceIds = /* @__PURE__ */ new Set();
	const encoder = new TextEncoder();
	let sourceTextBytes = 0;
	for (const candidate of sourceFiles) {
		if (!isRecord$4(candidate) || !DEPENDENCY_ECOSYSTEMS.includes(candidate.ecosystem) || !"manifest lockfile source".split(" ").includes(candidate.role)) throw new Error("Dependency source files require a supported ecosystem and role.");
		assertSafeRelativePath(candidate.path, "Dependency source path");
		if (typeof candidate.contents !== "string" || candidate.contents.includes("\0")) throw new Error(`Dependency source file '${String(candidate.path)}' must contain NUL-free text.`);
		sourceTextBytes += encoder.encode(candidate.contents).byteLength;
		if (sourceTextBytes > DEPENDENCY_RESOLUTION_LIMITS.sourceTextBytes) throw new RangeError(`Dependency source text exceeds the ${DEPENDENCY_RESOLUTION_LIMITS.sourceTextBytes}-byte aggregate limit.`);
		const identity = `${candidate.ecosystem}:${candidate.role}:${candidate.path}`;
		if (sourceIds.has(identity)) throw new Error(`Duplicate dependency source file '${candidate.path}'.`);
		sourceIds.add(identity);
	}
}
function assertDependencyRequirement(value) {
	if (!isRecord$4(value)) throw new TypeError("Dependency requirement must be an object.");
	if (!DEPENDENCY_ECOSYSTEMS.includes(value.ecosystem)) throw new Error(`Unsupported dependency ecosystem '${String(value.ecosystem)}'.`);
	canonicalText(value.name, "dependency name", 512);
	canonicalText(value.requirement, "dependency requirement", 2048);
	if (value.features !== void 0) {
		if (!Array.isArray(value.features)) throw new TypeError("Dependency features must be an array.");
		assertBoundedCount(value.features.length, DEPENDENCY_RESOLUTION_LIMITS.referencesPerPackage, "Dependency features");
		assertSortedUnique(canonicalStrings(value.features, "dependency feature"), "dependency features");
	}
}
function assertValidDependencyBuildBundle(value) {
	if (!isRecord$4(value)) throw new TypeError("Dependency build bundle must be an object.");
	assertValidDependencyLock(value.lock);
	requireSha256$2(value.lockSha256, "Dependency build lock");
	if (!Array.isArray(value.packages) || value.packages.length !== value.lock.packages.length) throw new Error("Dependency build packages must exactly match the dependency lock.");
	let totalBytes = 0;
	for (const [index, candidate] of value.packages.entries()) {
		if (!isRecord$4(candidate) || !isRecord$4(candidate.package) || candidate.package.id !== value.lock.packages[index]?.id) throw new Error("Dependency build packages must use canonical lock order.");
		requireSha256$2(candidate.filesSha256, `Dependency package '${candidate.package.id}' file tree`);
		const files = canonicalDependencyFiles(candidate.files, candidate.package.id, false);
		totalBytes += Object.values(files).reduce((sum, bytes) => sum + bytes.byteLength, 0);
	}
	if (totalBytes > DEPENDENCY_BUILD_LIMITS.totalBytes) throw new RangeError(`Dependency build exceeds ${DEPENDENCY_BUILD_LIMITS.totalBytes} extracted bytes.`);
}
async function verifyDependencyBuildBundle(bundle) {
	assertValidDependencyBuildBundle(bundle);
	if (await dependencyLockSha256(bundle.lock) !== bundle.lockSha256) throw new Error("Dependency build lock digest does not match its canonical lock.");
	for (const item of bundle.packages) if (await dependencyFileTreeSha256(item.files) !== item.filesSha256) throw new Error(`Dependency package '${item.package.id}' file-tree digest mismatch.`);
}
async function dependencyFileTreeSha256(files) {
	const entries = [];
	for (const [path, bytes] of Object.entries(files).sort(([left], [right]) => left.localeCompare(right))) entries.push({
		path,
		bytes: bytes.byteLength,
		sha256: await sha256Hex$1(bytes)
	});
	return sha256Hex$1(JSON.stringify(entries));
}
function canonicalDependencyFiles(value, id, clone = true) {
	if (!isRecord$4(value)) throw new TypeError(`Dependency '${id}' materializer must return a file record.`);
	const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right));
	if (entries.length === 0 || entries.length > DEPENDENCY_BUILD_LIMITS.filesPerPackage) throw new RangeError(`Dependency '${id}' must contain 1-${DEPENDENCY_BUILD_LIMITS.filesPerPackage} files.`);
	const result = {};
	for (const [path, bytes] of entries) {
		assertSafeRelativePath(path, `Dependency '${id}' file path`);
		if (!(bytes instanceof Uint8Array) || bytes.byteLength > DEPENDENCY_BUILD_LIMITS.bytesPerFile) throw new RangeError(`Dependency '${id}' file '${path}' exceeds its byte limit.`);
		result[path] = clone ? bytes.slice() : bytes;
	}
	return result;
}
function canonicalPackage(value) {
	if (!isRecord$4(value)) throw new TypeError("Locked dependency package must be an object.");
	canonicalText(value.id, "dependency package ID", 2048);
	if (!DEPENDENCY_ECOSYSTEMS.includes(value.ecosystem)) throw new Error(`Unsupported dependency ecosystem '${String(value.ecosystem)}'.`);
	const ecosystem = value.ecosystem;
	canonicalText(value.name, "dependency package name", 512);
	canonicalText(value.version, "dependency package version", 512);
	canonicalText(value.source, "dependency package source", 4096);
	if (value.id !== `${ecosystem}:${value.name}@${value.version}`) throw new Error(`Dependency package ID '${value.id}' does not match its ecosystem, name, and version.`);
	requireSha256$2(value.integritySha256, `Dependency package '${value.id}'`);
	if (!Array.isArray(value.dependencies)) throw new TypeError("Package dependencies must be an array.");
	const dependencies = canonicalStrings(value.dependencies, "dependency package reference");
	assertSortedUnique(dependencies, `dependencies of '${value.id}'`);
	let features;
	if (value.features !== void 0) {
		if (!Array.isArray(value.features)) throw new TypeError("Locked package features must be an array.");
		features = canonicalStrings(value.features, "locked package feature");
		assertSortedUnique(features, `features of '${value.id}'`);
	}
	return {
		id: value.id,
		ecosystem,
		name: value.name,
		version: value.version,
		source: value.source,
		integritySha256: value.integritySha256,
		dependencies,
		...features ? { features } : {}
	};
}
function canonicalStrings(values, label) {
	return values.map((value) => canonicalText(value, label, 4096));
}
function canonicalText(value, label, maximum) {
	if (typeof value !== "string" || !value || value !== value.trim() || value.length > maximum || value.includes("\0")) throw new Error(`${label} must be a non-empty, trimmed, NUL-free string of at most ${maximum} characters.`);
	return value;
}
function assertSortedUnique(values, label) {
	for (let index = 1; index < values.length; index += 1) if (values[index - 1] >= values[index]) throw new Error(`${label} must be sorted and unique.`);
}
function requireSha256$2(value, label) {
	if (typeof value !== "string" || !SHA256$3.test(value)) throw new Error(`${label} SHA-256 must be lowercase hexadecimal.`);
}
function isRecord$4(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
//#endregion
//#region src/core/project-validation.ts
var PROJECT_KEYS = Object.freeze([
	"id",
	"name",
	"files",
	"config",
	"activeFile",
	"updatedAt"
]);
var PROJECT_KEYS_WITH_DEPENDENCIES = Object.freeze([...PROJECT_KEYS, "dependencies"]);
var PROJECT_FILE_KEYS = Object.freeze([
	"path",
	"language",
	"content"
]);
var PROJECT_CONFIG_KEYS = Object.freeze([
	"language",
	"target",
	"optimization",
	"entry",
	"args",
	"stdin",
	"env",
	"determinism",
	"resources"
]);
var DETERMINISM_KEYS = Object.freeze([
	"randomSeed",
	"realtimeEpochMs",
	"clockStepNs"
]);
var RESOURCE_KEYS = Object.freeze([
	"instructionBudget",
	"logicalTimeLimitMs",
	"memoryLimitBytes",
	"outputLimitBytes",
	"filesystemWriteLimitBytes",
	"filesystemEntryLimit",
	"wallTimeLimitMs"
]);
function plainDataRecord(value, label) {
	if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be a plain data object.`);
	const prototype = Object.getPrototypeOf(value);
	if (prototype !== Object.prototype && prototype !== null) throw new Error(`${label} must be a plain data object.`);
	for (const key of Reflect.ownKeys(value)) {
		if (typeof key !== "string") throw new Error(`${label} cannot contain symbol properties.`);
		const descriptor = Object.getOwnPropertyDescriptor(value, key);
		if (!descriptor?.enumerable || !("value" in descriptor)) throw new Error(`${label}.${key} must be an enumerable data property.`);
	}
	return value;
}
function exactDataRecord(value, label, expectedKeys) {
	const record = plainDataRecord(value, label);
	if (Object.keys(record).length !== expectedKeys.length || expectedKeys.some((key) => !Object.hasOwn(record, key))) throw new Error(`${label} must contain exactly: ${expectedKeys.join(", ")}.`);
	return record;
}
function denseDataArray(value, label) {
	if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) throw new Error(`${label} must be a plain array.`);
	const keys = Object.keys(value);
	if (keys.length !== value.length || keys.some((key, index) => key !== String(index)) || Reflect.ownKeys(value).length !== value.length + 1) throw new Error(`${label} must be a dense array without custom properties.`);
	for (const key of keys) {
		const descriptor = Object.getOwnPropertyDescriptor(value, key);
		if (!descriptor?.enumerable || !("value" in descriptor)) throw new Error(`${label}[${key}] must be an enumerable data property.`);
	}
	return value;
}
function requiredTrimmedString$1(value, label, maximum) {
	if (typeof value !== "string" || !value || value !== value.trim() || value.length > maximum) throw new Error(`${label} must be a non-empty, trimmed string of at most ${maximum} characters.`);
}
function assertStringArray(value, label) {
	if (denseDataArray(value, label).some((entry) => typeof entry !== "string")) throw new Error(`${label} must contain only strings.`);
}
function assertEnvironment(value) {
	const environment = plainDataRecord(value, "Project environment");
	for (const [name, entry] of Object.entries(environment)) {
		if (!name || name.includes("=") || name.includes("\0")) throw new Error(`Project environment variable name '${name}' is invalid.`);
		if (typeof entry !== "string" || entry.includes("\0")) throw new Error(`Project environment variable '${name}' must be a NUL-free string.`);
	}
}
function assertProjectFiles(value) {
	const files = denseDataArray(value, "Project files");
	for (const [index, file] of files.entries()) exactDataRecord(file, `Project file ${index}`, PROJECT_FILE_KEYS);
	canonicalProjectFiles(files);
}
function assertDeterminism(value) {
	exactDataRecord(value, "Project determinism", DETERMINISM_KEYS);
	resolveDeterminism(value);
}
function assertResources(value) {
	exactDataRecord(value, "Project resources", RESOURCE_KEYS);
	resolveResourcePolicy(value);
}
function assertProjectConfig(value) {
	const hasStackSize = Boolean(value && typeof value === "object" && Object.hasOwn(value, "stackSizeBytes"));
	const config = exactDataRecord(value, "Project config", hasStackSize ? [...PROJECT_CONFIG_KEYS, "stackSizeBytes"] : PROJECT_CONFIG_KEYS);
	assertLanguageIdentifier$1(config.language);
	if (hasStackSize) assertBuildStackSize(config.language, config.stackSizeBytes);
	if (config.target !== "wasip1" && config.target !== "wasix") throw new Error("Project target must be 'wasip1' or 'wasix'.");
	if (config.optimization !== "debug" && config.optimization !== "release") throw new Error("Project optimization must be 'debug' or 'release'.");
	if (isBuiltinLanguage$1(config.language) && !TOOLCHAINS[config.language].targets.includes(config.target)) throw new Error(`Project target '${config.target}' is unsupported for built-in language '${config.language}'.`);
	if (config.language === "java" && config.target !== "wasip1") throw new Error("Project target 'wasix' is unsupported for Java.");
	requiredTrimmedString$1(config.entry, "Project entry", 4096);
	assertStringArray(config.args, "Project arguments");
	if (typeof config.stdin !== "string") throw new Error("Project stdin must be a string.");
	assertEnvironment(config.env);
	assertDeterminism(config.determinism);
	assertResources(config.resources);
}
/**
* Fail-closed validation boundary for projects crossing persistence or
* transport boundaries. The candidate is checked without mutation, defaults,
* type coercion, or shape recovery.
*/
function assertValidProject(candidate) {
	const hasDependencies = Boolean(candidate && typeof candidate === "object" && Object.hasOwn(candidate, "dependencies"));
	const project = exactDataRecord(candidate, "Project", hasDependencies ? PROJECT_KEYS_WITH_DEPENDENCIES : PROJECT_KEYS);
	requiredTrimmedString$1(project.id, "Project id", 16384);
	requiredTrimmedString$1(project.name, "Project name", 4096);
	assertProjectFiles(project.files);
	assertProjectConfig(project.config);
	if (typeof project.activeFile !== "string") throw new Error("Project activeFile must be a string.");
	const paths = new Set(project.files.map((file) => file.path));
	if (!paths.has(project.config.entry)) throw new Error(`Project entry '${project.config.entry}' is not present in files.`);
	if (!paths.has(project.activeFile)) throw new Error(`Project activeFile '${project.activeFile}' is not present in files.`);
	if (typeof project.updatedAt !== "number" || !Number.isFinite(project.updatedAt) || project.updatedAt < 0) throw new Error("Project updatedAt must be a non-negative finite number.");
	if (hasDependencies) assertValidDependencyBuildBundle(project.dependencies);
}
//#endregion
//#region src/core/artifact-validation.ts
var encoder$2 = new TextEncoder();
var RUNTIME_COMMANDS = Object.freeze({
	python: "python",
	javascript: "qjs",
	typescript: "qjs"
});
function requiredTrimmedString(value, label, maximum = 16384) {
	if (typeof value !== "string" || !value || value !== value.trim() || value.length > maximum) throw new Error(`${label} must be a non-empty, trimmed string of at most ${maximum} characters.`);
}
function serializeRuntimeBundleManifest(data) {
	return JSON.stringify({
		schema: WASM_OJ_SCHEMAS$1.runtimeBundle,
		version: WASM_OJ_CONTRACT_VERSION$1,
		name: data.name,
		target: data.target,
		language: data.language,
		runtime: {
			package: data.runtimePackage,
			command: data.command
		},
		execution: {
			deterministic: true,
			contractVersion: WASM_OJ_CONTRACT_VERSION$1
		},
		entry: data.entry,
		files: [...data.files]
	}, null, 2);
}
/** Canonical WASM-OJ manifest constructor for built-in and downstream runtime bundles. */
function createRuntimeBundleManifest(project, runtimePackage, command, entry) {
	requiredTrimmedString(project.name, "Project name");
	requiredTrimmedString(runtimePackage, "Runtime package");
	requiredTrimmedString(command, "Runtime command", 128);
	assertLanguageIdentifier$1(project.config.language);
	assertSafeRelativePath(entry, "Runtime bundle entry");
	return serializeRuntimeBundleManifest({
		name: project.name,
		target: project.config.target,
		language: project.config.language,
		runtimePackage,
		command,
		entry,
		files: canonicalProjectFiles(project.files).map((file) => file.path)
	});
}
function parseRuntimeBundleManifest(artifact) {
	let parsed;
	try {
		parsed = JSON.parse(artifact.manifest);
	} catch (error) {
		throw new Error("Runtime bundle manifest is not valid JSON.", { cause: error });
	}
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Runtime bundle manifest must be a JSON object.");
	const manifest = parsed;
	const runtime = manifest.runtime;
	const execution = manifest.execution;
	if (!runtime || typeof runtime !== "object" || Array.isArray(runtime)) throw new Error("Runtime bundle manifest runtime must be an object.");
	if (!execution || typeof execution !== "object" || Array.isArray(execution)) throw new Error("Runtime bundle manifest execution must be an object.");
	const runtimeRecord = runtime;
	const executionRecord = execution;
	requiredTrimmedString(manifest.name, "Runtime bundle manifest name");
	requiredTrimmedString(runtimeRecord.package, "Runtime bundle manifest package");
	requiredTrimmedString(runtimeRecord.command, "Runtime bundle manifest command", 128);
	if (manifest.target !== "wasip1" && manifest.target !== "wasix") throw new Error("Runtime bundle manifest has an invalid target.");
	if (typeof manifest.language !== "string") throw new Error("Runtime bundle manifest has an invalid language.");
	assertLanguageIdentifier$1(manifest.language);
	if (typeof manifest.entry !== "string") throw new Error("Runtime bundle manifest has an invalid entry.");
	assertSafeRelativePath(manifest.entry, "Runtime bundle manifest entry");
	if (!Array.isArray(manifest.files)) throw new Error("Runtime bundle manifest files must be an array.");
	const files = manifest.files.map((path, index) => {
		assertSafeRelativePath(path, `Runtime bundle manifest file ${index}`);
		return path;
	});
	const canonicalFiles = [...files].sort((left, right) => left < right ? -1 : left > right ? 1 : 0);
	if (new Set(files).size !== files.length || JSON.stringify(files) !== JSON.stringify(canonicalFiles)) throw new Error("Runtime bundle manifest files must be unique and canonically sorted.");
	if (manifest.schema !== WASM_OJ_SCHEMAS$1.runtimeBundle || manifest.version !== WASM_OJ_CONTRACT_VERSION$1 || executionRecord.deterministic !== true || executionRecord.contractVersion !== WASM_OJ_CONTRACT_VERSION$1) throw new Error("Runtime bundle manifest does not match the current WASM-OJ contract.");
	const data = {
		name: manifest.name,
		target: manifest.target,
		language: manifest.language,
		runtimePackage: runtimeRecord.package,
		command: runtimeRecord.command,
		entry: manifest.entry,
		files
	};
	if (artifact.manifest !== serializeRuntimeBundleManifest(data)) throw new Error("Runtime bundle manifest must use the canonical WASM-OJ representation without extra fields.");
	return data;
}
function expectedBuiltinArtifactName(project) {
	switch (project.config.language) {
		case "c":
		case "cpp":
		case "go":
		case "rust": return `${project.name}.wasm`;
		case "python": return `${project.name}.python-${project.config.target}.json`;
		case "javascript":
		case "typescript": return `${project.name}.${project.config.language}-${project.config.target}.json`;
		default: throw new Error(`WASM-OJ has no built-in artifact name for '${project.config.language}'.`);
	}
}
function expectedRuntimeEntry(project) {
	if (project.config.language === "python") {
		if (!project.config.entry.endsWith(".py")) throw new Error("Python entry files must end in '.py'.");
		return project.config.entry;
	}
	if (project.config.language === "typescript") {
		if (!project.config.entry.endsWith(".ts")) throw new Error("TypeScript entry files must end in '.ts'.");
		return `${project.config.entry.slice(0, -3)}.js`;
	}
	return project.config.entry;
}
function assertArtifactMetadata(artifact) {
	if (artifact.wasmOjContract !== WASM_OJ_CONTRACT_VERSION$1) throw new Error(`Artifact WASM-OJ contract '${String(artifact.wasmOjContract)}' is unsupported; expected '${WASM_OJ_CONTRACT_VERSION$1}'.`);
	requiredTrimmedString(artifact.id, "Artifact id");
	requiredTrimmedString(artifact.projectId, "Artifact projectId");
	requiredTrimmedString(artifact.cacheKey, "Artifact cacheKey");
	requiredTrimmedString(artifact.name, "Artifact name");
	if (typeof artifact.language !== "string") throw new Error("Artifact language must be a string.");
	assertLanguageIdentifier$1(artifact.language);
	if (artifact.target !== "wasip1" && artifact.target !== "wasix") throw new Error("Artifact target is invalid.");
	if (artifact.optimization !== "debug" && artifact.optimization !== "release") throw new Error("Artifact optimization is invalid.");
	if (typeof artifact.createdAt !== "number" || !Number.isFinite(artifact.createdAt) || artifact.createdAt < 0) throw new Error("Artifact createdAt must be a non-negative finite number.");
	if (typeof artifact.durationMs !== "number" || !Number.isFinite(artifact.durationMs) || artifact.durationMs < 0) throw new Error("Artifact durationMs must be a non-negative finite number.");
	if (!Number.isSafeInteger(artifact.size) || artifact.size < 0) throw new Error("Artifact size must be a non-negative safe integer.");
	if (!Array.isArray(artifact.toolchains)) throw new Error("Artifact toolchains must be an array.");
	const toolchains = artifact.toolchains;
	if (toolchains.length === 0 || toolchains.some((identity) => typeof identity !== "string" || !identity || identity !== identity.trim()) || new Set(toolchains).size !== toolchains.length) throw new Error("Artifact toolchains must be non-empty, unique, trimmed identities.");
	requiredTrimmedString(artifact.costProfile, "Artifact costProfile");
	if (artifact.dependencyLockSha256 !== void 0 && (typeof artifact.dependencyLockSha256 !== "string" || !/^[0-9a-f]{64}$/.test(artifact.dependencyLockSha256))) throw new Error("Artifact dependencyLockSha256 must be lowercase SHA-256 hexadecimal.");
}
function assertBuiltinContract(artifact) {
	if (!isBuiltinLanguage$1(artifact.language)) return;
	const toolchain = TOOLCHAINS[artifact.language];
	if (!toolchain.targets.includes(artifact.target)) throw new Error(`Artifact target '${artifact.target}' is unsupported for built-in language '${artifact.language}'.`);
	if (artifact.kind !== toolchain.artifact) throw new Error(`Built-in '${artifact.language}' artifacts must use kind '${toolchain.artifact}', not '${artifact.kind}'.`);
	const expectedToolchains = toolchainPackageIdentities(artifact.language);
	if (JSON.stringify(artifact.toolchains) !== JSON.stringify(expectedToolchains)) throw new Error(`Artifact toolchains do not match the canonical '${artifact.language}' toolchain identities.`);
	const expectedProfile = costProfileId(artifact.language, artifact.target, artifact.optimization);
	if (artifact.costProfile !== expectedProfile) throw new Error(`Artifact cost profile '${artifact.costProfile}' does not match ${artifact.language}/${artifact.target}/${artifact.optimization}.`);
	if (artifact.kind === "runtime-bundle") {
		const expectedCommand = RUNTIME_COMMANDS[artifact.language];
		if (artifact.runtimePackage !== toolchain.runtimePackage || artifact.command !== expectedCommand) throw new Error(`Built-in '${artifact.language}' artifact runtime package or command is not canonical.`);
	}
}
function assertBundle(artifact) {
	requiredTrimmedString(artifact.runtimePackage, "Runtime bundle package");
	requiredTrimmedString(artifact.command, "Runtime bundle command", 128);
	assertSafeRelativePath(artifact.entry, "Runtime bundle entry");
	requiredTrimmedString(artifact.manifest, "Runtime bundle manifest", 1048576);
	const entries = canonicalFileEntries(artifact.files);
	for (const [path, contents] of entries) if (typeof contents !== "string" && !(contents instanceof Uint8Array)) throw new Error(`Runtime bundle file '${path}' must contain text or Uint8Array bytes.`);
	if (!Object.hasOwn(artifact.files, artifact.entry)) throw new Error(`Runtime bundle entry '${artifact.entry}' is not present in its files.`);
	if (artifact.files["wasm-oj.manifest.json"] !== artifact.manifest) throw new Error("Runtime bundle must contain its exact manifest at 'wasm-oj.manifest.json'.");
	const manifest = parseRuntimeBundleManifest(artifact);
	if (manifest.target !== artifact.target || manifest.language !== artifact.language || manifest.runtimePackage !== artifact.runtimePackage || manifest.command !== artifact.command || manifest.entry !== artifact.entry) throw new Error("Runtime bundle manifest metadata does not match its artifact metadata.");
	return manifest;
}
/**
* Fail-closed compatibility boundary for cache, compiler, and runner inputs.
* Built-in languages are bound to WASM-OJ's exact artifact/runtime/toolchain
* profile; downstream languages retain their own toolchain and runtime driver.
*/
function assertValidBuildArtifact(candidate, expectation) {
	if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) throw new Error("Build artifact must be an object.");
	const record = candidate;
	assertArtifactMetadata(record);
	if (record.kind !== "wasm" && record.kind !== "runtime-bundle") throw new Error("Artifact kind must be 'wasm' or 'runtime-bundle'.");
	const artifact = candidate;
	let manifest;
	let payloadSize;
	if (artifact.kind === "wasm") {
		if (!(artifact.bytes instanceof Uint8Array)) throw new Error("Wasm artifact bytes must be a Uint8Array.");
		payloadSize = artifact.bytes.byteLength;
	} else {
		manifest = assertBundle(artifact);
		payloadSize = canonicalFileEntries(artifact.files).reduce((total, [, contents]) => total + (typeof contents === "string" ? encoder$2.encode(contents).byteLength : contents.byteLength), 0);
	}
	if (artifact.size !== payloadSize) throw new Error(`Artifact size ${artifact.size} does not match payload size ${payloadSize}.`);
	assertBuiltinContract(artifact);
	if (!isBuiltinLanguage$1(artifact.language) && !isCostProfileFor(artifact.costProfile, artifact.language, artifact.target, artifact.optimization)) throw new Error(`Artifact cost profile '${artifact.costProfile}' does not match ${artifact.language}/${artifact.target}/${artifact.optimization}.`);
	if (!expectation) return;
	const { project, cacheKey } = expectation;
	canonicalProjectFiles(project.files);
	const expected = {
		cacheKey,
		projectId: project.id,
		language: project.config.language,
		target: project.config.target,
		optimization: project.config.optimization,
		dependencyLockSha256: project.dependencies?.lockSha256
	};
	for (const key of [
		"cacheKey",
		"projectId",
		"language",
		"target",
		"optimization",
		"dependencyLockSha256"
	]) if (artifact[key] !== expected[key]) throw new Error(`Artifact ${key} '${String(artifact[key])}' does not match build identity '${String(expected[key])}'.`);
	if (!isBuiltinLanguage$1(project.config.language)) return;
	const expectedName = expectedBuiltinArtifactName(project);
	if (artifact.name !== expectedName) throw new Error(`Artifact name '${artifact.name}' does not match build identity '${expectedName}'.`);
	if (artifact.kind === "runtime-bundle") {
		const expectedEntry = expectedRuntimeEntry(project);
		if (artifact.entry !== expectedEntry) throw new Error(`Artifact entry '${artifact.entry}' does not match build identity '${expectedEntry}'.`);
		const expectedManifest = createRuntimeBundleManifest(project, artifact.runtimePackage, artifact.command, expectedEntry);
		if (artifact.manifest !== expectedManifest || manifest?.name !== project.name) throw new Error("Runtime bundle manifest does not match the canonical project build identity.");
	}
}
//#endregion
//#region src/core/toolchain-sources.ts
var SHA256_PATTERN$1 = /^[a-f0-9]{64}$/;
var ASSET_PATH_PATTERN = /^\/toolchains\/[A-Za-z0-9][A-Za-z0-9._+/-]*$/;
var BROWSER_BASE_SENTINEL = new URL("https://wasm-oj.invalid/");
/**
* Validates a complete, homogeneous toolchain-source set at the host boundary.
* No source is inferred and no duplicate language, profile, or asset ownership
* is accepted.
*/
function validateToolchainDescriptors(sources, expectedKind) {
	if (!Array.isArray(sources) || sources.length === 0) throw new Error("At least one explicit WASM-OJ toolchain source is required.");
	const kind = expectedKind ?? sources[0]?.kind;
	if (kind !== "browser" && kind !== "server") throw new Error("Toolchain sources must declare either the 'browser' or 'server' host kind.");
	const ids = /* @__PURE__ */ new Set();
	const languages = /* @__PURE__ */ new Set();
	const profiles = /* @__PURE__ */ new Set();
	const assets = /* @__PURE__ */ new Set();
	for (const [sourceIndex, source] of sources.entries()) {
		assertObject(source, `Toolchain source ${sourceIndex}`);
		if (source.kind !== kind) throw new Error(`Toolchain source ${sourceIndex} has host kind '${String(source.kind)}'; expected '${kind}'.`);
		if (kind === "browser") {
			assertExactKeys(source, [
				"kind",
				"descriptor",
				"baseUrl"
			], `Browser toolchain source ${sourceIndex}`);
			assertBrowserBaseUrl(source.baseUrl, sourceIndex);
		} else {
			assertExactKeys(source, [
				"kind",
				"descriptor",
				"directory"
			], `Server toolchain source ${sourceIndex}`);
			assertServerDirectory(source.directory, sourceIndex);
		}
		const descriptor = source.descriptor;
		validateDescriptor(descriptor, sourceIndex);
		if (ids.has(descriptor.id)) throw new Error(`Toolchain descriptor id '${descriptor.id}' is registered more than once.`);
		ids.add(descriptor.id);
		for (const language of descriptor.languages) {
			if (languages.has(language)) throw new Error(`Toolchain language '${language}' is owned by more than one descriptor.`);
			languages.add(language);
		}
		for (const profile of descriptor.profiles) {
			const key = profileKey(profile.language, profile.target, profile.optimization);
			if (profiles.has(key)) throw new Error(`Toolchain profile '${key}' is registered more than once.`);
			profiles.add(key);
		}
		for (const asset of descriptor.assets) {
			if (assets.has(asset.path)) throw new Error(`Toolchain asset '${asset.path}' is owned by more than one descriptor.`);
			assets.add(asset.path);
		}
	}
	return sources;
}
function validateBrowserToolchainSources(sources) {
	return validateToolchainDescriptors(sources, "browser");
}
function validateServerToolchainSources(sources) {
	return validateToolchainDescriptors(sources, "server");
}
/** Returns an immutable, structured-clone-safe browser source snapshot. */
function snapshotBrowserToolchainSources(sources) {
	validateBrowserToolchainSources(sources);
	const snapshot = sources.map((source) => Object.freeze({
		kind: "browser",
		baseUrl: source.baseUrl,
		descriptor: freezeDescriptor(source.descriptor)
	}));
	return Object.freeze(snapshot);
}
function toolchainAssetSource(sources, path) {
	assertAssetPath(path, "Requested toolchain asset path");
	let found;
	for (const source of sources) {
		const asset = source.descriptor.assets.find((candidate) => candidate.path === path);
		if (!asset) continue;
		if (found) throw new Error(`Toolchain asset '${path}' has more than one source.`);
		found = {
			source,
			asset
		};
	}
	if (!found) throw new Error(`No explicit toolchain source declares asset '${path}'.`);
	return found;
}
function toolchainProfileSource(sources, language, target, optimization) {
	const key = profileKey(language, target, optimization);
	let found;
	for (const source of sources) {
		const profile = source.descriptor.profiles.find((candidate) => profileKey(candidate.language, candidate.target, candidate.optimization) === key);
		if (!profile) continue;
		if (found) throw new Error(`Toolchain profile '${key}' has more than one source.`);
		found = {
			source,
			profile
		};
	}
	if (!found) throw new Error(`No explicit toolchain source declares profile '${key}'.`);
	return found;
}
function browserToolchainAssetBaseUrl(sources, path, resolutionBaseUrl) {
	const { source } = toolchainAssetSource(sources, path);
	const base = new URL(source.baseUrl, resolutionBaseUrl);
	if (!base.pathname.endsWith("/")) throw new Error(`Browser toolchain base URL '${source.baseUrl}' must end with '/'.`);
	return base;
}
function browserToolchainAssetUrl(sources, path, resolutionBaseUrl) {
	const { asset } = toolchainAssetSource(sources, path);
	const base = browserToolchainAssetBaseUrl(sources, path, resolutionBaseUrl);
	const inheritedSearch = [...base.searchParams];
	base.search = "";
	const url = new URL(asset.path.slice(asset.path.lastIndexOf("/") + 1), base);
	for (const [name, value] of inheritedSearch) url.searchParams.append(name, value);
	url.searchParams.set("sha256", asset.sha256);
	return url;
}
function validateDescriptor(descriptor, sourceIndex) {
	const label = `Toolchain descriptor ${sourceIndex}`;
	assertObject(descriptor, label);
	assertExactKeys(descriptor, [
		"schema",
		"id",
		"version",
		"wasmOjContract",
		"languages",
		"profiles",
		"assets"
	], label);
	if (descriptor.schema !== WASM_OJ_SCHEMAS$1.toolchainPackage) throw new Error(`${label} schema '${String(descriptor.schema)}' is unsupported; expected '${WASM_OJ_SCHEMAS$1.toolchainPackage}'.`);
	if (descriptor.wasmOjContract !== WASM_OJ_CONTRACT_VERSION$1) throw new Error(`${label} contract '${String(descriptor.wasmOjContract)}' is unsupported; expected '${WASM_OJ_CONTRACT_VERSION$1}'.`);
	assertTrimmedString(descriptor.id, `${label} id`, 214);
	assertTrimmedString(descriptor.version, `${label} version`, 128);
	if (!Array.isArray(descriptor.languages) || descriptor.languages.length === 0) throw new Error(`${label} must declare at least one language.`);
	if (!Array.isArray(descriptor.profiles) || descriptor.profiles.length === 0) throw new Error(`${label} must declare at least one build profile.`);
	if (!Array.isArray(descriptor.assets) || descriptor.assets.length === 0) throw new Error(`${label} must declare at least one digest-pinned asset.`);
	const descriptorLanguages = /* @__PURE__ */ new Set();
	for (const language of descriptor.languages) {
		assertLanguageIdentifier$1(language);
		if (descriptorLanguages.has(language)) throw new Error(`${label} repeats language '${language}'.`);
		descriptorLanguages.add(language);
	}
	const descriptorProfiles = /* @__PURE__ */ new Set();
	for (const [profileIndex, profile] of descriptor.profiles.entries()) {
		assertObject(profile, `${label} profile ${profileIndex}`);
		assertExactKeys(profile, [
			"language",
			"target",
			"optimization"
		], `${label} profile ${profileIndex}`);
		assertLanguageIdentifier$1(profile.language);
		if (!descriptorLanguages.has(profile.language)) throw new Error(`${label} profile ${profileIndex} references undeclared language '${profile.language}'.`);
		if (profile.target !== "wasip1" && profile.target !== "wasix") throw new Error(`${label} profile ${profileIndex} has unsupported target '${String(profile.target)}'.`);
		if (profile.optimization !== "debug" && profile.optimization !== "release") throw new Error(`${label} profile ${profileIndex} has unsupported optimization '${String(profile.optimization)}'.`);
		const key = profileKey(profile.language, profile.target, profile.optimization);
		if (descriptorProfiles.has(key)) throw new Error(`${label} repeats profile '${key}'.`);
		descriptorProfiles.add(key);
	}
	for (const language of descriptorLanguages) if (!descriptor.profiles.some((profile) => profile.language === language)) throw new Error(`${label} language '${language}' has no build profile.`);
	const descriptorAssets = /* @__PURE__ */ new Set();
	for (const [assetIndex, asset] of descriptor.assets.entries()) {
		const assetLabel = `${label} asset ${assetIndex}`;
		assertObject(asset, assetLabel);
		assertExactKeys(asset, [
			"path",
			"bytes",
			"sha256",
			"exportPath"
		], assetLabel);
		assertAssetPath(asset.path, `${assetLabel} path`);
		if (descriptorAssets.has(asset.path)) throw new Error(`${label} repeats asset '${asset.path}'.`);
		descriptorAssets.add(asset.path);
		if (!Number.isSafeInteger(asset.bytes) || asset.bytes <= 0) throw new Error(`${assetLabel} bytes must be a positive safe integer.`);
		if (!SHA256_PATTERN$1.test(asset.sha256)) throw new Error(`${assetLabel} sha256 must be a lowercase hexadecimal SHA-256 digest.`);
		const expectedDigest = PINNED_TOOLCHAIN_ASSET_SHA256[asset.path];
		if (expectedDigest !== void 0 && asset.sha256 !== expectedDigest) throw new Error(`${assetLabel} digest '${asset.sha256}' does not match the WASM-OJ pin '${expectedDigest}'.`);
		const expectedExportPath = `./assets/${asset.path.slice(asset.path.lastIndexOf("/") + 1)}`;
		if (asset.exportPath !== expectedExportPath) throw new Error(`${assetLabel} exportPath must be '${expectedExportPath}'.`);
	}
}
function assertBrowserBaseUrl(baseUrl, sourceIndex) {
	assertTrimmedString(baseUrl, `Browser toolchain source ${sourceIndex} baseUrl`, 4096);
	let parsed;
	try {
		parsed = baseUrl.startsWith("/") ? new URL(baseUrl, BROWSER_BASE_SENTINEL) : new URL(baseUrl);
	} catch {
		throw new Error(`Browser toolchain source ${sourceIndex} baseUrl must be absolute or root-relative.`);
	}
	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error(`Browser toolchain source ${sourceIndex} baseUrl must use HTTP or HTTPS.`);
	if (parsed.username || parsed.password) throw new Error(`Browser toolchain source ${sourceIndex} baseUrl must not contain credentials.`);
	if (parsed.hash) throw new Error(`Browser toolchain source ${sourceIndex} baseUrl must not contain a fragment.`);
	if (!parsed.pathname.endsWith("/")) throw new Error(`Browser toolchain source ${sourceIndex} baseUrl must identify a directory and end with '/'.`);
}
function assertServerDirectory(directory, sourceIndex) {
	if (!(directory instanceof URL)) throw new Error(`Server toolchain source ${sourceIndex} directory must be a URL.`);
	if (directory.protocol !== "file:") throw new Error(`Server toolchain source ${sourceIndex} directory must use the file: protocol.`);
	if (directory.search || directory.hash || !directory.pathname.endsWith("/")) throw new Error(`Server toolchain source ${sourceIndex} directory must be a query-free directory URL ending with '/'.`);
}
function assertAssetPath(path, label) {
	if (!ASSET_PATH_PATTERN.test(path) || path.includes("//")) throw new Error(`${label} must be a canonical absolute path below '/toolchains/'.`);
	const segments = path.split("/");
	if (segments.includes(".") || segments.includes("..")) throw new Error(`${label} must not contain traversal segments.`);
}
function profileKey(language, target, optimization) {
	return `${language}/${target}/${optimization}`;
}
function freezeDescriptor(descriptor) {
	return Object.freeze({
		...descriptor,
		languages: Object.freeze([...descriptor.languages]),
		profiles: Object.freeze(descriptor.profiles.map((profile) => Object.freeze({ ...profile }))),
		assets: Object.freeze(descriptor.assets.map((asset) => Object.freeze({ ...asset })))
	});
}
function assertObject(value, label) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error(`${label} must be an object.`);
}
function assertExactKeys(value, expected, label) {
	const actual = Object.keys(value).sort();
	const canonical = [...expected].sort();
	if (actual.length !== canonical.length || actual.some((key, index) => key !== canonical[index])) throw new Error(`${label} must contain exactly: ${canonical.join(", ")}.`);
}
function assertTrimmedString(value, label, maximumLength) {
	if (typeof value !== "string" || value.length === 0 || value !== value.trim() || value.length > maximumLength) throw new Error(`${label} must be a non-empty trimmed string of at most ${maximumLength} characters.`);
}
//#endregion
//#region src/core/hash.ts
async function projectCacheKeyForCompiler(project, compilerCacheIdentity) {
	if (project.dependencies) await verifyDependencyBuildBundle(project.dependencies);
	return sha256Hex$1(projectBuildIdentity(project, compilerCacheIdentity));
}
function assertCompilerCacheKey(cacheKey) {
	if (typeof cacheKey !== "string" || !cacheKey || cacheKey !== cacheKey.trim() || cacheKey.length > 16384) throw new Error("Compiler cache keys must be non-empty, trimmed strings of at most 16384 characters.");
}
/** Stable synchronous identity used to debounce compile-ahead work in UIs. */
function projectBuildIdentity(project, compilerCacheIdentity = JSON.stringify(toolchainCacheIdentity(project.config.language))) {
	if (!compilerCacheIdentity || compilerCacheIdentity !== compilerCacheIdentity.trim() || compilerCacheIdentity.length > 16384) throw new Error("Compiler cache identities must be non-empty, trimmed strings of at most 16384 characters.");
	return JSON.stringify({
		project: {
			id: project.id,
			name: project.name
		},
		config: {
			language: project.config.language,
			target: project.config.target,
			optimization: project.config.optimization,
			...project.config.stackSizeBytes === void 0 ? {} : { stackSizeBytes: project.config.stackSizeBytes },
			entry: project.config.entry
		},
		compiler: compilerCacheIdentity,
		files: canonicalProjectFiles(project.files).map(({ path, language, content }) => ({
			path,
			language,
			content
		})),
		...project.dependencies === void 0 ? {} : { dependencies: {
			lockSha256: project.dependencies.lockSha256,
			packages: project.dependencies.packages.map((item) => ({
				id: item.package.id,
				filesSha256: item.filesSha256
			}))
		} }
	});
}
//#endregion
//#region src/compiler/coordinator.ts
/**
* Coordinates content-addressed foreground and compile-ahead requests.
* It never permits two compiler requests to share mutable compiler state.
*/
var CompileCoordinator = class {
	compiler;
	artifactStore;
	active;
	backgroundIntent = 0;
	lifecycleGeneration = 0;
	inFlightOperations = /* @__PURE__ */ new Set();
	cacheMutationTails = /* @__PURE__ */ new Map();
	constructor(compiler, artifactStore) {
		this.compiler = compiler;
		this.artifactStore = artifactStore;
	}
	compile(project, options = {}) {
		return this.track(this.compileOperation(project, options));
	}
	async compileOperation(project, options) {
		assertValidProject(project);
		const generation = this.lifecycleGeneration;
		const cacheKey = await this.cacheKey(project);
		this.assertCurrent(generation);
		const useCache = options.cache ?? true;
		if (this.active?.cacheKey === cacheKey) {
			this.backgroundIntent += 1;
			this.active.priority = "foreground";
			return this.active.promise;
		}
		if (useCache) {
			const cached = await this.loadCached(project, cacheKey);
			this.assertCurrent(generation);
			if (cached) return cached;
		}
		this.backgroundIntent += 1;
		if (this.active?.cacheKey === cacheKey) {
			this.active.priority = "foreground";
			return this.active.promise;
		}
		await this.cancelActiveBackground();
		this.assertCurrent(generation);
		if (this.active) throw new Error("The compiler already has a different foreground build in progress.");
		return this.start(project, cacheKey, "foreground", useCache);
	}
	precompile(project) {
		return this.track(this.precompileOperation(project));
	}
	async precompileOperation(project) {
		assertValidProject(project);
		const intent = ++this.backgroundIntent;
		const cacheKey = await this.cacheKey(project);
		if (intent !== this.backgroundIntent) return {
			cacheKey,
			status: "superseded"
		};
		try {
			const cached = await this.loadCached(project, cacheKey);
			if (intent !== this.backgroundIntent) return {
				cacheKey,
				status: "superseded"
			};
			if (cached) return {
				cacheKey,
				status: "ready",
				result: cached
			};
			if (this.active?.cacheKey === cacheKey) {
				const result = await this.active.promise;
				return intent === this.backgroundIntent ? outcomeFromBuild(cacheKey, result) : {
					cacheKey,
					status: "superseded"
				};
			}
			await this.cancelActiveBackground();
			if (this.active || intent !== this.backgroundIntent) return {
				cacheKey,
				status: "superseded"
			};
			const result = await this.start(project, cacheKey, "background", true);
			return intent === this.backgroundIntent ? outcomeFromBuild(cacheKey, result) : {
				cacheKey,
				status: "superseded"
			};
		} catch (error) {
			if (intent !== this.backgroundIntent) return {
				cacheKey,
				status: "superseded"
			};
			return {
				cacheKey,
				status: "failed",
				error: error instanceof Error ? error : new Error(String(error))
			};
		}
	}
	supersedeBackground() {
		this.backgroundIntent += 1;
		const active = this.active;
		if (!active || active.priority !== "background") return;
		this.supersede(active);
		this.compiler.cancel();
	}
	/** Cancel every accepted compilation and release it before returning. */
	cancel() {
		this.backgroundIntent += 1;
		this.lifecycleGeneration += 1;
		const active = this.active;
		if (active) this.supersede(active);
		this.compiler.cancel();
	}
	/** Cancel accepted work and wait for hashing, cache I/O, builds, and persistence to settle. */
	async cancelAndWait() {
		this.cancel();
		while (this.inFlightOperations.size > 0) await Promise.allSettled([...this.inFlightOperations]);
	}
	/** Restart the compiler without allowing a retry to join stale work. */
	restart() {
		this.backgroundIntent += 1;
		this.lifecycleGeneration += 1;
		const active = this.active;
		if (active) this.supersede(active);
		this.compiler.restart();
	}
	dispose() {
		this.backgroundIntent += 1;
		this.lifecycleGeneration += 1;
		const active = this.active;
		if (active) this.supersede(active);
		this.compiler.dispose();
	}
	cacheKey(project) {
		return projectCacheKeyForCompiler(project, this.compiler.cacheIdentity(project));
	}
	async loadCached(project, cacheKey) {
		await this.cacheMutationTails.get(cacheKey);
		const artifact = await this.artifactStore?.load(cacheKey);
		if (!artifact) return void 0;
		try {
			assertValidBuildArtifact(artifact, {
				project,
				cacheKey
			});
		} catch (error) {
			console.warn(`Ignoring cached artifact '${cacheKey}' because its build identity is invalid.`, error);
			try {
				await this.artifactStore?.delete(cacheKey);
			} catch (deleteError) {
				console.warn(`Unable to evict invalid cached artifact '${cacheKey}'.`, deleteError);
			}
			return;
		}
		return {
			success: true,
			diagnostics: [],
			artifact,
			stdout: "",
			stderr: "",
			cacheHit: true
		};
	}
	start(project, cacheKey, priority, persist) {
		const state = { superseded: false };
		const promise = this.compiler.build(project, cacheKey).then(async (result) => {
			if (state.superseded) throw new Error("Compilation was superseded.");
			if (result.success) {
				if (!result.artifact) throw new Error("Compiler returned success without an artifact.");
				assertValidBuildArtifact(result.artifact, {
					project,
					cacheKey
				});
				const artifact = result.artifact;
				const artifactStore = this.artifactStore;
				if (persist && artifactStore) await this.queueCacheMutation(cacheKey, async () => {
					try {
						await artifactStore.save(artifact);
					} catch (error) {
						console.warn(`Unable to persist compiled artifact '${cacheKey}'.`, error);
					}
					if (state.superseded) try {
						await artifactStore.delete(cacheKey);
					} catch (error) {
						console.warn(`Unable to remove superseded artifact '${cacheKey}'.`, error);
					}
				});
			} else if (result.artifact) throw new Error("Compiler returned an artifact for a failed build.");
			if (state.superseded) throw new Error("Compilation was superseded.");
			return result;
		});
		const active = {
			cacheKey,
			priority,
			promise,
			state
		};
		this.active = active;
		promise.then(() => this.clearActive(active), () => this.clearActive(active));
		return promise;
	}
	async cancelActiveBackground() {
		const active = this.active;
		if (!active || active.priority !== "background") return;
		this.supersede(active);
		this.compiler.cancel();
		try {
			await active.promise;
		} catch {}
	}
	supersede(active) {
		active.state.superseded = true;
		this.clearActive(active);
	}
	assertCurrent(generation) {
		if (generation !== this.lifecycleGeneration) throw new Error("Compilation was superseded.");
	}
	clearActive(active) {
		if (this.active === active) this.active = void 0;
	}
	track(operation) {
		this.inFlightOperations.add(operation);
		operation.then(() => this.inFlightOperations.delete(operation), () => this.inFlightOperations.delete(operation));
		return operation;
	}
	queueCacheMutation(cacheKey, mutation) {
		const current = (this.cacheMutationTails.get(cacheKey) ?? Promise.resolve()).then(mutation, mutation);
		this.cacheMutationTails.set(cacheKey, current);
		current.then(() => {
			if (this.cacheMutationTails.get(cacheKey) === current) this.cacheMutationTails.delete(cacheKey);
		}, () => {
			if (this.cacheMutationTails.get(cacheKey) === current) this.cacheMutationTails.delete(cacheKey);
		});
		return current;
	}
};
function outcomeFromBuild(cacheKey, result) {
	return {
		cacheKey,
		status: result.success && result.artifact ? "ready" : "compile-error",
		result
	};
}
//#endregion
//#region src/online-judge/trusted-judge-wasm.ts
var TRUSTED_JUDGE_WASM_MAX_BYTES = 8388608;
var WASM_PAGE_BYTES = 65536;
var WASM_MAGIC = [
	0,
	97,
	115,
	109,
	1,
	0,
	0,
	0
];
var VALUE_TYPES = /* @__PURE__ */ new Set([
	127,
	126,
	125,
	124,
	123,
	112,
	111
]);
var RESERVED_EXPORTS = /* @__PURE__ */ new Set(["gas_counter", "__wasm_oj_deferred_start"]);
var I32 = 127;
var I64 = 126;
var errno = (parameters) => ({
	parameters,
	results: [I32]
});
var WASIP1_SIGNATURES = Object.freeze({
	args_get: errno([I32, I32]),
	args_sizes_get: errno([I32, I32]),
	clock_res_get: errno([I32, I32]),
	clock_time_get: errno([
		I32,
		I64,
		I32
	]),
	environ_get: errno([I32, I32]),
	environ_sizes_get: errno([I32, I32]),
	fd_advise: errno([
		I32,
		I64,
		I64,
		I32
	]),
	fd_allocate: errno([
		I32,
		I64,
		I64
	]),
	fd_close: errno([I32]),
	fd_datasync: errno([I32]),
	fd_fdstat_get: errno([I32, I32]),
	fd_fdstat_set_flags: errno([I32, I32]),
	fd_fdstat_set_rights: errno([
		I32,
		I64,
		I64
	]),
	fd_filestat_get: errno([I32, I32]),
	fd_filestat_set_size: errno([I32, I64]),
	fd_filestat_set_times: errno([
		I32,
		I64,
		I64,
		I32
	]),
	fd_pread: errno([
		I32,
		I32,
		I32,
		I64,
		I32
	]),
	fd_prestat_dir_name: errno([
		I32,
		I32,
		I32
	]),
	fd_prestat_get: errno([I32, I32]),
	fd_pwrite: errno([
		I32,
		I32,
		I32,
		I64,
		I32
	]),
	fd_read: errno([
		I32,
		I32,
		I32,
		I32
	]),
	fd_readdir: errno([
		I32,
		I32,
		I32,
		I64,
		I32
	]),
	fd_renumber: errno([I32, I32]),
	fd_seek: errno([
		I32,
		I64,
		I32,
		I32
	]),
	fd_sync: errno([I32]),
	fd_tell: errno([I32, I32]),
	fd_write: errno([
		I32,
		I32,
		I32,
		I32
	]),
	path_create_directory: errno([
		I32,
		I32,
		I32
	]),
	path_filestat_get: errno([
		I32,
		I32,
		I32,
		I32,
		I32
	]),
	path_filestat_set_times: errno([
		I32,
		I32,
		I32,
		I32,
		I64,
		I64,
		I32
	]),
	path_link: errno([
		I32,
		I32,
		I32,
		I32,
		I32,
		I32,
		I32
	]),
	path_open: errno([
		I32,
		I32,
		I32,
		I32,
		I32,
		I64,
		I64,
		I32,
		I32
	]),
	path_readlink: errno([
		I32,
		I32,
		I32,
		I32,
		I32,
		I32
	]),
	path_remove_directory: errno([
		I32,
		I32,
		I32
	]),
	path_rename: errno([
		I32,
		I32,
		I32,
		I32,
		I32,
		I32
	]),
	path_symlink: errno([
		I32,
		I32,
		I32,
		I32,
		I32
	]),
	path_unlink_file: errno([
		I32,
		I32,
		I32
	]),
	poll_oneoff: errno([
		I32,
		I32,
		I32,
		I32
	]),
	proc_exit: {
		parameters: [I32],
		results: []
	},
	proc_raise: errno([I32]),
	random_get: errno([I32, I32]),
	sched_yield: errno([])
});
/** Exact deterministic WASI Preview 1 surface admitted for trusted judge commands. */
var TRUSTED_JUDGE_WASIP1_IMPORTS = Object.freeze(/* @__PURE__ */ new Set([
	"args_get",
	"args_sizes_get",
	"clock_res_get",
	"clock_time_get",
	"environ_get",
	"environ_sizes_get",
	"fd_advise",
	"fd_allocate",
	"fd_close",
	"fd_datasync",
	"fd_fdstat_get",
	"fd_fdstat_set_flags",
	"fd_fdstat_set_rights",
	"fd_filestat_get",
	"fd_filestat_set_size",
	"fd_filestat_set_times",
	"fd_pread",
	"fd_prestat_dir_name",
	"fd_prestat_get",
	"fd_pwrite",
	"fd_read",
	"fd_readdir",
	"fd_renumber",
	"fd_seek",
	"fd_sync",
	"fd_tell",
	"fd_write",
	"path_create_directory",
	"path_filestat_get",
	"path_filestat_set_times",
	"path_link",
	"path_open",
	"path_readlink",
	"path_remove_directory",
	"path_rename",
	"path_symlink",
	"path_unlink_file",
	"poll_oneoff",
	"proc_exit",
	"proc_raise",
	"random_get",
	"sched_yield"
]));
var TRUSTED_JUDGE_RUNTIME_PROFILES = Object.freeze(/* @__PURE__ */ new Set([
	"c-wasip1-release",
	"cpp-wasip1-release",
	"rust-wasip1-release",
	"go-wasip1-release"
]));
var WasmReader = class WasmReader {
	bytes;
	label;
	offset = 0;
	constructor(bytes, label) {
		this.bytes = bytes;
		this.label = label;
	}
	get remaining() {
		return this.bytes.byteLength - this.offset;
	}
	done() {
		return this.offset === this.bytes.byteLength;
	}
	requireDone() {
		if (!this.done()) throw new TypeError(`${this.label} has trailing bytes.`);
	}
	byte() {
		if (this.offset >= this.bytes.byteLength) throw new TypeError(`${this.label} is truncated.`);
		return this.bytes[this.offset++];
	}
	u32() {
		let value = 0;
		let shift = 0;
		for (let index = 0; index < 5; index += 1) {
			const byte = this.byte();
			if (index === 4 && (byte & 240) !== 0) throw new TypeError(`${this.label} contains an overflowing varuint32.`);
			value += (byte & 127) * 2 ** shift;
			if ((byte & 128) === 0) return value >>> 0;
			shift += 7;
		}
		throw new TypeError(`${this.label} contains an invalid varuint32.`);
	}
	vector(read) {
		const count = this.u32();
		const result = [];
		for (let index = 0; index < count; index += 1) result.push(read(this, index));
		return result;
	}
	name() {
		const length = this.u32();
		if (length > 4096 || length > this.remaining) throw new TypeError(`${this.label} contains an invalid name length.`);
		const bytes = this.take(length);
		try {
			return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
		} catch (error) {
			throw new TypeError(`${this.label} contains a non-UTF-8 name.`, { cause: error });
		}
	}
	take(length) {
		if (!Number.isSafeInteger(length) || length < 0 || length > this.remaining) throw new TypeError(`${this.label} is truncated.`);
		const result = this.bytes.subarray(this.offset, this.offset + length);
		this.offset += length;
		return result;
	}
	section(length, label) {
		return new WasmReader(this.take(length), label);
	}
};
function valueType(reader) {
	const type = reader.byte();
	if (!VALUE_TYPES.has(type)) throw new TypeError("Trusted judge Wasm uses a type outside the admitted core value-type surface.");
	return type;
}
function parseTypes(section) {
	const result = section.vector((reader) => {
		if (reader.byte() !== 96) throw new TypeError("Trusted judge Wasm may declare only core function types.");
		return {
			parameters: reader.vector((item) => valueType(item)),
			results: reader.vector((item) => valueType(item))
		};
	});
	section.requireDone();
	return result;
}
function parseImports(section) {
	const typeIndices = [];
	const names = [];
	section.vector((reader) => {
		const namespace = reader.name();
		const name = reader.name();
		if (reader.byte() !== 0) throw new TypeError(`Trusted judge import '${namespace}.${name}' must be a function.`);
		if (namespace !== "wasi_snapshot_preview1" || !TRUSTED_JUDGE_WASIP1_IMPORTS.has(name)) throw new TypeError(`Trusted judge import '${namespace}.${name}' is outside the admitted WASI Preview 1 surface.`);
		typeIndices.push(reader.u32());
		names.push(`${namespace}.${name}`);
	});
	section.requireDone();
	return {
		typeIndices,
		names
	};
}
function parseFunctions(section) {
	const result = section.vector((reader) => reader.u32());
	section.requireDone();
	return result;
}
function parseMemory(section) {
	const memories = section.vector((reader) => {
		const flags = reader.u32();
		if (flags !== 0 && flags !== 1) throw new TypeError("Trusted judge memory must be 32-bit, unshared, and use the default page size.");
		const initial = reader.u32();
		const maximum = flags === 1 ? reader.u32() : void 0;
		if (maximum !== void 0 && maximum < initial) throw new TypeError("Trusted judge memory maximum is below its initial size.");
		return {
			initial,
			...maximum === void 0 ? {} : { maximum }
		};
	});
	section.requireDone();
	if (memories.length !== 1) throw new TypeError("Trusted judge Wasm must define exactly one linear memory.");
	return memories[0];
}
function parseExports(section) {
	const result = section.vector((reader) => ({
		name: reader.name(),
		kind: reader.byte(),
		index: reader.u32()
	}));
	section.requireDone();
	return result;
}
function assertHeader(bytes) {
	if (bytes.byteLength < WASM_MAGIC.length || WASM_MAGIC.some((byte, index) => bytes[index] !== byte)) throw new TypeError("Trusted judge artifact is not a core WebAssembly v1 module.");
}
/**
* Pure static admission for prebuilt checker/interactor modules. It validates
* structure and ABI only; it never compiles, instantiates, or executes guest code.
*/
function validateTrustedJudgeWasm(bytes, options = {}) {
	if (!(bytes instanceof Uint8Array) || bytes.byteLength < WASM_MAGIC.length || bytes.byteLength > 8388608) throw new TypeError("Trusted judge Wasm is outside the 8 MiB artifact limit.");
	assertHeader(bytes);
	if (!WebAssembly.validate(bytes.slice().buffer)) throw new TypeError("Trusted judge artifact is not valid WebAssembly for the active runtime.");
	if (options.memoryLimitBytes !== void 0 && (!Number.isSafeInteger(options.memoryLimitBytes) || options.memoryLimitBytes < WASM_PAGE_BYTES || options.memoryLimitBytes % WASM_PAGE_BYTES !== 0)) throw new TypeError("Trusted judge memory limit must be a positive multiple of 64 KiB.");
	const reader = new WasmReader(bytes.subarray(WASM_MAGIC.length), "trusted judge module");
	let types = [];
	let importedTypes = [];
	let importNames = [];
	let definedTypes = [];
	let memory;
	let exports = [];
	while (!reader.done()) {
		const id = reader.byte();
		const length = reader.u32();
		const section = reader.section(length, `trusted judge section ${id}`);
		if (id === 0) continue;
		if (id === 1) types = parseTypes(section);
		else if (id === 2) ({typeIndices: importedTypes, names: importNames} = parseImports(section));
		else if (id === 3) definedTypes = parseFunctions(section);
		else if (id === 5) memory = parseMemory(section);
		else if (id === 7) exports = parseExports(section);
		else if (id === 8) throw new TypeError("Trusted judge Wasm must not declare a start section; '_start' is the only entrypoint.");
	}
	if (!memory) throw new TypeError("Trusted judge Wasm must define exactly one linear memory.");
	if (options.memoryLimitBytes !== void 0 && memory.initial * WASM_PAGE_BYTES > options.memoryLimitBytes) throw new TypeError("Trusted judge initial memory exceeds the problem memory limit.");
	for (const entry of exports) {
		if (RESERVED_EXPORTS.has(entry.name) || entry.name.startsWith("__wasm_oj_")) throw new TypeError(`Trusted judge export '${entry.name}' is reserved by WASM-OJ.`);
		if (entry.name !== "memory" && entry.name !== "_start") throw new TypeError(`Trusted judge export '${entry.name}' is outside the admitted command ABI.`);
	}
	const memoryExport = exports.filter((entry) => entry.name === "memory");
	if (memoryExport.length !== 1 || memoryExport[0].kind !== 2 || memoryExport[0].index !== 0) throw new TypeError("Trusted judge Wasm must export its sole linear memory as 'memory'.");
	const startExports = exports.filter((entry) => entry.name === "_start");
	if (startExports.length !== 1 || startExports[0].kind !== 0) throw new TypeError("Trusted judge Wasm must export exactly one '_start' function.");
	const startIndex = startExports[0].index;
	if (startIndex < importedTypes.length) throw new TypeError("Trusted judge '_start' must be defined by the module.");
	const typeIndex = definedTypes[startIndex - importedTypes.length];
	const type = typeIndex === void 0 ? void 0 : types[typeIndex];
	if (!type || type.parameters.length !== 0 || type.results.length !== 0) throw new TypeError("Trusted judge '_start' must have the signature () -> ().");
	for (const typeIndexValue of [...importedTypes, ...definedTypes]) if (!types[typeIndexValue]) throw new TypeError("Trusted judge function refers to a missing type.");
	if (new Set(importNames).size !== importNames.length) throw new TypeError("Trusted judge Wasm repeats a WASI import.");
	for (const [index, qualifiedName] of importNames.entries()) {
		const expected = WASIP1_SIGNATURES[qualifiedName.slice(23)];
		const actual = types[importedTypes[index]];
		if (JSON.stringify(actual.parameters) !== JSON.stringify(expected.parameters) || JSON.stringify(actual.results) !== JSON.stringify(expected.results)) throw new TypeError(`Trusted judge import '${qualifiedName}' has an invalid WASI ABI signature.`);
	}
	return {
		bytes: bytes.byteLength,
		initialMemoryPages: memory.initial,
		...memory.maximum === void 0 ? {} : { maximumMemoryPages: memory.maximum },
		imports: [...importNames]
	};
}
//#endregion
//#region src/judge/normalization.ts
function normalizeOutput(value, mode) {
	if (mode === "exact") return value;
	const lines = value.replace(/\r\n?/g, "\n").split("\n").map((line) => line.trimEnd());
	while (lines.at(-1) === "") lines.pop();
	const normalized = lines.join("\n");
	return mode === "trimmed-lines" ? normalized.trim() : normalized;
}
//#endregion
//#region src/judge/spec.ts
function textMatcher(expected, normalization = "lines") {
	return {
		id: "text",
		config: {
			expected,
			normalization
		}
	};
}
function sha256Matcher(digest, normalization = "trimmed-lines") {
	return {
		id: "sha256",
		config: {
			digest: digest.toLowerCase(),
			normalization
		}
	};
}
function fileMatcher(expected, normalization = "lines") {
	return {
		id: "files",
		config: {
			expected: { ...expected },
			normalization
		}
	};
}
function tokenMatcher(expected) {
	return {
		id: "tokens",
		config: { expected }
	};
}
function floatMatcher(expected, absoluteTolerance = 1e-6, relativeTolerance = 1e-6) {
	assertTolerance(absoluteTolerance, "absolute");
	assertTolerance(relativeTolerance, "relative");
	return {
		id: "float",
		config: {
			expected,
			absoluteTolerance,
			relativeTolerance
		}
	};
}
function setMatcher(expected, multiplicity = false) {
	return {
		id: "set",
		config: {
			expected,
			multiplicity
		}
	};
}
function wasmCheckerMatcher(checker, expected, args = [], files = {}) {
	return {
		id: "wasm-checker",
		config: {
			checker: {
				runtimeProfile: checker.runtimeProfile,
				wasm: checker.wasm.slice()
			},
			expected,
			args: [...args],
			files: Object.fromEntries(Object.entries(files).map(([path, contents]) => [path, contents.slice()]))
		}
	};
}
function assertTolerance(value, label) {
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw new RangeError(`Float matcher ${label} tolerance must be finite and non-negative.`);
}
function validateJudgeSpec(spec) {
	if (!spec || typeof spec !== "object") throw new TypeError("Judge spec must be an object.");
	if (spec.version !== WASM_OJ_CONTRACT_VERSION$1) throw new Error(`Unsupported judge spec version '${String(spec.version)}'.`);
	if (!Array.isArray(spec.cases)) throw new TypeError("Judge spec cases must be an array.");
	if (spec.cases.length === 0) throw new Error("A judge spec must contain at least one case.");
	if (spec.failFast !== void 0 && typeof spec.failFast !== "boolean") throw new TypeError("Judge spec failFast must be a boolean.");
	const ids = /* @__PURE__ */ new Set();
	for (const [index, item] of spec.cases.entries()) {
		if (!item || typeof item !== "object") throw new TypeError(`Judge case ${index} must be an object.`);
		assertJudgeIdentifier(item.id, `Judge case ${index} ID`);
		if (ids.has(item.id)) throw new Error(`Duplicate judge case ID '${item.id}'.`);
		ids.add(item.id);
		if (item.kind !== "batch" && item.kind !== "interactive") throw new Error(`Judge case '${item.id}' kind must be 'batch' or 'interactive'.`);
		if (item.kind === "batch") {
			if (!item.matcher || typeof item.matcher !== "object") throw new TypeError(`Judge case '${item.id}' matcher must be an object.`);
			assertJudgeIdentifier(item.matcher.id, `Judge case '${item.id}' matcher ID`);
			if (!item.matcher.config || typeof item.matcher.config !== "object" || Array.isArray(item.matcher.config)) throw new TypeError(`Judge case '${item.id}' matcher config must be a record.`);
			validateProgramSpec(item, item.id, "batch program");
			validateOutputPaths(item.outputPaths, item.id);
		} else validateInteractiveCase(item);
		if (!item.input || typeof item.input !== "object") throw new TypeError(`Judge case '${item.id}' input must be an object.`);
		if (item.files !== void 0) {
			if (!item.files || typeof item.files !== "object" || Array.isArray(item.files)) throw new TypeError(`Judge case '${item.id}' files must be a record.`);
			if (Object.keys(item.files).length > 256) throw new Error(`Judge case '${item.id}' has too many input files.`);
			for (const [path, input] of Object.entries(item.files)) {
				assertGuestFilePath(path, `Judge case '${item.id}' input file path`);
				validateFileInputSpec(input, `Judge case '${item.id}' input file '${path}'`);
			}
		}
		if (item.input.kind === "inline") {
			if (typeof item.input.value !== "string") throw new TypeError(`Judge case '${item.id}' inline input must be a string.`);
		} else if (item.input.kind === "provider") {
			assertJudgeIdentifier(item.input.provider, `Judge case '${item.id}' input provider`);
			assertCanonicalString(item.input.key, `Judge case '${item.id}' input key`, 4096);
			if (item.input.sha256 !== void 0 && (typeof item.input.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(item.input.sha256))) throw new Error(`Judge case '${item.id}' input SHA-256 digest must be lowercase hexadecimal.`);
		} else throw new Error(`Judge case '${item.id}' has unsupported input kind '${String(item.input.kind)}'.`);
		if (item.determinism !== void 0 && (!item.determinism || typeof item.determinism !== "object" || Array.isArray(item.determinism))) throw new TypeError(`Judge case '${item.id}' determinism must be a record.`);
		resolveDeterminism(item.determinism);
	}
}
function validateInteractiveCase(item) {
	if (item.contestant !== void 0) validateProgramSpec(item.contestant, item.id, "contestant");
	if (!item.interactor || typeof item.interactor !== "object" || Array.isArray(item.interactor)) throw new TypeError(`Judge case '${item.id}' interactor must be an object.`);
	validateProgramSpec(item.interactor, item.id, "interactor");
	assertGuestFilePath(item.interactor.inputPath, `Judge case '${item.id}' interactor inputPath`);
	validateTrustedProgram(item.interactor.program, `Judge case '${item.id}' interactor`);
}
function validateTrustedProgram(value, label) {
	if (!value || typeof value !== "object" || !(value.wasm instanceof Uint8Array)) throw new TypeError(`${label} must be a trusted judge program.`);
	validateTrustedJudgeWasm(value.wasm);
}
function validateProgramSpec(value, caseId, label) {
	if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`Judge case '${caseId}' ${label} must be an object.`);
	if (value.args !== void 0 && (!Array.isArray(value.args) || value.args.some((argument) => typeof argument !== "string"))) throw new TypeError(`Judge case '${caseId}' ${label} args must be an array of strings.`);
	if (value.env !== void 0) validateEnvironment(value.env, `Judge case '${caseId}' ${label} environment`);
	if (value.cwd !== void 0) assertGuestDirectoryPath(value.cwd, `Judge case '${caseId}' ${label} cwd`);
	if (value.resources !== void 0 && (!value.resources || typeof value.resources !== "object" || Array.isArray(value.resources))) throw new TypeError(`Judge case '${caseId}' ${label} resources must be a record.`);
	resolveResourcePolicy(value.resources);
}
function validateOutputPaths(outputPaths, caseId) {
	if (outputPaths === void 0) return;
	if (!Array.isArray(outputPaths) || outputPaths.length > 256) throw new TypeError(`Judge case '${caseId}' outputPaths must be an array of at most 256 paths.`);
	const paths = outputPaths.map((path) => assertGuestFilePath(path, `Judge case '${caseId}' output path`)).sort();
	if (paths.some((path, index) => index > 0 && paths[index - 1] === path)) throw new Error(`Judge case '${caseId}' output paths must be unique.`);
}
function validateInputSpec(input, label) {
	if (!input || typeof input !== "object") throw new TypeError(`${label} must be an object.`);
	if (input.kind === "inline") {
		if (typeof input.value !== "string") throw new TypeError(`${label} inline value must be a string.`);
		return;
	}
	if (input.kind !== "provider") throw new Error(`${label} has an unsupported input kind.`);
	assertJudgeIdentifier(input.provider, `${label} provider`);
	assertCanonicalString(input.key, `${label} key`, 4096);
	if (input.sha256 !== void 0 && !/^[0-9a-f]{64}$/.test(input.sha256)) throw new Error(`${label} SHA-256 digest must be lowercase hexadecimal.`);
}
function validateFileInputSpec(input, label) {
	if (input?.kind === "inline-bytes") {
		if (!(input.value instanceof Uint8Array)) throw new TypeError(`${label} inline bytes must be a Uint8Array.`);
		return;
	}
	validateInputSpec(input, label);
}
/** Shared strict guest-path boundary for trusted judge assets. */
function assertJudgeGuestFilePath(value, label = "Judge guest file path") {
	return assertGuestFilePath(value, label);
}
function assertGuestFilePath(value, label) {
	if (typeof value !== "string" || value === "/" || !isNormalizedGuestPath(value)) throw new Error(`${label} must be an absolute normalized file path.`);
	return value;
}
function assertGuestDirectoryPath(value, label) {
	if (typeof value !== "string" || !isNormalizedGuestPath(value)) throw new Error(`${label} must be an absolute normalized path.`);
	return value;
}
function isNormalizedGuestPath(path) {
	return path.startsWith("/") && path.length <= 4096 && !path.includes("\\") && !path.includes("\0") && (path === "/" || !path.endsWith("/") && !path.includes("//")) && !path.split("/").some((part) => part === "." || part === "..");
}
function assertJudgeIdentifier(value, label) {
	assertCanonicalString(value, label, 128);
}
function assertCanonicalString(value, label, maximum) {
	if (typeof value !== "string" || !value || value !== value.trim() || value.length > maximum) throw new Error(`${label} must be a non-empty, trimmed string of at most ${maximum} characters.`);
}
function validateEnvironment(value, caseLabel) {
	if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`Judge case '${caseLabel}' env must be a record.`);
	for (const [name, contents] of Object.entries(value)) {
		if (!name || name.includes("=") || name.includes("\0")) throw new Error(`Judge case '${caseLabel}' has invalid environment variable name '${name}'.`);
		if (typeof contents !== "string" || contents.includes("\0")) throw new Error(`Judge case '${caseLabel}' environment variable '${name}' must be a NUL-free string.`);
	}
}
//#endregion
//#region src/judge/engine.ts
var JudgeEngine = class {
	executor;
	inputs = /* @__PURE__ */ new Map();
	matchers = /* @__PURE__ */ new Map();
	constructor(executor, options = {}) {
		this.executor = executor;
		this.registerMatcher(textOutputMatcher);
		this.registerMatcher(sha256OutputMatcher);
		this.registerMatcher(fileOutputMatcher);
		this.registerMatcher(tokenOutputMatcher);
		this.registerMatcher(floatOutputMatcher);
		this.registerMatcher(setOutputMatcher);
		this.registerMatcher(wasmCheckerOutputMatcher(this.executor));
		for (const provider of options.inputProviders ?? []) this.registerInputProvider(provider);
		for (const matcher of options.matchers ?? []) this.registerMatcher(matcher);
	}
	registerInputProvider(provider) {
		if (!provider || typeof provider !== "object" || typeof provider.resolve !== "function") throw new TypeError("Judge input providers must be objects implementing resolve().");
		registerUnique(this.inputs, provider.id, provider, "input provider");
	}
	registerMatcher(matcher) {
		if (!matcher || typeof matcher !== "object" || typeof matcher.match !== "function") throw new TypeError("Judge matchers must be objects implementing match().");
		registerUnique(this.matchers, matcher.id, matcher, "matcher");
	}
	async judge(artifact, spec, options = {}) {
		assertValidBuildArtifact(artifact);
		validateJudgeSpec(spec);
		const retention = options.retention ?? "full";
		if (retention !== "full" && retention !== "metrics-only") throw new TypeError("Judge result retention must be 'full' or 'metrics-only'.");
		if (options.aggregateOutputLimitBytes !== void 0 && (!Number.isSafeInteger(options.aggregateOutputLimitBytes) || options.aggregateOutputLimitBytes < 1)) throw new RangeError("Judge aggregateOutputLimitBytes must be a positive safe integer.");
		const cases = [];
		let aggregateOutputBytes = 0;
		for (const [index, caseSpec] of spec.cases.entries()) {
			let result = await this.runCase(artifact, caseSpec);
			const caseOutputBytes = retainedOutputBytes(result);
			const exceedsAggregateLimit = options.aggregateOutputLimitBytes !== void 0 && caseOutputBytes > options.aggregateOutputLimitBytes - aggregateOutputBytes;
			aggregateOutputBytes += caseOutputBytes;
			await options.onOutputBytes?.(caseOutputBytes, aggregateOutputBytes);
			if (exceedsAggregateLimit && result.verdict !== "judge-error") result = {
				...result,
				verdict: "output-limit",
				message: "The submission exceeded the judge job's cumulative output limit."
			};
			result = retainCaseResult(result, retention);
			cases.push(result);
			await options.onCase?.(result, cases.length, spec.cases.length);
			if (result.verdict === "judge-error") break;
			if (exceedsAggregateLimit) {
				for (const remaining of spec.cases.slice(index + 1)) cases.push({
					id: remaining.id,
					verdict: "output-limit"
				});
				break;
			}
			if ((spec.failFast ?? true) && result.verdict !== "accepted") break;
		}
		return summarize(cases, spec.cases.length);
	}
	async runCase(artifact, caseSpec) {
		try {
			const input = await this.resolveInput(caseSpec);
			if (caseSpec.kind === "interactive") {
				const interaction = await this.executor.interact(artifact, caseSpec, input);
				const verdict = interactiveVerdict(interaction);
				return {
					id: caseSpec.id,
					verdict,
					...verdict === "wrong-answer" ? { message: "Interactor rejected the protocol." } : {},
					interaction
				};
			}
			const run = await this.executor.run(artifact, caseSpec, input);
			const termination = terminationVerdict(run);
			if (termination) return {
				id: caseSpec.id,
				verdict: termination,
				run
			};
			const matcher = this.matchers.get(caseSpec.matcher.id);
			if (!matcher) throw new Error(`No judge matcher is registered for '${caseSpec.matcher.id}'.`);
			const matched = await matcher.match(caseSpec.matcher, {
				case: caseSpec,
				artifact,
				stdin: input.stdin,
				run,
				stdout: run.stdout,
				stderr: run.stderr,
				files: run.files
			});
			if (matched.auxiliaryOutputBytes !== void 0 && (!Number.isSafeInteger(matched.auxiliaryOutputBytes) || matched.auxiliaryOutputBytes < 0)) throw new Error("Judge matcher auxiliary output bytes must be a non-negative safe integer.");
			return withAuxiliaryOutput({
				id: caseSpec.id,
				verdict: matched.accepted ? "accepted" : "wrong-answer",
				message: matched.message,
				run
			}, matched.auxiliaryOutputBytes ?? 0);
		} catch (error) {
			return {
				id: caseSpec.id,
				verdict: "judge-error",
				message: error instanceof Error ? error.message : String(error)
			};
		}
	}
	async resolveInput(caseSpec) {
		const stdin = await this.resolveInputSpec(caseSpec.input, caseSpec);
		const files = {};
		for (const [path, input] of Object.entries(caseSpec.files ?? {}).sort(([left], [right]) => left.localeCompare(right))) files[path] = input.kind === "inline-bytes" ? input.value.slice() : new TextEncoder().encode(await this.resolveInputSpec(input, caseSpec));
		return {
			stdin,
			files
		};
	}
	async resolveInputSpec(input, caseSpec) {
		if (input.kind === "inline") return input.value;
		const provider = this.inputs.get(input.provider);
		if (!provider) throw new Error(`No judge input provider is registered for '${input.provider}'.`);
		const value = await provider.resolve(input, caseSpec);
		if (input.sha256 && await sha256Hex$1(value) !== input.sha256.toLowerCase()) throw new Error(`Input provider '${provider.id}' returned data with the wrong SHA-256 digest.`);
		return value;
	}
};
var AUXILIARY_OUTPUT_BYTES = Symbol("judge-auxiliary-output-bytes");
function withAuxiliaryOutput(result, bytes) {
	if (bytes === 0) return result;
	Object.defineProperty(result, AUXILIARY_OUTPUT_BYTES, {
		value: bytes,
		enumerable: false
	});
	return result;
}
function retainedOutputBytes(result) {
	const auxiliary = result[AUXILIARY_OUTPUT_BYTES] ?? 0;
	if (result.run) return auxiliary + utf8Bytes(result.run.stdout) + utf8Bytes(result.run.stderr) + Object.values(result.run.files).reduce((total, bytes) => total + bytes.byteLength, 0);
	if (result.interaction) return auxiliary + utf8Bytes(result.interaction.contestant.stderr) + utf8Bytes(result.interaction.interactor.stderr) + utf8Bytes(result.interaction.contestantToInteractor) + utf8Bytes(result.interaction.interactorToContestant);
	return auxiliary;
}
function utf8Bytes(value) {
	return new TextEncoder().encode(value).byteLength;
}
function retainCaseResult(result, retention) {
	if (retention === "full") return result;
	const run = result.run === void 0 ? void 0 : {
		code: result.run.code,
		stdout: "",
		stderr: "",
		files: {},
		durationMs: result.run.durationMs,
		determinism: result.run.determinism,
		resources: result.run.resources,
		termination: result.run.termination,
		metrics: result.run.metrics
	};
	const interaction = result.interaction === void 0 ? void 0 : {
		...result.interaction,
		contestant: {
			...result.interaction.contestant,
			stderr: ""
		},
		interactor: {
			...result.interaction.interactor,
			stderr: ""
		},
		contestantToInteractor: "",
		interactorToContestant: ""
	};
	return {
		id: result.id,
		verdict: result.verdict,
		...run === void 0 ? {} : { run },
		...interaction === void 0 ? {} : { interaction }
	};
}
function createJudgeExecutor(adapter) {
	return {
		run: (artifact, caseSpec, input) => adapter.run(artifact, {
			args: caseSpec.args ?? [],
			stdin: input.stdin,
			env: caseSpec.env ?? {},
			files: cloneFiles(input.files),
			outputPaths: [...caseSpec.outputPaths ?? []],
			...caseSpec.cwd === void 0 ? {} : { cwd: caseSpec.cwd },
			determinism: resolveDeterminism(caseSpec.determinism),
			resources: resolveResourcePolicy(caseSpec.resources)
		}),
		runTrusted: (program, caseSpec, input) => {
			if (!adapter.runTrusted) throw new Error("This WASM-OJ host cannot execute trusted judge programs.");
			return adapter.runTrusted(program, {
				args: caseSpec.args ?? [],
				stdin: input.stdin,
				env: caseSpec.env ?? {},
				files: cloneFiles(input.files),
				outputPaths: [...caseSpec.outputPaths ?? []],
				...caseSpec.cwd === void 0 ? {} : { cwd: caseSpec.cwd },
				determinism: resolveDeterminism(caseSpec.determinism),
				resources: resolveResourcePolicy(caseSpec.resources)
			});
		},
		interact: (contestant, caseSpec, input) => {
			if (!adapter.interactTrusted) throw new Error("This WASM-OJ host cannot execute trusted interactors.");
			const interactorFiles = {
				...cloneFiles(input.files),
				[caseSpec.interactor.inputPath]: new TextEncoder().encode(input.stdin)
			};
			return adapter.interactTrusted(contestant, caseSpec.interactor.program, {
				contestant: judgeProgramConfig(caseSpec.contestant),
				interactor: {
					...judgeProgramConfig(caseSpec.interactor),
					files: interactorFiles
				},
				determinism: resolveDeterminism(caseSpec.determinism)
			});
		}
	};
}
function judgeProgramConfig(spec = {}) {
	return {
		args: [...spec.args ?? []],
		env: { ...spec.env ?? {} },
		...spec.cwd === void 0 ? {} : { cwd: spec.cwd },
		resources: resolveResourcePolicy(spec.resources)
	};
}
function cloneFiles(files) {
	return Object.fromEntries(Object.entries(files).map(([path, contents]) => [path, contents.slice()]));
}
var textOutputMatcher = {
	id: "text",
	async match(spec, context) {
		const expected = requiredString(spec, "expected");
		const normalization = normalizationFrom(spec);
		const actual = normalizeOutput(context.stdout, normalization);
		const normalizedExpected = normalizeOutput(expected, normalization);
		return actual === normalizedExpected ? { accepted: true } : {
			accepted: false,
			message: `Output mismatch: expected ${JSON.stringify(normalizedExpected)}, received ${JSON.stringify(actual)}.`
		};
	}
};
var sha256OutputMatcher = {
	id: "sha256",
	async match(spec, context) {
		const digest = requiredString(spec, "digest").toLowerCase();
		if (!/^[0-9a-f]{64}$/.test(digest)) throw new Error("sha256 matcher requires a 64-character hexadecimal digest.");
		const actual = await sha256Hex$1(normalizeOutput(context.stdout, normalizationFrom(spec)));
		return actual === digest ? { accepted: true } : {
			accepted: false,
			message: `Output SHA-256 mismatch: expected ${digest}, received ${actual}.`
		};
	}
};
var fileOutputMatcher = {
	id: "files",
	async match(spec, context) {
		const expected = spec.config.expected;
		if (!expected || typeof expected !== "object" || Array.isArray(expected)) throw new Error("files matcher requires record config 'expected'.");
		const normalization = normalizationFrom(spec);
		const expectedRecord = expected;
		const expectedPaths = Object.keys(expectedRecord).sort();
		const actualPaths = Object.keys(context.files).sort();
		if (JSON.stringify(actualPaths) !== JSON.stringify(expectedPaths)) return {
			accepted: false,
			message: `Output file set mismatch: expected ${expectedPaths.join(", ")}, received ${actualPaths.join(", ")}.`
		};
		const decoder = new TextDecoder("utf-8", { fatal: true });
		for (const path of expectedPaths) {
			const expectedContents = expectedRecord[path];
			if (typeof expectedContents !== "string") throw new Error(`Expected contents for '${path}' must be a string.`);
			if (normalizeOutput(decoder.decode(context.files[path]), normalization) !== normalizeOutput(expectedContents, normalization)) return {
				accepted: false,
				message: `Output file '${path}' mismatch.`
			};
		}
		return { accepted: true };
	}
};
var tokenOutputMatcher = {
	id: "tokens",
	async match(spec, context) {
		const expected = tokens(requiredString(spec, "expected"));
		const actual = tokens(context.stdout);
		return arraysEqual(actual, expected) ? { accepted: true } : {
			accepted: false,
			message: `Token mismatch: expected ${expected.length} tokens, received ${actual.length}.`
		};
	}
};
var floatOutputMatcher = {
	id: "float",
	async match(spec, context) {
		const expected = tokens(requiredString(spec, "expected"));
		const actual = tokens(context.stdout);
		const absoluteTolerance = requiredTolerance(spec, "absoluteTolerance");
		const relativeTolerance = requiredTolerance(spec, "relativeTolerance");
		if (actual.length !== expected.length) return {
			accepted: false,
			message: `Float token count mismatch: expected ${expected.length}, received ${actual.length}.`
		};
		for (let index = 0; index < expected.length; index += 1) {
			const wanted = parseFiniteNumber(expected[index]);
			const received = parseFiniteNumber(actual[index]);
			if (wanted === void 0 || received === void 0) {
				if (actual[index] !== expected[index]) return {
					accepted: false,
					message: `Token ${index + 1} is not equal.`
				};
				continue;
			}
			const difference = Math.abs(received - wanted);
			const tolerance = Math.max(absoluteTolerance, relativeTolerance * Math.abs(wanted));
			if (difference > tolerance) return {
				accepted: false,
				message: `Float token ${index + 1} differs by ${difference}, exceeding ${tolerance}.`
			};
		}
		return { accepted: true };
	}
};
var setOutputMatcher = {
	id: "set",
	async match(spec, context) {
		const multiplicity = spec.config.multiplicity;
		if (typeof multiplicity !== "boolean") throw new Error("set matcher requires boolean config 'multiplicity'.");
		const normalize = (value) => {
			const values = tokens(value).sort();
			return multiplicity ? values : [...new Set(values)];
		};
		const expected = normalize(requiredString(spec, "expected"));
		return arraysEqual(normalize(context.stdout), expected) ? { accepted: true } : {
			accepted: false,
			message: `${multiplicity ? "Multiset" : "Set"} output mismatch.`
		};
	}
};
function wasmCheckerOutputMatcher(executor) {
	return {
		id: "wasm-checker",
		async match(spec, context) {
			const checker = spec.config.checker;
			if (!checker || typeof checker !== "object" || Array.isArray(checker)) throw new Error("wasm-checker matcher requires a trusted judge program.");
			const runtimeProfile = checker.runtimeProfile;
			const wasm = checker.wasm;
			if (typeof runtimeProfile !== "string" || !(wasm instanceof Uint8Array)) throw new Error("wasm-checker matcher requires a trusted judge program.");
			const program = {
				runtimeProfile,
				wasm
			};
			validateTrustedJudgeWasm(program.wasm);
			const expected = requiredString(spec, "expected");
			const configuredArgs = spec.config.args;
			if (!Array.isArray(configuredArgs) || configuredArgs.some((value) => typeof value !== "string")) throw new Error("wasm-checker matcher requires string array config 'args'.");
			const files = {
				"/checker/input.txt": new TextEncoder().encode(context.stdin),
				"/checker/expected.txt": new TextEncoder().encode(expected),
				"/checker/actual.txt": new TextEncoder().encode(context.stdout),
				"/checker/stderr.txt": new TextEncoder().encode(context.stderr)
			};
			const trustedFiles = spec.config.files;
			if (!trustedFiles || typeof trustedFiles !== "object" || Array.isArray(trustedFiles)) throw new Error("wasm-checker matcher requires a trusted file record.");
			for (const [path, contents] of Object.entries(trustedFiles)) {
				assertJudgeGuestFilePath(path, "Custom checker trusted file path");
				if (!path.startsWith("/checker/assets/")) throw new Error("Custom checker trusted files must be inside '/checker/assets/'.");
				if (!(contents instanceof Uint8Array)) throw new Error("Custom checker trusted file contents must be bytes.");
				if (Object.hasOwn(files, path)) throw new Error("Custom checker trusted file collides with a reserved path.");
				files[path] = contents.slice();
			}
			for (const [path, contents] of Object.entries(context.files)) files[`/checker/files${path}`] = contents.slice();
			const checkerCase = {
				kind: "batch",
				id: `${context.case.id}:checker`,
				input: {
					kind: "inline",
					value: ""
				},
				matcher: {
					id: "text",
					config: { expected: "" }
				},
				args: [
					"/checker/input.txt",
					"/checker/expected.txt",
					"/checker/actual.txt",
					"/checker/stderr.txt",
					...configuredArgs
				],
				env: {},
				determinism: context.case.determinism,
				resources: context.case.resources
			};
			const result = await executor.runTrusted(program, checkerCase, {
				stdin: "",
				files
			});
			if (result.termination !== "exited" || result.code !== 0 && result.code !== 1) throw new Error("Custom checker failed inside the judge sandbox.");
			return result.code === 0 ? {
				accepted: true,
				auxiliaryOutputBytes: retainedOutputBytes({
					id: checkerCase.id,
					verdict: "accepted",
					run: result
				})
			} : {
				accepted: false,
				message: "Custom checker rejected the output.",
				auxiliaryOutputBytes: retainedOutputBytes({
					id: checkerCase.id,
					verdict: "wrong-answer",
					run: result
				})
			};
		}
	};
}
function tokens(value) {
	const trimmed = value.trim();
	return trimmed ? trimmed.split(/\s+/u) : [];
}
function arraysEqual(left, right) {
	return left.length === right.length && left.every((value, index) => value === right[index]);
}
function requiredTolerance(spec, key) {
	const value = spec.config[key];
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw new Error(`float matcher requires finite non-negative config '${key}'.`);
	return value;
}
function parseFiniteNumber(value) {
	if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value)) return void 0;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : void 0;
}
function requiredString(spec, key) {
	const value = spec.config[key];
	if (typeof value !== "string") throw new Error(`${spec.id} matcher requires string config '${key}'.`);
	return value;
}
function normalizationFrom(spec) {
	const value = spec.config.normalization ?? (spec.id === "sha256" ? "trimmed-lines" : "lines");
	if (value !== "exact" && value !== "lines" && value !== "trimmed-lines") throw new Error(`Unsupported output normalization '${String(value)}'.`);
	return value;
}
function terminationVerdict(run) {
	if (run.termination === "exited" && run.code === 0) return void 0;
	if (run.termination === "exited" || run.termination === "trap") return "runtime-error";
	return run.termination;
}
function interactiveVerdict(result) {
	const contestantTermination = interactiveContestantTerminationVerdict(result);
	if (contestantTermination && contestantTermination !== "runtime-error") return contestantTermination;
	if (result.interactor.termination !== "exited") return "judge-error";
	if (result.interactor.code === 1) return "wrong-answer";
	if (result.interactor.code !== 0) return "judge-error";
	return contestantTermination ?? "accepted";
}
function interactiveContestantTerminationVerdict(result) {
	const { contestant } = result;
	if (contestant.termination === "exited" && contestant.code === 0) return void 0;
	if (contestant.termination === "exited" || contestant.termination === "trap") return "runtime-error";
	return contestant.termination;
}
function registerUnique(registry, id, value, label) {
	if (typeof id !== "string" || !id || id !== id.trim() || id.length > 128) throw new Error(`Judge ${label} IDs must be non-empty, trimmed strings of at most 128 characters.`);
	if (registry.has(id)) throw new Error(`Judge ${label} '${id}' is already registered.`);
	registry.set(id, value);
}
function summarize(cases, total) {
	const metrics = cases.flatMap((item) => item.run ? [item.run.metrics] : item.interaction ? [item.interaction.contestant.metrics] : []);
	const sum = (values) => values.some((value) => value === null) ? null : values.reduce((totalValue, value) => totalValue + (value ?? 0), 0);
	const maximum = (values) => values.some((value) => value === null) ? null : Math.max(0, ...values.map((value) => value ?? 0));
	return {
		verdict: cases.find((item) => item.verdict !== "accepted")?.verdict ?? "accepted",
		completed: cases.length,
		total,
		cases,
		metrics: {
			cost: sum(metrics.map((value) => value.cost)),
			rawCost: sum(metrics.map((value) => value.rawCost)),
			baselineCost: metrics.reduce((totalValue, value) => totalValue + value.baselineCost, 0),
			logicalTimeNs: sum(metrics.map((value) => value.logicalTimeNs)),
			maxMemoryBytes: maximum(metrics.map((value) => value.memoryBytes)),
			maxFilesystemBytes: maximum(metrics.map((value) => value.filesystemBytes)),
			maxFilesystemEntries: maximum(metrics.map((value) => value.filesystemEntries)),
			stdoutBytes: sum(metrics.map((value) => value.stdoutBytes)),
			stderrBytes: sum(metrics.map((value) => value.stderrBytes))
		}
	};
}
//#endregion
//#region src/dependencies/build.ts
function createDefaultDependencyBuildAdapters() {
	return [
		archiveAdapter("cargo", materializeCargo),
		archiveAdapter("npm", materializeNpm),
		archiveAdapter("pypi", materializePyPi),
		archiveAdapter("go", materializeGo),
		archiveAdapter("cpp", materializeCpp)
	];
}
async function createDependencyBuildBundle(lock, payloads, adapters = createDefaultDependencyBuildAdapters()) {
	assertValidDependencyLock(lock);
	if (!(payloads instanceof Map)) throw new TypeError("Dependency payloads must be a package-ID keyed Map.");
	if (!Array.isArray(adapters)) throw new TypeError("Dependency build adapters must be an array.");
	if (lock.packages.length > DEPENDENCY_BUILD_LIMITS.packages) throw new RangeError(`Dependency build contains more than ${DEPENDENCY_BUILD_LIMITS.packages} packages.`);
	const adapterByEcosystem = /* @__PURE__ */ new Map();
	for (const adapter of adapters) {
		if (!adapter || typeof adapter !== "object" || typeof adapter.materialize !== "function") throw new TypeError("Dependency build adapters must implement materialize().");
		if (adapterByEcosystem.has(adapter.ecosystem)) throw new Error(`Dependency build adapter '${adapter.ecosystem}' is registered more than once.`);
		adapterByEcosystem.set(adapter.ecosystem, adapter);
	}
	const expectedIds = new Set(lock.packages.map((item) => item.id));
	const unexpected = [...payloads.keys()].filter((id) => !expectedIds.has(id)).sort();
	if (unexpected.length > 0) throw new Error(`Dependency payloads contain unknown packages: ${unexpected.join(", ")}.`);
	let totalBytes = 0;
	const packages = [];
	for (const packageRecord of lock.packages) {
		const payload = payloads.get(packageRecord.id);
		if (!(payload instanceof Uint8Array)) throw new Error(`Dependency payload '${packageRecord.id}' is missing.`);
		if (await sha256Hex$1(payload) !== packageRecord.integritySha256) throw new Error(`Dependency payload '${packageRecord.id}' failed integrity verification.`);
		const adapter = adapterByEcosystem.get(packageRecord.ecosystem);
		if (!adapter) throw new Error(`No dependency build adapter is registered for '${packageRecord.ecosystem}'.`);
		const files = canonicalDependencyFiles(await adapter.materialize(packageRecord, payload), packageRecord.id);
		totalBytes += Object.values(files).reduce((sum, bytes) => sum + bytes.byteLength, 0);
		if (totalBytes > DEPENDENCY_BUILD_LIMITS.totalBytes) throw new RangeError(`Dependency build exceeds ${DEPENDENCY_BUILD_LIMITS.totalBytes} extracted bytes.`);
		packages.push(Object.freeze({
			package: structuredClone(packageRecord),
			filesSha256: await dependencyFileTreeSha256(files),
			files: Object.freeze(files)
		}));
	}
	const bundle = Object.freeze({
		lock: structuredClone(lock),
		lockSha256: await dependencyLockSha256(lock),
		packages: Object.freeze(packages)
	});
	await verifyDependencyBuildBundle(bundle);
	return bundle;
}
function archiveAdapter(ecosystem, materialize) {
	return Object.freeze({
		ecosystem,
		async materialize(record, payload) {
			return materialize(record, payload);
		}
	});
}
function materializeCargo(record, payload) {
	const files = stripArchiveRoot(extractTar(gunzip(payload, record.id)), `${record.name}-${record.version}`, record.id);
	const manifest = requiredUtf8(files, "Cargo.toml", record.id);
	if (/^\s*proc-macro\s*=\s*true\s*$/m.test(manifest)) unsupported(record, "proc-macro crates");
	if (/^\s*build\s*=\s*(?:true|"[^"]+")\s*$/m.test(manifest) || Object.hasOwn(files, "build.rs")) unsupported(record, "Cargo build scripts");
	if (/^\s*links\s*=\s*"/m.test(manifest)) unsupported(record, "native Cargo links");
	rejectExtensions(files, record, [
		".a",
		".o",
		".so",
		".dylib",
		".dll",
		".wasm"
	]);
	return files;
}
function materializeNpm(record, payload) {
	const files = stripArchiveRoot(extractTar(gunzip(payload, record.id)), "package", record.id);
	const packageJson = JSON.parse(requiredUtf8(files, "package.json", record.id));
	if (packageJson.scripts && typeof packageJson.scripts === "object") {
		const scripts = packageJson.scripts;
		const lifecycle = [
			"preinstall",
			"install",
			"postinstall",
			"prepare"
		].find((name) => scripts[name] !== void 0);
		if (lifecycle) unsupported(record, `npm '${lifecycle}' lifecycle scripts`);
	}
	rejectExtensions(files, record, [
		".node",
		".so",
		".dylib",
		".dll"
	]);
	return files;
}
function materializePyPi(record, payload) {
	if (!new URL(record.source).pathname.toLowerCase().endsWith(".whl")) unsupported(record, "PyPI source distributions and build backends");
	const files = extractZip(payload, record.id);
	rejectExtensions(files, record, [
		".so",
		".pyd",
		".dylib",
		".dll"
	]);
	if (Object.keys(files).find((path) => path.includes(".data/purelib/"))) unsupported(record, "wheel .data installation remapping");
	return files;
}
function materializeGo(record, payload) {
	const stripped = stripArchiveRoot(extractZip(payload, record.id), `${record.name}@${record.version}`, record.id);
	rejectExtensions(stripped, record, [
		".a",
		".o",
		".so",
		".dylib",
		".dll"
	]);
	if (Object.keys(stripped).some((path) => path.endsWith(".s") || path.endsWith(".S"))) unsupported(record, "Go assembly sources");
	return stripped;
}
function materializeCpp(record, payload) {
	const stripped = stripSingleCommonRoot(isZip(payload) ? extractZip(payload, record.id) : extractTar(gunzip(payload, record.id)));
	rejectExtensions(stripped, record, [
		".a",
		".o",
		".so",
		".dylib",
		".dll",
		".wasm"
	]);
	return stripped;
}
function extractZip(payload, id) {
	let extracted;
	let count = 0;
	let totalBytes = 0;
	try {
		extracted = unzipSync(payload, { filter(file) {
			if (file.name.endsWith("/")) return false;
			count += 1;
			totalBytes += file.originalSize;
			if (count > DEPENDENCY_BUILD_LIMITS.filesPerPackage || file.originalSize > DEPENDENCY_BUILD_LIMITS.bytesPerFile || totalBytes > DEPENDENCY_BUILD_LIMITS.totalBytes) throw new RangeError(`Dependency '${id}' ZIP exceeds its extracted-file limits.`);
			return true;
		} });
	} catch (error) {
		throw new Error(`Dependency '${id}' is not a valid ZIP archive.`, { cause: error });
	}
	return Object.fromEntries(Object.entries(extracted).filter(([path]) => !path.endsWith("/")));
}
function gunzip(payload, id) {
	const chunks = [];
	let totalBytes = 0;
	let complete = false;
	try {
		new Gunzip((chunk, final) => {
			totalBytes += chunk.byteLength;
			if (totalBytes > DEPENDENCY_BUILD_LIMITS.totalBytes + DEPENDENCY_BUILD_LIMITS.filesPerPackage * 512) throw new RangeError(`Dependency '${id}' gzip exceeds its extracted-byte limit.`);
			chunks.push(chunk.slice());
			complete = final;
		}).push(payload, true);
	} catch (error) {
		if (error instanceof RangeError && error.message.startsWith(`Dependency '${id}'`)) throw error;
		throw new Error(`Dependency '${id}' is not a valid gzip archive.`, { cause: error });
	}
	if (!complete) throw new Error(`Dependency '${id}' gzip stream is incomplete.`);
	const result = new Uint8Array(totalBytes);
	let offset = 0;
	for (const chunk of chunks) {
		result.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return result;
}
function extractTar(payload) {
	const files = {};
	let offset = 0;
	let pendingLongPath;
	let pendingPaxPath;
	while (offset + 512 <= payload.byteLength) {
		const header = payload.subarray(offset, offset + 512);
		if (header.every((byte) => byte === 0)) break;
		verifyTarChecksum(header);
		const name = tarText(header.subarray(0, 100));
		const prefix = tarText(header.subarray(345, 500));
		const size = tarNumber(header.subarray(124, 136), "tar entry size");
		const type = String.fromCharCode(header[156] || 48);
		const dataStart = offset + 512;
		const dataEnd = dataStart + size;
		if (dataEnd > payload.byteLength) throw new Error("Dependency tar entry exceeds its archive.");
		const data = payload.slice(dataStart, dataEnd);
		const rawPath = pendingPaxPath ?? pendingLongPath ?? (prefix ? `${prefix}/${name}` : name);
		pendingPaxPath = void 0;
		pendingLongPath = void 0;
		if (type === "L") pendingLongPath = tarText(data);
		else if (type === "x") pendingPaxPath = paxPath(data);
		else if (type === "g") paxPath(data);
		else if (type === "0" || type === "\0") files[rawPath] = data;
		else if (type !== "5") throw new Error(`Dependency tar entry '${rawPath}' uses unsupported type '${type}'.`);
		offset = dataStart + Math.ceil(size / 512) * 512;
	}
	if (offset > payload.byteLength) throw new Error("Dependency tar archive has invalid block padding.");
	return files;
}
function verifyTarChecksum(header) {
	const expected = tarNumber(header.subarray(148, 156), "tar header checksum");
	let actual = 0;
	for (let index = 0; index < header.length; index += 1) actual += index >= 148 && index < 156 ? 32 : header[index];
	if (actual !== expected) throw new Error("Dependency tar header checksum mismatch.");
}
function tarNumber(bytes, label) {
	if ((bytes[0] & 128) !== 0) throw new Error(`${label} uses unsupported base-256 encoding.`);
	const value = tarText(bytes).trim();
	if (!/^[0-7]*$/.test(value)) throw new Error(`${label} is not canonical octal.`);
	const number = value ? Number.parseInt(value, 8) : 0;
	if (!Number.isSafeInteger(number) || number < 0) throw new Error(`${label} exceeds the supported range.`);
	return number;
}
function tarText(bytes) {
	const nul = bytes.indexOf(0);
	return new TextDecoder("utf-8", { fatal: true }).decode(nul < 0 ? bytes : bytes.subarray(0, nul));
}
function paxPath(bytes) {
	const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
	let offset = 0;
	let path;
	while (offset < text.length) {
		const space = text.indexOf(" ", offset);
		if (space < 0) throw new Error("Dependency PAX header has an invalid record length.");
		const length = Number(text.slice(offset, space));
		if (!Number.isSafeInteger(length) || length <= space - offset + 1 || offset + length > text.length) throw new Error("Dependency PAX header record exceeds its payload.");
		const record = text.slice(space + 1, offset + length - 1);
		const equals = record.indexOf("=");
		if (equals > 0 && record.slice(0, equals) === "path") path = record.slice(equals + 1);
		offset += length;
	}
	return path;
}
function stripArchiveRoot(files, root, id) {
	const prefix = `${root}/`;
	const entries = Object.entries(files);
	if (entries.length === 0 || entries.some(([path]) => !path.startsWith(prefix))) throw new Error(`Dependency '${id}' archive must use canonical root '${root}/'.`);
	return Object.fromEntries(entries.map(([path, bytes]) => [path.slice(prefix.length), bytes]));
}
function stripSingleCommonRoot(files) {
	const paths = Object.keys(files);
	if (paths.length === 0) return files;
	const root = paths[0].split("/")[0];
	return paths.every((path) => path.startsWith(`${root}/`)) ? Object.fromEntries(Object.entries(files).map(([path, bytes]) => [path.slice(root.length + 1), bytes])) : files;
}
function requiredUtf8(files, path, id) {
	const bytes = files[path];
	if (!bytes) throw new Error(`Dependency '${id}' omits required '${path}'.`);
	return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}
function rejectExtensions(files, record, extensions) {
	const path = Object.keys(files).find((candidate) => extensions.some((extension) => candidate.toLowerCase().endsWith(extension)));
	if (path) unsupported(record, `prebuilt/native file '${path}'`);
}
function unsupported(record, feature) {
	throw new Error(`Dependency '${record.id}' requires unsupported ${feature}.`);
}
function isZip(payload) {
	return payload.byteLength >= 4 && payload[0] === 80 && payload[1] === 75 && (payload[2] === 3 || payload[2] === 5 || payload[2] === 7);
}
//#endregion
//#region src/sdk/project.ts
function optionalMetadata(value, label, maximum) {
	if (value === void 0) return void 0;
	if (typeof value !== "string" || !value || value !== value.trim() || value.length > maximum) throw new Error(`${label} must be a non-empty, trimmed string of at most ${maximum} characters.`);
	return value;
}
function fileLanguage(path, projectLanguage) {
	const inferred = extensionLanguage(path);
	if (!inferred || path.endsWith(".h") || path.endsWith(".hpp")) return projectLanguage;
	return inferred;
}
function createSdkProject(input) {
	if (!input || typeof input !== "object") throw new TypeError("Compile input must be an object.");
	assertLanguageIdentifier$1(input.language);
	assertSafeRelativePath(input.entry, "Entry file");
	const entry = input.entry;
	if (!input.files || typeof input.files !== "object" || Array.isArray(input.files)) throw new TypeError("Compile input files must be a record.");
	const entries = Object.entries(input.files);
	if (entries.length === 0) throw new Error("A project must contain at least one source file.");
	const files = entries.map(([path, content]) => {
		assertSafeRelativePath(path, "Source file path");
		return {
			path,
			content,
			language: fileLanguage(path, input.language)
		};
	});
	if (!Object.hasOwn(input.files, entry)) throw new Error(`Entry file '${entry}' is not present in files.`);
	const target = input.target ?? "wasip1";
	if (target !== "wasip1" && target !== "wasix") throw new Error(`Unsupported target '${String(target)}'.`);
	if (isBuiltinLanguage$1(input.language) && !TOOLCHAINS[input.language].targets.includes(target)) throw new Error(`${input.language} does not support the ${target.toUpperCase()} target.`);
	if (input.language === "java" && target !== "wasip1") throw new Error("Java does not support the WASIX target.");
	const optimization = input.optimization ?? "release";
	if (optimization !== "debug" && optimization !== "release") throw new Error(`Unsupported optimization level '${String(optimization)}'.`);
	if (input.stackSizeBytes !== void 0) assertBuildStackSize(input.language, input.stackSizeBytes);
	const inferredName = entry.split("/").at(-1)?.replace(/\.[^.]+$/, "") || "wasm-oj-project";
	const name = optionalMetadata(input.name, "Project name", 4096) ?? inferredName;
	const projectId = optionalMetadata(input.projectId, "Project ID", 16384) ?? `sdk:${name}`;
	if (input.dependencies !== void 0) assertValidDependencyBuildBundle(input.dependencies);
	return {
		id: projectId,
		name,
		files: canonicalProjectFiles(files),
		activeFile: entry,
		updatedAt: Date.now(),
		...input.dependencies === void 0 ? {} : { dependencies: structuredClone(input.dependencies) },
		config: {
			language: input.language,
			target,
			optimization,
			...input.stackSizeBytes === void 0 ? {} : { stackSizeBytes: input.stackSizeBytes },
			entry,
			args: [],
			stdin: "",
			env: {},
			determinism: { ...DEFAULT_DETERMINISM },
			resources: { ...DEFAULT_RESOURCE_POLICY }
		}
	};
}
//#endregion
//#region src/conformance/matrix.ts
async function runConformanceMatrix(hosts, cases, options = {}) {
	if (hosts.length === 0) throw new Error("A conformance matrix requires at least one host.");
	if (cases.length === 0) throw new Error("A conformance matrix requires at least one case.");
	const repetitions = options.repetitions ?? 3;
	if (!Number.isInteger(repetitions) || repetitions < 1 || repetitions > 100) throw new RangeError("Conformance repetitions must be an integer from 1 through 100.");
	const snapshots = [];
	for (const host of hosts) snapshots.push(await runConformanceHost(host, cases, {
		...options,
		repetitions
	}));
	return compareConformanceSnapshots(snapshots);
}
/** Run one host independently so browser and server snapshots can be produced in different processes. */
async function runConformanceHost(host, cases, options = {}) {
	if (cases.length === 0) throw new Error("A conformance snapshot requires at least one case.");
	const repetitions = options.repetitions ?? 3;
	if (!Number.isInteger(repetitions) || repetitions < 1 || repetitions > 100) throw new RangeError("Conformance repetitions must be an integer from 1 through 100.");
	const samples = [];
	for (const item of cases) {
		const sample = await sampleHost(host, item, repetitions, options.repeatCompile ?? true);
		samples.push(sample);
		await options.onSample?.(sample, samples.length, cases.length);
	}
	return {
		schema: WASM_OJ_SCHEMAS$1.conformance,
		host: host.id,
		repetitions,
		caseIds: cases.map((item) => item.id),
		samples
	};
}
/** Compare independently serialized snapshots and produce the efficiency matrix. */
function compareConformanceSnapshots(snapshots) {
	if (snapshots.length === 0) throw new Error("At least one conformance snapshot is required.");
	const baseline = snapshots[0];
	if (!baseline) throw new Error("The conformance baseline is missing.");
	const hostIds = /* @__PURE__ */ new Set();
	for (const snapshot of snapshots) {
		validateConformanceSnapshot(snapshot);
		if (hostIds.has(snapshot.host)) throw new Error(`Duplicate conformance host '${snapshot.host}'.`);
		hostIds.add(snapshot.host);
		if (snapshot.repetitions !== baseline.repetitions) throw new Error("Conformance snapshots use different repetition counts.");
		if (JSON.stringify(snapshot.caseIds) !== JSON.stringify(baseline.caseIds)) throw new Error(`Conformance host '${snapshot.host}' ran a different ordered case set.`);
	}
	const samples = snapshots.flatMap((snapshot) => snapshot.samples);
	const mismatches = compareSnapshotSamples(snapshots);
	return {
		compatible: mismatches.length === 0 && samples.every((sample) => sample.success),
		repetitions: baseline.repetitions,
		samples,
		mismatches,
		efficiency: samples.map((sample) => ({
			caseId: sample.caseId,
			host: sample.host,
			firstUncachedCompileMs: sample.firstUncachedCompileMs,
			repeatUncachedCompileMs: sample.repeatUncachedCompileMs,
			runMedianMs: sample.runMedianMs,
			artifactBytes: sample.artifactBytes,
			netWeightedCost: sample.transcript?.metrics.cost,
			rawWeightedCost: sample.transcript?.metrics.rawCost,
			baselineWeightedCost: sample.transcript?.metrics.baselineCost,
			logicalTimeNs: sample.transcript?.metrics.logicalTimeNs
		}))
	};
}
function validateConformanceSnapshot(snapshot) {
	if (!snapshot || typeof snapshot !== "object") throw new TypeError("Conformance snapshot must be an object.");
	if (snapshot.schema !== WASM_OJ_SCHEMAS$1.conformance) throw new Error(`Unsupported conformance schema '${String(snapshot.schema)}'.`);
	if (!isIdentifier(snapshot.host)) throw new Error("Conformance snapshot host must be a non-empty trimmed identifier.");
	if (!Number.isInteger(snapshot.repetitions) || snapshot.repetitions < 1 || snapshot.repetitions > 100) throw new RangeError("Conformance snapshot repetitions must be an integer from 1 through 100.");
	if (!Array.isArray(snapshot.caseIds) || snapshot.caseIds.length === 0) throw new Error(`Conformance host '${snapshot.host}' has no case IDs.`);
	const caseIds = /* @__PURE__ */ new Set();
	for (const caseId of snapshot.caseIds) {
		if (!isIdentifier(caseId)) throw new Error(`Conformance host '${snapshot.host}' has an invalid case ID.`);
		if (caseIds.has(caseId)) throw new Error(`Conformance host '${snapshot.host}' repeats case '${caseId}'.`);
		caseIds.add(caseId);
	}
	if (!Array.isArray(snapshot.samples) || snapshot.samples.length !== caseIds.size) throw new Error(`Conformance host '${snapshot.host}' must contain exactly one sample for each declared case.`);
	const sampledCases = /* @__PURE__ */ new Set();
	for (const sample of snapshot.samples) {
		if (!sample || typeof sample !== "object") throw new Error(`Conformance host '${snapshot.host}' has an invalid sample.`);
		if (sample.host !== snapshot.host) throw new Error(`Conformance sample host '${String(sample.host)}' does not match '${snapshot.host}'.`);
		if (!caseIds.has(sample.caseId)) throw new Error(`Conformance host '${snapshot.host}' has an undeclared sample '${String(sample.caseId)}'.`);
		if (!isIdentifier(sample.caseLabel)) throw new Error(`Conformance sample '${sample.caseId}' has an invalid case label.`);
		if (sampledCases.has(sample.caseId)) throw new Error(`Conformance host '${snapshot.host}' repeats sample '${sample.caseId}'.`);
		sampledCases.add(sample.caseId);
		if (typeof sample.success !== "boolean") throw new Error(`Conformance sample '${sample.caseId}' has no boolean success state.`);
		requireDuration(sample.firstUncachedCompileMs, `${sample.caseId}.firstUncachedCompileMs`);
		if (sample.repeatUncachedCompileMs !== void 0) requireDuration(sample.repeatUncachedCompileMs, `${sample.caseId}.repeatUncachedCompileMs`);
		if (!Array.isArray(sample.diagnostics)) throw new Error(`Conformance sample '${sample.caseId}' has invalid diagnostics.`);
		if (sample.success) {
			if (typeof sample.artifactDigest !== "string" || !/^[0-9a-f]{64}$/.test(sample.artifactDigest)) throw new Error(`Successful conformance sample '${sample.caseId}' has no canonical artifact digest.`);
			if (!Number.isSafeInteger(sample.artifactBytes) || (sample.artifactBytes ?? 0) < 1) throw new Error(`Successful conformance sample '${sample.caseId}' has invalid artifact bytes.`);
			requireDuration(sample.runMedianMs, `${sample.caseId}.runMedianMs`);
			if (!sample.transcript || typeof sample.transcript !== "object") throw new Error(`Successful conformance sample '${sample.caseId}' has no deterministic transcript.`);
		} else if (typeof sample.error !== "string" || !sample.error.trim()) throw new Error(`Failed conformance sample '${sample.caseId}' has no error.`);
	}
}
function isIdentifier(value) {
	return typeof value === "string" && value.length > 0 && value === value.trim() && value.length <= 256;
}
function requireDuration(value, field) {
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw new Error(`Conformance duration '${field}' must be a non-negative finite number.`);
}
async function sampleHost(host, item, repetitions, repeatCompile) {
	const started = performance.now();
	try {
		const build = await host.compile(item.input, { cache: false });
		const firstUncachedCompileMs = performance.now() - started;
		if (!build.success || !build.artifact) return {
			host: host.id,
			caseId: item.id,
			caseLabel: item.label,
			success: false,
			firstUncachedCompileMs,
			diagnostics: build.diagnostics,
			error: build.stderr || "Compilation failed without an artifact."
		};
		let repeatUncachedCompileMs;
		if (repeatCompile) {
			const repeatStarted = performance.now();
			const repeat = await host.compile(item.input, { cache: false });
			repeatUncachedCompileMs = performance.now() - repeatStarted;
			if (!repeat.success || !repeat.artifact) throw new Error("Repeated uncached compiler run failed.");
			const [firstDigest, repeatDigest] = await Promise.all([artifactDigest(build.artifact), artifactDigest(repeat.artifact)]);
			if (firstDigest !== repeatDigest) throw new Error("Repeated uncached builds produced different artifacts.");
		}
		const durations = [];
		let transcript;
		for (let index = 0; index < repetitions; index += 1) {
			const run = await host.run(build.artifact, item.run);
			assertExpectedRun(item, run);
			durations.push(run.durationMs);
			const next = deterministicTranscript(run);
			if (transcript && diffPaths$1(transcript, next).length > 0) throw new Error(`Host '${host.id}' produced a non-deterministic transcript for '${item.id}'.`);
			transcript = next;
		}
		return {
			host: host.id,
			caseId: item.id,
			caseLabel: item.label,
			success: true,
			artifactDigest: await artifactDigest(build.artifact),
			artifactBytes: build.artifact.size,
			firstUncachedCompileMs,
			repeatUncachedCompileMs,
			runMedianMs: median(durations),
			transcript,
			diagnostics: build.diagnostics
		};
	} catch (error) {
		return {
			host: host.id,
			caseId: item.id,
			caseLabel: item.label,
			success: false,
			firstUncachedCompileMs: performance.now() - started,
			diagnostics: [],
			error: error instanceof Error ? error.message : String(error)
		};
	}
}
function assertExpectedRun(item, run) {
	const expected = item.expect;
	const mismatches = [];
	if (run.code !== expected.code) mismatches.push(`code ${run.code} (expected ${expected.code})`);
	if (run.stdout !== expected.stdout) mismatches.push(`stdout ${JSON.stringify(run.stdout)} (expected ${JSON.stringify(expected.stdout)})`);
	if (expected.stderr !== void 0 && run.stderr !== expected.stderr) mismatches.push(`stderr ${JSON.stringify(run.stderr)} (expected ${JSON.stringify(expected.stderr)})`);
	if (run.termination !== expected.termination) mismatches.push(`termination ${run.termination} (expected ${expected.termination})`);
	if (expected.logicalTimeNs !== void 0 && run.metrics.logicalTimeNs !== expected.logicalTimeNs) mismatches.push(`logicalTimeNs ${String(run.metrics.logicalTimeNs)} (expected ${expected.logicalTimeNs})`);
	if (expected.trapMessageIncludes !== void 0 && !run.trapMessage?.includes(expected.trapMessageIncludes)) mismatches.push(`trapMessage ${JSON.stringify(run.trapMessage)} (expected to include ${JSON.stringify(expected.trapMessageIncludes)})`);
	if (expected.files !== void 0) {
		const expectedPaths = Object.keys(expected.files).sort();
		const actualPaths = Object.keys(run.files).sort();
		if (JSON.stringify(actualPaths) !== JSON.stringify(expectedPaths)) mismatches.push(`files ${JSON.stringify(actualPaths)} (expected ${JSON.stringify(expectedPaths)})`);
		else {
			const decoder = new TextDecoder("utf-8", { fatal: true });
			for (const path of expectedPaths) {
				const actual = decoder.decode(run.files[path]);
				if (actual !== expected.files[path]) mismatches.push(`file ${path} ${JSON.stringify(actual)} (expected ${JSON.stringify(expected.files[path])})`);
			}
		}
	}
	if (mismatches.length > 0) throw new Error(`Conformance case '${item.id}' returned an unexpected result: ${mismatches.join(", ")}.`);
}
function compareSnapshotSamples(snapshots) {
	const mismatches = [];
	const baselineSnapshot = snapshots[0];
	if (!baselineSnapshot) return mismatches;
	for (const caseId of baselineSnapshot.caseIds) {
		const baseline = baselineSnapshot.samples.find((sample) => sample.caseId === caseId);
		if (!baseline?.success || !baseline.transcript) continue;
		for (const snapshot of snapshots.slice(1)) {
			const sample = snapshot.samples.find((candidate) => candidate.caseId === caseId);
			if (!sample?.success || !sample.transcript) {
				mismatches.push({
					caseId,
					baselineHost: baseline.host,
					comparedHost: snapshot.host,
					fields: ["execution"]
				});
				continue;
			}
			const fields = diffPaths$1(baseline.transcript, sample.transcript);
			if (baseline.caseLabel !== sample.caseLabel) fields.unshift("caseLabel");
			if (baseline.artifactDigest !== sample.artifactDigest) fields.unshift("artifactDigest");
			if (fields.length > 0) mismatches.push({
				caseId,
				baselineHost: baseline.host,
				comparedHost: snapshot.host,
				fields
			});
		}
	}
	return mismatches;
}
function deterministicTranscript(run) {
	return {
		code: run.code,
		stdout: run.stdout,
		stderr: run.stderr,
		files: Object.fromEntries(Object.entries(run.files).sort(([left], [right]) => left.localeCompare(right)).map(([path, contents]) => [path, bytesToHex$1(contents)])),
		termination: run.termination,
		trapMessage: run.trapMessage,
		determinism: run.determinism,
		resources: run.resources,
		metrics: run.metrics
	};
}
function bytesToHex$1(bytes) {
	let result = "";
	for (const byte of bytes) result += byte.toString(16).padStart(2, "0");
	return result;
}
async function artifactDigest(artifact) {
	const metadata = {
		kind: artifact.kind,
		wasmOjContract: artifact.wasmOjContract,
		projectId: artifact.projectId,
		cacheKey: artifact.cacheKey,
		name: artifact.name,
		language: artifact.language,
		target: artifact.target,
		optimization: artifact.optimization,
		size: artifact.size,
		toolchains: artifact.toolchains,
		costProfile: artifact.costProfile
	};
	if (artifact.kind === "wasm") return sha256Hex$1(JSON.stringify({
		...metadata,
		bytesSha256: await sha256Hex$1(artifact.bytes)
	}));
	const files = [];
	for (const [path, contents] of canonicalFileEntries(artifact.files)) files.push([path, await sha256Hex$1(typeof contents === "string" ? contents : contents)]);
	return sha256Hex$1(JSON.stringify({
		...metadata,
		runtimePackage: artifact.runtimePackage,
		command: artifact.command,
		entry: artifact.entry,
		manifest: artifact.manifest,
		files
	}));
}
function median(values) {
	const sorted = [...values].sort((left, right) => left - right);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0 ? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2 : sorted[middle] ?? 0;
}
function diffPaths$1(left, right, path = "") {
	if (Object.is(left, right)) return [];
	if (typeof left !== "object" || left === null || typeof right !== "object" || right === null) return [path || "value"];
	const leftRecord = left;
	const rightRecord = right;
	return [.../* @__PURE__ */ new Set([...Object.keys(leftRecord), ...Object.keys(rightRecord)])].sort().flatMap((key) => diffPaths$1(leftRecord[key], rightRecord[key], path ? `${path}.${key}` : key));
}
//#endregion
//#region src/replay/bundle.ts
var MAGIC$2 = new TextEncoder().encode("WOJRPL02");
var HEADER_BYTES$1 = MAGIC$2.byteLength + 8 + 4;
var SHA256_BYTES = 32;
var MAX_BUNDLE_BYTES = 536870912;
var MAX_MANIFEST_BYTES$1 = 33554432;
var MAX_BLOBS$1 = 4096;
var encoder$1 = new TextEncoder();
var decoder$1 = new TextDecoder("utf-8", { fatal: true });
var SELF_CONTAINED_MATCHERS = /* @__PURE__ */ new Set([
	"text",
	"sha256",
	"files",
	"tokens",
	"float",
	"set",
	"wasm-checker"
]);
async function createReplayBundle(input) {
	assertValidProject(input.project);
	const project = structuredClone(input.project);
	project.files = canonicalProjectFiles(project.files);
	project.updatedAt = 0;
	const artifactSha256 = await artifactDigest(input.artifact);
	const artifact = structuredClone(input.artifact);
	artifact.id = `replay:${artifactSha256}`;
	artifact.createdAt = 0;
	artifact.durationMs = 0;
	assertValidBuildArtifact(artifact, {
		project,
		cacheKey: artifact.cacheKey
	});
	const projectSha256 = await portableSha256(project);
	const dependencies = input.dependencies === void 0 ? void 0 : structuredClone(input.dependencies);
	if (dependencies) await assertOfflineDependencies(dependencies);
	let operation;
	if (input.operation.kind === "run") {
		const config = canonicalRunConfig(input.operation.config);
		const expected = replayRunTranscript(input.operation.result);
		operation = {
			kind: "run",
			config,
			expected,
			expectedSha256: await portableSha256(expected)
		};
	} else {
		const spec = structuredClone(input.operation.spec);
		validateSelfContainedJudgeSpec(spec);
		const expected = judgeTranscript(input.operation.result);
		operation = {
			kind: "judge",
			spec,
			expected,
			expectedSha256: await portableSha256(expected)
		};
	}
	const bundle = {
		schema: WASM_OJ_SCHEMAS$1.replayBundle,
		wasmOjContract: WASM_OJ_CONTRACT_VERSION$1,
		projectSha256,
		artifactSha256,
		project,
		artifact,
		...dependencies ? { dependencies } : {},
		operation
	};
	await assertValidReplayBundle(bundle);
	return bundle;
}
async function assertValidReplayBundle(value) {
	if (!isRecord$3(value) || value.schema !== WASM_OJ_SCHEMAS$1.replayBundle || value.wasmOjContract !== WASM_OJ_CONTRACT_VERSION$1) throw new Error("ReplayBundle does not use the active WASM-OJ contract.");
	const bundleKeys = Object.keys(value).sort();
	const expectedBundleKeys = [
		"artifact",
		"artifactSha256",
		"wasmOjContract",
		"operation",
		"project",
		"projectSha256",
		"schema",
		...value.dependencies === void 0 ? [] : ["dependencies"]
	].sort();
	if (JSON.stringify(bundleKeys) !== JSON.stringify(expectedBundleKeys)) throw new Error("ReplayBundle contains unexpected fields.");
	assertValidProject(value.project);
	const project = value.project;
	if (project.updatedAt !== 0) throw new Error("ReplayBundle project.updatedAt must be normalized to zero.");
	if (JSON.stringify(project.files.map((file) => file.path)) !== JSON.stringify(canonicalProjectFiles(project.files).map((file) => file.path))) throw new Error("ReplayBundle project files must be canonically sorted.");
	requireSha256$1(value.projectSha256, "ReplayBundle project");
	if (value.projectSha256 !== await portableSha256(project)) throw new Error("ReplayBundle project digest mismatch.");
	assertValidBuildArtifact(value.artifact, {
		project,
		cacheKey: value.artifact.cacheKey
	});
	const artifact = value.artifact;
	requireSha256$1(value.artifactSha256, "ReplayBundle artifact");
	if (artifact.id !== `replay:${value.artifactSha256}` || artifact.createdAt !== 0 || artifact.durationMs !== 0 || value.artifactSha256 !== await artifactDigest(artifact)) throw new Error("ReplayBundle artifact metadata or digest is not canonical.");
	if (value.dependencies !== void 0) await assertOfflineDependencies(value.dependencies);
	if (!isRecord$3(value.operation) || value.operation.kind !== "run" && value.operation.kind !== "judge") throw new Error("ReplayBundle operation must be 'run' or 'judge'.");
	requireSha256$1(value.operation.expectedSha256, "ReplayBundle expected transcript");
	if (value.operation.kind === "run") {
		requireExactKeys(value.operation, [
			"config",
			"expected",
			"expectedSha256",
			"kind"
		], "run operation");
		const canonicalConfig = canonicalRunConfig(value.operation.config);
		if (JSON.stringify(await toPortableNode(value.operation.config, /* @__PURE__ */ new Map())) !== JSON.stringify(await toPortableNode(canonicalConfig, /* @__PURE__ */ new Map()))) throw new Error("ReplayBundle run config is not canonical.");
		validateDeterministicTranscript(value.operation.expected);
	} else {
		requireExactKeys(value.operation, [
			"expected",
			"expectedSha256",
			"kind",
			"spec"
		], "judge operation");
		validateSelfContainedJudgeSpec(value.operation.spec);
		validateJudgeTranscript(value.operation.expected);
	}
	if (value.operation.expectedSha256 !== await portableSha256(value.operation.expected)) throw new Error("ReplayBundle expected transcript digest mismatch.");
	await toPortableNode(value, /* @__PURE__ */ new Map());
}
async function encodeReplayBundle(bundle) {
	await assertValidReplayBundle(bundle);
	const blobs = /* @__PURE__ */ new Map();
	const manifest = encoder$1.encode(JSON.stringify(await toPortableNode(bundle, blobs)));
	if (manifest.byteLength > MAX_MANIFEST_BYTES$1) throw new Error("ReplayBundle manifest exceeds its byte limit.");
	const orderedBlobs = [...blobs].sort(([left], [right]) => left.localeCompare(right));
	if (orderedBlobs.length > MAX_BLOBS$1) throw new Error("ReplayBundle contains too many binary blobs.");
	const total = orderedBlobs.reduce((size, [, bytes]) => safeAdd(size, 40 + bytes.byteLength), HEADER_BYTES$1 + manifest.byteLength);
	if (total > MAX_BUNDLE_BYTES) throw new Error("ReplayBundle exceeds its encoded byte limit.");
	const output = new Uint8Array(total);
	output.set(MAGIC$2, 0);
	const view = new DataView(output.buffer);
	writeU64(view, MAGIC$2.byteLength, manifest.byteLength);
	view.setUint32(MAGIC$2.byteLength + 8, orderedBlobs.length, false);
	let offset = HEADER_BYTES$1;
	output.set(manifest, offset);
	offset += manifest.byteLength;
	for (const [digest, bytes] of orderedBlobs) {
		output.set(hexToBytes(digest), offset);
		offset += SHA256_BYTES;
		writeU64(view, offset, bytes.byteLength);
		offset += 8;
		output.set(bytes, offset);
		offset += bytes.byteLength;
	}
	return output;
}
async function decodeReplayBundle(encoded, options = {}) {
	const maxBundleBytes = positiveLimit(options.maxBundleBytes ?? MAX_BUNDLE_BYTES, "replay bundle byte limit");
	const maxManifestBytes = positiveLimit(options.maxManifestBytes ?? MAX_MANIFEST_BYTES$1, "replay manifest byte limit");
	const maxBlobs = positiveLimit(options.maxBlobs ?? MAX_BLOBS$1, "replay blob count limit");
	if (!(encoded instanceof Uint8Array) || encoded.byteLength < HEADER_BYTES$1 || encoded.byteLength > maxBundleBytes) throw new Error("ReplayBundle transport has an invalid byte length.");
	if (!equalBytes$1(encoded.subarray(0, MAGIC$2.byteLength), MAGIC$2)) throw new Error("ReplayBundle transport magic is invalid.");
	const view = new DataView(encoded.buffer, encoded.byteOffset, encoded.byteLength);
	const manifestLength = readU64(view, MAGIC$2.byteLength, "ReplayBundle manifest length");
	const blobCount = view.getUint32(MAGIC$2.byteLength + 8, false);
	if (manifestLength > maxManifestBytes || blobCount > maxBlobs) throw new Error("ReplayBundle transport exceeds its decode limits.");
	let offset = HEADER_BYTES$1;
	if (offset + manifestLength > encoded.byteLength) throw new Error("ReplayBundle manifest is truncated.");
	let node;
	let manifestText;
	try {
		manifestText = decoder$1.decode(encoded.subarray(offset, offset + manifestLength));
		node = JSON.parse(manifestText);
	} catch (error) {
		throw new Error("ReplayBundle manifest is not canonical UTF-8 JSON.", { cause: error });
	}
	if (manifestText !== JSON.stringify(node)) throw new Error("ReplayBundle manifest JSON is not canonical.");
	offset += manifestLength;
	const blobs = /* @__PURE__ */ new Map();
	let previousDigest = "";
	for (let index = 0; index < blobCount; index += 1) {
		if (offset + SHA256_BYTES + 8 > encoded.byteLength) throw new Error("ReplayBundle blob header is truncated.");
		const digest = bytesToHex(encoded.subarray(offset, offset + SHA256_BYTES));
		offset += SHA256_BYTES;
		if (digest <= previousDigest) throw new Error("ReplayBundle blobs must be sorted and unique.");
		previousDigest = digest;
		const length = readU64(view, offset, `ReplayBundle blob ${index} length`);
		offset += 8;
		if (offset + length > encoded.byteLength) throw new Error(`ReplayBundle blob '${digest}' is truncated.`);
		const bytes = encoded.slice(offset, offset + length);
		offset += length;
		if (await sha256Hex$1(bytes) !== digest) throw new Error(`ReplayBundle blob '${digest}' failed integrity verification.`);
		blobs.set(digest, bytes);
	}
	if (offset !== encoded.byteLength) throw new Error("ReplayBundle transport has trailing bytes.");
	const used = /* @__PURE__ */ new Set();
	const decoded = fromPortableNode(node, blobs, used);
	if (used.size !== blobs.size) throw new Error("ReplayBundle transport contains unreferenced blobs.");
	await assertValidReplayBundle(decoded);
	if (JSON.stringify(await toPortableNode(decoded, /* @__PURE__ */ new Map())) !== JSON.stringify(node)) throw new Error("ReplayBundle manifest is not canonical.");
	return decoded;
}
async function replayBundleSha256(bundle) {
	return sha256Hex$1(await encodeReplayBundle(bundle));
}
async function replayBundle(host, bundle, options = {}) {
	await assertValidReplayBundle(bundle);
	const mismatches = [];
	let artifact = bundle.artifact;
	let build;
	if (options.recompile ?? true) {
		build = await host.compileProject(structuredClone(bundle.project), { cache: false });
		if (!build.success || !build.artifact) return {
			compatible: false,
			mismatches: ["build"],
			build
		};
		artifact = build.artifact;
		if (await artifactDigest(artifact) !== bundle.artifactSha256) mismatches.push("artifactSha256");
	}
	if (bundle.operation.kind === "run") {
		const run = await host.run(artifact, structuredClone(bundle.operation.config));
		const actual = replayRunTranscript(run);
		mismatches.push(...diffPaths(bundle.operation.expected, actual, "run"));
		return {
			compatible: mismatches.length === 0,
			mismatches: sortedUnique$1(mismatches),
			build,
			run
		};
	}
	const judge = await host.judge(artifact, structuredClone(bundle.operation.spec));
	const actual = judgeTranscript(judge);
	mismatches.push(...diffPaths(bundle.operation.expected, actual, "judge"));
	return {
		compatible: mismatches.length === 0,
		mismatches: sortedUnique$1(mismatches),
		build,
		judge
	};
}
function judgeTranscript(result) {
	return {
		verdict: result.verdict,
		completed: result.completed,
		total: result.total,
		cases: result.cases.map((item) => ({
			id: item.id,
			verdict: item.verdict,
			...item.message === void 0 ? {} : { message: item.message },
			...item.run === void 0 ? {} : { run: replayRunTranscript(item.run) },
			...item.interaction === void 0 ? {} : { interaction: interactionTranscript(item.interaction) }
		})),
		metrics: structuredClone(result.metrics)
	};
}
function interactionTranscript(result) {
	return {
		contestant: structuredClone(result.contestant),
		interactor: structuredClone(result.interactor),
		contestantToInteractor: result.contestantToInteractor,
		interactorToContestant: result.interactorToContestant,
		determinism: structuredClone(result.determinism)
	};
}
function replayRunTranscript(result) {
	const transcript = deterministicTranscript(result);
	if (transcript.trapMessage === void 0) delete transcript.trapMessage;
	return transcript;
}
function canonicalRunConfig(value) {
	if (!isRecord$3(value) || !Array.isArray(value.args) || value.args.some((item) => typeof item !== "string") || typeof value.stdin !== "string" || !isRecord$3(value.env)) throw new Error("ReplayBundle run config is malformed.");
	const env = Object.fromEntries(Object.entries(value.env).sort(([left], [right]) => left.localeCompare(right)).map(([name, entry]) => {
		if (!name || name.includes("=") || name.includes("\0") || typeof entry !== "string" || entry.includes("\0")) throw new Error(`ReplayBundle run environment '${name}' is invalid.`);
		return [name, entry];
	}));
	const files = Object.fromEntries(Object.entries(value.files ?? {}).sort(([left], [right]) => left.localeCompare(right)).map(([path, bytes]) => {
		requireGuestPath(path, "run input file");
		if (!(bytes instanceof Uint8Array)) throw new Error(`ReplayBundle run input '${path}' must be bytes.`);
		return [path, bytes.slice()];
	}));
	const outputPaths = [...value.outputPaths ?? []].map((path) => requireGuestPath(path, "run output file")).sort();
	if (new Set(outputPaths).size !== outputPaths.length) throw new Error("ReplayBundle run output paths must be unique.");
	const cwd = value.cwd === void 0 ? void 0 : requireGuestPath(value.cwd, "run cwd", true);
	return {
		args: [...value.args],
		stdin: value.stdin,
		env,
		files,
		outputPaths,
		...cwd === void 0 ? {} : { cwd },
		determinism: resolveDeterminism(value.determinism),
		resources: resolveResourcePolicy(value.resources)
	};
}
function validateSelfContainedJudgeSpec(spec) {
	validateJudgeSpec(spec);
	for (const item of spec.cases) {
		requireInlineInput(item.input, `Judge case '${item.id}' stdin`);
		for (const [path, input] of Object.entries(item.files ?? {})) requireInlineFileInput(input, `Judge case '${item.id}' file '${path}'`);
		if (item.kind === "batch" && !SELF_CONTAINED_MATCHERS.has(item.matcher.id)) throw new Error(`Judge matcher '${item.matcher.id}' is not self-contained in a replay bundle.`);
	}
}
function requireInlineInput(input, label) {
	if (input.kind !== "inline") throw new Error(`${label} must be materialized inline for an offline replay bundle.`);
}
function requireInlineFileInput(input, label) {
	if (input.kind !== "inline" && input.kind !== "inline-bytes") throw new Error(`${label} must be materialized inline for an offline replay bundle.`);
}
async function assertOfflineDependencies(value) {
	if (!isRecord$3(value) || value.schema !== WASM_OJ_SCHEMAS$1.dependencyOfflineBundle || value.wasmOjContract !== WASM_OJ_CONTRACT_VERSION$1 || !isRecord$3(value.payloads)) throw new Error("ReplayBundle dependencies must be a WASM-OJ offline dependency bundle.");
	assertValidDependencyLock(value.lock);
	const lock = value.lock;
	const expected = new Set(lock.packages.map((item) => item.integritySha256));
	const actual = Object.keys(value.payloads).sort();
	if (actual.length !== expected.size || actual.some((digest) => !expected.has(digest))) throw new Error("ReplayBundle dependency payloads do not match their lock.");
	for (const [digest, payload] of Object.entries(value.payloads)) if (!(payload instanceof Uint8Array) || await sha256Hex$1(payload) !== digest) throw new Error(`ReplayBundle dependency '${digest}' failed integrity verification.`);
}
async function portableSha256(value) {
	return sha256Hex$1(JSON.stringify(await toPortableNode(value, /* @__PURE__ */ new Map())));
}
async function toPortableNode(value, blobs, seen = /* @__PURE__ */ new Set()) {
	if (value === null || typeof value === "string" || typeof value === "boolean") return value;
	if (typeof value === "number") {
		if (!Number.isFinite(value)) throw new Error("ReplayBundle cannot encode non-finite numbers.");
		return Object.is(value, -0) ? 0 : value;
	}
	if (value instanceof Uint8Array) {
		const bytes = value.slice();
		const digest = await sha256Hex$1(bytes);
		const existing = blobs.get(digest);
		if (existing && !equalBytes$1(existing, bytes)) throw new Error("ReplayBundle encountered a SHA-256 collision.");
		blobs.set(digest, bytes);
		return [
			"b",
			digest,
			bytes.byteLength
		];
	}
	if (typeof value !== "object" || value === void 0) throw new Error("ReplayBundle contains a non-portable value.");
	if (seen.has(value)) throw new Error("ReplayBundle cannot encode cyclic data.");
	seen.add(value);
	try {
		if (Array.isArray(value)) {
			if (Object.keys(value).length !== value.length) throw new Error("ReplayBundle arrays must be dense.");
			return ["a", await Promise.all(value.map((item) => toPortableNode(item, blobs, seen)))];
		}
		const prototype = Object.getPrototypeOf(value);
		if (prototype !== Object.prototype && prototype !== null) throw new Error("ReplayBundle objects must be plain data records.");
		const entries = [];
		for (const key of Object.keys(value).sort()) {
			const descriptor = Object.getOwnPropertyDescriptor(value, key);
			if (!descriptor?.enumerable || !("value" in descriptor) || descriptor.value === void 0) throw new Error(`ReplayBundle field '${key}' is not portable.`);
			entries.push([key, await toPortableNode(descriptor.value, blobs, seen)]);
		}
		return ["o", entries];
	} finally {
		seen.delete(value);
	}
}
function fromPortableNode(value, blobs, used) {
	if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0)) return value;
	if (!Array.isArray(value) || value.length !== 2 && value.length !== 3) throw new Error("ReplayBundle manifest contains an invalid node.");
	if (value[0] === "b" && value.length === 3 && typeof value[1] === "string" && Number.isSafeInteger(value[2])) {
		const bytes = blobs.get(value[1]);
		if (!bytes || bytes.byteLength !== value[2]) throw new Error(`ReplayBundle manifest refers to missing blob '${value[1]}'.`);
		used.add(value[1]);
		return bytes.slice();
	}
	if (value[0] === "a" && value.length === 2 && Array.isArray(value[1])) return value[1].map((item) => fromPortableNode(item, blobs, used));
	if (value[0] === "o" && value.length === 2 && Array.isArray(value[1])) {
		const result = {};
		let previous = "";
		for (const entry of value[1]) {
			if (!Array.isArray(entry) || entry.length !== 2 || typeof entry[0] !== "string" || entry[0] <= previous) throw new Error("ReplayBundle object keys must be sorted and unique.");
			if (entry[0] === "__proto__") throw new Error("ReplayBundle object contains a forbidden key.");
			previous = entry[0];
			result[entry[0]] = fromPortableNode(entry[1], blobs, used);
		}
		return result;
	}
	throw new Error("ReplayBundle manifest contains an unknown node tag.");
}
function validateDeterministicTranscript(value) {
	if (!isRecord$3(value) || !Number.isInteger(value.code) || typeof value.stdout !== "string" || typeof value.stderr !== "string" || !isRecord$3(value.files) || typeof value.termination !== "string" || !isRecord$3(value.determinism) || !isRecord$3(value.resources) || !isRecord$3(value.metrics)) throw new Error("ReplayBundle run transcript is malformed.");
	resolveDeterminism(value.determinism);
	resolveResourcePolicy(value.resources);
	for (const [path, hex] of Object.entries(value.files)) {
		requireGuestPath(path, "run transcript file");
		if (typeof hex !== "string" || !/^(?:[0-9a-f]{2})*$/.test(hex)) throw new Error(`Run transcript file '${path}' is not hexadecimal.`);
	}
}
function validateJudgeTranscript(value) {
	if (!isRecord$3(value) || typeof value.verdict !== "string" || !Number.isSafeInteger(value.completed) || !Number.isSafeInteger(value.total) || !Array.isArray(value.cases) || !isRecord$3(value.metrics)) throw new Error("ReplayBundle judge transcript is malformed.");
	for (const item of value.cases) {
		if (!isRecord$3(item) || typeof item.id !== "string" || typeof item.verdict !== "string") throw new Error("ReplayBundle judge case transcript is malformed.");
		if (item.run !== void 0) validateDeterministicTranscript(item.run);
	}
}
function diffPaths(expected, actual, path) {
	if (Object.is(expected, actual)) return [];
	if (expected instanceof Uint8Array && actual instanceof Uint8Array) return equalBytes$1(expected, actual) ? [] : [path];
	if (Array.isArray(expected) && Array.isArray(actual)) {
		const result = [];
		const maximum = Math.max(expected.length, actual.length);
		for (let index = 0; index < maximum && result.length < 128; index += 1) result.push(...diffPaths(expected[index], actual[index], `${path}[${index}]`));
		return result.slice(0, 128);
	}
	if (isRecord$3(expected) && isRecord$3(actual)) {
		const keys = sortedUnique$1([...Object.keys(expected), ...Object.keys(actual)]);
		const result = [];
		for (const key of keys) {
			result.push(...diffPaths(expected[key], actual[key], `${path}.${key}`));
			if (result.length >= 128) break;
		}
		return result.slice(0, 128);
	}
	return [path];
}
function requireGuestPath(value, label, allowRoot = false) {
	if (typeof value !== "string" || !value.startsWith("/") || value.includes("\\") || value.includes("\0") || value.includes("//") || value.split("/").some((part) => part === "." || part === "..") || !allowRoot && value === "/" || value !== "/" && value.endsWith("/")) throw new Error(`ReplayBundle ${label} must be an absolute normalized guest path.`);
	return value;
}
function readU64(view, offset, label) {
	const value = view.getBigUint64(offset, false);
	if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error(`${label} exceeds the safe integer range.`);
	return Number(value);
}
function writeU64(view, offset, value) {
	if (!Number.isSafeInteger(value) || value < 0) throw new Error("ReplayBundle length is invalid.");
	view.setBigUint64(offset, BigInt(value), false);
}
function bytesToHex(bytes) {
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
function hexToBytes(value) {
	requireSha256$1(value, "ReplayBundle blob");
	return Uint8Array.from({ length: SHA256_BYTES }, (_, index) => Number.parseInt(value.slice(index * 2, index * 2 + 2), 16));
}
function equalBytes$1(left, right) {
	if (left.byteLength !== right.byteLength) return false;
	let difference = 0;
	for (let index = 0; index < left.byteLength; index += 1) difference |= left[index] ^ right[index];
	return difference === 0;
}
function safeAdd(left, right) {
	const result = left + right;
	if (!Number.isSafeInteger(result)) throw new Error("ReplayBundle byte length exceeds the safe integer range.");
	return result;
}
function positiveLimit(value, label) {
	if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${label} must be a positive safe integer.`);
	return value;
}
function requireSha256$1(value, label) {
	if (typeof value !== "string" || !/^[0-9a-f]{64}$/.test(value)) throw new Error(`${label} SHA-256 is invalid.`);
}
function sortedUnique$1(values) {
	return [...new Set(values)].sort();
}
function requireExactKeys(value, expected, label) {
	if (JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...expected].sort())) throw new Error(`ReplayBundle ${label} contains unexpected fields.`);
}
function isRecord$3(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
//#endregion
//#region src/operations/operation.ts
var OperationScheduler = class {
	host;
	observe;
	queue = [];
	identities = /* @__PURE__ */ new Set();
	active;
	disposed = false;
	constructor(host, observe) {
		this.host = host;
		this.observe = observe;
		if (!host || typeof host.executeSubmission !== "function" || typeof host.cancelActiveSubmission !== "function") throw new TypeError("OperationScheduler requires a submission execution host.");
	}
	submit(request) {
		if (this.disposed) throw new WasmOjError$1("WASM-OJ operation scheduler is disposed.", {
			code: "disposed",
			stage: "operation"
		});
		if (!request || typeof request !== "object") throw new WasmOjError$1("WASM-OJ submission request must be an object.", {
			code: "invalid-input",
			stage: "operation"
		});
		const id = submissionId(request.id);
		if (this.identities.has(id)) throw new WasmOjError$1(`WASM-OJ submission operation '${id}' already exists.`, {
			code: "operation-conflict",
			stage: "operation",
			operationId: id
		});
		this.identities.add(id);
		const entry = new SubmissionEntry(id, request, (payload) => this.emit(entry, payload), () => this.cancelEntry(entry));
		this.queue.push(entry);
		entry.emit({
			type: "state",
			state: "queued"
		});
		queueMicrotask(() => void this.drain());
		return entry.operation;
	}
	dispose() {
		if (this.disposed) return;
		this.disposed = true;
		if (this.active) {
			this.active.disposal = true;
			this.active.cancel("WASM-OJ operation scheduler was disposed.");
			this.host.cancelActiveSubmission();
		}
		for (const entry of this.queue.splice(0)) {
			entry.disposal = true;
			entry.cancel("WASM-OJ operation scheduler was disposed.");
			this.settleCancellation(entry);
		}
	}
	hasPending() {
		return this.active !== void 0 || this.queue.some((entry) => !entry.settled);
	}
	cancelActive(reason = "WASM-OJ submission operation was cancelled.") {
		if (!this.active) return false;
		this.active.cancel(reason);
		return true;
	}
	cancelEntry(entry) {
		if (entry.settled) return;
		if (this.active === entry) this.host.cancelActiveSubmission();
		else {
			const index = this.queue.indexOf(entry);
			if (index >= 0) this.queue.splice(index, 1);
			this.settleCancellation(entry);
		}
	}
	async drain() {
		if (this.disposed || this.active) return;
		const entry = this.queue.shift();
		if (!entry) return;
		if (entry.signal.aborted) {
			this.settleCancellation(entry);
			queueMicrotask(() => void this.drain());
			return;
		}
		this.active = entry;
		entry.setState("running");
		try {
			const result = await this.host.executeSubmission({
				...entry.request,
				id: entry.id,
				signal: entry.signal
			}, entry.emit);
			if (entry.signal.aborted) this.settleCancellation(entry);
			else {
				entry.setState("succeeded");
				entry.resolve(result);
			}
		} catch (error) {
			if (entry.signal.aborted) this.settleCancellation(entry, error);
			else {
				const failure = asWasmOjError$1(error, {
					code: "internal-failure",
					stage: "operation",
					retryable: false,
					operationId: entry.id
				});
				entry.emit({
					type: "error",
					error: failure.toJSON()
				});
				entry.setState("failed");
				entry.reject(failure);
			}
		} finally {
			entry.cleanup();
			if (this.active === entry) this.active = void 0;
			queueMicrotask(() => void this.drain());
		}
	}
	settleCancellation(entry, cause) {
		if (entry.settled) return;
		const failure = new WasmOjError$1(entry.cancelReason ?? "WASM-OJ submission operation was cancelled.", {
			code: entry.disposal ? "disposed" : "operation-cancelled",
			stage: "operation",
			operationId: entry.id,
			cause
		});
		entry.emit({
			type: "error",
			error: failure.toJSON()
		});
		entry.setState("cancelled");
		entry.reject(failure);
		entry.cleanup();
	}
	emit(entry, payload) {
		const event = Object.freeze({
			...payload,
			operationId: entry.id,
			sequence: entry.nextSequence()
		});
		entry.notify(event);
		this.observe?.(event);
	}
};
var SubmissionEntry = class {
	id;
	request;
	controller = new AbortController();
	signal = this.controller.signal;
	operation;
	result;
	emit;
	listeners = /* @__PURE__ */ new Set();
	lastStateEvent;
	externalSignal;
	onExternalAbort;
	sequence = 0;
	currentState = "queued";
	resolveResult;
	rejectResult;
	settled = false;
	disposal = false;
	cancelReason;
	constructor(id, request, emit, cancelEntry) {
		this.id = id;
		this.request = request;
		this.emit = emit;
		this.result = new Promise((resolve, reject) => {
			this.resolveResult = resolve;
			this.rejectResult = reject;
		});
		this.result.catch(() => void 0);
		this.externalSignal = request.signal;
		this.onExternalAbort = () => {
			this.cancel(abortReason(this.externalSignal?.reason));
			cancelEntry();
		};
		if (this.externalSignal?.aborted) this.controller.abort(this.externalSignal.reason);
		else this.externalSignal?.addEventListener("abort", this.onExternalAbort, { once: true });
		this.operation = Object.freeze({
			id,
			kind: "submission",
			signal: this.signal,
			result: this.result,
			state: () => this.currentState,
			cancel: (reason) => {
				this.cancel(reason);
				cancelEntry();
			},
			onEvent: (listener) => {
				if (typeof listener !== "function") throw new TypeError("WASM-OJ operation event listener must be a function.");
				this.listeners.add(listener);
				if (this.lastStateEvent) this.notifyListener(listener, this.lastStateEvent);
				return () => this.listeners.delete(listener);
			}
		});
	}
	cancel(reason) {
		if (this.settled || this.signal.aborted) return;
		this.cancelReason = validCancelReason(reason);
		this.controller.abort(this.cancelReason);
	}
	setState(state) {
		if (this.settled) return;
		this.currentState = state;
		this.emit({
			type: "state",
			state
		});
		if (state === "succeeded" || state === "failed" || state === "cancelled") this.settled = true;
	}
	resolve(result) {
		if (!this.settled) this.settled = true;
		this.resolveResult(result);
	}
	reject(error) {
		if (!this.settled) this.settled = true;
		this.rejectResult(error);
	}
	nextSequence() {
		return this.sequence++;
	}
	notify(event) {
		if (event.type === "state") this.lastStateEvent = event;
		for (const listener of this.listeners) this.notifyListener(listener, event);
	}
	notifyListener(listener, event) {
		try {
			listener(event);
		} catch {
			this.listeners.delete(listener);
		}
	}
	cleanup() {
		this.externalSignal?.removeEventListener("abort", this.onExternalAbort);
	}
};
function submissionId(requested) {
	if (requested === void 0) return crypto.randomUUID();
	if (typeof requested !== "string" || !requested || requested !== requested.trim() || requested.length > 128) throw new WasmOjError$1("WASM-OJ submission ID must be non-empty, trimmed, and at most 128 characters.", {
		code: "invalid-input",
		stage: "operation"
	});
	return requested;
}
function validCancelReason(reason) {
	if (reason === void 0) return "WASM-OJ submission operation was cancelled.";
	if (typeof reason !== "string" || !reason || reason !== reason.trim() || reason.length > 512) throw new TypeError("WASM-OJ cancellation reason must be non-empty, trimmed, and at most 512 characters.");
	return reason;
}
function abortReason(reason) {
	return typeof reason === "string" && reason && reason === reason.trim() && reason.length <= 512 ? reason : "WASM-OJ submission operation was aborted.";
}
//#endregion
//#region src/sdk/engine.ts
/** High-level compile/run API shared by browser and server hosts. */
var Engine = class {
	compiler;
	runner;
	artifactStore;
	dependencyManager;
	compilation;
	operationScheduler;
	observationListeners = /* @__PURE__ */ new Set();
	disposed = false;
	cacheClearActive = false;
	cacheClearOperation;
	/** Extensible judge registry for custom input providers and output matchers. */
	judging;
	constructor(options) {
		this.compiler = options.compiler;
		this.runner = options.runner;
		this.artifactStore = options.artifactStore;
		this.dependencyManager = options.dependencyManager;
		this.compilation = new CompileCoordinator(options.compiler, options.artifactStore);
		this.judging = new JudgeEngine(createJudgeExecutor({
			run: (artifact, run) => this.runner.run(artifact, {
				...run,
				args: [...run.args],
				env: { ...run.env },
				files: Object.fromEntries(Object.entries(run.files).map(([path, contents]) => [path, contents.slice()])),
				outputPaths: [...run.outputPaths]
			}),
			interact: (contestant, interactor, interaction) => this.runner.interact(contestant, interactor, interaction),
			...this.runner.runTrusted === void 0 ? {} : { runTrusted: (program, run) => this.runner.runTrusted(program, {
				...run,
				args: [...run.args],
				env: { ...run.env },
				files: Object.fromEntries(Object.entries(run.files).map(([path, contents]) => [path, contents.slice()])),
				outputPaths: [...run.outputPaths]
			}) },
			...this.runner.interactTrusted === void 0 ? {} : { interactTrusted: (contestant, interactor, interaction) => this.runner.interactTrusted(contestant, interactor, interaction) }
		}), options.judge);
		this.operationScheduler = new OperationScheduler({
			executeSubmission: (request, observe) => this.executeSubmission(request, observe),
			cancelActiveSubmission: () => this.cancelExecution()
		}, (event) => this.notifyObservation(event));
	}
	async ready() {
		this.assertAvailable();
		await stableBoundary(() => Promise.all([this.compiler.ready(), this.runner.ready()]).then(() => void 0), {
			code: "initialization-failure",
			stage: "initialize",
			retryable: false
		});
	}
	onProgress(listener) {
		this.assertActive();
		const removeCompilerListener = this.compiler.onProgress(listener);
		let removeRunnerListener;
		try {
			removeRunnerListener = this.runner.onProgress(listener);
		} catch (error) {
			removeCompilerListener();
			throw error;
		}
		return () => {
			removeCompilerListener();
			removeRunnerListener();
		};
	}
	onStream(listener) {
		this.assertActive();
		return this.runner.onStream(listener);
	}
	/** Subscribe to operation-scoped, structured host observations. */
	onObservation(listener) {
		this.assertActive();
		if (typeof listener !== "function") throw new TypeError("WASM-OJ observation listener must be a function.");
		this.observationListeners.add(listener);
		return () => this.observationListeners.delete(listener);
	}
	/** Enqueue one independently observable and cancellable compile-and-judge submission. */
	submit(request) {
		this.assertActive();
		if (this.cacheClearActive) throw new WasmOjError$1("Engine is clearing its caches.", {
			code: "operation-conflict",
			stage: "operation",
			retryable: true
		});
		stableInput(() => {
			createSdkProject(request?.input);
			validateJudgeSpec(request?.spec);
			compileCacheRequested(request?.compile ?? {});
		}, "operation");
		return this.operationScheduler.submit(request);
	}
	/** Resolve and cache one canonical dependency graph using this host's adapters. */
	async resolveDependencies(manifest, options) {
		this.assertActive();
		const dependencyManager = this.dependencyManager;
		if (!dependencyManager) throw new WasmOjError$1("Engine has no dependency manager.", {
			code: "unsupported",
			stage: "dependency"
		});
		return stableBoundary(() => dependencyManager.resolve(manifest, options), {
			code: "dependency-failure",
			stage: "dependency",
			retryable: true
		});
	}
	/** Materialize a lock into the archive-independent compiler input contract. */
	async prepareDependencies(lock, adapters) {
		this.assertActive();
		const dependencyManager = this.dependencyManager;
		if (!dependencyManager) throw new WasmOjError$1("Engine has no dependency manager.", {
			code: "unsupported",
			stage: "dependency"
		});
		return stableBoundary(() => dependencyManager.prepareBuild(lock, adapters), {
			code: "dependency-failure",
			stage: "dependency",
			retryable: false
		});
	}
	async compile(input, options = {}) {
		this.assertAvailable();
		const { project, cache } = stableInput(() => ({
			project: createSdkProject(input),
			cache: compileCacheRequested(options)
		}), "compile");
		return stableBoundary(() => this.compilation.compile(project, { cache: this.artifactStore !== void 0 && cache }), {
			code: "compiler-failure",
			stage: "compile",
			retryable: true
		});
	}
	/** Compile an already-normalized Project without reconstructing its library identity. */
	async compileProject(project, options = {}) {
		this.assertAvailable();
		const { normalized, cache } = stableInput(() => {
			assertValidProject(project);
			return {
				normalized: structuredClone(project),
				cache: compileCacheRequested(options)
			};
		}, "compile");
		return stableBoundary(() => this.compilation.compile(normalized, { cache: this.artifactStore !== void 0 && cache }), {
			code: "compiler-failure",
			stage: "compile",
			retryable: true
		});
	}
	async replay(bundle, options) {
		this.assertAvailable();
		stableInput(() => assertValidReplayBundle(bundle), "replay");
		return stableBoundary(() => replayBundle(this, bundle, options), {
			code: "replay-failure",
			stage: "replay",
			retryable: false
		});
	}
	/** Compile during idle time; a matching foreground compile joins this exact request. */
	async precompile(input) {
		this.assertAvailable();
		const project = stableInput(() => createSdkProject(input), "compile");
		return stableBoundary(() => this.compilation.precompile(project), {
			code: "compiler-failure",
			stage: "compile",
			retryable: true
		});
	}
	/** Supersede only speculative work; a foreground build is never cancelled here. */
	supersedePrecompile() {
		if (this.disposed || this.cacheClearActive) return;
		this.compilation.supersedeBackground();
	}
	async run(artifact, options = {}) {
		this.assertAvailable();
		const request = stableInput(() => {
			assertValidBuildArtifact(artifact);
			return {
				args: runStringArray(options.args, "Run arguments"),
				stdin: optionalString(options.stdin, "Run stdin") ?? "",
				env: runEnvironment(options.env),
				files: Object.fromEntries(runFileEntries(options.files).map(([path, contents]) => [path, typeof contents === "string" ? new TextEncoder().encode(contents) : contents.slice()])),
				outputPaths: runStringArray(options.outputPaths, "Run output paths"),
				...options.cwd === void 0 ? {} : { cwd: optionalString(options.cwd, "Run cwd") },
				determinism: resolveDeterminism(options.determinism),
				resources: resolveResourcePolicy(options.resources)
			};
		}, "run");
		return stableBoundary(() => this.runner.run(artifact, request), {
			code: "runner-failure",
			stage: "run",
			retryable: true
		});
	}
	async interact(contestant, interactor, options = {}) {
		this.assertAvailable();
		const request = stableInput(() => {
			assertValidBuildArtifact(contestant);
			assertValidBuildArtifact(interactor);
			return {
				contestant: interactiveProgramConfig(options.contestant),
				interactor: interactiveProgramConfig(options.interactor),
				determinism: resolveDeterminism(options.determinism)
			};
		}, "run");
		return stableBoundary(() => this.runner.interact(contestant, interactor, request), {
			code: "runner-failure",
			stage: "run",
			retryable: true
		});
	}
	async judge(artifact, spec, options) {
		this.assertAvailable();
		stableInput(() => {
			assertValidBuildArtifact(artifact);
			validateJudgeSpec(spec);
		}, "judge");
		return stableBoundary(() => this.judging.judge(artifact, spec, options), {
			code: "judge-failure",
			stage: "judge",
			retryable: false
		});
	}
	async judgeProject(input, spec, compile = {}, judge) {
		this.assertAvailable();
		const build = await this.compile(input, compile);
		if (!build.success || !build.artifact) return { build };
		return {
			build,
			judge: await this.judge(build.artifact, spec, judge)
		};
	}
	async execute(input, run = {}, compile = {}) {
		this.assertAvailable();
		const build = await this.compile(input, compile);
		if (!build.success || !build.artifact) return { build };
		return {
			build,
			run: await this.run(build.artifact, run)
		};
	}
	cancel() {
		if (this.disposed || this.cacheClearActive) return;
		if (!this.operationScheduler.cancelActive()) this.cancelExecution();
	}
	restart() {
		this.assertAvailable();
		this.compilation.restart();
		this.runner.restart();
	}
	clearCache() {
		this.assertActive();
		if (this.cacheClearOperation) return this.cacheClearOperation;
		if (this.operationScheduler.hasPending()) throw new WasmOjError$1("Engine cannot clear caches while submission operations are pending.", {
			code: "operation-conflict",
			stage: "storage",
			retryable: true
		});
		this.cacheClearActive = true;
		const operation = stableBoundary(() => this.clearCacheOperationInternal(), {
			code: "storage-failure",
			stage: "storage",
			retryable: true
		});
		this.cacheClearOperation = operation;
		operation.finally(() => {
			if (this.cacheClearOperation === operation) {
				this.cacheClearOperation = void 0;
				this.cacheClearActive = false;
			}
		}).catch(() => void 0);
		return operation;
	}
	async clearCacheOperationInternal() {
		await Promise.all([this.compilation.cancelAndWait(), this.runner.cancelAndWait()]);
		this.assertActive();
		await Promise.all([
			this.compiler.clearToolchainCache(),
			this.runner.clearRuntimeCache(),
			this.artifactStore?.clear(),
			this.dependencyManager?.clearCache()
		]);
	}
	dispose() {
		if (this.disposed) return;
		this.operationScheduler.dispose();
		this.disposed = true;
		this.compilation.dispose();
		this.runner.dispose();
		this.observationListeners.clear();
	}
	assertActive() {
		if (this.disposed) throw new WasmOjError$1("Engine is disposed.", {
			code: "disposed",
			stage: "operation"
		});
	}
	assertAvailable() {
		this.assertActive();
		if (this.cacheClearActive) throw new WasmOjError$1("Engine is clearing its caches.", {
			code: "operation-conflict",
			stage: "operation",
			retryable: true
		});
		if (this.operationScheduler.hasPending()) throw new WasmOjError$1("Direct Engine operations are unavailable while submission operations are pending.", {
			code: "operation-conflict",
			stage: "operation",
			retryable: true
		});
	}
	cancelExecution() {
		this.compilation.cancel();
		this.runner.cancel();
	}
	async executeSubmission(request, observe) {
		this.assertActive();
		const removeCompilerProgress = this.compiler.onProgress((progress) => observe({
			type: "progress",
			progress
		}));
		const removeRunnerProgress = this.runner.onProgress((progress) => observe({
			type: "progress",
			progress
		}));
		const removeStream = this.runner.onStream((stream, chunk) => observe({
			type: "stream",
			stream,
			chunk
		}));
		try {
			if (request.signal?.aborted) throw request.signal.reason;
			let build;
			try {
				const project = createSdkProject(request.input);
				build = await this.compilation.compile(project, { cache: this.artifactStore !== void 0 && compileCacheRequested(request.compile ?? {}) });
			} catch (error) {
				throw asWasmOjError$1(error, {
					code: "compiler-failure",
					stage: "compile",
					retryable: true,
					operationId: request.id
				});
			}
			observe({
				type: "build",
				success: build.success,
				cacheHit: build.cacheHit,
				diagnosticCount: build.diagnostics.length,
				...build.artifact === void 0 ? {} : { artifact: {
					id: build.artifact.id,
					kind: build.artifact.kind,
					size: build.artifact.size
				} }
			});
			if (!build.success || !build.artifact) return { build };
			try {
				const judge = await this.judging.judge(build.artifact, request.spec, {
					...request.judge,
					onCase: (result, completed, total) => {
						observe({
							type: "case",
							caseId: result.id,
							verdict: result.verdict,
							...result.message === void 0 ? {} : { message: result.message },
							completed,
							total
						});
					}
				});
				return {
					build,
					judge
				};
			} catch (error) {
				throw asWasmOjError$1(error, {
					code: "judge-failure",
					stage: "judge",
					retryable: false,
					operationId: request.id
				});
			}
		} finally {
			removeCompilerProgress();
			removeRunnerProgress();
			removeStream();
		}
	}
	notifyObservation(event) {
		for (const listener of this.observationListeners) try {
			listener(event);
		} catch {
			this.observationListeners.delete(listener);
		}
	}
};
function interactiveProgramConfig(options = {}) {
	return {
		args: runStringArray(options.args, "Interactive arguments"),
		env: runEnvironment(options.env),
		files: Object.fromEntries(runFileEntries(options.files).map(([path, contents]) => [path, typeof contents === "string" ? new TextEncoder().encode(contents) : contents.slice()])),
		...options.cwd === void 0 ? {} : { cwd: optionalString(options.cwd, "Interactive cwd") },
		resources: resolveResourcePolicy(options.resources)
	};
}
function compileCacheRequested(options) {
	dataRecord(options, "Compile options");
	if (options.cache !== void 0 && typeof options.cache !== "boolean") throw new TypeError("Compile cache option must be a boolean.");
	return options.cache ?? true;
}
function runStringArray(value, label) {
	if (value === void 0) return [];
	if (!Array.isArray(value)) throw new TypeError(`${label} must be an array.`);
	return value.map((item, index) => {
		if (typeof item !== "string" || item.includes("\0")) throw new TypeError(`${label} entry ${index} must be a NUL-free string.`);
		return item;
	});
}
function optionalString(value, label) {
	if (value === void 0) return void 0;
	if (typeof value !== "string") throw new TypeError(`${label} must be a string.`);
	return value;
}
function runEnvironment(value) {
	if (value === void 0) return {};
	const environment = dataRecord(value, "Run environment");
	const result = {};
	for (const [name, entry] of Object.entries(environment)) {
		if (!name || name.includes("=") || name.includes("\0")) throw new TypeError(`Run environment variable name '${name}' is invalid.`);
		if (typeof entry !== "string" || entry.includes("\0")) throw new TypeError(`Run environment variable '${name}' must be a NUL-free string.`);
		result[name] = entry;
	}
	return result;
}
function runFileEntries(value) {
	if (value === void 0) return [];
	const files = dataRecord(value, "Run files");
	return Object.entries(files).map(([path, contents]) => {
		if (typeof contents !== "string" && !(contents instanceof Uint8Array)) throw new TypeError(`Run file '${path}' must be a string or Uint8Array.`);
		return [path, contents];
	});
}
function dataRecord(value, label) {
	if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be a plain object.`);
	const prototype = Object.getPrototypeOf(value);
	if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain object.`);
	for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
		if (!descriptor.enumerable) continue;
		if (!("value" in descriptor)) throw new TypeError(`${label} property '${key}' must be plain data.`);
	}
	return value;
}
async function stableBoundary(operation, options) {
	try {
		return await operation();
	} catch (error) {
		throw asWasmOjError$1(error, options);
	}
}
function stableInput(operation, stage) {
	try {
		return operation();
	} catch (error) {
		throw asWasmOjError$1(error, {
			code: "invalid-input",
			stage,
			retryable: false
		});
	}
}
async function createEngine(options) {
	const engine = new Engine(options);
	try {
		await engine.ready();
		return engine;
	} catch (error) {
		engine.dispose();
		throw error;
	}
}
//#endregion
//#region src/compiler/libcxx-pch.ts
var WASM_OJ_LIBCXX_PCH_HEADER = `#pragma once
#include <algorithm>
#include <array>
#include <bitset>
#include <cassert>
#include <cctype>
#include <cerrno>
#include <cfloat>
#include <charconv>
#include <chrono>
#include <climits>
#include <cmath>
#include <compare>
#include <concepts>
#include <cstddef>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <deque>
#include <exception>
#include <functional>
#include <iomanip>
#include <ios>
#include <iostream>
#include <iterator>
#include <limits>
#include <map>
#include <memory>
#include <numeric>
#include <optional>
#include <queue>
#include <random>
#include <ranges>
#include <set>
#include <span>
#include <sstream>
#include <stack>
#include <string>
#include <string_view>
#include <tuple>
#include <type_traits>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <variant>
#include <vector>
`;
var decoder = new TextDecoder();
async function decodeLibcxxPchManifest(bytes) {
	const digest = await sha256Hex$1(bytes);
	if (digest !== "9bbe41d77c786f1c36169369c909268530b05726e1581683f6edd9a2983eebd0") throw new Error(`Pinned libc++ PCH manifest digest mismatch: expected ${CLANG_LIBCXX_PCH_MANIFEST_SHA256}, received ${digest}.`);
	let value;
	try {
		value = JSON.parse(decoder.decode(bytes));
	} catch (error) {
		throw new Error("Pinned libc++ PCH manifest is not valid JSON.", { cause: error });
	}
	if (!isRecord$2(value) || value.schema !== WASM_OJ_SCHEMAS$1.clangLibcxxPch || value.version !== "22.0.0-git20542-10" || value.clangPackageSha256 !== "21ded33b9c6d4e1aaad5528c940bdaf6c3e84be77ea8f522f018ca7289a2a224" || value.clangPinsSha256 !== "895eee17c63b1112c84adcc4ddbcb38e0c18e53bff15f50a8689b9b82d87b1ff" || value.header !== WASM_OJ_LIBCXX_PCH_HEADER || !isRecord$2(value.profiles)) throw new Error("Pinned libc++ PCH manifest is not admitted by the active Clang toolchain contract.");
	if (value.headerSha256 !== await sha256Hex$1(WASM_OJ_LIBCXX_PCH_HEADER)) throw new Error("Pinned libc++ PCH header digest does not match its canonical source.");
	const manifestProfiles = value.profiles;
	const profiles = Object.fromEntries(await Promise.all(["cpp-debug", "cpp-release"].map(async (profile) => {
		const asset = manifestProfiles[profile];
		if (!isRecord$2(asset) || typeof asset.path !== "string" || !asset.path.endsWith(`.${profile}.pch.gz.bin`) || !isBytes(asset.byteLength) || !isBytes(asset.compressedByteLength) || !isSha256(asset.sha256) || !isSha256(asset.compressedSha256)) throw new Error(`Pinned libc++ PCH profile '${profile}' is malformed.`);
		return [profile, {
			path: asset.path,
			byteLength: asset.byteLength,
			sha256: asset.sha256,
			compressedByteLength: asset.compressedByteLength,
			compressedSha256: asset.compressedSha256
		}];
	})));
	if (Object.keys(manifestProfiles).sort().join(",") !== "cpp-debug,cpp-release") throw new Error("Pinned libc++ PCH manifest has an unexpected profile set.");
	return {
		schema: WASM_OJ_SCHEMAS$1.clangLibcxxPch,
		version: CLANG_VERSION,
		clangPackageSha256: CLANG_PACKAGE_SHA256,
		clangPinsSha256: CLANG_CC1_PINS_SHA256,
		header: WASM_OJ_LIBCXX_PCH_HEADER,
		headerSha256: value.headerSha256,
		profiles
	};
}
function isToolchainLibcxxPchHeader(contents) {
	return contents === WASM_OJ_LIBCXX_PCH_HEADER;
}
function isRecord$2(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isSha256(value) {
	return typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
}
function isBytes(value) {
	return Number.isSafeInteger(value) && value > 0;
}
//#endregion
//#region src/compiler/compiler-registry.ts
/**
* Environment-neutral router for composing built-in and downstream compilers.
*
* Registration is frozen by the first lifecycle operation, keeping routing
* deterministic for the lifetime of an engine and making each language owned
* by exactly one compiler.
*/
var CompilerRegistry = class {
	routes = /* @__PURE__ */ new Map();
	compilers = /* @__PURE__ */ new Set();
	progressListeners = /* @__PURE__ */ new Set();
	removeCompilerListeners = /* @__PURE__ */ new Map();
	initialization;
	sealed = false;
	disposed = false;
	generation = 0;
	constructor(registrations = []) {
		try {
			for (const registration of registrations) this.register(registration.languages, registration.compiler);
		} catch (error) {
			try {
				this.dispose();
			} catch (disposeError) {
				throw new AggregateError([error, disposeError], "CompilerRegistry construction and cleanup failed.");
			}
			throw error;
		}
	}
	register(languages, compiler) {
		this.assertActive();
		if (this.sealed) throw new Error("CompilerRegistry is sealed after its first lifecycle operation.");
		if (!Array.isArray(languages) || languages.length === 0) throw new Error("A compiler registration must own at least one language.");
		assertCompilerContract(compiler);
		const unique = /* @__PURE__ */ new Set();
		for (const language of languages) {
			assertLanguageIdentifier$1(language);
			if (unique.has(language)) throw new Error(`Language '${language}' is duplicated in one compiler registration.`);
			unique.add(language);
			if (this.routes.has(language)) throw new Error(`Language '${language}' already has a registered compiler.`);
		}
		let removeProgressListener;
		if (!this.compilers.has(compiler)) {
			removeProgressListener = compiler.onProgress((progress) => {
				for (const listener of this.progressListeners) listener(progress);
			});
			if (typeof removeProgressListener !== "function") throw new TypeError("Compiler.onProgress() must return an unsubscribe function.");
		}
		for (const language of unique) this.routes.set(language, compiler);
		if (removeProgressListener) {
			this.compilers.add(compiler);
			this.removeCompilerListeners.set(compiler, removeProgressListener);
		}
		return this;
	}
	languages() {
		this.assertActive();
		return [...this.routes.keys()];
	}
	cacheIdentity(project) {
		this.assertActive();
		this.sealed = true;
		return this.compilerFor(project.config.language).cacheIdentity(project);
	}
	ready() {
		this.assertActive();
		this.sealed = true;
		if (!this.initialization) {
			const generation = this.generation;
			const initialization = Promise.all([...this.compilers].map((compiler) => compiler.ready())).then(() => {
				this.assertActive();
				if (generation !== this.generation) throw new Error("CompilerRegistry initialization was superseded by a lifecycle change.");
			});
			this.initialization = initialization;
			initialization.catch(() => {
				if (this.initialization === initialization) this.initialization = void 0;
			});
		}
		return this.initialization;
	}
	async build(project, cacheKey) {
		await this.ready();
		return this.compilerFor(project.config.language).build(project, cacheKey);
	}
	onProgress(listener) {
		this.assertActive();
		this.progressListeners.add(listener);
		return () => this.progressListeners.delete(listener);
	}
	async clearToolchainCache() {
		await this.ready();
		await Promise.all([...this.compilers].map((compiler) => compiler.clearToolchainCache()));
	}
	cancel() {
		if (this.disposed) return;
		this.invalidateInitialization();
		this.invokeCompilers("cancel");
	}
	restart() {
		this.assertActive();
		this.invalidateInitialization();
		this.invokeCompilers("restart");
	}
	dispose() {
		if (this.disposed) return;
		this.disposed = true;
		this.generation += 1;
		this.initialization = void 0;
		const errors = [];
		for (const remove of this.removeCompilerListeners.values()) try {
			remove();
		} catch (error) {
			errors.push(error);
		}
		for (const compiler of this.compilers) try {
			compiler.dispose();
		} catch (error) {
			errors.push(error);
		}
		this.removeCompilerListeners.clear();
		this.progressListeners.clear();
		if (errors.length > 0) throw new AggregateError(errors, "CompilerRegistry disposal failed.");
	}
	assertActive() {
		if (this.disposed) throw new Error("CompilerRegistry is disposed.");
	}
	compilerFor(language) {
		this.assertActive();
		const compiler = this.routes.get(language);
		if (!compiler) throw new Error(`No Compiler is registered for language '${language}'.`);
		return compiler;
	}
	invalidateInitialization() {
		this.generation += 1;
		this.initialization = void 0;
	}
	invokeCompilers(operation) {
		const errors = [];
		for (const compiler of this.compilers) try {
			compiler[operation]();
		} catch (error) {
			errors.push(error);
		}
		if (errors.length > 0) throw new AggregateError(errors, `CompilerRegistry ${operation} failed.`);
	}
};
function assertCompilerContract(compiler) {
	if (!compiler || typeof compiler !== "object") throw new TypeError("WASM-OJ compilers must be objects.");
	for (const method of [
		"cacheIdentity",
		"ready",
		"build",
		"onProgress",
		"clearToolchainCache",
		"cancel",
		"restart",
		"dispose"
	]) if (typeof compiler[method] !== "function") throw new TypeError(`Compiler must implement ${method}().`);
}
//#endregion
//#region src/runtime/quickjs/stdlib.generated.ts
var QUICKJS_NODE_STDLIB = "var __nodeStdio=(function(nt){Object.defineProperty(nt,Symbol.toStringTag,{value:\"Module\"});var jt=Object.create,Ge=Object.defineProperty,Ft=Object.getOwnPropertyDescriptor,$t=Object.getOwnPropertyNames,qt=Object.getPrototypeOf,it=Object.prototype.hasOwnProperty,Ht=(E,d,s)=>()=>{if(s)throw s[0];try{return E&&(d=E(E=0)),d}catch(c){throw s=[c],c}},Ee=(E,d)=>()=>(d||(E((d={exports:{}}).exports,d),E=null),d.exports),Gt=(E,d)=>{let s={};for(var c in E)Ge(s,c,{get:E[c],enumerable:!0});return d||Ge(s,Symbol.toStringTag,{value:\"Module\"}),s},gt=(E,d,s,c)=>{if(d&&typeof d==\"object\"||typeof d==\"function\")for(var _=$t(d),A=0,R=_.length,n;A<R;A++)n=_[A],!it.call(E,n)&&n!==s&&Ge(E,n,{get:(C=>d[C]).bind(null,n),enumerable:!(c=Ft(d,n))||c.enumerable});return E},Vt=(E,d,s)=>(s=E!=null?jt(qt(E)):{},gt(d||!E||!E.__esModule||!it.call(E,\"default\")?Ge(s,\"default\",{value:E,enumerable:!0}):s,E)),Yt=E=>it.call(E,\"module.exports\")?E[\"module.exports\"]:gt(Ge({},\"__esModule\",{value:!0}),E),Kt=Ee((E=>{E.byteLength=C,E.toByteArray=W,E.fromByteArray=$;for(var d=[],s=[],c=typeof Uint8Array<\"u\"?Uint8Array:Array,_=\"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/\",A=0,R=_.length;A<R;++A)d[A]=_[A],s[_.charCodeAt(A)]=A;s[45]=62,s[95]=63;function n(P){var Y=P.length;if(Y%4>0)throw new Error(\"Invalid string. Length must be a multiple of 4\");var k=P.indexOf(\"=\");k===-1&&(k=Y);var D=k===Y?0:4-k%4;return[k,D]}function C(P){var Y=n(P),k=Y[0],D=Y[1];return(k+D)*3/4-D}function T(P,Y,k){return(Y+k)*3/4-k}function W(P){var Y,k=n(P),D=k[0],l=k[1],w=new c(T(P,D,l)),S=0,y=l>0?D-4:D,f;for(f=0;f<y;f+=4)Y=s[P.charCodeAt(f)]<<18|s[P.charCodeAt(f+1)]<<12|s[P.charCodeAt(f+2)]<<6|s[P.charCodeAt(f+3)],w[S++]=Y>>16&255,w[S++]=Y>>8&255,w[S++]=Y&255;return l===2&&(Y=s[P.charCodeAt(f)]<<2|s[P.charCodeAt(f+1)]>>4,w[S++]=Y&255),l===1&&(Y=s[P.charCodeAt(f)]<<10|s[P.charCodeAt(f+1)]<<4|s[P.charCodeAt(f+2)]>>2,w[S++]=Y>>8&255,w[S++]=Y&255),w}function L(P){return d[P>>18&63]+d[P>>12&63]+d[P>>6&63]+d[P&63]}function O(P,Y,k){for(var D,l=[],w=Y;w<k;w+=3)D=(P[w]<<16&16711680)+(P[w+1]<<8&65280)+(P[w+2]&255),l.push(L(D));return l.join(\"\")}function $(P){for(var Y,k=P.length,D=k%3,l=[],w=16383,S=0,y=k-D;S<y;S+=w)l.push(O(P,S,S+w>y?y:S+w));return D===1?(Y=P[k-1],l.push(d[Y>>2]+d[Y<<4&63]+\"==\")):D===2&&(Y=(P[k-2]<<8)+P[k-1],l.push(d[Y>>10]+d[Y>>4&63]+d[Y<<2&63]+\"=\")),l.join(\"\")}})),zt=Ee((E=>{E.read=function(d,s,c,_,A){var R,n,C=A*8-_-1,T=(1<<C)-1,W=T>>1,L=-7,O=c?A-1:0,$=c?-1:1,P=d[s+O];for(O+=$,R=P&(1<<-L)-1,P>>=-L,L+=C;L>0;R=R*256+d[s+O],O+=$,L-=8);for(n=R&(1<<-L)-1,R>>=-L,L+=_;L>0;n=n*256+d[s+O],O+=$,L-=8);if(R===0)R=1-W;else{if(R===T)return n?NaN:(P?-1:1)*(1/0);n=n+Math.pow(2,_),R=R-W}return(P?-1:1)*n*Math.pow(2,R-_)},E.write=function(d,s,c,_,A,R){var n,C,T,W=R*8-A-1,L=(1<<W)-1,O=L>>1,$=A===23?Math.pow(2,-24)-Math.pow(2,-77):0,P=_?0:R-1,Y=_?1:-1,k=s<0||s===0&&1/s<0?1:0;for(s=Math.abs(s),isNaN(s)||s===1/0?(C=isNaN(s)?1:0,n=L):(n=Math.floor(Math.log(s)/Math.LN2),s*(T=Math.pow(2,-n))<1&&(n--,T*=2),n+O>=1?s+=$/T:s+=$*Math.pow(2,1-O),s*T>=2&&(n++,T/=2),n+O>=L?(C=0,n=L):n+O>=1?(C=(s*T-1)*Math.pow(2,A),n=n+O):(C=s*Math.pow(2,O-1)*Math.pow(2,A),n=0));A>=8;d[c+P]=C&255,P+=Y,C/=256,A-=8);for(n=n<<A|C,W+=A;W>0;d[c+P]=n&255,P+=Y,n/=256,W-=8);d[c+P-Y]|=k*128}})),Oe=Ee((E=>{var d=Kt(),s=zt(),c=typeof Symbol==\"function\"&&typeof Symbol.for==\"function\"?Symbol.for(\"nodejs.util.inspect.custom\"):null;E.Buffer=n,E.SlowBuffer=l,E.INSPECT_MAX_BYTES=50;var _=2147483647;E.kMaxLength=_,n.TYPED_ARRAY_SUPPORT=A(),!n.TYPED_ARRAY_SUPPORT&&typeof console<\"u\"&&typeof console.error==\"function\"&&console.error(\"This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support.\");function A(){try{const r=new Uint8Array(1),e={foo:function(){return 42}};return Object.setPrototypeOf(e,Uint8Array.prototype),Object.setPrototypeOf(r,e),r.foo()===42}catch{return!1}}Object.defineProperty(n.prototype,\"parent\",{enumerable:!0,get:function(){if(n.isBuffer(this))return this.buffer}}),Object.defineProperty(n.prototype,\"offset\",{enumerable:!0,get:function(){if(n.isBuffer(this))return this.byteOffset}});function R(r){if(r>_)throw new RangeError('The value \"'+r+'\" is invalid for option \"size\"');const e=new Uint8Array(r);return Object.setPrototypeOf(e,n.prototype),e}function n(r,e,t){if(typeof r==\"number\"){if(typeof e==\"string\")throw new TypeError('The \"string\" argument must be of type string. Received type number');return L(r)}return C(r,e,t)}n.poolSize=8192;function C(r,e,t){if(typeof r==\"string\")return O(r,e);if(ArrayBuffer.isView(r))return P(r);if(r==null)throw new TypeError(\"The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type \"+typeof r);if(q(r,ArrayBuffer)||r&&q(r.buffer,ArrayBuffer)||typeof SharedArrayBuffer<\"u\"&&(q(r,SharedArrayBuffer)||r&&q(r.buffer,SharedArrayBuffer)))return Y(r,e,t);if(typeof r==\"number\")throw new TypeError('The \"value\" argument must not be of type number. Received type number');const i=r.valueOf&&r.valueOf();if(i!=null&&i!==r)return n.from(i,e,t);const p=k(r);if(p)return p;if(typeof Symbol<\"u\"&&Symbol.toPrimitive!=null&&typeof r[Symbol.toPrimitive]==\"function\")return n.from(r[Symbol.toPrimitive](\"string\"),e,t);throw new TypeError(\"The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type \"+typeof r)}n.from=function(r,e,t){return C(r,e,t)},Object.setPrototypeOf(n.prototype,Uint8Array.prototype),Object.setPrototypeOf(n,Uint8Array);function T(r){if(typeof r!=\"number\")throw new TypeError('\"size\" argument must be of type number');if(r<0)throw new RangeError('The value \"'+r+'\" is invalid for option \"size\"')}function W(r,e,t){return T(r),r<=0?R(r):e!==void 0?typeof t==\"string\"?R(r).fill(e,t):R(r).fill(e):R(r)}n.alloc=function(r,e,t){return W(r,e,t)};function L(r){return T(r),R(r<0?0:D(r)|0)}n.allocUnsafe=function(r){return L(r)},n.allocUnsafeSlow=function(r){return L(r)};function O(r,e){if((typeof e!=\"string\"||e===\"\")&&(e=\"utf8\"),!n.isEncoding(e))throw new TypeError(\"Unknown encoding: \"+e);const t=w(r,e)|0;let i=R(t);const p=i.write(r,e);return p!==t&&(i=i.slice(0,p)),i}function $(r){const e=r.length<0?0:D(r.length)|0,t=R(e);for(let i=0;i<e;i+=1)t[i]=r[i]&255;return t}function P(r){if(q(r,Uint8Array)){const e=new Uint8Array(r);return Y(e.buffer,e.byteOffset,e.byteLength)}return $(r)}function Y(r,e,t){if(e<0||r.byteLength<e)throw new RangeError('\"offset\" is outside of buffer bounds');if(r.byteLength<e+(t||0))throw new RangeError('\"length\" is outside of buffer bounds');let i;return e===void 0&&t===void 0?i=new Uint8Array(r):t===void 0?i=new Uint8Array(r,e):i=new Uint8Array(r,e,t),Object.setPrototypeOf(i,n.prototype),i}function k(r){if(n.isBuffer(r)){const e=D(r.length)|0,t=R(e);return t.length===0||r.copy(t,0,0,e),t}if(r.length!==void 0)return typeof r.length!=\"number\"||oe(r.length)?R(0):$(r);if(r.type===\"Buffer\"&&Array.isArray(r.data))return $(r.data)}function D(r){if(r>=_)throw new RangeError(\"Attempt to allocate Buffer larger than maximum size: 0x\"+_.toString(16)+\" bytes\");return r|0}function l(r){return+r!=r&&(r=0),n.alloc(+r)}n.isBuffer=function(e){return e!=null&&e._isBuffer===!0&&e!==n.prototype},n.compare=function(e,t){if(q(e,Uint8Array)&&(e=n.from(e,e.offset,e.byteLength)),q(t,Uint8Array)&&(t=n.from(t,t.offset,t.byteLength)),!n.isBuffer(e)||!n.isBuffer(t))throw new TypeError('The \"buf1\", \"buf2\" arguments must be one of type Buffer or Uint8Array');if(e===t)return 0;let i=e.length,p=t.length;for(let B=0,j=Math.min(i,p);B<j;++B)if(e[B]!==t[B]){i=e[B],p=t[B];break}return i<p?-1:p<i?1:0},n.isEncoding=function(e){switch(String(e).toLowerCase()){case\"hex\":case\"utf8\":case\"utf-8\":case\"ascii\":case\"latin1\":case\"binary\":case\"base64\":case\"ucs2\":case\"ucs-2\":case\"utf16le\":case\"utf-16le\":return!0;default:return!1}},n.concat=function(e,t){if(!Array.isArray(e))throw new TypeError('\"list\" argument must be an Array of Buffers');if(e.length===0)return n.alloc(0);let i;if(t===void 0)for(t=0,i=0;i<e.length;++i)t+=e[i].length;const p=n.allocUnsafe(t);let B=0;for(i=0;i<e.length;++i){let j=e[i];if(q(j,Uint8Array))B+j.length>p.length?(n.isBuffer(j)||(j=n.from(j)),j.copy(p,B)):Uint8Array.prototype.set.call(p,j,B);else if(n.isBuffer(j))j.copy(p,B);else throw new TypeError('\"list\" argument must be an Array of Buffers');B+=j.length}return p};function w(r,e){if(n.isBuffer(r))return r.length;if(ArrayBuffer.isView(r)||q(r,ArrayBuffer))return r.byteLength;if(typeof r!=\"string\")throw new TypeError('The \"string\" argument must be one of type string, Buffer, or ArrayBuffer. Received type '+typeof r);const t=r.length,i=arguments.length>2&&arguments[2]===!0;if(!i&&t===0)return 0;let p=!1;for(;;)switch(e){case\"ascii\":case\"latin1\":case\"binary\":return t;case\"utf8\":case\"utf-8\":return M(r).length;case\"ucs2\":case\"ucs-2\":case\"utf16le\":case\"utf-16le\":return t*2;case\"hex\":return t>>>1;case\"base64\":return Z(r).length;default:if(p)return i?-1:M(r).length;e=(\"\"+e).toLowerCase(),p=!0}}n.byteLength=w;function S(r,e,t){let i=!1;if((e===void 0||e<0)&&(e=0),e>this.length||((t===void 0||t>this.length)&&(t=this.length),t<=0)||(t>>>=0,e>>>=0,t<=e))return\"\";for(r||(r=\"utf8\");;)switch(r){case\"hex\":return _e(this,e,t);case\"utf8\":case\"utf-8\":return V(this,e,t);case\"ascii\":return se(this,e,t);case\"latin1\":case\"binary\":return he(this,e,t);case\"base64\":return N(this,e,t);case\"ucs2\":case\"ucs-2\":case\"utf16le\":case\"utf-16le\":return H(this,e,t);default:if(i)throw new TypeError(\"Unknown encoding: \"+r);r=(r+\"\").toLowerCase(),i=!0}}n.prototype._isBuffer=!0;function y(r,e,t){const i=r[e];r[e]=r[t],r[t]=i}n.prototype.swap16=function(){const e=this.length;if(e%2!==0)throw new RangeError(\"Buffer size must be a multiple of 16-bits\");for(let t=0;t<e;t+=2)y(this,t,t+1);return this},n.prototype.swap32=function(){const e=this.length;if(e%4!==0)throw new RangeError(\"Buffer size must be a multiple of 32-bits\");for(let t=0;t<e;t+=4)y(this,t,t+3),y(this,t+1,t+2);return this},n.prototype.swap64=function(){const e=this.length;if(e%8!==0)throw new RangeError(\"Buffer size must be a multiple of 64-bits\");for(let t=0;t<e;t+=8)y(this,t,t+7),y(this,t+1,t+6),y(this,t+2,t+5),y(this,t+3,t+4);return this},n.prototype.toString=function(){const e=this.length;return e===0?\"\":arguments.length===0?V(this,0,e):S.apply(this,arguments)},n.prototype.toLocaleString=n.prototype.toString,n.prototype.equals=function(e){if(!n.isBuffer(e))throw new TypeError(\"Argument must be a Buffer\");return this===e?!0:n.compare(this,e)===0},n.prototype.inspect=function(){let e=\"\";const t=E.INSPECT_MAX_BYTES;return e=this.toString(\"hex\",0,t).replace(/(.{2})/g,\"$1 \").trim(),this.length>t&&(e+=\" ... \"),\"<Buffer \"+e+\">\"},c&&(n.prototype[c]=n.prototype.inspect),n.prototype.compare=function(e,t,i,p,B){if(q(e,Uint8Array)&&(e=n.from(e,e.offset,e.byteLength)),!n.isBuffer(e))throw new TypeError('The \"target\" argument must be one of type Buffer or Uint8Array. Received type '+typeof e);if(t===void 0&&(t=0),i===void 0&&(i=e?e.length:0),p===void 0&&(p=0),B===void 0&&(B=this.length),t<0||i>e.length||p<0||B>this.length)throw new RangeError(\"out of range index\");if(p>=B&&t>=i)return 0;if(p>=B)return-1;if(t>=i)return 1;if(t>>>=0,i>>>=0,p>>>=0,B>>>=0,this===e)return 0;let j=B-p,ge=i-t;const Re=Math.min(j,ge),me=this.slice(p,B),Te=e.slice(t,i);for(let Se=0;Se<Re;++Se)if(me[Se]!==Te[Se]){j=me[Se],ge=Te[Se];break}return j<ge?-1:ge<j?1:0};function f(r,e,t,i,p){if(r.length===0)return-1;if(typeof t==\"string\"?(i=t,t=0):t>2147483647?t=2147483647:t<-2147483648&&(t=-2147483648),t=+t,oe(t)&&(t=p?0:r.length-1),t<0&&(t=r.length+t),t>=r.length){if(p)return-1;t=r.length-1}else if(t<0)if(p)t=0;else return-1;if(typeof e==\"string\"&&(e=n.from(e,i)),n.isBuffer(e))return e.length===0?-1:h(r,e,t,i,p);if(typeof e==\"number\")return e=e&255,typeof Uint8Array.prototype.indexOf==\"function\"?p?Uint8Array.prototype.indexOf.call(r,e,t):Uint8Array.prototype.lastIndexOf.call(r,e,t):h(r,[e],t,i,p);throw new TypeError(\"val must be string, number or Buffer\")}function h(r,e,t,i,p){let B=1,j=r.length,ge=e.length;if(i!==void 0&&(i=String(i).toLowerCase(),i===\"ucs2\"||i===\"ucs-2\"||i===\"utf16le\"||i===\"utf-16le\")){if(r.length<2||e.length<2)return-1;B=2,j/=2,ge/=2,t/=2}function Re(Te,Se){return B===1?Te[Se]:Te.readUInt16BE(Se*B)}let me;if(p){let Te=-1;for(me=t;me<j;me++)if(Re(r,me)===Re(e,Te===-1?0:me-Te)){if(Te===-1&&(Te=me),me-Te+1===ge)return Te*B}else Te!==-1&&(me-=me-Te),Te=-1}else for(t+ge>j&&(t=j-ge),me=t;me>=0;me--){let Te=!0;for(let Se=0;Se<ge;Se++)if(Re(r,me+Se)!==Re(e,Se)){Te=!1;break}if(Te)return me}return-1}n.prototype.includes=function(e,t,i){return this.indexOf(e,t,i)!==-1},n.prototype.indexOf=function(e,t,i){return f(this,e,t,i,!0)},n.prototype.lastIndexOf=function(e,t,i){return f(this,e,t,i,!1)};function x(r,e,t,i){t=Number(t)||0;const p=r.length-t;i?(i=Number(i),i>p&&(i=p)):i=p;const B=e.length;i>B/2&&(i=B/2);let j;for(j=0;j<i;++j){const ge=parseInt(e.substr(j*2,2),16);if(oe(ge))return j;r[t+j]=ge}return j}function z(r,e,t,i){return b(M(e,r.length-t),r,t,i)}function U(r,e,t,i){return b(Q(e),r,t,i)}function ue(r,e,t,i){return b(Z(e),r,t,i)}function m(r,e,t,i){return b(ee(e,r.length-t),r,t,i)}n.prototype.write=function(e,t,i,p){if(t===void 0)p=\"utf8\",i=this.length,t=0;else if(i===void 0&&typeof t==\"string\")p=t,i=this.length,t=0;else if(isFinite(t))t=t>>>0,isFinite(i)?(i=i>>>0,p===void 0&&(p=\"utf8\")):(p=i,i=void 0);else throw new Error(\"Buffer.write(string, encoding, offset[, length]) is no longer supported\");const B=this.length-t;if((i===void 0||i>B)&&(i=B),e.length>0&&(i<0||t<0)||t>this.length)throw new RangeError(\"Attempt to write outside buffer bounds\");p||(p=\"utf8\");let j=!1;for(;;)switch(p){case\"hex\":return x(this,e,t,i);case\"utf8\":case\"utf-8\":return z(this,e,t,i);case\"ascii\":case\"latin1\":case\"binary\":return U(this,e,t,i);case\"base64\":return ue(this,e,t,i);case\"ucs2\":case\"ucs-2\":case\"utf16le\":case\"utf-16le\":return m(this,e,t,i);default:if(j)throw new TypeError(\"Unknown encoding: \"+p);p=(\"\"+p).toLowerCase(),j=!0}},n.prototype.toJSON=function(){return{type:\"Buffer\",data:Array.prototype.slice.call(this._arr||this,0)}};function N(r,e,t){return e===0&&t===r.length?d.fromByteArray(r):d.fromByteArray(r.slice(e,t))}function V(r,e,t){t=Math.min(r.length,t);const i=[];let p=e;for(;p<t;){const B=r[p];let j=null,ge=B>239?4:B>223?3:B>191?2:1;if(p+ge<=t){let Re,me,Te,Se;switch(ge){case 1:B<128&&(j=B);break;case 2:Re=r[p+1],(Re&192)===128&&(Se=(B&31)<<6|Re&63,Se>127&&(j=Se));break;case 3:Re=r[p+1],me=r[p+2],(Re&192)===128&&(me&192)===128&&(Se=(B&15)<<12|(Re&63)<<6|me&63,Se>2047&&(Se<55296||Se>57343)&&(j=Se));break;case 4:Re=r[p+1],me=r[p+2],Te=r[p+3],(Re&192)===128&&(me&192)===128&&(Te&192)===128&&(Se=(B&15)<<18|(Re&63)<<12|(me&63)<<6|Te&63,Se>65535&&Se<1114112&&(j=Se))}}j===null?(j=65533,ge=1):j>65535&&(j-=65536,i.push(j>>>10&1023|55296),j=56320|j&1023),i.push(j),p+=ge}return ae(i)}var I=4096;function ae(r){const e=r.length;if(e<=I)return String.fromCharCode.apply(String,r);let t=\"\",i=0;for(;i<e;)t+=String.fromCharCode.apply(String,r.slice(i,i+=I));return t}function se(r,e,t){let i=\"\";t=Math.min(r.length,t);for(let p=e;p<t;++p)i+=String.fromCharCode(r[p]&127);return i}function he(r,e,t){let i=\"\";t=Math.min(r.length,t);for(let p=e;p<t;++p)i+=String.fromCharCode(r[p]);return i}function _e(r,e,t){const i=r.length;(!e||e<0)&&(e=0),(!t||t<0||t>i)&&(t=i);let p=\"\";for(let B=e;B<t;++B)p+=J[r[B]];return p}function H(r,e,t){const i=r.slice(e,t);let p=\"\";for(let B=0;B<i.length-1;B+=2)p+=String.fromCharCode(i[B]+i[B+1]*256);return p}n.prototype.slice=function(e,t){const i=this.length;e=~~e,t=t===void 0?i:~~t,e<0?(e+=i,e<0&&(e=0)):e>i&&(e=i),t<0?(t+=i,t<0&&(t=0)):t>i&&(t=i),t<e&&(t=e);const p=this.subarray(e,t);return Object.setPrototypeOf(p,n.prototype),p};function ie(r,e,t){if(r%1!==0||r<0)throw new RangeError(\"offset is not uint\");if(r+e>t)throw new RangeError(\"Trying to access beyond buffer length\")}n.prototype.readUintLE=n.prototype.readUIntLE=function(e,t,i){e=e>>>0,t=t>>>0,i||ie(e,t,this.length);let p=this[e],B=1,j=0;for(;++j<t&&(B*=256);)p+=this[e+j]*B;return p},n.prototype.readUintBE=n.prototype.readUIntBE=function(e,t,i){e=e>>>0,t=t>>>0,i||ie(e,t,this.length);let p=this[e+--t],B=1;for(;t>0&&(B*=256);)p+=this[e+--t]*B;return p},n.prototype.readUint8=n.prototype.readUInt8=function(e,t){return e=e>>>0,t||ie(e,1,this.length),this[e]},n.prototype.readUint16LE=n.prototype.readUInt16LE=function(e,t){return e=e>>>0,t||ie(e,2,this.length),this[e]|this[e+1]<<8},n.prototype.readUint16BE=n.prototype.readUInt16BE=function(e,t){return e=e>>>0,t||ie(e,2,this.length),this[e]<<8|this[e+1]},n.prototype.readUint32LE=n.prototype.readUInt32LE=function(e,t){return e=e>>>0,t||ie(e,4,this.length),(this[e]|this[e+1]<<8|this[e+2]<<16)+this[e+3]*16777216},n.prototype.readUint32BE=n.prototype.readUInt32BE=function(e,t){return e=e>>>0,t||ie(e,4,this.length),this[e]*16777216+(this[e+1]<<16|this[e+2]<<8|this[e+3])},n.prototype.readBigUInt64LE=fe(function(e){e=e>>>0,pe(e,\"offset\");const t=this[e],i=this[e+7];(t===void 0||i===void 0)&&ye(e,this.length-8);const p=t+this[++e]*256+this[++e]*2**16+this[++e]*2**24,B=this[++e]+this[++e]*256+this[++e]*2**16+i*2**24;return BigInt(p)+(BigInt(B)<<BigInt(32))}),n.prototype.readBigUInt64BE=fe(function(e){e=e>>>0,pe(e,\"offset\");const t=this[e],i=this[e+7];(t===void 0||i===void 0)&&ye(e,this.length-8);const p=t*2**24+this[++e]*2**16+this[++e]*256+this[++e],B=this[++e]*2**24+this[++e]*2**16+this[++e]*256+i;return(BigInt(p)<<BigInt(32))+BigInt(B)}),n.prototype.readIntLE=function(e,t,i){e=e>>>0,t=t>>>0,i||ie(e,t,this.length);let p=this[e],B=1,j=0;for(;++j<t&&(B*=256);)p+=this[e+j]*B;return B*=128,p>=B&&(p-=Math.pow(2,8*t)),p},n.prototype.readIntBE=function(e,t,i){e=e>>>0,t=t>>>0,i||ie(e,t,this.length);let p=t,B=1,j=this[e+--p];for(;p>0&&(B*=256);)j+=this[e+--p]*B;return B*=128,j>=B&&(j-=Math.pow(2,8*t)),j},n.prototype.readInt8=function(e,t){return e=e>>>0,t||ie(e,1,this.length),this[e]&128?(255-this[e]+1)*-1:this[e]},n.prototype.readInt16LE=function(e,t){e=e>>>0,t||ie(e,2,this.length);const i=this[e]|this[e+1]<<8;return i&32768?i|4294901760:i},n.prototype.readInt16BE=function(e,t){e=e>>>0,t||ie(e,2,this.length);const i=this[e+1]|this[e]<<8;return i&32768?i|4294901760:i},n.prototype.readInt32LE=function(e,t){return e=e>>>0,t||ie(e,4,this.length),this[e]|this[e+1]<<8|this[e+2]<<16|this[e+3]<<24},n.prototype.readInt32BE=function(e,t){return e=e>>>0,t||ie(e,4,this.length),this[e]<<24|this[e+1]<<16|this[e+2]<<8|this[e+3]},n.prototype.readBigInt64LE=fe(function(e){e=e>>>0,pe(e,\"offset\");const t=this[e],i=this[e+7];(t===void 0||i===void 0)&&ye(e,this.length-8);const p=this[e+4]+this[e+5]*256+this[e+6]*2**16+(i<<24);return(BigInt(p)<<BigInt(32))+BigInt(t+this[++e]*256+this[++e]*2**16+this[++e]*2**24)}),n.prototype.readBigInt64BE=fe(function(e){e=e>>>0,pe(e,\"offset\");const t=this[e],i=this[e+7];(t===void 0||i===void 0)&&ye(e,this.length-8);const p=(t<<24)+this[++e]*2**16+this[++e]*256+this[++e];return(BigInt(p)<<BigInt(32))+BigInt(this[++e]*2**24+this[++e]*2**16+this[++e]*256+i)}),n.prototype.readFloatLE=function(e,t){return e=e>>>0,t||ie(e,4,this.length),s.read(this,e,!0,23,4)},n.prototype.readFloatBE=function(e,t){return e=e>>>0,t||ie(e,4,this.length),s.read(this,e,!1,23,4)},n.prototype.readDoubleLE=function(e,t){return e=e>>>0,t||ie(e,8,this.length),s.read(this,e,!0,52,8)},n.prototype.readDoubleBE=function(e,t){return e=e>>>0,t||ie(e,8,this.length),s.read(this,e,!1,52,8)};function u(r,e,t,i,p,B){if(!n.isBuffer(r))throw new TypeError('\"buffer\" argument must be a Buffer instance');if(e>p||e<B)throw new RangeError('\"value\" argument is out of bounds');if(t+i>r.length)throw new RangeError(\"Index out of range\")}n.prototype.writeUintLE=n.prototype.writeUIntLE=function(e,t,i,p){if(e=+e,t=t>>>0,i=i>>>0,!p){const ge=Math.pow(2,8*i)-1;u(this,e,t,i,ge,0)}let B=1,j=0;for(this[t]=e&255;++j<i&&(B*=256);)this[t+j]=e/B&255;return t+i},n.prototype.writeUintBE=n.prototype.writeUIntBE=function(e,t,i,p){if(e=+e,t=t>>>0,i=i>>>0,!p){const ge=Math.pow(2,8*i)-1;u(this,e,t,i,ge,0)}let B=i-1,j=1;for(this[t+B]=e&255;--B>=0&&(j*=256);)this[t+B]=e/j&255;return t+i},n.prototype.writeUint8=n.prototype.writeUInt8=function(e,t,i){return e=+e,t=t>>>0,i||u(this,e,t,1,255,0),this[t]=e&255,t+1},n.prototype.writeUint16LE=n.prototype.writeUInt16LE=function(e,t,i){return e=+e,t=t>>>0,i||u(this,e,t,2,65535,0),this[t]=e&255,this[t+1]=e>>>8,t+2},n.prototype.writeUint16BE=n.prototype.writeUInt16BE=function(e,t,i){return e=+e,t=t>>>0,i||u(this,e,t,2,65535,0),this[t]=e>>>8,this[t+1]=e&255,t+2},n.prototype.writeUint32LE=n.prototype.writeUInt32LE=function(e,t,i){return e=+e,t=t>>>0,i||u(this,e,t,4,4294967295,0),this[t+3]=e>>>24,this[t+2]=e>>>16,this[t+1]=e>>>8,this[t]=e&255,t+4},n.prototype.writeUint32BE=n.prototype.writeUInt32BE=function(e,t,i){return e=+e,t=t>>>0,i||u(this,e,t,4,4294967295,0),this[t]=e>>>24,this[t+1]=e>>>16,this[t+2]=e>>>8,this[t+3]=e&255,t+4};function X(r,e,t,i,p){ne(e,i,p,r,t,7);let B=Number(e&BigInt(4294967295));r[t++]=B,B=B>>8,r[t++]=B,B=B>>8,r[t++]=B,B=B>>8,r[t++]=B;let j=Number(e>>BigInt(32)&BigInt(4294967295));return r[t++]=j,j=j>>8,r[t++]=j,j=j>>8,r[t++]=j,j=j>>8,r[t++]=j,t}function le(r,e,t,i,p){ne(e,i,p,r,t,7);let B=Number(e&BigInt(4294967295));r[t+7]=B,B=B>>8,r[t+6]=B,B=B>>8,r[t+5]=B,B=B>>8,r[t+4]=B;let j=Number(e>>BigInt(32)&BigInt(4294967295));return r[t+3]=j,j=j>>8,r[t+2]=j,j=j>>8,r[t+1]=j,j=j>>8,r[t]=j,t+8}n.prototype.writeBigUInt64LE=fe(function(e,t=0){return X(this,e,t,BigInt(0),BigInt(\"0xffffffffffffffff\"))}),n.prototype.writeBigUInt64BE=fe(function(e,t=0){return le(this,e,t,BigInt(0),BigInt(\"0xffffffffffffffff\"))}),n.prototype.writeIntLE=function(e,t,i,p){if(e=+e,t=t>>>0,!p){const Re=Math.pow(2,8*i-1);u(this,e,t,i,Re-1,-Re)}let B=0,j=1,ge=0;for(this[t]=e&255;++B<i&&(j*=256);)e<0&&ge===0&&this[t+B-1]!==0&&(ge=1),this[t+B]=(e/j>>0)-ge&255;return t+i},n.prototype.writeIntBE=function(e,t,i,p){if(e=+e,t=t>>>0,!p){const Re=Math.pow(2,8*i-1);u(this,e,t,i,Re-1,-Re)}let B=i-1,j=1,ge=0;for(this[t+B]=e&255;--B>=0&&(j*=256);)e<0&&ge===0&&this[t+B+1]!==0&&(ge=1),this[t+B]=(e/j>>0)-ge&255;return t+i},n.prototype.writeInt8=function(e,t,i){return e=+e,t=t>>>0,i||u(this,e,t,1,127,-128),e<0&&(e=255+e+1),this[t]=e&255,t+1},n.prototype.writeInt16LE=function(e,t,i){return e=+e,t=t>>>0,i||u(this,e,t,2,32767,-32768),this[t]=e&255,this[t+1]=e>>>8,t+2},n.prototype.writeInt16BE=function(e,t,i){return e=+e,t=t>>>0,i||u(this,e,t,2,32767,-32768),this[t]=e>>>8,this[t+1]=e&255,t+2},n.prototype.writeInt32LE=function(e,t,i){return e=+e,t=t>>>0,i||u(this,e,t,4,2147483647,-2147483648),this[t]=e&255,this[t+1]=e>>>8,this[t+2]=e>>>16,this[t+3]=e>>>24,t+4},n.prototype.writeInt32BE=function(e,t,i){return e=+e,t=t>>>0,i||u(this,e,t,4,2147483647,-2147483648),e<0&&(e=4294967295+e+1),this[t]=e>>>24,this[t+1]=e>>>16,this[t+2]=e>>>8,this[t+3]=e&255,t+4},n.prototype.writeBigInt64LE=fe(function(e,t=0){return X(this,e,t,-BigInt(\"0x8000000000000000\"),BigInt(\"0x7fffffffffffffff\"))}),n.prototype.writeBigInt64BE=fe(function(e,t=0){return le(this,e,t,-BigInt(\"0x8000000000000000\"),BigInt(\"0x7fffffffffffffff\"))});function F(r,e,t,i,p,B){if(t+i>r.length)throw new RangeError(\"Index out of range\");if(t<0)throw new RangeError(\"Index out of range\")}function de(r,e,t,i,p){return e=+e,t=t>>>0,p||F(r,e,t,4,34028234663852886e22,-34028234663852886e22),s.write(r,e,t,i,23,4),t+4}n.prototype.writeFloatLE=function(e,t,i){return de(this,e,t,!0,i)},n.prototype.writeFloatBE=function(e,t,i){return de(this,e,t,!1,i)};function be(r,e,t,i,p){return e=+e,t=t>>>0,p||F(r,e,t,8,17976931348623157e292,-17976931348623157e292),s.write(r,e,t,i,52,8),t+8}n.prototype.writeDoubleLE=function(e,t,i){return be(this,e,t,!0,i)},n.prototype.writeDoubleBE=function(e,t,i){return be(this,e,t,!1,i)},n.prototype.copy=function(e,t,i,p){if(!n.isBuffer(e))throw new TypeError(\"argument should be a Buffer\");if(i||(i=0),!p&&p!==0&&(p=this.length),t>=e.length&&(t=e.length),t||(t=0),p>0&&p<i&&(p=i),p===i||e.length===0||this.length===0)return 0;if(t<0)throw new RangeError(\"targetStart out of bounds\");if(i<0||i>=this.length)throw new RangeError(\"Index out of range\");if(p<0)throw new RangeError(\"sourceEnd out of bounds\");p>this.length&&(p=this.length),e.length-t<p-i&&(p=e.length-t+i);const B=p-i;return this===e&&typeof Uint8Array.prototype.copyWithin==\"function\"?this.copyWithin(t,i,p):Uint8Array.prototype.set.call(e,this.subarray(i,p),t),B},n.prototype.fill=function(e,t,i,p){if(typeof e==\"string\"){if(typeof t==\"string\"?(p=t,t=0,i=this.length):typeof i==\"string\"&&(p=i,i=this.length),p!==void 0&&typeof p!=\"string\")throw new TypeError(\"encoding must be a string\");if(typeof p==\"string\"&&!n.isEncoding(p))throw new TypeError(\"Unknown encoding: \"+p);if(e.length===1){const j=e.charCodeAt(0);(p===\"utf8\"&&j<128||p===\"latin1\")&&(e=j)}}else typeof e==\"number\"?e=e&255:typeof e==\"boolean\"&&(e=Number(e));if(t<0||this.length<t||this.length<i)throw new RangeError(\"Out of range index\");if(i<=t)return this;t=t>>>0,i=i===void 0?this.length:i>>>0,e||(e=0);let B;if(typeof e==\"number\")for(B=t;B<i;++B)this[B]=e;else{const j=n.isBuffer(e)?e:n.from(e,p),ge=j.length;if(ge===0)throw new TypeError('The value \"'+e+'\" is invalid for argument \"value\"');for(B=0;B<i-t;++B)this[B+t]=j[B%ge]}return this};var ve={};function we(r,e,t){ve[r]=class extends t{constructor(){super(),Object.defineProperty(this,\"message\",{value:e.apply(this,arguments),writable:!0,configurable:!0}),this.name=`${this.name} [${r}]`,this.stack,delete this.name}get code(){return r}set code(p){Object.defineProperty(this,\"code\",{configurable:!0,enumerable:!0,value:p,writable:!0})}toString(){return`${this.name} [${r}]: ${this.message}`}}}we(\"ERR_BUFFER_OUT_OF_BOUNDS\",function(r){return r?`${r} is outside of buffer bounds`:\"Attempt to access memory outside buffer bounds\"},RangeError),we(\"ERR_INVALID_ARG_TYPE\",function(r,e){return`The \"${r}\" argument must be of type number. Received type ${typeof e}`},TypeError),we(\"ERR_OUT_OF_RANGE\",function(r,e,t){let i=`The value of \"${r}\" is out of range.`,p=t;return Number.isInteger(t)&&Math.abs(t)>2**32?p=K(String(t)):typeof t==\"bigint\"&&(p=String(t),(t>BigInt(2)**BigInt(32)||t<-(BigInt(2)**BigInt(32)))&&(p=K(p)),p+=\"n\"),i+=` It must be ${e}. Received ${p}`,i},RangeError);function K(r){let e=\"\",t=r.length;const i=r[0]===\"-\"?1:0;for(;t>=i+4;t-=3)e=`_${r.slice(t-3,t)}${e}`;return`${r.slice(0,t)}${e}`}function G(r,e,t){pe(e,\"offset\"),(r[e]===void 0||r[e+t]===void 0)&&ye(e,r.length-(t+1))}function ne(r,e,t,i,p,B){if(r>t||r<e){const j=typeof e==\"bigint\"?\"n\":\"\";let ge;throw B>3?e===0||e===BigInt(0)?ge=`>= 0${j} and < 2${j} ** ${(B+1)*8}${j}`:ge=`>= -(2${j} ** ${(B+1)*8-1}${j}) and < 2 ** ${(B+1)*8-1}${j}`:ge=`>= ${e}${j} and <= ${t}${j}`,new ve.ERR_OUT_OF_RANGE(\"value\",ge,r)}G(i,p,B)}function pe(r,e){if(typeof r!=\"number\")throw new ve.ERR_INVALID_ARG_TYPE(e,\"number\",r)}function ye(r,e,t){throw Math.floor(r)!==r?(pe(r,t),new ve.ERR_OUT_OF_RANGE(t||\"offset\",\"an integer\",r)):e<0?new ve.ERR_BUFFER_OUT_OF_BOUNDS:new ve.ERR_OUT_OF_RANGE(t||\"offset\",`>= ${t?1:0} and <= ${e}`,r)}var g=/[^+/0-9A-Za-z-_]/g;function v(r){if(r=r.split(\"=\")[0],r=r.trim().replace(g,\"\"),r.length<2)return\"\";for(;r.length%4!==0;)r=r+\"=\";return r}function M(r,e){e=e||1/0;let t;const i=r.length;let p=null;const B=[];for(let j=0;j<i;++j){if(t=r.charCodeAt(j),t>55295&&t<57344){if(!p){if(t>56319){(e-=3)>-1&&B.push(239,191,189);continue}else if(j+1===i){(e-=3)>-1&&B.push(239,191,189);continue}p=t;continue}if(t<56320){(e-=3)>-1&&B.push(239,191,189),p=t;continue}t=(p-55296<<10|t-56320)+65536}else p&&(e-=3)>-1&&B.push(239,191,189);if(p=null,t<128){if((e-=1)<0)break;B.push(t)}else if(t<2048){if((e-=2)<0)break;B.push(t>>6|192,t&63|128)}else if(t<65536){if((e-=3)<0)break;B.push(t>>12|224,t>>6&63|128,t&63|128)}else if(t<1114112){if((e-=4)<0)break;B.push(t>>18|240,t>>12&63|128,t>>6&63|128,t&63|128)}else throw new Error(\"Invalid code point\")}return B}function Q(r){const e=[];for(let t=0;t<r.length;++t)e.push(r.charCodeAt(t)&255);return e}function ee(r,e){let t,i,p;const B=[];for(let j=0;j<r.length&&!((e-=2)<0);++j)t=r.charCodeAt(j),i=t>>8,p=t%256,B.push(p),B.push(i);return B}function Z(r){return d.toByteArray(v(r))}function b(r,e,t,i){let p;for(p=0;p<i&&!(p+t>=e.length||p>=r.length);++p)e[p+t]=r[p];return p}function q(r,e){return r instanceof e||r!=null&&r.constructor!=null&&r.constructor.name!=null&&r.constructor.name===e.name}function oe(r){return r!==r}var J=(function(){const r=\"0123456789abcdef\",e=new Array(256);for(let t=0;t<16;++t){const i=t*16;for(let p=0;p<16;++p)e[i+p]=r[t]+r[p]}return e})();function fe(r){return typeof BigInt>\"u\"?Le:r}function Le(){throw new Error(\"BigInt not supported\")}})),Ie=Ee(((E,d)=>{var s=class extends Error{constructor(c){if(!Array.isArray(c))throw new TypeError(`Expected input to be an Array, got ${typeof c}`);let _=\"\";for(let A=0;A<c.length;A++)_+=`    ${c[A].stack}\n`;super(_),this.name=\"AggregateError\",this.errors=c}};d.exports={AggregateError:s,ArrayIsArray(c){return Array.isArray(c)},ArrayPrototypeIncludes(c,_){return c.includes(_)},ArrayPrototypeIndexOf(c,_){return c.indexOf(_)},ArrayPrototypeJoin(c,_){return c.join(_)},ArrayPrototypeMap(c,_){return c.map(_)},ArrayPrototypePop(c,_){return c.pop(_)},ArrayPrototypePush(c,_){return c.push(_)},ArrayPrototypeSlice(c,_,A){return c.slice(_,A)},Error,FunctionPrototypeCall(c,_,...A){return c.call(_,...A)},FunctionPrototypeSymbolHasInstance(c,_){return Function.prototype[Symbol.hasInstance].call(c,_)},MathFloor:Math.floor,Number,NumberIsInteger:Number.isInteger,NumberIsNaN:Number.isNaN,NumberMAX_SAFE_INTEGER:Number.MAX_SAFE_INTEGER,NumberMIN_SAFE_INTEGER:Number.MIN_SAFE_INTEGER,NumberParseInt:Number.parseInt,ObjectDefineProperties(c,_){return Object.defineProperties(c,_)},ObjectDefineProperty(c,_,A){return Object.defineProperty(c,_,A)},ObjectGetOwnPropertyDescriptor(c,_){return Object.getOwnPropertyDescriptor(c,_)},ObjectKeys(c){return Object.keys(c)},ObjectSetPrototypeOf(c,_){return Object.setPrototypeOf(c,_)},Promise,PromisePrototypeCatch(c,_){return c.catch(_)},PromisePrototypeThen(c,_,A){return c.then(_,A)},PromiseReject(c){return Promise.reject(c)},PromiseResolve(c){return Promise.resolve(c)},ReflectApply:Reflect.apply,RegExpPrototypeTest(c,_){return c.test(_)},SafeSet:Set,String,StringPrototypeSlice(c,_,A){return c.slice(_,A)},StringPrototypeToLowerCase(c){return c.toLowerCase()},StringPrototypeToUpperCase(c){return c.toUpperCase()},StringPrototypeTrim(c){return c.trim()},Symbol,SymbolFor:Symbol.for,SymbolAsyncIterator:Symbol.asyncIterator,SymbolHasInstance:Symbol.hasInstance,SymbolIterator:Symbol.iterator,SymbolDispose:Symbol.dispose||Symbol(\"Symbol.dispose\"),SymbolAsyncDispose:Symbol.asyncDispose||Symbol(\"Symbol.asyncDispose\"),TypedArrayPrototypeSet(c,_,A){return c.set(_,A)},Boolean,Uint8Array}})),_t=Ee(((E,d)=>{d.exports={format(s,...c){return s.replace(/%([sdifj])/g,function(...[_,A]){const R=c.shift();return A===\"f\"?R.toFixed(6):A===\"j\"?JSON.stringify(R):A===\"s\"&&typeof R==\"object\"?`${R.constructor!==Object?R.constructor.name:\"\"} {}`.trim():R.toString()})},inspect(s){switch(typeof s){case\"string\":if(s.includes(\"'\"))if(s.includes('\"')){if(!s.includes(\"`\")&&!s.includes(\"${\"))return`\\`${s}\\``}else return`\"${s}\"`;return`'${s}'`;case\"number\":return isNaN(s)?\"NaN\":Object.is(s,-0)?String(s):s;case\"bigint\":return`${String(s)}n`;case\"boolean\":case\"undefined\":return String(s);case\"object\":return\"{}\"}}}})),xe=Ee(((E,d)=>{var{format:s,inspect:c}=_t(),{AggregateError:_}=Ie(),A=globalThis.AggregateError||_,R=Symbol(\"kIsNodeError\"),n=[\"string\",\"function\",\"number\",\"object\",\"Function\",\"Object\",\"boolean\",\"bigint\",\"symbol\"],C=/^([A-Z][a-z0-9]*)+$/,T=\"__node_internal_\",W={};function L(l,w){if(!l)throw new W.ERR_INTERNAL_ASSERTION(w)}function O(l){let w=\"\",S=l.length;const y=l[0]===\"-\"?1:0;for(;S>=y+4;S-=3)w=`_${l.slice(S-3,S)}${w}`;return`${l.slice(0,S)}${w}`}function $(l,w,S){if(typeof w==\"function\")return L(w.length<=S.length,`Code: ${l}; The provided arguments length (${S.length}) does not match the required ones (${w.length}).`),w(...S);const y=(w.match(/%[dfijoOs]/g)||[]).length;return L(y===S.length,`Code: ${l}; The provided arguments length (${S.length}) does not match the required ones (${y}).`),S.length===0?w:s(w,...S)}function P(l,w,S){S||(S=Error);class y extends S{constructor(...h){super($(l,w,h))}toString(){return`${this.name} [${l}]: ${this.message}`}}Object.defineProperties(y.prototype,{name:{value:S.name,writable:!0,enumerable:!1,configurable:!0},toString:{value(){return`${this.name} [${l}]: ${this.message}`},writable:!0,enumerable:!1,configurable:!0}}),y.prototype.code=l,y.prototype[R]=!0,W[l]=y}function Y(l){const w=T+l.name;return Object.defineProperty(l,\"name\",{value:w}),l}function k(l,w){if(l&&w&&l!==w){if(Array.isArray(w.errors))return w.errors.push(l),w;const S=new A([w,l],w.message);return S.code=w.code,S}return l||w}var D=class extends Error{constructor(l=\"The operation was aborted\",w=void 0){if(w!==void 0&&typeof w!=\"object\")throw new W.ERR_INVALID_ARG_TYPE(\"options\",\"Object\",w);super(l,w),this.code=\"ABORT_ERR\",this.name=\"AbortError\"}};P(\"ERR_ASSERTION\",\"%s\",Error),P(\"ERR_INVALID_ARG_TYPE\",(l,w,S)=>{L(typeof l==\"string\",\"'name' must be a string\"),Array.isArray(w)||(w=[w]);let y=\"The \";l.endsWith(\" argument\")?y+=`${l} `:y+=`\"${l}\" ${l.includes(\".\")?\"property\":\"argument\"} `,y+=\"must be \";const f=[],h=[],x=[];for(const U of w)L(typeof U==\"string\",\"All expected entries have to be of type string\"),n.includes(U)?f.push(U.toLowerCase()):C.test(U)?h.push(U):(L(U!==\"object\",'The value \"object\" should be written as \"Object\"'),x.push(U));if(h.length>0){const U=f.indexOf(\"object\");U!==-1&&(f.splice(f,U,1),h.push(\"Object\"))}if(f.length>0){switch(f.length){case 1:y+=`of type ${f[0]}`;break;case 2:y+=`one of type ${f[0]} or ${f[1]}`;break;default:{const U=f.pop();y+=`one of type ${f.join(\", \")}, or ${U}`}}(h.length>0||x.length>0)&&(y+=\" or \")}if(h.length>0){switch(h.length){case 1:y+=`an instance of ${h[0]}`;break;case 2:y+=`an instance of ${h[0]} or ${h[1]}`;break;default:{const U=h.pop();y+=`an instance of ${h.join(\", \")}, or ${U}`}}x.length>0&&(y+=\" or \")}switch(x.length){case 0:break;case 1:x[0].toLowerCase()!==x[0]&&(y+=\"an \"),y+=`${x[0]}`;break;case 2:y+=`one of ${x[0]} or ${x[1]}`;break;default:{const U=x.pop();y+=`one of ${x.join(\", \")}, or ${U}`}}if(S==null)y+=`. Received ${S}`;else if(typeof S==\"function\"&&S.name)y+=`. Received function ${S.name}`;else if(typeof S==\"object\"){var z;if((z=S.constructor)!==null&&z!==void 0&&z.name)y+=`. Received an instance of ${S.constructor.name}`;else{const U=c(S,{depth:-1});y+=`. Received ${U}`}}else{let U=c(S,{colors:!1});U.length>25&&(U=`${U.slice(0,25)}...`),y+=`. Received type ${typeof S} (${U})`}return y},TypeError),P(\"ERR_INVALID_ARG_VALUE\",(l,w,S=\"is invalid\")=>{let y=c(w);return y.length>128&&(y=y.slice(0,128)+\"...\"),`The ${l.includes(\".\")?\"property\":\"argument\"} '${l}' ${S}. Received ${y}`},TypeError),P(\"ERR_INVALID_RETURN_VALUE\",(l,w,S)=>{var y;return`Expected ${l} to be returned from the \"${w}\" function but got ${S!=null&&(y=S.constructor)!==null&&y!==void 0&&y.name?`instance of ${S.constructor.name}`:`type ${typeof S}`}.`},TypeError),P(\"ERR_MISSING_ARGS\",(...l)=>{L(l.length>0,\"At least one arg needs to be specified\");let w;const S=l.length;switch(l=(Array.isArray(l)?l:[l]).map(y=>`\"${y}\"`).join(\" or \"),S){case 1:w+=`The ${l[0]} argument`;break;case 2:w+=`The ${l[0]} and ${l[1]} arguments`;break;default:{const y=l.pop();w+=`The ${l.join(\", \")}, and ${y} arguments`}}return`${w} must be specified`},TypeError),P(\"ERR_OUT_OF_RANGE\",(l,w,S)=>{L(w,'Missing \"range\" argument');let y;if(Number.isInteger(S)&&Math.abs(S)>2**32)y=O(String(S));else if(typeof S==\"bigint\"){y=String(S);const f=BigInt(2)**BigInt(32);(S>f||S<-f)&&(y=O(y)),y+=\"n\"}else y=c(S);return`The value of \"${l}\" is out of range. It must be ${w}. Received ${y}`},RangeError),P(\"ERR_MULTIPLE_CALLBACK\",\"Callback called multiple times\",Error),P(\"ERR_METHOD_NOT_IMPLEMENTED\",\"The %s method is not implemented\",Error),P(\"ERR_STREAM_ALREADY_FINISHED\",\"Cannot call %s after a stream was finished\",Error),P(\"ERR_STREAM_CANNOT_PIPE\",\"Cannot pipe, not readable\",Error),P(\"ERR_STREAM_DESTROYED\",\"Cannot call %s after a stream was destroyed\",Error),P(\"ERR_STREAM_NULL_VALUES\",\"May not write null values to stream\",TypeError),P(\"ERR_STREAM_PREMATURE_CLOSE\",\"Premature close\",Error),P(\"ERR_STREAM_PUSH_AFTER_EOF\",\"stream.push() after EOF\",Error),P(\"ERR_STREAM_UNSHIFT_AFTER_END_EVENT\",\"stream.unshift() after end event\",Error),P(\"ERR_STREAM_WRITE_AFTER_END\",\"write after end\",Error),P(\"ERR_UNKNOWN_ENCODING\",\"Unknown encoding: %s\",TypeError),d.exports={AbortError:D,aggregateTwoErrors:Y(k),hideStackFrames:Y,codes:W}})),Xt=Gt({EventTarget:()=>Me,default:()=>Me,defineEventAttribute:()=>At});function Ae(E){const d=ot.get(E);return console.assert(d!=null,\"'this' is expected an Event object, but got\",E),d}function vt(E){if(E.passiveListener!=null){typeof console<\"u\"&&typeof console.error==\"function\"&&console.error(\"Unable to preventDefault inside passive event listener invocation.\",E.passiveListener);return}E.event.cancelable&&(E.canceled=!0,typeof E.event.preventDefault==\"function\"&&E.event.preventDefault())}function qe(E,d){ot.set(this,{eventTarget:E,event:d,eventPhase:2,currentTarget:E,canceled:!1,stopped:!1,immediateStopped:!1,passiveListener:null,timeStamp:d.timeStamp||Date.now()}),Object.defineProperty(this,\"isTrusted\",{value:!1,enumerable:!0});const s=Object.keys(d);for(let c=0;c<s.length;++c){const _=s[c];_ in this||Object.defineProperty(this,_,Et(_))}}function Et(E){return{get(){return Ae(this).event[E]},set(d){Ae(this).event[E]=d},configurable:!0,enumerable:!0}}function Jt(E){return{value(){const d=Ae(this).event;return d[E].apply(d,arguments)},configurable:!0,enumerable:!0}}function Zt(E,d){const s=Object.keys(d);if(s.length===0)return E;function c(_,A){E.call(this,_,A)}c.prototype=Object.create(E.prototype,{constructor:{value:c,configurable:!0,writable:!0}});for(let _=0;_<s.length;++_){const A=s[_];if(!(A in E.prototype)){const R=typeof Object.getOwnPropertyDescriptor(d,A).value==\"function\";Object.defineProperty(c.prototype,A,R?Jt(A):Et(A))}}return c}function St(E){if(E==null||E===Object.prototype)return qe;let d=Qe.get(E);return d==null&&(d=Zt(St(Object.getPrototypeOf(E)),E),Qe.set(E,d)),d}function Qt(E,d){return new(St(Object.getPrototypeOf(d)))(E,d)}function er(E){return Ae(E).immediateStopped}function tr(E,d){Ae(E).eventPhase=d}function rr(E,d){Ae(E).currentTarget=d}function mt(E,d){Ae(E).passiveListener=d}function Ze(E){return E!==null&&typeof E==\"object\"}function Ve(E){const d=lt.get(E);if(d==null)throw new TypeError(\"'this' is expected an EventTarget object, but got another value.\");return d}function nr(E){return{get(){let d=Ve(this).get(E);for(;d!=null;){if(d.listenerType===Ye)return d.listener;d=d.next}return null},set(d){typeof d!=\"function\"&&!Ze(d)&&(d=null);const s=Ve(this);let c=null,_=s.get(E);for(;_!=null;)_.listenerType===Ye?c!==null?c.next=_.next:_.next!==null?s.set(E,_.next):s.delete(E):c=_,_=_.next;if(d!==null){const A={listener:d,listenerType:Ye,passive:!1,once:!1,next:null};c===null?s.set(E,A):c.next=A}},configurable:!0,enumerable:!0}}function At(E,d){Object.defineProperty(E,`on${d}`,nr(d))}function Rt(E){function d(){Me.call(this)}d.prototype=Object.create(Me.prototype,{constructor:{value:d,configurable:!0,writable:!0}});for(let s=0;s<E.length;++s)At(d.prototype,E[s]);return d}function Me(){if(this instanceof Me){lt.set(this,new Map);return}if(arguments.length===1&&Array.isArray(arguments[0]))return Rt(arguments[0]);if(arguments.length>0){const E=new Array(arguments.length);for(let d=0;d<arguments.length;++d)E[d]=arguments[d];return Rt(E)}throw new TypeError(\"Cannot call a class as a function\")}var ot,Qe,lt,at,st,Ye,ir=Ht((()=>{ot=new WeakMap,Qe=new WeakMap,qe.prototype={get type(){return Ae(this).event.type},get target(){return Ae(this).eventTarget},get currentTarget(){return Ae(this).currentTarget},composedPath(){const E=Ae(this).currentTarget;return E==null?[]:[E]},get NONE(){return 0},get CAPTURING_PHASE(){return 1},get AT_TARGET(){return 2},get BUBBLING_PHASE(){return 3},get eventPhase(){return Ae(this).eventPhase},stopPropagation(){const E=Ae(this);E.stopped=!0,typeof E.event.stopPropagation==\"function\"&&E.event.stopPropagation()},stopImmediatePropagation(){const E=Ae(this);E.stopped=!0,E.immediateStopped=!0,typeof E.event.stopImmediatePropagation==\"function\"&&E.event.stopImmediatePropagation()},get bubbles(){return!!Ae(this).event.bubbles},get cancelable(){return!!Ae(this).event.cancelable},preventDefault(){vt(Ae(this))},get defaultPrevented(){return Ae(this).canceled},get composed(){return!!Ae(this).event.composed},get timeStamp(){return Ae(this).timeStamp},get srcElement(){return Ae(this).eventTarget},get cancelBubble(){return Ae(this).stopped},set cancelBubble(E){if(!E)return;const d=Ae(this);d.stopped=!0,typeof d.event.cancelBubble==\"boolean\"&&(d.event.cancelBubble=!0)},get returnValue(){return!Ae(this).canceled},set returnValue(E){E||vt(Ae(this))},initEvent(){}},Object.defineProperty(qe.prototype,\"constructor\",{value:qe,configurable:!0,writable:!0}),typeof window<\"u\"&&typeof window.Event<\"u\"&&(Object.setPrototypeOf(qe.prototype,window.Event.prototype),Qe.set(window.Event.prototype,qe)),lt=new WeakMap,at=1,st=2,Ye=3,Me.prototype={addEventListener(E,d,s){if(d==null)return;if(typeof d!=\"function\"&&!Ze(d))throw new TypeError(\"'listener' should be a function or an object.\");const c=Ve(this),_=Ze(s),A=(_?s.capture:s)?at:st,R={listener:d,listenerType:A,passive:_&&!!s.passive,once:_&&!!s.once,next:null};let n=c.get(E);if(n===void 0){c.set(E,R);return}let C=null;for(;n!=null;){if(n.listener===d&&n.listenerType===A)return;C=n,n=n.next}C.next=R},removeEventListener(E,d,s){if(d==null)return;const c=Ve(this),_=(Ze(s)?s.capture:s)?at:st;let A=null,R=c.get(E);for(;R!=null;){if(R.listener===d&&R.listenerType===_){A!==null?A.next=R.next:R.next!==null?c.set(E,R.next):c.delete(E);return}A=R,R=R.next}},dispatchEvent(E){if(E==null||typeof E.type!=\"string\")throw new TypeError('\"event.type\" should be a string.');const d=Ve(this),s=E.type;let c=d.get(s);if(c==null)return!0;const _=Qt(this,E);let A=null;for(;c!=null;){if(c.once?A!==null?A.next=c.next:c.next!==null?d.set(s,c.next):d.delete(s):A=c,mt(_,c.passive?c.listener:null),typeof c.listener==\"function\")try{c.listener.call(this,_)}catch(R){typeof console<\"u\"&&typeof console.error==\"function\"&&console.error(R)}else c.listenerType!==Ye&&typeof c.listener.handleEvent==\"function\"&&c.listener.handleEvent(_);if(er(_))break;c=c.next}return mt(_,null),tr(_,0),rr(_,null),!_.defaultPrevented}},Object.defineProperty(Me.prototype,\"constructor\",{value:Me,configurable:!0,writable:!0}),typeof window<\"u\"&&typeof window.EventTarget<\"u\"&&Object.setPrototypeOf(Me.prototype,window.EventTarget.prototype)})),Ke=Ee(((E,d)=>{Object.defineProperty(E,\"__esModule\",{value:!0});var s=(ir(),Yt(Xt)),c=class extends s.EventTarget{constructor(){throw super(),new TypeError(\"AbortSignal cannot be constructed directly\")}get aborted(){const W=R.get(this);if(typeof W!=\"boolean\")throw new TypeError(`Expected 'this' to be an 'AbortSignal' object, but got ${this===null?\"null\":typeof this}`);return W}};s.defineEventAttribute(c.prototype,\"abort\");function _(){const W=Object.create(c.prototype);return s.EventTarget.call(W),R.set(W,!1),W}function A(W){R.get(W)===!1&&(R.set(W,!0),W.dispatchEvent({type:\"abort\"}))}var R=new WeakMap;Object.defineProperties(c.prototype,{aborted:{enumerable:!0}}),typeof Symbol==\"function\"&&typeof Symbol.toStringTag==\"symbol\"&&Object.defineProperty(c.prototype,Symbol.toStringTag,{configurable:!0,value:\"AbortSignal\"});var n=class{constructor(){C.set(this,_())}get signal(){return T(this)}abort(){A(T(this))}},C=new WeakMap;function T(W){const L=C.get(W);if(L==null)throw new TypeError(`Expected 'this' to be an 'AbortController' object, but got ${W===null?\"null\":typeof W}`);return L}Object.defineProperties(n.prototype,{signal:{enumerable:!0},abort:{enumerable:!0}}),typeof Symbol==\"function\"&&typeof Symbol.toStringTag==\"symbol\"&&Object.defineProperty(n.prototype,Symbol.toStringTag,{configurable:!0,value:\"AbortController\"}),E.AbortController=n,E.AbortSignal=c,E.default=n,d.exports=n,d.exports.AbortController=d.exports.default=n,d.exports.AbortSignal=c})),ze=Ee(((E,d)=>{var s=typeof Reflect==\"object\"?Reflect:null,c=s&&typeof s.apply==\"function\"?s.apply:function(h,x,z){return Function.prototype.apply.call(h,x,z)},_;s&&typeof s.ownKeys==\"function\"?_=s.ownKeys:Object.getOwnPropertySymbols?_=function(h){return Object.getOwnPropertyNames(h).concat(Object.getOwnPropertySymbols(h))}:_=function(h){return Object.getOwnPropertyNames(h)};function A(f){console&&console.warn&&console.warn(f)}var R=Number.isNaN||function(h){return h!==h};function n(){n.init.call(this)}d.exports=n,d.exports.once=w,n.EventEmitter=n,n.prototype._events=void 0,n.prototype._eventsCount=0,n.prototype._maxListeners=void 0;var C=10;function T(f){if(typeof f!=\"function\")throw new TypeError('The \"listener\" argument must be of type Function. Received type '+typeof f)}Object.defineProperty(n,\"defaultMaxListeners\",{enumerable:!0,get:function(){return C},set:function(f){if(typeof f!=\"number\"||f<0||R(f))throw new RangeError('The value of \"defaultMaxListeners\" is out of range. It must be a non-negative number. Received '+f+\".\");C=f}}),n.init=function(){(this._events===void 0||this._events===Object.getPrototypeOf(this)._events)&&(this._events=Object.create(null),this._eventsCount=0),this._maxListeners=this._maxListeners||void 0},n.prototype.setMaxListeners=function(h){if(typeof h!=\"number\"||h<0||R(h))throw new RangeError('The value of \"n\" is out of range. It must be a non-negative number. Received '+h+\".\");return this._maxListeners=h,this};function W(f){return f._maxListeners===void 0?n.defaultMaxListeners:f._maxListeners}n.prototype.getMaxListeners=function(){return W(this)},n.prototype.emit=function(h){for(var x=[],z=1;z<arguments.length;z++)x.push(arguments[z]);var U=h===\"error\",ue=this._events;if(ue!==void 0)U=U&&ue.error===void 0;else if(!U)return!1;if(U){var m;if(x.length>0&&(m=x[0]),m instanceof Error)throw m;var N=new Error(\"Unhandled error.\"+(m?\" (\"+m.message+\")\":\"\"));throw N.context=m,N}var V=ue[h];if(V===void 0)return!1;if(typeof V==\"function\")c(V,this,x);else for(var I=V.length,ae=k(V,I),z=0;z<I;++z)c(ae[z],this,x);return!0};function L(f,h,x,z){var U,ue,m;if(T(x),ue=f._events,ue===void 0?(ue=f._events=Object.create(null),f._eventsCount=0):(ue.newListener!==void 0&&(f.emit(\"newListener\",h,x.listener?x.listener:x),ue=f._events),m=ue[h]),m===void 0)m=ue[h]=x,++f._eventsCount;else if(typeof m==\"function\"?m=ue[h]=z?[x,m]:[m,x]:z?m.unshift(x):m.push(x),U=W(f),U>0&&m.length>U&&!m.warned){m.warned=!0;var N=new Error(\"Possible EventEmitter memory leak detected. \"+m.length+\" \"+String(h)+\" listeners added. Use emitter.setMaxListeners() to increase limit\");N.name=\"MaxListenersExceededWarning\",N.emitter=f,N.type=h,N.count=m.length,A(N)}return f}n.prototype.addListener=function(h,x){return L(this,h,x,!1)},n.prototype.on=n.prototype.addListener,n.prototype.prependListener=function(h,x){return L(this,h,x,!0)};function O(){if(!this.fired)return this.target.removeListener(this.type,this.wrapFn),this.fired=!0,arguments.length===0?this.listener.call(this.target):this.listener.apply(this.target,arguments)}function $(f,h,x){var z={fired:!1,wrapFn:void 0,target:f,type:h,listener:x},U=O.bind(z);return U.listener=x,z.wrapFn=U,U}n.prototype.once=function(h,x){return T(x),this.on(h,$(this,h,x)),this},n.prototype.prependOnceListener=function(h,x){return T(x),this.prependListener(h,$(this,h,x)),this},n.prototype.removeListener=function(h,x){var z,U,ue,m,N;if(T(x),U=this._events,U===void 0)return this;if(z=U[h],z===void 0)return this;if(z===x||z.listener===x)--this._eventsCount===0?this._events=Object.create(null):(delete U[h],U.removeListener&&this.emit(\"removeListener\",h,z.listener||x));else if(typeof z!=\"function\"){for(ue=-1,m=z.length-1;m>=0;m--)if(z[m]===x||z[m].listener===x){N=z[m].listener,ue=m;break}if(ue<0)return this;ue===0?z.shift():D(z,ue),z.length===1&&(U[h]=z[0]),U.removeListener!==void 0&&this.emit(\"removeListener\",h,N||x)}return this},n.prototype.off=n.prototype.removeListener,n.prototype.removeAllListeners=function(h){var x,z=this._events,U;if(z===void 0)return this;if(z.removeListener===void 0)return arguments.length===0?(this._events=Object.create(null),this._eventsCount=0):z[h]!==void 0&&(--this._eventsCount===0?this._events=Object.create(null):delete z[h]),this;if(arguments.length===0){var ue=Object.keys(z),m;for(U=0;U<ue.length;++U)m=ue[U],m!==\"removeListener\"&&this.removeAllListeners(m);return this.removeAllListeners(\"removeListener\"),this._events=Object.create(null),this._eventsCount=0,this}if(x=z[h],typeof x==\"function\")this.removeListener(h,x);else if(x!==void 0)for(U=x.length-1;U>=0;U--)this.removeListener(h,x[U]);return this};function P(f,h,x){var z=f._events;if(z===void 0)return[];var U=z[h];return U===void 0?[]:typeof U==\"function\"?x?[U.listener||U]:[U]:x?l(U):k(U,U.length)}n.prototype.listeners=function(h){return P(this,h,!0)},n.prototype.rawListeners=function(h){return P(this,h,!1)},n.listenerCount=function(f,h){return typeof f.listenerCount==\"function\"?f.listenerCount(h):Y.call(f,h)},n.prototype.listenerCount=Y;function Y(f){var h=this._events;if(h!==void 0){var x=h[f];if(typeof x==\"function\")return 1;if(x!==void 0)return x.length}return 0}n.prototype.eventNames=function(){return this._eventsCount>0?_(this._events):[]};function k(f,h){for(var x=new Array(h),z=0;z<h;++z)x[z]=f[z];return x}function D(f,h){for(;h+1<f.length;h++)f[h]=f[h+1];f.pop()}function l(f){for(var h=new Array(f.length),x=0;x<h.length;++x)h[x]=f[x].listener||f[x];return h}function w(f,h){return new Promise(function(x,z){function U(m){f.removeListener(h,ue),z(m)}function ue(){typeof f.removeListener==\"function\"&&f.removeListener(\"error\",U),x([].slice.call(arguments))}y(f,h,ue,{once:!0}),h!==\"error\"&&S(f,U,{once:!0})})}function S(f,h,x){typeof f.on==\"function\"&&y(f,\"error\",h,x)}function y(f,h,x,z){if(typeof f.on==\"function\")z.once?f.once(h,x):f.on(h,x);else if(typeof f.addEventListener==\"function\")f.addEventListener(h,function U(ue){z.once&&f.removeEventListener(h,U),x(ue)});else throw new TypeError('The \"emitter\" argument must be of type EventEmitter. Received type '+typeof f)}})),Ne=Ee(((E,d)=>{var s=Oe(),{format:c,inspect:_}=_t(),{codes:{ERR_INVALID_ARG_TYPE:A}}=xe(),{kResistStopPropagation:R,AggregateError:n,SymbolDispose:C}=Ie(),T=globalThis.AbortSignal||Ke().AbortSignal,W=globalThis.AbortController||Ke().AbortController,L=Object.getPrototypeOf(async function(){}).constructor,O=globalThis.Blob||s.Blob,$=typeof O<\"u\"?function(D){return D instanceof O}:function(D){return!1},P=(k,D)=>{if(k!==void 0&&(k===null||typeof k!=\"object\"||!(\"aborted\"in k)))throw new A(D,\"AbortSignal\",k)},Y=(k,D)=>{if(typeof k!=\"function\")throw new A(D,\"Function\",k)};d.exports={AggregateError:n,kEmptyObject:Object.freeze({}),once(k){let D=!1;return function(...l){D||(D=!0,k.apply(this,l))}},createDeferredPromise:function(){let k,D;return{promise:new Promise((l,w)=>{k=l,D=w}),resolve:k,reject:D}},promisify(k){return new Promise((D,l)=>{k((w,...S)=>w?l(w):D(...S))})},debuglog(){return function(){}},format:c,inspect:_,types:{isAsyncFunction(k){return k instanceof L},isArrayBufferView(k){return ArrayBuffer.isView(k)}},isBlob:$,deprecate(k,D){return k},addAbortListener:ze().addAbortListener||function(D,l){if(D===void 0)throw new A(\"signal\",\"AbortSignal\",D);P(D,\"signal\"),Y(l,\"listener\");let w;return D.aborted?queueMicrotask(()=>l()):(D.addEventListener(\"abort\",l,{__proto__:null,once:!0,[R]:!0}),w=()=>{D.removeEventListener(\"abort\",l)}),{__proto__:null,[C](){var S;(S=w)===null||S===void 0||S()}}},AbortSignalAny:T.any||function(D){if(D.length===1)return D[0];const l=new W,w=()=>l.abort();return D.forEach(S=>{P(S,\"signals\"),S.addEventListener(\"abort\",w,{once:!0})}),l.signal.addEventListener(\"abort\",()=>{D.forEach(S=>S.removeEventListener(\"abort\",w))},{once:!0}),l.signal}},d.exports.promisify.custom=Symbol.for(\"nodejs.util.promisify.custom\")})),Xe=Ee(((E,d)=>{var{ArrayIsArray:s,ArrayPrototypeIncludes:c,ArrayPrototypeJoin:_,ArrayPrototypeMap:A,NumberIsInteger:R,NumberIsNaN:n,NumberMAX_SAFE_INTEGER:C,NumberMIN_SAFE_INTEGER:T,NumberParseInt:W,ObjectPrototypeHasOwnProperty:L,RegExpPrototypeExec:O,String:$,StringPrototypeToUpperCase:P,StringPrototypeTrim:Y}=Ie(),{hideStackFrames:k,codes:{ERR_SOCKET_BAD_PORT:D,ERR_INVALID_ARG_TYPE:l,ERR_INVALID_ARG_VALUE:w,ERR_OUT_OF_RANGE:S,ERR_UNKNOWN_SIGNAL:y}}=xe(),{normalizeEncoding:f}=Ne(),{isAsyncFunction:h,isArrayBufferView:x}=Ne().types,z={};function U(b){return b===(b|0)}function ue(b){return b===b>>>0}var m=/^[0-7]+$/,N=\"must be a 32-bit unsigned integer or an octal string\";function V(b,q,oe){if(typeof b>\"u\"&&(b=oe),typeof b==\"string\"){if(O(m,b)===null)throw new w(q,b,N);b=W(b,8)}return se(b,q),b}var I=k((b,q,oe=T,J=C)=>{if(typeof b!=\"number\")throw new l(q,\"number\",b);if(!R(b))throw new S(q,\"an integer\",b);if(b<oe||b>J)throw new S(q,`>= ${oe} && <= ${J}`,b)}),ae=k((b,q,oe=-2147483648,J=2147483647)=>{if(typeof b!=\"number\")throw new l(q,\"number\",b);if(!R(b))throw new S(q,\"an integer\",b);if(b<oe||b>J)throw new S(q,`>= ${oe} && <= ${J}`,b)}),se=k((b,q,oe=!1)=>{if(typeof b!=\"number\")throw new l(q,\"number\",b);if(!R(b))throw new S(q,\"an integer\",b);const J=oe?1:0,fe=4294967295;if(b<J||b>fe)throw new S(q,`>= ${J} && <= ${fe}`,b)});function he(b,q){if(typeof b!=\"string\")throw new l(q,\"string\",b)}function _e(b,q,oe=void 0,J){if(typeof b!=\"number\")throw new l(q,\"number\",b);if(oe!=null&&b<oe||J!=null&&b>J||(oe!=null||J!=null)&&n(b))throw new S(q,`${oe!=null?`>= ${oe}`:\"\"}${oe!=null&&J!=null?\" && \":\"\"}${J!=null?`<= ${J}`:\"\"}`,b)}var H=k((b,q,oe)=>{if(!c(oe,b)){const J=\"must be one of: \"+_(A(oe,fe=>typeof fe==\"string\"?`'${fe}'`:$(fe)),\", \");throw new w(q,b,J)}});function ie(b,q){if(typeof b!=\"boolean\")throw new l(q,\"boolean\",b)}function u(b,q,oe){return b==null||!L(b,q)?oe:b[q]}var X=k((b,q,oe=null)=>{const J=u(oe,\"allowArray\",!1),fe=u(oe,\"allowFunction\",!1);if(!u(oe,\"nullable\",!1)&&b===null||!J&&s(b)||typeof b!=\"object\"&&(!fe||typeof b!=\"function\"))throw new l(q,\"Object\",b)}),le=k((b,q)=>{if(b!=null&&typeof b!=\"object\"&&typeof b!=\"function\")throw new l(q,\"a dictionary\",b)}),F=k((b,q,oe=0)=>{if(!s(b))throw new l(q,\"Array\",b);if(b.length<oe){const J=`must be longer than ${oe}`;throw new w(q,b,J)}});function de(b,q){F(b,q);for(let oe=0;oe<b.length;oe++)he(b[oe],`${q}[${oe}]`)}function be(b,q){F(b,q);for(let oe=0;oe<b.length;oe++)ie(b[oe],`${q}[${oe}]`)}function ve(b,q){F(b,q);for(let oe=0;oe<b.length;oe++){const J=b[oe],fe=`${q}[${oe}]`;if(J==null)throw new l(fe,\"AbortSignal\",J);pe(J,fe)}}function we(b,q=\"signal\"){if(he(b,q),z[b]===void 0)throw z[P(b)]!==void 0?new y(b+\" (signals must use all capital letters)\"):new y(b)}var K=k((b,q=\"buffer\")=>{if(!x(b))throw new l(q,[\"Buffer\",\"TypedArray\",\"DataView\"],b)});function G(b,q){const oe=f(q),J=b.length;if(oe===\"hex\"&&J%2!==0)throw new w(\"encoding\",q,`is invalid for data of length ${J}`)}function ne(b,q=\"Port\",oe=!0){if(typeof b!=\"number\"&&typeof b!=\"string\"||typeof b==\"string\"&&Y(b).length===0||+b!==+b>>>0||b>65535||b===0&&!oe)throw new D(q,b,oe);return b|0}var pe=k((b,q)=>{if(b!==void 0&&(b===null||typeof b!=\"object\"||!(\"aborted\"in b)))throw new l(q,\"AbortSignal\",b)}),ye=k((b,q)=>{if(typeof b!=\"function\")throw new l(q,\"Function\",b)}),g=k((b,q)=>{if(typeof b!=\"function\"||h(b))throw new l(q,\"Function\",b)}),v=k((b,q)=>{if(b!==void 0)throw new l(q,\"undefined\",b)});function M(b,q,oe){if(!c(oe,b))throw new l(q,`('${_(oe,\"|\")}')`,b)}var Q=/^(?:<[^>]*>)(?:\\s*;\\s*[^;\"\\s]+(?:=(\")?[^;\"\\s]*\\1)?)*$/;function ee(b,q){if(typeof b>\"u\"||!O(Q,b))throw new w(q,b,'must be an array or string of format \"</styles.css>; rel=preload; as=style\"')}function Z(b){if(typeof b==\"string\")return ee(b,\"hints\"),b;if(s(b)){const q=b.length;let oe=\"\";if(q===0)return oe;for(let J=0;J<q;J++){const fe=b[J];ee(fe,\"hints\"),oe+=fe,J!==q-1&&(oe+=\", \")}return oe}throw new w(\"hints\",b,'must be an array or string of format \"</styles.css>; rel=preload; as=style\"')}d.exports={isInt32:U,isUint32:ue,parseFileMode:V,validateArray:F,validateStringArray:de,validateBooleanArray:be,validateAbortSignalArray:ve,validateBoolean:ie,validateBuffer:K,validateDictionary:le,validateEncoding:G,validateFunction:ye,validateInt32:ae,validateInteger:I,validateNumber:_e,validateObject:X,validateOneOf:H,validatePlainFunction:g,validatePort:ne,validateSignalName:we,validateString:he,validateUint32:se,validateUndefined:v,validateUnion:M,validateAbortSignal:pe,validateLinkHeaderValue:Z}})),Ue=Ee(((E,d)=>{var s=[],c=!1;function _(){try{for(;s.length;){const[R,n]=s.shift();R(...n)}}finally{c=!1}}var A={env:{},nextTick(R,...n){if(typeof R!=\"function\")throw new TypeError(\"callback must be a function\");s.push([R,n]),c||(c=!0,Promise.resolve().then(_))}};d.exports=A})),ke=Ee(((E,d)=>{var{SymbolAsyncIterator:s,SymbolIterator:c,SymbolFor:_}=Ie(),A=_(\"nodejs.stream.destroyed\"),R=_(\"nodejs.stream.errored\"),n=_(\"nodejs.stream.readable\"),C=_(\"nodejs.stream.writable\"),T=_(\"nodejs.stream.disturbed\"),W=_(\"nodejs.webstream.isClosedPromise\"),L=_(\"nodejs.webstream.controllerErrorFunction\");function O(u,X=!1){var le;return!!(u&&typeof u.pipe==\"function\"&&typeof u.on==\"function\"&&(!X||typeof u.pause==\"function\"&&typeof u.resume==\"function\")&&(!u._writableState||((le=u._readableState)===null||le===void 0?void 0:le.readable)!==!1)&&(!u._writableState||u._readableState))}function $(u){var X;return!!(u&&typeof u.write==\"function\"&&typeof u.on==\"function\"&&(!u._readableState||((X=u._writableState)===null||X===void 0?void 0:X.writable)!==!1))}function P(u){return!!(u&&typeof u.pipe==\"function\"&&u._readableState&&typeof u.on==\"function\"&&typeof u.write==\"function\")}function Y(u){return u&&(u._readableState||u._writableState||typeof u.write==\"function\"&&typeof u.on==\"function\"||typeof u.pipe==\"function\"&&typeof u.on==\"function\")}function k(u){return!!(u&&!Y(u)&&typeof u.pipeThrough==\"function\"&&typeof u.getReader==\"function\"&&typeof u.cancel==\"function\")}function D(u){return!!(u&&!Y(u)&&typeof u.getWriter==\"function\"&&typeof u.abort==\"function\")}function l(u){return!!(u&&!Y(u)&&typeof u.readable==\"object\"&&typeof u.writable==\"object\")}function w(u){return k(u)||D(u)||l(u)}function S(u,X){return u==null?!1:X===!0?typeof u[s]==\"function\":X===!1?typeof u[c]==\"function\":typeof u[s]==\"function\"||typeof u[c]==\"function\"}function y(u){if(!Y(u))return null;const X=u._writableState,le=u._readableState,F=X||le;return!!(u.destroyed||u[A]||F!=null&&F.destroyed)}function f(u){if(!$(u))return null;if(u.writableEnded===!0)return!0;const X=u._writableState;return X!=null&&X.errored?!1:typeof X?.ended!=\"boolean\"?null:X.ended}function h(u,X){if(!$(u))return null;if(u.writableFinished===!0)return!0;const le=u._writableState;return le!=null&&le.errored?!1:typeof le?.finished!=\"boolean\"?null:!!(le.finished||X===!1&&le.ended===!0&&le.length===0)}function x(u){if(!O(u))return null;if(u.readableEnded===!0)return!0;const X=u._readableState;return!X||X.errored?!1:typeof X?.ended!=\"boolean\"?null:X.ended}function z(u,X){if(!O(u))return null;const le=u._readableState;return le!=null&&le.errored?!1:typeof le?.endEmitted!=\"boolean\"?null:!!(le.endEmitted||X===!1&&le.ended===!0&&le.length===0)}function U(u){return u&&u[n]!=null?u[n]:typeof u?.readable!=\"boolean\"?null:y(u)?!1:O(u)&&u.readable&&!z(u)}function ue(u){return u&&u[C]!=null?u[C]:typeof u?.writable!=\"boolean\"?null:y(u)?!1:$(u)&&u.writable&&!f(u)}function m(u,X){return Y(u)?y(u)?!0:!(X?.readable!==!1&&U(u)||X?.writable!==!1&&ue(u)):null}function N(u){var X,le;return Y(u)?u.writableErrored?u.writableErrored:(X=(le=u._writableState)===null||le===void 0?void 0:le.errored)!==null&&X!==void 0?X:null:null}function V(u){var X,le;return Y(u)?u.readableErrored?u.readableErrored:(X=(le=u._readableState)===null||le===void 0?void 0:le.errored)!==null&&X!==void 0?X:null:null}function I(u){if(!Y(u))return null;if(typeof u.closed==\"boolean\")return u.closed;const X=u._writableState,le=u._readableState;return typeof X?.closed==\"boolean\"||typeof le?.closed==\"boolean\"?X?.closed||le?.closed:typeof u._closed==\"boolean\"&&ae(u)?u._closed:null}function ae(u){return typeof u._closed==\"boolean\"&&typeof u._defaultKeepAlive==\"boolean\"&&typeof u._removedConnection==\"boolean\"&&typeof u._removedContLen==\"boolean\"}function se(u){return typeof u._sent100==\"boolean\"&&ae(u)}function he(u){var X;return typeof u._consuming==\"boolean\"&&typeof u._dumped==\"boolean\"&&((X=u.req)===null||X===void 0?void 0:X.upgradeOrConnect)===void 0}function _e(u){if(!Y(u))return null;const X=u._writableState,le=u._readableState,F=X||le;return!F&&se(u)||!!(F&&F.autoDestroy&&F.emitClose&&F.closed===!1)}function H(u){var X;return!!(u&&((X=u[T])!==null&&X!==void 0?X:u.readableDidRead||u.readableAborted))}function ie(u){var X,le,F,de,be,ve,we,K,G,ne;return!!(u&&((X=(le=(F=(de=(be=(ve=u[R])!==null&&ve!==void 0?ve:u.readableErrored)!==null&&be!==void 0?be:u.writableErrored)!==null&&de!==void 0?de:(we=u._readableState)===null||we===void 0?void 0:we.errorEmitted)!==null&&F!==void 0?F:(K=u._writableState)===null||K===void 0?void 0:K.errorEmitted)!==null&&le!==void 0?le:(G=u._readableState)===null||G===void 0?void 0:G.errored)!==null&&X!==void 0?X:!((ne=u._writableState)===null||ne===void 0)&&ne.errored))}d.exports={isDestroyed:y,kIsDestroyed:A,isDisturbed:H,kIsDisturbed:T,isErrored:ie,kIsErrored:R,isReadable:U,kIsReadable:n,kIsClosedPromise:W,kControllerErrorFunction:L,kIsWritable:C,isClosed:I,isDuplexNodeStream:P,isFinished:m,isIterable:S,isReadableNodeStream:O,isReadableStream:k,isReadableEnded:x,isReadableFinished:z,isReadableErrored:V,isNodeStream:Y,isWebStream:w,isWritable:ue,isWritableNodeStream:$,isWritableStream:D,isWritableEnded:f,isWritableFinished:h,isWritableErrored:N,isServerRequest:he,isServerResponse:se,willEmitClose:_e,isTransformStream:l}})),We=Ee(((E,d)=>{var s=Ue(),{AbortError:c,codes:_}=xe(),{ERR_INVALID_ARG_TYPE:A,ERR_STREAM_PREMATURE_CLOSE:R}=_,{kEmptyObject:n,once:C}=Ne(),{validateAbortSignal:T,validateFunction:W,validateObject:L,validateBoolean:O}=Xe(),{Promise:$,PromisePrototypeThen:P,SymbolDispose:Y}=Ie(),{isClosed:k,isReadable:D,isReadableNodeStream:l,isReadableStream:w,isReadableFinished:S,isReadableErrored:y,isWritable:f,isWritableNodeStream:h,isWritableStream:x,isWritableFinished:z,isWritableErrored:U,isNodeStream:ue,willEmitClose:m,kIsClosedPromise:N}=ke(),V;function I(H){return H.setHeader&&typeof H.abort==\"function\"}var ae=()=>{};function se(H,ie,u){var X,le;if(arguments.length===2?(u=ie,ie=n):ie==null?ie=n:L(ie,\"options\"),W(u,\"callback\"),T(ie.signal,\"options.signal\"),u=C(u),w(H)||x(H))return he(H,ie,u);if(!ue(H))throw new A(\"stream\",[\"ReadableStream\",\"WritableStream\",\"Stream\"],H);const F=(X=ie.readable)!==null&&X!==void 0?X:l(H),de=(le=ie.writable)!==null&&le!==void 0?le:h(H),be=H._writableState,ve=H._readableState,we=()=>{H.writable||ne()};let K=m(H)&&l(H)===F&&h(H)===de,G=z(H,!1);const ne=()=>{G=!0,H.destroyed&&(K=!1),!(K&&(!H.readable||F))&&(!F||pe)&&u.call(H)};let pe=S(H,!1);const ye=()=>{pe=!0,H.destroyed&&(K=!1),!(K&&(!H.writable||de))&&(!de||G)&&u.call(H)},g=b=>{u.call(H,b)};let v=k(H);const M=()=>{v=!0;const b=U(H)||y(H);if(b&&typeof b!=\"boolean\")return u.call(H,b);if(F&&!pe&&l(H,!0)&&!S(H,!1))return u.call(H,new R);if(de&&!G&&!z(H,!1))return u.call(H,new R);u.call(H)},Q=()=>{v=!0;const b=U(H)||y(H);if(b&&typeof b!=\"boolean\")return u.call(H,b);u.call(H)},ee=()=>{H.req.on(\"finish\",ne)};I(H)?(H.on(\"complete\",ne),K||H.on(\"abort\",M),H.req?ee():H.on(\"request\",ee)):de&&!be&&(H.on(\"end\",we),H.on(\"close\",we)),!K&&typeof H.aborted==\"boolean\"&&H.on(\"aborted\",M),H.on(\"end\",ye),H.on(\"finish\",ne),ie.error!==!1&&H.on(\"error\",g),H.on(\"close\",M),v?s.nextTick(M):be!=null&&be.errorEmitted||ve!=null&&ve.errorEmitted?K||s.nextTick(Q):(!F&&(!K||D(H))&&(G||f(H)===!1)||!de&&(!K||f(H))&&(pe||D(H)===!1)||ve&&H.req&&H.aborted)&&s.nextTick(Q);const Z=()=>{u=ae,H.removeListener(\"aborted\",M),H.removeListener(\"complete\",ne),H.removeListener(\"abort\",M),H.removeListener(\"request\",ee),H.req&&H.req.removeListener(\"finish\",ne),H.removeListener(\"end\",we),H.removeListener(\"close\",we),H.removeListener(\"finish\",ne),H.removeListener(\"end\",ye),H.removeListener(\"error\",g),H.removeListener(\"close\",M)};if(ie.signal&&!v){const b=()=>{const q=u;Z(),q.call(H,new c(void 0,{cause:ie.signal.reason}))};if(ie.signal.aborted)s.nextTick(b);else{V=V||Ne().addAbortListener;const q=V(ie.signal,b),oe=u;u=C((...J)=>{q[Y](),oe.apply(H,J)})}}return Z}function he(H,ie,u){let X=!1,le=ae;if(ie.signal)if(le=()=>{X=!0,u.call(H,new c(void 0,{cause:ie.signal.reason}))},ie.signal.aborted)s.nextTick(le);else{V=V||Ne().addAbortListener;const de=V(ie.signal,le),be=u;u=C((...ve)=>{de[Y](),be.apply(H,ve)})}const F=(...de)=>{X||s.nextTick(()=>u.apply(H,de))};return P(H[N].promise,F,F),ae}function _e(H,ie){var u;let X=!1;return ie===null&&(ie=n),(u=ie)!==null&&u!==void 0&&u.cleanup&&(O(ie.cleanup,\"cleanup\"),X=ie.cleanup),new $((le,F)=>{const de=se(H,ie,be=>{X&&de(),be?F(be):le()})})}d.exports=se,d.exports.finished=_e})),He=Ee(((E,d)=>{var s=Ue(),{aggregateTwoErrors:c,codes:{ERR_MULTIPLE_CALLBACK:_},AbortError:A}=xe(),{Symbol:R}=Ie(),{kIsDestroyed:n,isDestroyed:C,isFinished:T,isServerRequest:W}=ke(),L=R(\"kDestroy\"),O=R(\"kConstruct\");function $(m,N,V){m&&(m.stack,N&&!N.errored&&(N.errored=m),V&&!V.errored&&(V.errored=m))}function P(m,N){const V=this._readableState,I=this._writableState,ae=I||V;return I!=null&&I.destroyed||V!=null&&V.destroyed?(typeof N==\"function\"&&N(),this):($(m,I,V),I&&(I.destroyed=!0),V&&(V.destroyed=!0),ae.constructed?Y(this,m,N):this.once(L,function(se){Y(this,c(se,m),N)}),this)}function Y(m,N,V){let I=!1;function ae(se){if(I)return;I=!0;const he=m._readableState,_e=m._writableState;$(se,_e,he),_e&&(_e.closed=!0),he&&(he.closed=!0),typeof V==\"function\"&&V(se),se?s.nextTick(k,m,se):s.nextTick(D,m)}try{m._destroy(N||null,ae)}catch(se){ae(se)}}function k(m,N){l(m,N),D(m)}function D(m){const N=m._readableState,V=m._writableState;V&&(V.closeEmitted=!0),N&&(N.closeEmitted=!0),(V!=null&&V.emitClose||N!=null&&N.emitClose)&&m.emit(\"close\")}function l(m,N){const V=m._readableState,I=m._writableState;I!=null&&I.errorEmitted||V!=null&&V.errorEmitted||(I&&(I.errorEmitted=!0),V&&(V.errorEmitted=!0),m.emit(\"error\",N))}function w(){const m=this._readableState,N=this._writableState;m&&(m.constructed=!0,m.closed=!1,m.closeEmitted=!1,m.destroyed=!1,m.errored=null,m.errorEmitted=!1,m.reading=!1,m.ended=m.readable===!1,m.endEmitted=m.readable===!1),N&&(N.constructed=!0,N.destroyed=!1,N.closed=!1,N.closeEmitted=!1,N.errored=null,N.errorEmitted=!1,N.finalCalled=!1,N.prefinished=!1,N.ended=N.writable===!1,N.ending=N.writable===!1,N.finished=N.writable===!1)}function S(m,N,V){const I=m._readableState,ae=m._writableState;if(ae!=null&&ae.destroyed||I!=null&&I.destroyed)return this;I!=null&&I.autoDestroy||ae!=null&&ae.autoDestroy?m.destroy(N):N&&(N.stack,ae&&!ae.errored&&(ae.errored=N),I&&!I.errored&&(I.errored=N),V?s.nextTick(l,m,N):l(m,N))}function y(m,N){if(typeof m._construct!=\"function\")return;const V=m._readableState,I=m._writableState;V&&(V.constructed=!1),I&&(I.constructed=!1),m.once(O,N),!(m.listenerCount(O)>1)&&s.nextTick(f,m)}function f(m){let N=!1;function V(I){if(N){S(m,I??new _);return}N=!0;const ae=m._readableState,se=m._writableState,he=se||ae;ae&&(ae.constructed=!0),se&&(se.constructed=!0),he.destroyed?m.emit(L,I):I?S(m,I,!0):s.nextTick(h,m)}try{m._construct(I=>{s.nextTick(V,I)})}catch(I){s.nextTick(V,I)}}function h(m){m.emit(O)}function x(m){return m?.setHeader&&typeof m.abort==\"function\"}function z(m){m.emit(\"close\")}function U(m,N){m.emit(\"error\",N),s.nextTick(z,m)}function ue(m,N){!m||C(m)||(!N&&!T(m)&&(N=new A),W(m)?(m.socket=null,m.destroy(N)):x(m)?m.abort():x(m.req)?m.req.abort():typeof m.destroy==\"function\"?m.destroy(N):typeof m.close==\"function\"?m.close():N?s.nextTick(U,m,N):s.nextTick(z,m),m.destroyed||(m[n]=!0))}d.exports={construct:y,destroyer:ue,destroy:P,undestroy:w,errorOrDestroy:S}})),ut=Ee(((E,d)=>{var{ArrayIsArray:s,ObjectSetPrototypeOf:c}=Ie(),{EventEmitter:_}=ze();function A(n){_.call(this,n)}c(A.prototype,_.prototype),c(A,_),A.prototype.pipe=function(n,C){const T=this;function W(D){n.writable&&n.write(D)===!1&&T.pause&&T.pause()}T.on(\"data\",W);function L(){T.readable&&T.resume&&T.resume()}n.on(\"drain\",L),!n._isStdio&&(!C||C.end!==!1)&&(T.on(\"end\",$),T.on(\"close\",P));let O=!1;function $(){O||(O=!0,n.end())}function P(){O||(O=!0,typeof n.destroy==\"function\"&&n.destroy())}function Y(D){k(),_.listenerCount(this,\"error\")===0&&this.emit(\"error\",D)}R(T,\"error\",Y),R(n,\"error\",Y);function k(){T.removeListener(\"data\",W),n.removeListener(\"drain\",L),T.removeListener(\"end\",$),T.removeListener(\"close\",P),T.removeListener(\"error\",Y),n.removeListener(\"error\",Y),T.removeListener(\"end\",k),T.removeListener(\"close\",k),n.removeListener(\"close\",k)}return T.on(\"end\",k),T.on(\"close\",k),n.on(\"close\",k),n.emit(\"pipe\",T),n};function R(n,C,T){if(typeof n.prependListener==\"function\")return n.prependListener(C,T);!n._events||!n._events[C]?n.on(C,T):s(n._events[C])?n._events[C].unshift(T):n._events[C]=[T,n._events[C]]}d.exports={Stream:A,prependListener:R}})),et=Ee(((E,d)=>{var{SymbolDispose:s}=Ie(),{AbortError:c,codes:_}=xe(),{isNodeStream:A,isWebStream:R,kControllerErrorFunction:n}=ke(),C=We(),{ERR_INVALID_ARG_TYPE:T}=_,W,L=(O,$)=>{if(typeof O!=\"object\"||!(\"aborted\"in O))throw new T($,\"AbortSignal\",O)};d.exports.addAbortSignal=function($,P){if(L($,\"signal\"),!A(P)&&!R(P))throw new T(\"stream\",[\"ReadableStream\",\"WritableStream\",\"Stream\"],P);return d.exports.addAbortSignalNoValidate($,P)},d.exports.addAbortSignalNoValidate=function(O,$){if(typeof O!=\"object\"||!(\"aborted\"in O))return $;const P=A($)?()=>{$.destroy(new c(void 0,{cause:O.reason}))}:()=>{$[n](new c(void 0,{cause:O.reason}))};if(O.aborted)P();else{W=W||Ne().addAbortListener;const Y=W(O,P);C($,Y[s])}return $}})),or=Ee(((E,d)=>{var{StringPrototypeSlice:s,SymbolIterator:c,TypedArrayPrototypeSet:_,Uint8Array:A}=Ie(),{Buffer:R}=Oe(),{inspect:n}=Ne();d.exports=class{constructor(){this.head=null,this.tail=null,this.length=0}push(T){const W={data:T,next:null};this.length>0?this.tail.next=W:this.head=W,this.tail=W,++this.length}unshift(T){const W={data:T,next:this.head};this.length===0&&(this.tail=W),this.head=W,++this.length}shift(){if(this.length===0)return;const T=this.head.data;return this.length===1?this.head=this.tail=null:this.head=this.head.next,--this.length,T}clear(){this.head=this.tail=null,this.length=0}join(T){if(this.length===0)return\"\";let W=this.head,L=\"\"+W.data;for(;(W=W.next)!==null;)L+=T+W.data;return L}concat(T){if(this.length===0)return R.alloc(0);const W=R.allocUnsafe(T>>>0);let L=this.head,O=0;for(;L;)_(W,L.data,O),O+=L.data.length,L=L.next;return W}consume(T,W){const L=this.head.data;if(T<L.length){const O=L.slice(0,T);return this.head.data=L.slice(T),O}return T===L.length?this.shift():W?this._getString(T):this._getBuffer(T)}first(){return this.head.data}*[c](){for(let T=this.head;T;T=T.next)yield T.data}_getString(T){let W=\"\",L=this.head,O=0;do{const $=L.data;if(T>$.length)W+=$,T-=$.length;else{T===$.length?(W+=$,++O,L.next?this.head=L.next:this.head=this.tail=null):(W+=s($,0,T),this.head=L,L.data=s($,T));break}++O}while((L=L.next)!==null);return this.length-=O,W}_getBuffer(T){const W=R.allocUnsafe(T),L=T;let O=this.head,$=0;do{const P=O.data;if(T>P.length)_(W,P,L-T),T-=P.length;else{T===P.length?(_(W,P,L-T),++$,O.next?this.head=O.next:this.head=this.tail=null):(_(W,new A(P.buffer,P.byteOffset,T),L-T),this.head=O,O.data=P.slice(T));break}++$}while((O=O.next)!==null);return this.length-=$,W}[Symbol.for(\"nodejs.util.inspect.custom\")](T,W){return n(this,{...W,depth:0,customInspect:!1})}}})),tt=Ee(((E,d)=>{var{MathFloor:s,NumberIsInteger:c}=Ie(),{validateInteger:_}=Xe(),{ERR_INVALID_ARG_VALUE:A}=xe().codes,R=16384,n=16;function C(O,$,P){return O.highWaterMark!=null?O.highWaterMark:$?O[P]:null}function T(O){return O?n:R}function W(O,$){_($,\"value\",0),O?n=$:R=$}function L(O,$,P,Y){const k=C($,Y,P);if(k!=null){if(!c(k)||k<0){const D=Y?`options.${P}`:\"options.highWaterMark\";throw new A(D,k)}return s(k)}return T(O.objectMode)}d.exports={getHighWaterMark:L,getDefaultHighWaterMark:T,setDefaultHighWaterMark:W}})),lr=Ee(((E,d)=>{var s=Oe(),c=s.Buffer;function _(R,n){for(var C in R)n[C]=R[C]}c.from&&c.alloc&&c.allocUnsafe&&c.allocUnsafeSlow?d.exports=s:(_(s,E),E.Buffer=A);function A(R,n,C){return c(R,n,C)}A.prototype=Object.create(c.prototype),_(c,A),A.from=function(R,n,C){if(typeof R==\"number\")throw new TypeError(\"Argument must not be a number\");return c(R,n,C)},A.alloc=function(R,n,C){if(typeof R!=\"number\")throw new TypeError(\"Argument must be a number\");var T=c(R);return n!==void 0?typeof C==\"string\"?T.fill(n,C):T.fill(n):T.fill(0),T},A.allocUnsafe=function(R){if(typeof R!=\"number\")throw new TypeError(\"Argument must be a number\");return c(R)},A.allocUnsafeSlow=function(R){if(typeof R!=\"number\")throw new TypeError(\"Argument must be a number\");return s.SlowBuffer(R)}})),ar=Ee((E=>{var d=lr().Buffer,s=d.isEncoding||function(l){switch(l=\"\"+l,l&&l.toLowerCase()){case\"hex\":case\"utf8\":case\"utf-8\":case\"ascii\":case\"binary\":case\"base64\":case\"ucs2\":case\"ucs-2\":case\"utf16le\":case\"utf-16le\":case\"raw\":return!0;default:return!1}};function c(l){if(!l)return\"utf8\";for(var w;;)switch(l){case\"utf8\":case\"utf-8\":return\"utf8\";case\"ucs2\":case\"ucs-2\":case\"utf16le\":case\"utf-16le\":return\"utf16le\";case\"latin1\":case\"binary\":return\"latin1\";case\"base64\":case\"ascii\":case\"hex\":return l;default:if(w)return;l=(\"\"+l).toLowerCase(),w=!0}}function _(l){var w=c(l);if(typeof w!=\"string\"&&(d.isEncoding===s||!s(l)))throw new Error(\"Unknown encoding: \"+l);return w||l}E.StringDecoder=A;function A(l){this.encoding=_(l);var w;switch(this.encoding){case\"utf16le\":this.text=O,this.end=$,w=4;break;case\"utf8\":this.fillLast=T,w=4;break;case\"base64\":this.text=P,this.end=Y,w=3;break;default:this.write=k,this.end=D;return}this.lastNeed=0,this.lastTotal=0,this.lastChar=d.allocUnsafe(w)}A.prototype.write=function(l){if(l.length===0)return\"\";var w,S;if(this.lastNeed){if(w=this.fillLast(l),w===void 0)return\"\";S=this.lastNeed,this.lastNeed=0}else S=0;return S<l.length?w?w+this.text(l,S):this.text(l,S):w||\"\"},A.prototype.end=L,A.prototype.text=W,A.prototype.fillLast=function(l){if(this.lastNeed<=l.length)return l.copy(this.lastChar,this.lastTotal-this.lastNeed,0,this.lastNeed),this.lastChar.toString(this.encoding,0,this.lastTotal);l.copy(this.lastChar,this.lastTotal-this.lastNeed,0,l.length),this.lastNeed-=l.length};function R(l){return l<=127?0:l>>5===6?2:l>>4===14?3:l>>3===30?4:l>>6===2?-1:-2}function n(l,w,S){var y=w.length-1;if(y<S)return 0;var f=R(w[y]);return f>=0?(f>0&&(l.lastNeed=f-1),f):--y<S||f===-2?0:(f=R(w[y]),f>=0?(f>0&&(l.lastNeed=f-2),f):--y<S||f===-2?0:(f=R(w[y]),f>=0?(f>0&&(f===2?f=0:l.lastNeed=f-3),f):0))}function C(l,w,S){if((w[0]&192)!==128)return l.lastNeed=0,\"�\";if(l.lastNeed>1&&w.length>1){if((w[1]&192)!==128)return l.lastNeed=1,\"�\";if(l.lastNeed>2&&w.length>2&&(w[2]&192)!==128)return l.lastNeed=2,\"�\"}}function T(l){var w=this.lastTotal-this.lastNeed,S=C(this,l,w);if(S!==void 0)return S;if(this.lastNeed<=l.length)return l.copy(this.lastChar,w,0,this.lastNeed),this.lastChar.toString(this.encoding,0,this.lastTotal);l.copy(this.lastChar,w,0,l.length),this.lastNeed-=l.length}function W(l,w){var S=n(this,l,w);if(!this.lastNeed)return l.toString(\"utf8\",w);this.lastTotal=S;var y=l.length-(S-this.lastNeed);return l.copy(this.lastChar,0,y),l.toString(\"utf8\",w,y)}function L(l){var w=l&&l.length?this.write(l):\"\";return this.lastNeed?w+\"�\":w}function O(l,w){if((l.length-w)%2===0){var S=l.toString(\"utf16le\",w);if(S){var y=S.charCodeAt(S.length-1);if(y>=55296&&y<=56319)return this.lastNeed=2,this.lastTotal=4,this.lastChar[0]=l[l.length-2],this.lastChar[1]=l[l.length-1],S.slice(0,-1)}return S}return this.lastNeed=1,this.lastTotal=2,this.lastChar[0]=l[l.length-1],l.toString(\"utf16le\",w,l.length-1)}function $(l){var w=l&&l.length?this.write(l):\"\";if(this.lastNeed){var S=this.lastTotal-this.lastNeed;return w+this.lastChar.toString(\"utf16le\",0,S)}return w}function P(l,w){var S=(l.length-w)%3;return S===0?l.toString(\"base64\",w):(this.lastNeed=3-S,this.lastTotal=3,S===1?this.lastChar[0]=l[l.length-1]:(this.lastChar[0]=l[l.length-2],this.lastChar[1]=l[l.length-1]),l.toString(\"base64\",w,l.length-S))}function Y(l){var w=l&&l.length?this.write(l):\"\";return this.lastNeed?w+this.lastChar.toString(\"base64\",0,3-this.lastNeed):w}function k(l){return l.toString(this.encoding)}function D(l){return l&&l.length?this.write(l):\"\"}})),Tt=Ee(((E,d)=>{var s=Ue(),{PromisePrototypeThen:c,SymbolAsyncIterator:_,SymbolIterator:A}=Ie(),{Buffer:R}=Oe(),{ERR_INVALID_ARG_TYPE:n,ERR_STREAM_NULL_VALUES:C}=xe().codes;function T(W,L,O){let $;if(typeof L==\"string\"||L instanceof R)return new W({objectMode:!0,...O,read(){this.push(L),this.push(null)}});let P;if(L&&L[_])P=!0,$=L[_]();else if(L&&L[A])P=!1,$=L[A]();else throw new n(\"iterable\",[\"Iterable\"],L);const Y=new W({objectMode:!0,highWaterMark:1,...O});let k=!1;Y._read=function(){k||(k=!0,l())},Y._destroy=function(w,S){c(D(w),()=>s.nextTick(S,w),y=>s.nextTick(S,y||w))};async function D(w){const S=w!=null,y=typeof $.throw==\"function\";if(S&&y){const{value:f,done:h}=await $.throw(w);if(await f,h)return}if(typeof $.return==\"function\"){const{value:f}=await $.return();await f}}async function l(){for(;;){try{const{value:w,done:S}=P?await $.next():$.next();if(S)Y.push(null);else{const y=w&&typeof w.then==\"function\"?await w:w;if(y===null)throw k=!1,new C;if(Y.push(y))continue;k=!1}}catch(w){Y.destroy(w)}break}}return Y}d.exports=T})),rt=Ee(((E,d)=>{var s=Ue(),{ArrayPrototypeIndexOf:c,NumberIsInteger:_,NumberIsNaN:A,NumberParseInt:R,ObjectDefineProperties:n,ObjectKeys:C,ObjectSetPrototypeOf:T,Promise:W,SafeSet:L,SymbolAsyncDispose:O,SymbolAsyncIterator:$,Symbol:P}=Ie();d.exports=J,J.ReadableState=oe;var{EventEmitter:Y}=ze(),{Stream:k,prependListener:D}=ut(),{Buffer:l}=Oe(),{addAbortSignal:w}=et(),S=We(),y=Ne().debuglog(\"stream\",o=>{y=o}),f=or(),h=He(),{getHighWaterMark:x,getDefaultHighWaterMark:z}=tt(),{aggregateTwoErrors:U,codes:{ERR_INVALID_ARG_TYPE:ue,ERR_METHOD_NOT_IMPLEMENTED:m,ERR_OUT_OF_RANGE:N,ERR_STREAM_PUSH_AFTER_EOF:V,ERR_STREAM_UNSHIFT_AFTER_END_EVENT:I},AbortError:ae}=xe(),{validateObject:se}=Xe(),he=P(\"kPaused\"),{StringDecoder:_e}=ar(),H=Tt();T(J.prototype,k.prototype),T(J,k);var ie=()=>{},{errorOrDestroy:u}=h,X=1,le=2,F=4,de=8,be=16,ve=32,we=64,K=128,G=256,ne=512,pe=1024,ye=2048,g=4096,v=8192,M=16384,Q=32768,ee=65536,Z=1<<17,b=1<<18;function q(o){return{enumerable:!1,get(){return(this.state&o)!==0},set(a){a?this.state|=o:this.state&=~o}}}n(oe.prototype,{objectMode:q(X),ended:q(le),endEmitted:q(F),reading:q(de),constructed:q(be),sync:q(ve),needReadable:q(we),emittedReadable:q(K),readableListening:q(G),resumeScheduled:q(ne),errorEmitted:q(pe),emitClose:q(ye),autoDestroy:q(g),destroyed:q(v),closed:q(M),closeEmitted:q(Q),multiAwaitDrain:q(ee),readingMore:q(Z),dataEmitted:q(b)});function oe(o,a,te){typeof te!=\"boolean\"&&(te=a instanceof Ce()),this.state=6192,o&&o.objectMode&&(this.state|=X),te&&o&&o.readableObjectMode&&(this.state|=X),this.highWaterMark=o?x(this,o,\"readableHighWaterMark\",te):z(!1),this.buffer=new f,this.length=0,this.pipes=[],this.flowing=null,this[he]=null,o&&o.emitClose===!1&&(this.state&=-2049),o&&o.autoDestroy===!1&&(this.state&=-4097),this.errored=null,this.defaultEncoding=o&&o.defaultEncoding||\"utf8\",this.awaitDrainWriters=null,this.decoder=null,this.encoding=null,o&&o.encoding&&(this.decoder=new _e(o.encoding),this.encoding=o.encoding)}function J(o){if(!(this instanceof J))return new J(o);const a=this instanceof Ce();this._readableState=new oe(o,this,a),o&&(typeof o.read==\"function\"&&(this._read=o.read),typeof o.destroy==\"function\"&&(this._destroy=o.destroy),typeof o.construct==\"function\"&&(this._construct=o.construct),o.signal&&!a&&w(o.signal,this)),k.call(this,o),h.construct(this,()=>{this._readableState.needReadable&&j(this,this._readableState)})}J.prototype.destroy=h.destroy,J.prototype._undestroy=h.undestroy,J.prototype._destroy=function(o,a){a(o)},J.prototype[Y.captureRejectionSymbol]=function(o){this.destroy(o)},J.prototype[O]=function(){let o;return this.destroyed||(o=this.readableEnded?null:new ae,this.destroy(o)),new W((a,te)=>S(this,re=>re&&re!==o?te(re):a(null)))},J.prototype.push=function(o,a){return fe(this,o,a,!1)},J.prototype.unshift=function(o,a){return fe(this,o,a,!0)};function fe(o,a,te,re){y(\"readableAddChunk\",a);const ce=o._readableState;let Be;if((ce.state&X)===0&&(typeof a==\"string\"?(te=te||ce.defaultEncoding,ce.encoding!==te&&(re&&ce.encoding?a=l.from(a,te).toString(ce.encoding):(a=l.from(a,te),te=\"\"))):a instanceof l?te=\"\":k._isUint8Array(a)?(a=k._uint8ArrayToBuffer(a),te=\"\"):a!=null&&(Be=new ue(\"chunk\",[\"string\",\"Buffer\",\"Uint8Array\"],a))),Be)u(o,Be);else if(a===null)ce.state&=-9,i(o,ce);else if((ce.state&X)!==0||a&&a.length>0)if(re)if((ce.state&F)!==0)u(o,new I);else{if(ce.destroyed||ce.errored)return!1;Le(o,ce,a,!0)}else if(ce.ended)u(o,new V);else{if(ce.destroyed||ce.errored)return!1;ce.state&=-9,ce.decoder&&!te?(a=ce.decoder.write(a),ce.objectMode||a.length!==0?Le(o,ce,a,!1):j(o,ce)):Le(o,ce,a,!1)}else re||(ce.state&=-9,j(o,ce));return!ce.ended&&(ce.length<ce.highWaterMark||ce.length===0)}function Le(o,a,te,re){a.flowing&&a.length===0&&!a.sync&&o.listenerCount(\"data\")>0?((a.state&ee)!==0?a.awaitDrainWriters.clear():a.awaitDrainWriters=null,a.dataEmitted=!0,o.emit(\"data\",te)):(a.length+=a.objectMode?1:te.length,re?a.buffer.unshift(te):a.buffer.push(te),(a.state&we)!==0&&p(o)),j(o,a)}J.prototype.isPaused=function(){const o=this._readableState;return o[he]===!0||o.flowing===!1},J.prototype.setEncoding=function(o){const a=new _e(o);this._readableState.decoder=a,this._readableState.encoding=this._readableState.decoder.encoding;const te=this._readableState.buffer;let re=\"\";for(const ce of te)re+=a.write(ce);return te.clear(),re!==\"\"&&te.push(re),this._readableState.length=re.length,this};var r=1073741824;function e(o){if(o>r)throw new N(\"size\",\"<= 1GiB\",o);return o--,o|=o>>>1,o|=o>>>2,o|=o>>>4,o|=o>>>8,o|=o>>>16,o++,o}function t(o,a){return o<=0||a.length===0&&a.ended?0:(a.state&X)!==0?1:A(o)?a.flowing&&a.length?a.buffer.first().length:a.length:o<=a.length?o:a.ended?a.length:0}J.prototype.read=function(o){y(\"read\",o),o===void 0?o=NaN:_(o)||(o=R(o,10));const a=this._readableState,te=o;if(o>a.highWaterMark&&(a.highWaterMark=e(o)),o!==0&&(a.state&=-129),o===0&&a.needReadable&&((a.highWaterMark!==0?a.length>=a.highWaterMark:a.length>0)||a.ended))return y(\"read: emitReadable\",a.length,a.ended),a.length===0&&a.ended?ht(this):p(this),null;if(o=t(o,a),o===0&&a.ended)return a.length===0&&ht(this),null;let re=(a.state&we)!==0;if(y(\"need readable\",re),(a.length===0||a.length-o<a.highWaterMark)&&(re=!0,y(\"length less than watermark\",re)),a.ended||a.reading||a.destroyed||a.errored||!a.constructed)re=!1,y(\"reading, ended or constructing\",re);else if(re){y(\"do read\"),a.state|=40,a.length===0&&(a.state|=we);try{this._read(a.highWaterMark)}catch(Be){u(this,Be)}a.state&=-33,a.reading||(o=t(te,a))}let ce;return o>0?ce=kt(o,a):ce=null,ce===null?(a.needReadable=a.length<=a.highWaterMark,o=0):(a.length-=o,a.multiAwaitDrain?a.awaitDrainWriters.clear():a.awaitDrainWriters=null),a.length===0&&(a.ended||(a.needReadable=!0),te!==o&&a.ended&&ht(this)),ce!==null&&!a.errorEmitted&&!a.closeEmitted&&(a.dataEmitted=!0,this.emit(\"data\",ce)),ce};function i(o,a){if(y(\"onEofChunk\"),!a.ended){if(a.decoder){const te=a.decoder.end();te&&te.length&&(a.buffer.push(te),a.length+=a.objectMode?1:te.length)}a.ended=!0,a.sync?p(o):(a.needReadable=!1,a.emittedReadable=!0,B(o))}}function p(o){const a=o._readableState;y(\"emitReadable\",a.needReadable,a.emittedReadable),a.needReadable=!1,a.emittedReadable||(y(\"emitReadable\",a.flowing),a.emittedReadable=!0,s.nextTick(B,o))}function B(o){const a=o._readableState;y(\"emitReadable_\",a.destroyed,a.length,a.ended),!a.destroyed&&!a.errored&&(a.length||a.ended)&&(o.emit(\"readable\"),a.emittedReadable=!1),a.needReadable=!a.flowing&&!a.ended&&a.length<=a.highWaterMark,Ot(o)}function j(o,a){!a.readingMore&&a.constructed&&(a.readingMore=!0,s.nextTick(ge,o,a))}function ge(o,a){for(;!a.reading&&!a.ended&&(a.length<a.highWaterMark||a.flowing&&a.length===0);){const te=a.length;if(y(\"maybeReadMore read 0\"),o.read(0),te===a.length)break}a.readingMore=!1}J.prototype._read=function(o){throw new m(\"_read()\")},J.prototype.pipe=function(o,a){const te=this,re=this._readableState;re.pipes.length===1&&(re.multiAwaitDrain||(re.multiAwaitDrain=!0,re.awaitDrainWriters=new L(re.awaitDrainWriters?[re.awaitDrainWriters]:[]))),re.pipes.push(o),y(\"pipe count=%d opts=%j\",re.pipes.length,a);const ce=(!a||a.end!==!1)&&o!==s.stdout&&o!==s.stderr?Pe:Je;re.endEmitted?s.nextTick(ce):te.once(\"end\",ce),o.on(\"unpipe\",Be);function Be($e,De){y(\"onunpipe\"),$e===te&&De&&De.hasUnpiped===!1&&(De.hasUnpiped=!0,wr())}function Pe(){y(\"onend\"),o.end()}let Fe,Dt=!1;function wr(){y(\"cleanup\"),o.removeListener(\"close\",bt),o.removeListener(\"finish\",wt),Fe&&o.removeListener(\"drain\",Fe),o.removeListener(\"error\",yt),o.removeListener(\"unpipe\",Be),te.removeListener(\"end\",Pe),te.removeListener(\"end\",Je),te.removeListener(\"data\",Wt),Dt=!0,Fe&&re.awaitDrainWriters&&(!o._writableState||o._writableState.needDrain)&&Fe()}function Ut(){Dt||(re.pipes.length===1&&re.pipes[0]===o?(y(\"false write response, pause\",0),re.awaitDrainWriters=o,re.multiAwaitDrain=!1):re.pipes.length>1&&re.pipes.includes(o)&&(y(\"false write response, pause\",re.awaitDrainWriters.size),re.awaitDrainWriters.add(o)),te.pause()),Fe||(Fe=Re(te,o),o.on(\"drain\",Fe))}te.on(\"data\",Wt);function Wt($e){y(\"ondata\");const De=o.write($e);y(\"dest.write\",De),De===!1&&Ut()}function yt($e){if(y(\"onerror\",$e),Je(),o.removeListener(\"error\",yt),o.listenerCount(\"error\")===0){const De=o._writableState||o._readableState;De&&!De.errorEmitted?u(o,$e):o.emit(\"error\",$e)}}D(o,\"error\",yt);function bt(){o.removeListener(\"finish\",wt),Je()}o.once(\"close\",bt);function wt(){y(\"onfinish\"),o.removeListener(\"close\",bt),Je()}o.once(\"finish\",wt);function Je(){y(\"unpipe\"),te.unpipe(o)}return o.emit(\"pipe\",te),o.writableNeedDrain===!0?Ut():re.flowing||(y(\"pipe resume\"),te.resume()),o};function Re(o,a){return function(){const re=o._readableState;re.awaitDrainWriters===a?(y(\"pipeOnDrain\",1),re.awaitDrainWriters=null):re.multiAwaitDrain&&(y(\"pipeOnDrain\",re.awaitDrainWriters.size),re.awaitDrainWriters.delete(a)),(!re.awaitDrainWriters||re.awaitDrainWriters.size===0)&&o.listenerCount(\"data\")&&o.resume()}}J.prototype.unpipe=function(o){const a=this._readableState,te={hasUnpiped:!1};if(a.pipes.length===0)return this;if(!o){const ce=a.pipes;a.pipes=[],this.pause();for(let Be=0;Be<ce.length;Be++)ce[Be].emit(\"unpipe\",this,{hasUnpiped:!1});return this}const re=c(a.pipes,o);return re===-1?this:(a.pipes.splice(re,1),a.pipes.length===0&&this.pause(),o.emit(\"unpipe\",this,te),this)},J.prototype.on=function(o,a){const te=k.prototype.on.call(this,o,a),re=this._readableState;return o===\"data\"?(re.readableListening=this.listenerCount(\"readable\")>0,re.flowing!==!1&&this.resume()):o===\"readable\"&&!re.endEmitted&&!re.readableListening&&(re.readableListening=re.needReadable=!0,re.flowing=!1,re.emittedReadable=!1,y(\"on readable\",re.length,re.reading),re.length?p(this):re.reading||s.nextTick(Te,this)),te},J.prototype.addListener=J.prototype.on,J.prototype.removeListener=function(o,a){const te=k.prototype.removeListener.call(this,o,a);return o===\"readable\"&&s.nextTick(me,this),te},J.prototype.off=J.prototype.removeListener,J.prototype.removeAllListeners=function(o){const a=k.prototype.removeAllListeners.apply(this,arguments);return(o===\"readable\"||o===void 0)&&s.nextTick(me,this),a};function me(o){const a=o._readableState;a.readableListening=o.listenerCount(\"readable\")>0,a.resumeScheduled&&a[he]===!1?a.flowing=!0:o.listenerCount(\"data\")>0?o.resume():a.readableListening||(a.flowing=null)}function Te(o){y(\"readable nexttick read 0\"),o.read(0)}J.prototype.resume=function(){const o=this._readableState;return o.flowing||(y(\"resume\"),o.flowing=!o.readableListening,Se(this,o)),o[he]=!1,this};function Se(o,a){a.resumeScheduled||(a.resumeScheduled=!0,s.nextTick(hr,o,a))}function hr(o,a){y(\"resume\",a.reading),a.reading||o.read(0),a.resumeScheduled=!1,o.emit(\"resume\"),Ot(o),a.flowing&&!a.reading&&o.read(0)}J.prototype.pause=function(){return y(\"call pause flowing=%j\",this._readableState.flowing),this._readableState.flowing!==!1&&(y(\"pause\"),this._readableState.flowing=!1,this.emit(\"pause\")),this._readableState[he]=!0,this};function Ot(o){const a=o._readableState;for(y(\"flow\",a.flowing);a.flowing&&o.read()!==null;);}J.prototype.wrap=function(o){let a=!1;o.on(\"data\",re=>{!this.push(re)&&o.pause&&(a=!0,o.pause())}),o.on(\"end\",()=>{this.push(null)}),o.on(\"error\",re=>{u(this,re)}),o.on(\"close\",()=>{this.destroy()}),o.on(\"destroy\",()=>{this.destroy()}),this._read=()=>{a&&o.resume&&(a=!1,o.resume())};const te=C(o);for(let re=1;re<te.length;re++){const ce=te[re];this[ce]===void 0&&typeof o[ce]==\"function\"&&(this[ce]=o[ce].bind(o))}return this},J.prototype[$]=function(){return Mt(this)},J.prototype.iterator=function(o){return o!==void 0&&se(o,\"options\"),Mt(this,o)};function Mt(o,a){typeof o.read!=\"function\"&&(o=J.wrap(o,{objectMode:!0}));const te=pr(o,a);return te.stream=o,te}async function*pr(o,a){let te=ie;function re(Pe){this===o?(te(),te=ie):te=Pe}o.on(\"readable\",re);let ce;const Be=S(o,{writable:!1},Pe=>{ce=Pe?U(ce,Pe):null,te(),te=ie});try{for(;;){const Pe=o.destroyed?null:o.read();if(Pe!==null)yield Pe;else{if(ce)throw ce;if(ce===null)return;await new W(re)}}}catch(Pe){throw ce=U(ce,Pe),ce}finally{(ce||a?.destroyOnReturn!==!1)&&(ce===void 0||o._readableState.autoDestroy)?h.destroyer(o,null):(o.off(\"readable\",re),Be())}}n(J.prototype,{readable:{__proto__:null,get(){const o=this._readableState;return!!o&&o.readable!==!1&&!o.destroyed&&!o.errorEmitted&&!o.endEmitted},set(o){this._readableState&&(this._readableState.readable=!!o)}},readableDidRead:{__proto__:null,enumerable:!1,get:function(){return this._readableState.dataEmitted}},readableAborted:{__proto__:null,enumerable:!1,get:function(){return!!(this._readableState.readable!==!1&&(this._readableState.destroyed||this._readableState.errored)&&!this._readableState.endEmitted)}},readableHighWaterMark:{__proto__:null,enumerable:!1,get:function(){return this._readableState.highWaterMark}},readableBuffer:{__proto__:null,enumerable:!1,get:function(){return this._readableState&&this._readableState.buffer}},readableFlowing:{__proto__:null,enumerable:!1,get:function(){return this._readableState.flowing},set:function(o){this._readableState&&(this._readableState.flowing=o)}},readableLength:{__proto__:null,enumerable:!1,get(){return this._readableState.length}},readableObjectMode:{__proto__:null,enumerable:!1,get(){return this._readableState?this._readableState.objectMode:!1}},readableEncoding:{__proto__:null,enumerable:!1,get(){return this._readableState?this._readableState.encoding:null}},errored:{__proto__:null,enumerable:!1,get(){return this._readableState?this._readableState.errored:null}},closed:{__proto__:null,get(){return this._readableState?this._readableState.closed:!1}},destroyed:{__proto__:null,enumerable:!1,get(){return this._readableState?this._readableState.destroyed:!1},set(o){this._readableState&&(this._readableState.destroyed=o)}},readableEnded:{__proto__:null,enumerable:!1,get(){return this._readableState?this._readableState.endEmitted:!1}}}),n(oe.prototype,{pipesCount:{__proto__:null,get(){return this.pipes.length}},paused:{__proto__:null,get(){return this[he]!==!1},set(o){this[he]=!!o}}}),J._fromList=kt;function kt(o,a){if(a.length===0)return null;let te;return a.objectMode?te=a.buffer.shift():!o||o>=a.length?(a.decoder?te=a.buffer.join(\"\"):a.buffer.length===1?te=a.buffer.first():te=a.buffer.concat(a.length),a.buffer.clear()):te=a.buffer.consume(o,a.decoder),te}function ht(o){const a=o._readableState;y(\"endReadable\",a.endEmitted),a.endEmitted||(a.ended=!0,s.nextTick(yr,a,o))}function yr(o,a){if(y(\"endReadableNT\",o.endEmitted,o.length),!o.errored&&!o.closeEmitted&&!o.endEmitted&&o.length===0){if(o.endEmitted=!0,a.emit(\"end\"),a.writable&&a.allowHalfOpen===!1)s.nextTick(br,a);else if(o.autoDestroy){const te=a._writableState;(!te||te.autoDestroy&&(te.finished||te.writable===!1))&&a.destroy()}}}function br(o){o.writable&&!o.writableEnded&&!o.destroyed&&o.end()}J.from=function(o,a){return H(J,o,a)};var pt;function Ct(){return pt===void 0&&(pt={}),pt}J.fromWeb=function(o,a){return Ct().newStreamReadableFromReadableStream(o,a)},J.toWeb=function(o,a){return Ct().newReadableStreamFromStreamReadable(o,a)},J.wrap=function(o,a){var te,re;return new J({objectMode:(te=(re=o.readableObjectMode)!==null&&re!==void 0?re:o.objectMode)!==null&&te!==void 0?te:!0,...a,destroy(ce,Be){h.destroyer(o,ce),Be(ce)}}).wrap(o)}})),ft=Ee(((E,d)=>{var s=Ue(),{ArrayPrototypeSlice:c,Error:_,FunctionPrototypeSymbolHasInstance:A,ObjectDefineProperty:R,ObjectDefineProperties:n,ObjectSetPrototypeOf:C,StringPrototypeToLowerCase:T,Symbol:W,SymbolHasInstance:L}=Ie();d.exports=se,se.WritableState=I;var{EventEmitter:O}=ze(),$=ut().Stream,{Buffer:P}=Oe(),Y=He(),{addAbortSignal:k}=et(),{getHighWaterMark:D,getDefaultHighWaterMark:l}=tt(),{ERR_INVALID_ARG_TYPE:w,ERR_METHOD_NOT_IMPLEMENTED:S,ERR_MULTIPLE_CALLBACK:y,ERR_STREAM_CANNOT_PIPE:f,ERR_STREAM_DESTROYED:h,ERR_STREAM_ALREADY_FINISHED:x,ERR_STREAM_NULL_VALUES:z,ERR_STREAM_WRITE_AFTER_END:U,ERR_UNKNOWN_ENCODING:ue}=xe().codes,{errorOrDestroy:m}=Y;C(se.prototype,$.prototype),C(se,$);function N(){}var V=W(\"kOnFinished\");function I(g,v,M){typeof M!=\"boolean\"&&(M=v instanceof Ce()),this.objectMode=!!(g&&g.objectMode),M&&(this.objectMode=this.objectMode||!!(g&&g.writableObjectMode)),this.highWaterMark=g?D(this,g,\"writableHighWaterMark\",M):l(!1),this.finalCalled=!1,this.needDrain=!1,this.ending=!1,this.ended=!1,this.finished=!1,this.destroyed=!1;const Q=!!(g&&g.decodeStrings===!1);this.decodeStrings=!Q,this.defaultEncoding=g&&g.defaultEncoding||\"utf8\",this.length=0,this.writing=!1,this.corked=0,this.sync=!0,this.bufferProcessing=!1,this.onwrite=u.bind(void 0,v),this.writecb=null,this.writelen=0,this.afterWriteTickInfo=null,ae(this),this.pendingcb=0,this.constructed=!0,this.prefinished=!1,this.errorEmitted=!1,this.emitClose=!g||g.emitClose!==!1,this.autoDestroy=!g||g.autoDestroy!==!1,this.errored=null,this.closed=!1,this.closeEmitted=!1,this[V]=[]}function ae(g){g.buffered=[],g.bufferedIndex=0,g.allBuffers=!0,g.allNoop=!0}I.prototype.getBuffer=function(){return c(this.buffered,this.bufferedIndex)},R(I.prototype,\"bufferedRequestCount\",{__proto__:null,get(){return this.buffered.length-this.bufferedIndex}});function se(g){const v=this instanceof Ce();if(!v&&!A(se,this))return new se(g);this._writableState=new I(g,this,v),g&&(typeof g.write==\"function\"&&(this._write=g.write),typeof g.writev==\"function\"&&(this._writev=g.writev),typeof g.destroy==\"function\"&&(this._destroy=g.destroy),typeof g.final==\"function\"&&(this._final=g.final),typeof g.construct==\"function\"&&(this._construct=g.construct),g.signal&&k(g.signal,this)),$.call(this,g),Y.construct(this,()=>{const M=this._writableState;M.writing||de(this,M),K(this,M)})}R(se,L,{__proto__:null,value:function(g){return A(this,g)?!0:this!==se?!1:g&&g._writableState instanceof I}}),se.prototype.pipe=function(){m(this,new f)};function he(g,v,M,Q){const ee=g._writableState;if(typeof M==\"function\")Q=M,M=ee.defaultEncoding;else{if(!M)M=ee.defaultEncoding;else if(M!==\"buffer\"&&!P.isEncoding(M))throw new ue(M);typeof Q!=\"function\"&&(Q=N)}if(v===null)throw new z;if(!ee.objectMode)if(typeof v==\"string\")ee.decodeStrings!==!1&&(v=P.from(v,M),M=\"buffer\");else if(v instanceof P)M=\"buffer\";else if($._isUint8Array(v))v=$._uint8ArrayToBuffer(v),M=\"buffer\";else throw new w(\"chunk\",[\"string\",\"Buffer\",\"Uint8Array\"],v);let Z;return ee.ending?Z=new U:ee.destroyed&&(Z=new h(\"write\")),Z?(s.nextTick(Q,Z),m(g,Z,!0),Z):(ee.pendingcb++,_e(g,ee,v,M,Q))}se.prototype.write=function(g,v,M){return he(this,g,v,M)===!0},se.prototype.cork=function(){this._writableState.corked++},se.prototype.uncork=function(){const g=this._writableState;g.corked&&(g.corked--,g.writing||de(this,g))},se.prototype.setDefaultEncoding=function(v){if(typeof v==\"string\"&&(v=T(v)),!P.isEncoding(v))throw new ue(v);return this._writableState.defaultEncoding=v,this};function _e(g,v,M,Q,ee){const Z=v.objectMode?1:M.length;v.length+=Z;const b=v.length<v.highWaterMark;return b||(v.needDrain=!0),v.writing||v.corked||v.errored||!v.constructed?(v.buffered.push({chunk:M,encoding:Q,callback:ee}),v.allBuffers&&Q!==\"buffer\"&&(v.allBuffers=!1),v.allNoop&&ee!==N&&(v.allNoop=!1)):(v.writelen=Z,v.writecb=ee,v.writing=!0,v.sync=!0,g._write(M,Q,v.onwrite),v.sync=!1),b&&!v.errored&&!v.destroyed}function H(g,v,M,Q,ee,Z,b){v.writelen=Q,v.writecb=b,v.writing=!0,v.sync=!0,v.destroyed?v.onwrite(new h(\"write\")):M?g._writev(ee,v.onwrite):g._write(ee,Z,v.onwrite),v.sync=!1}function ie(g,v,M,Q){--v.pendingcb,Q(M),F(v),m(g,M)}function u(g,v){const M=g._writableState,Q=M.sync,ee=M.writecb;if(typeof ee!=\"function\"){m(g,new y);return}M.writing=!1,M.writecb=null,M.length-=M.writelen,M.writelen=0,v?(v.stack,M.errored||(M.errored=v),g._readableState&&!g._readableState.errored&&(g._readableState.errored=v),Q?s.nextTick(ie,g,M,v,ee):ie(g,M,v,ee)):(M.buffered.length>M.bufferedIndex&&de(g,M),Q?M.afterWriteTickInfo!==null&&M.afterWriteTickInfo.cb===ee?M.afterWriteTickInfo.count++:(M.afterWriteTickInfo={count:1,cb:ee,stream:g,state:M},s.nextTick(X,M.afterWriteTickInfo)):le(g,M,1,ee))}function X({stream:g,state:v,count:M,cb:Q}){return v.afterWriteTickInfo=null,le(g,v,M,Q)}function le(g,v,M,Q){for(!v.ending&&!g.destroyed&&v.length===0&&v.needDrain&&(v.needDrain=!1,g.emit(\"drain\"));M-- >0;)v.pendingcb--,Q();v.destroyed&&F(v),K(g,v)}function F(g){if(g.writing)return;for(let ee=g.bufferedIndex;ee<g.buffered.length;++ee){var v;const{chunk:Z,callback:b}=g.buffered[ee],q=g.objectMode?1:Z.length;g.length-=q,b((v=g.errored)!==null&&v!==void 0?v:new h(\"write\"))}const M=g[V].splice(0);for(let ee=0;ee<M.length;ee++){var Q;M[ee]((Q=g.errored)!==null&&Q!==void 0?Q:new h(\"end\"))}ae(g)}function de(g,v){if(v.corked||v.bufferProcessing||v.destroyed||!v.constructed)return;const{buffered:M,bufferedIndex:Q,objectMode:ee}=v,Z=M.length-Q;if(!Z)return;let b=Q;if(v.bufferProcessing=!0,Z>1&&g._writev){v.pendingcb-=Z-1;const q=v.allNoop?N:J=>{for(let fe=b;fe<M.length;++fe)M[fe].callback(J)},oe=v.allNoop&&b===0?M:c(M,b);oe.allBuffers=v.allBuffers,H(g,v,!0,v.length,oe,\"\",q),ae(v)}else{do{const{chunk:q,encoding:oe,callback:J}=M[b];M[b++]=null,H(g,v,!1,ee?1:q.length,q,oe,J)}while(b<M.length&&!v.writing);b===M.length?ae(v):b>256?(M.splice(0,b),v.bufferedIndex=0):v.bufferedIndex=b}v.bufferProcessing=!1}se.prototype._write=function(g,v,M){if(this._writev)this._writev([{chunk:g,encoding:v}],M);else throw new S(\"_write()\")},se.prototype._writev=null,se.prototype.end=function(g,v,M){const Q=this._writableState;typeof g==\"function\"?(M=g,g=null,v=null):typeof v==\"function\"&&(M=v,v=null);let ee;if(g!=null){const Z=he(this,g,v);Z instanceof _&&(ee=Z)}return Q.corked&&(Q.corked=1,this.uncork()),ee||(!Q.errored&&!Q.ending?(Q.ending=!0,K(this,Q,!0),Q.ended=!0):Q.finished?ee=new x(\"end\"):Q.destroyed&&(ee=new h(\"end\"))),typeof M==\"function\"&&(ee||Q.finished?s.nextTick(M,ee):Q[V].push(M)),this};function be(g){return g.ending&&!g.destroyed&&g.constructed&&g.length===0&&!g.errored&&g.buffered.length===0&&!g.finished&&!g.writing&&!g.errorEmitted&&!g.closeEmitted}function ve(g,v){let M=!1;function Q(ee){if(M){m(g,ee??y());return}if(M=!0,v.pendingcb--,ee){const Z=v[V].splice(0);for(let b=0;b<Z.length;b++)Z[b](ee);m(g,ee,v.sync)}else be(v)&&(v.prefinished=!0,g.emit(\"prefinish\"),v.pendingcb++,s.nextTick(G,g,v))}v.sync=!0,v.pendingcb++;try{g._final(Q)}catch(ee){Q(ee)}v.sync=!1}function we(g,v){!v.prefinished&&!v.finalCalled&&(typeof g._final==\"function\"&&!v.destroyed?(v.finalCalled=!0,ve(g,v)):(v.prefinished=!0,g.emit(\"prefinish\")))}function K(g,v,M){be(v)&&(we(g,v),v.pendingcb===0&&(M?(v.pendingcb++,s.nextTick((Q,ee)=>{be(ee)?G(Q,ee):ee.pendingcb--},g,v)):be(v)&&(v.pendingcb++,G(g,v))))}function G(g,v){v.pendingcb--,v.finished=!0;const M=v[V].splice(0);for(let Q=0;Q<M.length;Q++)M[Q]();if(g.emit(\"finish\"),v.autoDestroy){const Q=g._readableState;(!Q||Q.autoDestroy&&(Q.endEmitted||Q.readable===!1))&&g.destroy()}}n(se.prototype,{closed:{__proto__:null,get(){return this._writableState?this._writableState.closed:!1}},destroyed:{__proto__:null,get(){return this._writableState?this._writableState.destroyed:!1},set(g){this._writableState&&(this._writableState.destroyed=g)}},writable:{__proto__:null,get(){const g=this._writableState;return!!g&&g.writable!==!1&&!g.destroyed&&!g.errored&&!g.ending&&!g.ended},set(g){this._writableState&&(this._writableState.writable=!!g)}},writableFinished:{__proto__:null,get(){return this._writableState?this._writableState.finished:!1}},writableObjectMode:{__proto__:null,get(){return this._writableState?this._writableState.objectMode:!1}},writableBuffer:{__proto__:null,get(){return this._writableState&&this._writableState.getBuffer()}},writableEnded:{__proto__:null,get(){return this._writableState?this._writableState.ending:!1}},writableNeedDrain:{__proto__:null,get(){const g=this._writableState;return g?!g.destroyed&&!g.ending&&g.needDrain:!1}},writableHighWaterMark:{__proto__:null,get(){return this._writableState&&this._writableState.highWaterMark}},writableCorked:{__proto__:null,get(){return this._writableState?this._writableState.corked:0}},writableLength:{__proto__:null,get(){return this._writableState&&this._writableState.length}},errored:{__proto__:null,enumerable:!1,get(){return this._writableState?this._writableState.errored:null}},writableAborted:{__proto__:null,enumerable:!1,get:function(){return!!(this._writableState.writable!==!1&&(this._writableState.destroyed||this._writableState.errored)&&!this._writableState.finished)}}});var ne=Y.destroy;se.prototype.destroy=function(g,v){const M=this._writableState;return!M.destroyed&&(M.bufferedIndex<M.buffered.length||M[V].length)&&s.nextTick(F,M),ne.call(this,g,v),this},se.prototype._undestroy=Y.undestroy,se.prototype._destroy=function(g,v){v(g)},se.prototype[O.captureRejectionSymbol]=function(g){this.destroy(g)};var pe;function ye(){return pe===void 0&&(pe={}),pe}se.fromWeb=function(g,v){return ye().newStreamWritableFromWritableStream(g,v)},se.toWeb=function(g){return ye().newWritableStreamFromStreamWritable(g)}})),sr=Ee(((E,d)=>{var s=Ue(),c=Oe(),{isReadable:_,isWritable:A,isIterable:R,isNodeStream:n,isReadableNodeStream:C,isWritableNodeStream:T,isDuplexNodeStream:W,isReadableStream:L,isWritableStream:O}=ke(),$=We(),{AbortError:P,codes:{ERR_INVALID_ARG_TYPE:Y,ERR_INVALID_RETURN_VALUE:k}}=xe(),{destroyer:D}=He(),l=Ce(),w=rt(),S=ft(),{createDeferredPromise:y}=Ne(),f=Tt(),h=globalThis.Blob||c.Blob,x=typeof h<\"u\"?function(I){return I instanceof h}:function(I){return!1},z=globalThis.AbortController||Ke().AbortController,{FunctionPrototypeCall:U}=Ie(),ue=class extends l{constructor(V){super(V),V?.readable===!1&&(this._readableState.readable=!1,this._readableState.ended=!0,this._readableState.endEmitted=!0),V?.writable===!1&&(this._writableState.writable=!1,this._writableState.ending=!0,this._writableState.ended=!0,this._writableState.finished=!0)}};d.exports=function V(I,ae){if(W(I))return I;if(C(I))return N({readable:I});if(T(I))return N({writable:I});if(n(I))return N({writable:!1,readable:!1});if(L(I))return N({readable:w.fromWeb(I)});if(O(I))return N({writable:S.fromWeb(I)});if(typeof I==\"function\"){const{value:he,write:_e,final:H,destroy:ie}=m(I);if(R(he))return f(ue,he,{objectMode:!0,write:_e,final:H,destroy:ie});const u=he?.then;if(typeof u==\"function\"){let X;const le=U(u,he,F=>{if(F!=null)throw new k(\"nully\",\"body\",F)},F=>{D(X,F)});return X=new ue({objectMode:!0,readable:!1,write:_e,final(F){H(async()=>{try{await le,s.nextTick(F,null)}catch(de){s.nextTick(F,de)}})},destroy:ie})}throw new k(\"Iterable, AsyncIterable or AsyncFunction\",ae,he)}if(x(I))return V(I.arrayBuffer());if(R(I))return f(ue,I,{objectMode:!0,writable:!1});if(L(I?.readable)&&O(I?.writable))return ue.fromWeb(I);if(typeof I?.writable==\"object\"||typeof I?.readable==\"object\")return N({readable:I!=null&&I.readable?C(I?.readable)?I?.readable:V(I.readable):void 0,writable:I!=null&&I.writable?T(I?.writable)?I?.writable:V(I.writable):void 0});const se=I?.then;if(typeof se==\"function\"){let he;return U(se,I,_e=>{_e!=null&&he.push(_e),he.push(null)},_e=>{D(he,_e)}),he=new ue({objectMode:!0,writable:!1,read(){}})}throw new Y(ae,[\"Blob\",\"ReadableStream\",\"WritableStream\",\"Stream\",\"Iterable\",\"AsyncIterable\",\"Function\",\"{ readable, writable } pair\",\"Promise\"],I)};function m(V){let{promise:I,resolve:ae}=y();const se=new z,he=se.signal;return{value:V((async function*(){for(;;){const _e=I;I=null;const{chunk:H,done:ie,cb:u}=await _e;if(s.nextTick(u),ie)return;if(he.aborted)throw new P(void 0,{cause:he.reason});({promise:I,resolve:ae}=y()),yield H}})(),{signal:he}),write(_e,H,ie){const u=ae;ae=null,u({chunk:_e,done:!1,cb:ie})},final(_e){const H=ae;ae=null,H({done:!0,cb:_e})},destroy(_e,H){se.abort(),H(_e)}}}function N(V){const I=V.readable&&typeof V.readable.read!=\"function\"?w.wrap(V.readable):V.readable,ae=V.writable;let se=!!_(I),he=!!A(ae),_e,H,ie,u,X;function le(F){const de=u;u=null,de?de(F):F&&X.destroy(F)}return X=new ue({readableObjectMode:!!(I!=null&&I.readableObjectMode),writableObjectMode:!!(ae!=null&&ae.writableObjectMode),readable:se,writable:he}),he&&($(ae,F=>{he=!1,F&&D(I,F),le(F)}),X._write=function(F,de,be){ae.write(F,de)?be():_e=be},X._final=function(F){ae.end(),H=F},ae.on(\"drain\",function(){if(_e){const F=_e;_e=null,F()}}),ae.on(\"finish\",function(){if(H){const F=H;H=null,F()}})),se&&($(I,F=>{se=!1,F&&D(I,F),le(F)}),I.on(\"readable\",function(){if(ie){const F=ie;ie=null,F()}}),I.on(\"end\",function(){X.push(null)}),X._read=function(){for(;;){const F=I.read();if(F===null){ie=X._read;return}if(!X.push(F))return}}),X._destroy=function(F,de){!F&&u!==null&&(F=new P),ie=null,_e=null,H=null,u===null?de(F):(u=de,D(ae,F),D(I,F))},X}})),Ce=Ee(((E,d)=>{var{ObjectDefineProperties:s,ObjectGetOwnPropertyDescriptor:c,ObjectKeys:_,ObjectSetPrototypeOf:A}=Ie();d.exports=C;var R=rt(),n=ft();A(C.prototype,R.prototype),A(C,R);{const O=_(n.prototype);for(let $=0;$<O.length;$++){const P=O[$];C.prototype[P]||(C.prototype[P]=n.prototype[P])}}function C(O){if(!(this instanceof C))return new C(O);R.call(this,O),n.call(this,O),O?(this.allowHalfOpen=O.allowHalfOpen!==!1,O.readable===!1&&(this._readableState.readable=!1,this._readableState.ended=!0,this._readableState.endEmitted=!0),O.writable===!1&&(this._writableState.writable=!1,this._writableState.ending=!0,this._writableState.ended=!0,this._writableState.finished=!0)):this.allowHalfOpen=!0}s(C.prototype,{writable:{__proto__:null,...c(n.prototype,\"writable\")},writableHighWaterMark:{__proto__:null,...c(n.prototype,\"writableHighWaterMark\")},writableObjectMode:{__proto__:null,...c(n.prototype,\"writableObjectMode\")},writableBuffer:{__proto__:null,...c(n.prototype,\"writableBuffer\")},writableLength:{__proto__:null,...c(n.prototype,\"writableLength\")},writableFinished:{__proto__:null,...c(n.prototype,\"writableFinished\")},writableCorked:{__proto__:null,...c(n.prototype,\"writableCorked\")},writableEnded:{__proto__:null,...c(n.prototype,\"writableEnded\")},writableNeedDrain:{__proto__:null,...c(n.prototype,\"writableNeedDrain\")},destroyed:{__proto__:null,get(){return this._readableState===void 0||this._writableState===void 0?!1:this._readableState.destroyed&&this._writableState.destroyed},set(O){this._readableState&&this._writableState&&(this._readableState.destroyed=O,this._writableState.destroyed=O)}}});var T;function W(){return T===void 0&&(T={}),T}C.fromWeb=function(O,$){return W().newStreamDuplexFromReadableWritablePair(O,$)},C.toWeb=function(O){return W().newReadableWritablePairFromDuplex(O)};var L;C.from=function(O){return L||(L=sr()),L(O,\"body\")}})),It=Ee(((E,d)=>{var{ObjectSetPrototypeOf:s,Symbol:c}=Ie();d.exports=C;var{ERR_METHOD_NOT_IMPLEMENTED:_}=xe().codes,A=Ce(),{getHighWaterMark:R}=tt();s(C.prototype,A.prototype),s(C,A);var n=c(\"kCallback\");function C(L){if(!(this instanceof C))return new C(L);const O=L?R(this,L,\"readableHighWaterMark\",!0):null;O===0&&(L={...L,highWaterMark:null,readableHighWaterMark:O,writableHighWaterMark:L.writableHighWaterMark||0}),A.call(this,L),this._readableState.sync=!1,this[n]=null,L&&(typeof L.transform==\"function\"&&(this._transform=L.transform),typeof L.flush==\"function\"&&(this._flush=L.flush)),this.on(\"prefinish\",W)}function T(L){typeof this._flush==\"function\"&&!this.destroyed?this._flush((O,$)=>{if(O){L?L(O):this.destroy(O);return}$!=null&&this.push($),this.push(null),L&&L()}):(this.push(null),L&&L())}function W(){this._final!==T&&T.call(this)}C.prototype._final=T,C.prototype._transform=function(L,O,$){throw new _(\"_transform()\")},C.prototype._write=function(L,O,$){const P=this._readableState,Y=this._writableState,k=P.length;this._transform(L,O,(D,l)=>{if(D){$(D);return}l!=null&&this.push(l),Y.ended||k===P.length||P.length<P.highWaterMark?$():this[n]=$})},C.prototype._read=function(){if(this[n]){const L=this[n];this[n]=null,L()}}})),Bt=Ee(((E,d)=>{var{ObjectSetPrototypeOf:s}=Ie();d.exports=_;var c=It();s(_.prototype,c.prototype),s(_,c);function _(A){if(!(this instanceof _))return new _(A);c.call(this,A)}_.prototype._transform=function(A,R,n){n(null,A)}})),ct=Ee(((E,d)=>{var s=Ue(),{ArrayIsArray:c,Promise:_,SymbolAsyncIterator:A,SymbolDispose:R}=Ie(),n=We(),{once:C}=Ne(),T=He(),W=Ce(),{aggregateTwoErrors:L,codes:{ERR_INVALID_ARG_TYPE:O,ERR_INVALID_RETURN_VALUE:$,ERR_MISSING_ARGS:P,ERR_STREAM_DESTROYED:Y,ERR_STREAM_PREMATURE_CLOSE:k},AbortError:D}=xe(),{validateFunction:l,validateAbortSignal:w}=Xe(),{isIterable:S,isReadable:y,isReadableNodeStream:f,isNodeStream:h,isTransformStream:x,isWebStream:z,isReadableStream:U,isReadableFinished:ue}=ke(),m=globalThis.AbortController||Ke().AbortController,N,V,I;function ae(F,de,be){let ve=!1;return F.on(\"close\",()=>{ve=!0}),{destroy:we=>{ve||(ve=!0,T.destroyer(F,we||new Y(\"pipe\")))},cleanup:n(F,{readable:de,writable:be},we=>{ve=!we})}}function se(F){return l(F[F.length-1],\"streams[stream.length - 1]\"),F.pop()}function he(F){if(S(F))return F;if(f(F))return _e(F);throw new O(\"val\",[\"Readable\",\"Iterable\",\"AsyncIterable\"],F)}async function*_e(F){V||(V=rt()),yield*V.prototype[A].call(F)}async function H(F,de,be,{end:ve}){let we,K=null;const G=ye=>{if(ye&&(we=ye),K){const g=K;K=null,g()}},ne=()=>new _((ye,g)=>{we?g(we):K=()=>{we?g(we):ye()}});de.on(\"drain\",G);const pe=n(de,{readable:!1},G);try{de.writableNeedDrain&&await ne();for await(const ye of F)de.write(ye)||await ne();ve&&(de.end(),await ne()),be()}catch(ye){be(we!==ye?L(we,ye):ye)}finally{pe(),de.off(\"drain\",G)}}async function ie(F,de,be,{end:ve}){x(de)&&(de=de.writable);const we=de.getWriter();try{for await(const K of F)await we.ready,we.write(K).catch(()=>{});await we.ready,ve&&await we.close(),be()}catch(K){try{await we.abort(K),be(K)}catch(G){be(G)}}}function u(...F){return X(F,C(se(F)))}function X(F,de,be){if(F.length===1&&c(F[0])&&(F=F[0]),F.length<2)throw new P(\"streams\");const ve=new m,we=ve.signal,K=be?.signal,G=[];w(K,\"options.signal\");function ne(){ee(new D)}I=I||Ne().addAbortListener;let pe;K&&(pe=I(K,ne));let ye,g;const v=[];let M=0;function Q(J){ee(J,--M===0)}function ee(J,fe){var Le;if(J&&(!ye||ye.code===\"ERR_STREAM_PREMATURE_CLOSE\")&&(ye=J),!(!ye&&!fe)){for(;v.length;)v.shift()(ye);(Le=pe)===null||Le===void 0||Le[R](),ve.abort(),fe&&(ye||G.forEach(r=>r()),s.nextTick(de,ye,g))}}let Z;for(let J=0;J<F.length;J++){const fe=F[J],Le=J<F.length-1,r=J>0,e=Le||be?.end!==!1,t=J===F.length-1;if(h(fe)){let i=function(p){p&&p.name!==\"AbortError\"&&p.code!==\"ERR_STREAM_PREMATURE_CLOSE\"&&Q(p)};var oe=i;if(e){const{destroy:p,cleanup:B}=ae(fe,Le,r);v.push(p),y(fe)&&t&&G.push(B)}fe.on(\"error\",i),y(fe)&&t&&G.push(()=>{fe.removeListener(\"error\",i)})}if(J===0)if(typeof fe==\"function\"){if(Z=fe({signal:we}),!S(Z))throw new $(\"Iterable, AsyncIterable or Stream\",\"source\",Z)}else S(fe)||f(fe)||x(fe)?Z=fe:Z=W.from(fe);else if(typeof fe==\"function\"){if(x(Z)){var b;Z=he((b=Z)===null||b===void 0?void 0:b.readable)}else Z=he(Z);if(Z=fe(Z,{signal:we}),Le){if(!S(Z,!0))throw new $(\"AsyncIterable\",`transform[${J-1}]`,Z)}else{var q;N||(N=Bt());const i=new N({objectMode:!0}),p=(q=Z)===null||q===void 0?void 0:q.then;if(typeof p==\"function\")M++,p.call(Z,ge=>{g=ge,ge!=null&&i.write(ge),e&&i.end(),s.nextTick(Q)},ge=>{i.destroy(ge),s.nextTick(Q,ge)});else if(S(Z,!0))M++,H(Z,i,Q,{end:e});else if(U(Z)||x(Z)){const ge=Z.readable||Z;M++,H(ge,i,Q,{end:e})}else throw new $(\"AsyncIterable or Promise\",\"destination\",Z);Z=i;const{destroy:B,cleanup:j}=ae(Z,!1,!0);v.push(B),t&&G.push(j)}}else if(h(fe)){if(f(Z)){M+=2;const i=le(Z,fe,Q,{end:e});y(fe)&&t&&G.push(i)}else if(x(Z)||U(Z)){const i=Z.readable||Z;M++,H(i,fe,Q,{end:e})}else if(S(Z))M++,H(Z,fe,Q,{end:e});else throw new O(\"val\",[\"Readable\",\"Iterable\",\"AsyncIterable\",\"ReadableStream\",\"TransformStream\"],Z);Z=fe}else if(z(fe)){if(f(Z))M++,ie(he(Z),fe,Q,{end:e});else if(U(Z)||S(Z))M++,ie(Z,fe,Q,{end:e});else if(x(Z))M++,ie(Z.readable,fe,Q,{end:e});else throw new O(\"val\",[\"Readable\",\"Iterable\",\"AsyncIterable\",\"ReadableStream\",\"TransformStream\"],Z);Z=fe}else Z=W.from(fe)}return(we!=null&&we.aborted||K!=null&&K.aborted)&&s.nextTick(ne),Z}function le(F,de,be,{end:ve}){let we=!1;if(de.on(\"close\",()=>{we||be(new k)}),F.pipe(de,{end:!1}),ve){let G=function(){we=!0,de.end()};var K=G;ue(F)?s.nextTick(G):F.once(\"end\",G)}else be();return n(F,{readable:!0,writable:!1},G=>{const ne=F._readableState;G&&G.code===\"ERR_STREAM_PREMATURE_CLOSE\"&&ne&&ne.ended&&!ne.errored&&!ne.errorEmitted?F.once(\"end\",be).once(\"error\",be):be(G)}),n(de,{readable:!1,writable:!0},be)}d.exports={pipelineImpl:X,pipeline:u}})),xt=Ee(((E,d)=>{var{pipeline:s}=ct(),c=Ce(),{destroyer:_}=He(),{isNodeStream:A,isReadable:R,isWritable:n,isWebStream:C,isTransformStream:T,isWritableStream:W,isReadableStream:L}=ke(),{AbortError:O,codes:{ERR_INVALID_ARG_VALUE:$,ERR_MISSING_ARGS:P}}=xe(),Y=We();d.exports=function(...D){if(D.length===0)throw new P(\"streams\");if(D.length===1)return c.from(D[0]);const l=[...D];if(typeof D[0]==\"function\"&&(D[0]=c.from(D[0])),typeof D[D.length-1]==\"function\"){const N=D.length-1;D[N]=c.from(D[N])}for(let N=0;N<D.length;++N)if(!(!A(D[N])&&!C(D[N]))){if(N<D.length-1&&!(R(D[N])||L(D[N])||T(D[N])))throw new $(`streams[${N}]`,l[N],\"must be readable\");if(N>0&&!(n(D[N])||W(D[N])||T(D[N])))throw new $(`streams[${N}]`,l[N],\"must be writable\")}let w,S,y,f,h;function x(N){const V=f;f=null,V?V(N):N?h.destroy(N):!m&&!ue&&h.destroy()}const z=D[0],U=s(D,x),ue=!!(n(z)||W(z)||T(z)),m=!!(R(U)||L(U)||T(U));if(h=new c({writableObjectMode:!!(z!=null&&z.writableObjectMode),readableObjectMode:!!(U!=null&&U.readableObjectMode),writable:ue,readable:m}),ue){if(A(z))h._write=function(V,I,ae){z.write(V,I)?ae():w=ae},h._final=function(V){z.end(),S=V},z.on(\"drain\",function(){if(w){const V=w;w=null,V()}});else if(C(z)){const V=(T(z)?z.writable:z).getWriter();h._write=async function(I,ae,se){try{await V.ready,V.write(I).catch(()=>{}),se()}catch(he){se(he)}},h._final=async function(I){try{await V.ready,V.close().catch(()=>{}),S=I}catch(ae){I(ae)}}}const N=T(U)?U.readable:U;Y(N,()=>{if(S){const V=S;S=null,V()}})}if(m){if(A(U))U.on(\"readable\",function(){if(y){const N=y;y=null,N()}}),U.on(\"end\",function(){h.push(null)}),h._read=function(){for(;;){const N=U.read();if(N===null){y=h._read;return}if(!h.push(N))return}};else if(C(U)){const N=(T(U)?U.readable:U).getReader();h._read=async function(){for(;;)try{const{value:V,done:I}=await N.read();if(!h.push(V))return;if(I){h.push(null);return}}catch{return}}}}return h._destroy=function(N,V){!N&&f!==null&&(N=new O),y=null,w=null,S=null,f===null?V(N):(f=V,A(U)&&_(U,N))},h}})),ur=Ee(((E,d)=>{var s=globalThis.AbortController||Ke().AbortController,{codes:{ERR_INVALID_ARG_VALUE:c,ERR_INVALID_ARG_TYPE:_,ERR_MISSING_ARGS:A,ERR_OUT_OF_RANGE:R},AbortError:n}=xe(),{validateAbortSignal:C,validateInteger:T,validateObject:W}=Xe(),L=Ie().Symbol(\"kWeak\"),O=Ie().Symbol(\"kResistStopPropagation\"),{finished:$}=We(),P=xt(),{addAbortSignalNoValidate:Y}=et(),{isWritable:k,isNodeStream:D}=ke(),{deprecate:l}=Ne(),{ArrayPrototypePush:w,Boolean:S,MathFloor:y,Number:f,NumberIsNaN:h,Promise:x,PromiseReject:z,PromiseResolve:U,PromisePrototypeThen:ue,Symbol:m}=Ie(),N=m(\"kEmpty\"),V=m(\"kEof\");function I(K,G){if(G!=null&&W(G,\"options\"),G?.signal!=null&&C(G.signal,\"options.signal\"),D(K)&&!k(K))throw new c(\"stream\",K,\"must be writable\");const ne=P(this,K);return G!=null&&G.signal&&Y(G.signal,ne),ne}function ae(K,G){if(typeof K!=\"function\")throw new _(\"fn\",[\"Function\",\"AsyncFunction\"],K);G!=null&&W(G,\"options\"),G?.signal!=null&&C(G.signal,\"options.signal\");let ne=1;G?.concurrency!=null&&(ne=y(G.concurrency));let pe=ne-1;return G?.highWaterMark!=null&&(pe=y(G.highWaterMark)),T(ne,\"options.concurrency\",1),T(pe,\"options.highWaterMark\",0),pe+=ne,async function*(){const g=Ne().AbortSignalAny([G?.signal].filter(S)),v=this,M=[],Q={signal:g};let ee,Z,b=!1,q=0;function oe(){b=!0,J()}function J(){q-=1,fe()}function fe(){Z&&!b&&q<ne&&M.length<pe&&(Z(),Z=null)}async function Le(){try{for await(let r of v){if(b)return;if(g.aborted)throw new n;try{if(r=K(r,Q),r===N)continue;r=U(r)}catch(e){r=z(e)}q+=1,ue(r,J,oe),M.push(r),ee&&(ee(),ee=null),!b&&(M.length>=pe||q>=ne)&&await new x(e=>{Z=e})}M.push(V)}catch(r){const e=z(r);ue(e,J,oe),M.push(e)}finally{b=!0,ee&&(ee(),ee=null)}}Le();try{for(;;){for(;M.length>0;){const r=await M[0];if(r===V)return;if(g.aborted)throw new n;r!==N&&(yield r),M.shift(),fe()}await new x(r=>{ee=r})}}finally{b=!0,Z&&(Z(),Z=null)}}.call(this)}function se(K=void 0){return K!=null&&W(K,\"options\"),K?.signal!=null&&C(K.signal,\"options.signal\"),async function*(){let ne=0;for await(const ye of this){var pe;if(K!=null&&(pe=K.signal)!==null&&pe!==void 0&&pe.aborted)throw new n({cause:K.signal.reason});yield[ne++,ye]}}.call(this)}async function he(K,G=void 0){for await(const ne of u.call(this,K,G))return!0;return!1}async function _e(K,G=void 0){if(typeof K!=\"function\")throw new _(\"fn\",[\"Function\",\"AsyncFunction\"],K);return!await he.call(this,async(...ne)=>!await K(...ne),G)}async function H(K,G){for await(const ne of u.call(this,K,G))return ne}async function ie(K,G){if(typeof K!=\"function\")throw new _(\"fn\",[\"Function\",\"AsyncFunction\"],K);async function ne(pe,ye){return await K(pe,ye),N}for await(const pe of ae.call(this,ne,G));}function u(K,G){if(typeof K!=\"function\")throw new _(\"fn\",[\"Function\",\"AsyncFunction\"],K);async function ne(pe,ye){return await K(pe,ye)?pe:N}return ae.call(this,ne,G)}var X=class extends A{constructor(){super(\"reduce\"),this.message=\"Reduce of an empty stream requires an initial value\"}};async function le(K,G,ne){var pe;if(typeof K!=\"function\")throw new _(\"reducer\",[\"Function\",\"AsyncFunction\"],K);ne!=null&&W(ne,\"options\"),ne?.signal!=null&&C(ne.signal,\"options.signal\");let ye=arguments.length>1;if(ne!=null&&(pe=ne.signal)!==null&&pe!==void 0&&pe.aborted){const ee=new n(void 0,{cause:ne.signal.reason});throw this.once(\"error\",()=>{}),await $(this.destroy(ee)),ee}const g=new s,v=g.signal;if(ne!=null&&ne.signal){const ee={once:!0,[L]:this,[O]:!0};ne.signal.addEventListener(\"abort\",()=>g.abort(),ee)}let M=!1;try{for await(const ee of this){var Q;if(M=!0,ne!=null&&(Q=ne.signal)!==null&&Q!==void 0&&Q.aborted)throw new n;ye?G=await K(G,ee,{signal:v}):(G=ee,ye=!0)}if(!M&&!ye)throw new X}finally{g.abort()}return G}async function F(K){K!=null&&W(K,\"options\"),K?.signal!=null&&C(K.signal,\"options.signal\");const G=[];for await(const pe of this){var ne;if(K!=null&&(ne=K.signal)!==null&&ne!==void 0&&ne.aborted)throw new n(void 0,{cause:K.signal.reason});w(G,pe)}return G}function de(K,G){const ne=ae.call(this,K,G);return async function*(){for await(const ye of ne)yield*ye}.call(this)}function be(K){if(K=f(K),h(K))return 0;if(K<0)throw new R(\"number\",\">= 0\",K);return K}function ve(K,G=void 0){return G!=null&&W(G,\"options\"),G?.signal!=null&&C(G.signal,\"options.signal\"),K=be(K),async function*(){var pe;if(G!=null&&(pe=G.signal)!==null&&pe!==void 0&&pe.aborted)throw new n;for await(const g of this){var ye;if(G!=null&&(ye=G.signal)!==null&&ye!==void 0&&ye.aborted)throw new n;K--<=0&&(yield g)}}.call(this)}function we(K,G=void 0){return G!=null&&W(G,\"options\"),G?.signal!=null&&C(G.signal,\"options.signal\"),K=be(K),async function*(){var pe;if(G!=null&&(pe=G.signal)!==null&&pe!==void 0&&pe.aborted)throw new n;for await(const g of this){var ye;if(G!=null&&(ye=G.signal)!==null&&ye!==void 0&&ye.aborted)throw new n;if(K-- >0&&(yield g),K<=0)return}}.call(this)}d.exports.streamReturningOperators={asIndexedPairs:l(se,\"readable.asIndexedPairs will be removed in a future version.\"),drop:ve,filter:u,flatMap:de,map:ae,take:we,compose:I},d.exports.promiseReturningOperators={every:_e,forEach:ie,reduce:le,toArray:F,some:he,find:H}})),Lt=Ee(((E,d)=>{var{ArrayPrototypePop:s,Promise:c}=Ie(),{isIterable:_,isNodeStream:A,isWebStream:R}=ke(),{pipelineImpl:n}=ct(),{finished:C}=We();Nt();function T(...W){return new c((L,O)=>{let $,P;const Y=W[W.length-1];if(Y&&typeof Y==\"object\"&&!A(Y)&&!_(Y)&&!R(Y)){const k=s(W);$=k.signal,P=k.end}n(W,(k,D)=>{k?O(k):L(D)},{signal:$,end:P})})}d.exports={finished:C,pipeline:T}})),Nt=Ee(((E,d)=>{var{Buffer:s}=Oe(),{ObjectDefineProperty:c,ObjectKeys:_,ReflectApply:A}=Ie(),{promisify:{custom:R}}=Ne(),{streamReturningOperators:n,promiseReturningOperators:C}=ur(),{codes:{ERR_ILLEGAL_CONSTRUCTOR:T}}=xe(),W=xt(),{setDefaultHighWaterMark:L,getDefaultHighWaterMark:O}=tt(),{pipeline:$}=ct(),{destroyer:P}=He(),Y=We(),k=Lt(),D=ke(),l=d.exports=ut().Stream;l.isDestroyed=D.isDestroyed,l.isDisturbed=D.isDisturbed,l.isErrored=D.isErrored,l.isReadable=D.isReadable,l.isWritable=D.isWritable,l.Readable=rt();for(const y of _(n)){let h=function(...x){if(new.target)throw T();return l.Readable.from(A(f,this,x))};var S=h;const f=n[y];c(h,\"name\",{__proto__:null,value:f.name}),c(h,\"length\",{__proto__:null,value:f.length}),c(l.Readable.prototype,y,{__proto__:null,value:h,enumerable:!1,configurable:!0,writable:!0})}for(const y of _(C)){let h=function(...z){if(new.target)throw T();return A(f,this,z)};var S=h;const f=C[y];c(h,\"name\",{__proto__:null,value:f.name}),c(h,\"length\",{__proto__:null,value:f.length}),c(l.Readable.prototype,y,{__proto__:null,value:h,enumerable:!1,configurable:!0,writable:!0})}l.Writable=ft(),l.Duplex=Ce(),l.Transform=It(),l.PassThrough=Bt(),l.pipeline=$;var{addAbortSignal:w}=et();l.addAbortSignal=w,l.finished=Y,l.destroy=P,l.compose=W,l.setDefaultHighWaterMark=L,l.getDefaultHighWaterMark=O,c(l,\"promises\",{__proto__:null,configurable:!0,enumerable:!0,get(){return k}}),c($,R,{__proto__:null,enumerable:!0,get(){return k.pipeline}}),c(Y,R,{__proto__:null,enumerable:!0,get(){return k.finished}}),l.Stream=l,l._isUint8Array=function(f){return f instanceof Uint8Array},l._uint8ArrayToBuffer=function(f){return s.from(f.buffer,f.byteOffset,f.byteLength)}})),fr=Ee(((E,d)=>{var s=Nt(),c=Lt(),_=s.Readable.destroy;d.exports=s.Readable,d.exports._uint8ArrayToBuffer=s._uint8ArrayToBuffer,d.exports._isUint8Array=s._isUint8Array,d.exports.isDisturbed=s.isDisturbed,d.exports.isErrored=s.isErrored,d.exports.isReadable=s.isReadable,d.exports.Readable=s.Readable,d.exports.Writable=s.Writable,d.exports.Duplex=s.Duplex,d.exports.Transform=s.Transform,d.exports.PassThrough=s.PassThrough,d.exports.addAbortSignal=s.addAbortSignal,d.exports.finished=s.finished,d.exports.destroy=s.destroy,d.exports.destroy=_,d.exports.pipeline=s.pipeline,d.exports.compose=s.compose,Object.defineProperty(s,\"promises\",{configurable:!0,enumerable:!0,get(){return c}}),d.exports.Stream=s.Stream,d.exports.default=d.exports})),je=Oe(),Pt=fr(),cr=ze(),dt=Vt(Ue(),1);function dr(E,d,s,c,_){const A=je.Buffer.from(E);let R=0;const n=(y,f)=>Object.assign(new Error(f),{code:y});function C(y){if(y===\"/dev/stdin\")return 0;if(y===\"/dev/stdout\")return 1;if(y===\"/dev/stderr\")return 2;if(y===0||y===1||y===2)return y;throw n(\"ENOSYS\",\"Only standard input/output file descriptors are supported by this runtime.\")}function T(y,f){if(C(y)!==0)throw n(\"EBADF\",\"File descriptor is not readable\");const h=typeof f==\"string\"?f:f?.encoding;if(h!=null&&!je.Buffer.isEncoding(h))throw new TypeError(\"Unknown encoding: \"+h);const x=je.Buffer.from(A.subarray(R));return R=A.length,h==null?x:x.toString(h)}function W(y,f,h=0,x=f.byteLength-h,z=null){if(C(y)!==0)throw n(\"EBADF\",\"File descriptor is not readable\");if(!ArrayBuffer.isView(f))throw new TypeError(\"buffer must be an ArrayBuffer view\");if(z!=null&&z!==-1)throw n(\"ESPIPE\",\"Standard input is not seekable\");if(!Number.isInteger(h)||!Number.isInteger(x)||h<0||x<0||h+x>f.byteLength)throw new RangeError(\"Read range is outside the buffer\");const U=Math.min(x,A.length-R);return new Uint8Array(f.buffer,f.byteOffset,f.byteLength).set(A.subarray(R,R+U),h),R+=U,U}function L(y,f){const h=C(y);if(h===0)throw n(\"EBADF\",\"File descriptor is not writable\");const x=Uint8Array.from(f);return(h===1?d:s)(x.buffer),x.byteLength}function O(y,f,h){const x=typeof h==\"string\"?h:h?.encoding;if(typeof f!=\"string\"&&!ArrayBuffer.isView(f))throw new TypeError(\"data must be a string or ArrayBuffer view\");L(y,typeof f==\"string\"?je.Buffer.from(f,x):new Uint8Array(f.buffer,f.byteOffset,f.byteLength))}function $(y,f,h,x,z){if(typeof f==\"string\"){if(h!=null&&h!==-1)throw n(\"ESPIPE\",\"Standard output is not seekable\");return L(y,je.Buffer.from(f,typeof x==\"string\"?x:\"utf8\"))}if(!ArrayBuffer.isView(f))throw new TypeError(\"buffer must be an ArrayBuffer view\");if(z!=null&&z!==-1)throw n(\"ESPIPE\",\"Standard output is not seekable\");if(h??(h=0),x??(x=f.byteLength-h),!Number.isInteger(h)||!Number.isInteger(x)||h<0||x<0||h+x>f.byteLength)throw new RangeError(\"Write range is outside the buffer\");return L(y,new Uint8Array(f.buffer,f.byteOffset+h,x))}const P=new Pt.Readable({read(y){if(R===A.length){this.push(null);return}const f=Math.min(A.length,R+y),h=je.Buffer.from(A.subarray(R,f));R=f,this.push(h)}});function Y(y){return new Pt.Writable({write(f,h,x){try{L(y,f),x()}catch(z){x(z)}}})}Object.assign(dt.default,{stdin:P,stdout:Y(1),stderr:Y(2),env:c,argv:_});class k extends cr.EventEmitter{constructor(f){if(super(),!f?.input||f.terminal)throw n(\"ENOSYS\",\"readline supports nonterminal input streams only\");this.input=f.input,this.closed=!1;let h=[],x=!1;this.onData=z=>{const U=typeof z==\"string\"?z:z.toString(\"utf8\");let ue=x&&U.startsWith(`\n`)?1:0;x=!1;const m=/\\r\\n|\\n|\\r/g;m.lastIndex=ue;let N;for(;(N=m.exec(U))!==null;)h.push(U.slice(ue,N.index)),this.emit(\"line\",h.join(\"\")),h=[],ue=m.lastIndex,x=N[0]===\"\\r\"&&ue===U.length;ue<U.length&&h.push(U.slice(ue))},this.onEnd=()=>{h.length&&this.emit(\"line\",h.join(\"\")),this.close()},this.onError=z=>this.emit(\"error\",z),this.input.setEncoding(\"utf8\"),this.input.on(\"data\",this.onData),this.input.on(\"end\",this.onEnd),this.input.on(\"error\",this.onError)}close(){this.closed||(this.closed=!0,this.input.pause(),this.input.removeListener(\"data\",this.onData),this.input.removeListener(\"end\",this.onEnd),this.input.removeListener(\"error\",this.onError),this.emit(\"close\"))}pause(){return this.input.pause(),this.emit(\"pause\"),this}resume(){return this.input.resume(),this.emit(\"resume\"),this}[Symbol.asyncIterator](){const f=[],h=[];return this.on(\"line\",x=>h.length?h.shift()({value:x,done:!1}):f.push(x)),this.on(\"close\",()=>{for(const x of h.splice(0))x({value:void 0,done:!0})}),{next:()=>f.length?Promise.resolve({value:f.shift(),done:!1}):this.closed?Promise.resolve({value:void 0,done:!0}):new Promise(x=>h.push(x)),return:async()=>(this.close(),{value:void 0,done:!0})}}}const D={readFileSync:T,readSync:W,writeFileSync:O,writeSync:$},l={createInterface:y=>new k(y),Interface:k},w={Buffer:je.Buffer},S=Object.create(null);for(const[y,f]of Object.entries({fs:D,process:dt.default,readline:l,buffer:w}))f.default=f,S[y]=f,S[\"node:\"+y]=f;return globalThis.Buffer=je.Buffer,globalThis.process=dt.default,{builtins:S,readAsString:()=>T(0,\"utf8\")}}return nt.createNodeStdio=dr,nt})({});\n";
Object.freeze({
	c: "cpp",
	cpp: "cpp",
	rust: "cargo",
	python: "pypi",
	javascript: "npm",
	typescript: "npm",
	go: "go"
});
`${GO_VERSION.split(".").slice(0, 2).join(".")}`;
Object.freeze({
	version: GO_VERSION,
	target: "wasip1/wasm",
	packageAsset: GO_PACKAGE_ASSET_PATH,
	packageCompressedSha256: GO_COMPRESSED_PACKAGE_SHA256,
	packageSha256: GO_PACKAGE_SHA256,
	manifestAsset: GO_PACKAGE_MANIFEST_ASSET_PATH,
	manifestSha256: GO_PACKAGE_MANIFEST_SHA256,
	standardLibraryAsset: GO_STANDARD_LIBRARY_ASSET_PATH,
	standardLibraryCompressedSha256: GO_COMPRESSED_STANDARD_LIBRARY_SHA256,
	standardLibrarySha256: GO_STANDARD_LIBRARY_SHA256,
	compilerSha256: GO_COMPILER_SHA256,
	linkerSha256: GO_LINKER_SHA256
});
//#endregion
//#region src/runtime/determinism.ts
var PYTHON_RUNNER_PATH = ".wasm-oj/deterministic_runner.py";
var RESERVED_ENVIRONMENT = /* @__PURE__ */ new Set([
	"WASM_OJ_RANDOM_SEED",
	"WASM_OJ_REALTIME_EPOCH_MS",
	"WASM_OJ_CLOCK_STEP_NS",
	"PYTHONHASHSEED",
	"TZ",
	"LC_ALL"
]);
function deterministicEnvironment(environment, config) {
	const determinism = resolveDeterminism(config);
	const conflict = Object.keys(environment).find((name) => RESERVED_ENVIRONMENT.has(name));
	if (conflict) throw new Error(`Environment variable '${conflict}' is reserved by the deterministic runner.`);
	return {
		...environment,
		WASM_OJ_RANDOM_SEED: String(determinism.randomSeed).padStart(10, "0"),
		WASM_OJ_REALTIME_EPOCH_MS: String(determinism.realtimeEpochMs).padStart(14, "0"),
		WASM_OJ_CLOCK_STEP_NS: String(determinism.clockStepNs).padStart(10, "0"),
		PYTHONHASHSEED: "0",
		TZ: "UTC",
		LC_ALL: "C"
	};
}
String.raw`
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>

#ifdef __cplusplus
extern "C" {
#endif

static uint32_t wasm_oj_random_state;
static int wasm_oj_initialized;

static uint64_t wasm_oj_parse_u64(const char *value) {
    if (!value || !*value) abort();
    uint64_t result = 0;
    for (const unsigned char *cursor = (const unsigned char *)value; *cursor; ++cursor) {
        if (*cursor < '0' || *cursor > '9') abort();
        uint64_t digit = (uint64_t)(*cursor - '0');
        if (result > (UINT64_MAX - digit) / 10) abort();
        result = result * 10 + digit;
    }
    return result;
}

static void wasm_oj_initialize(void) {
    if (wasm_oj_initialized) return;
    uint64_t seed = wasm_oj_parse_u64(getenv("WASM_OJ_RANDOM_SEED"));
    wasm_oj_random_state = (uint32_t)seed;
    wasm_oj_initialized = 1;
}

static uint32_t wasm_oj_next_u32(void) {
    wasm_oj_random_state += 0x9e3779b9u;
    uint32_t value = wasm_oj_random_state;
    value ^= value >> 16;
    value *= 0x21f0aaadu;
    value ^= value >> 15;
    value *= 0x735a2d97u;
    value ^= value >> 15;
    return value;
}

uint32_t __imported_wasi_snapshot_preview1_random_get(uint8_t *buffer, size_t length) {
    wasm_oj_initialize();
    uint32_t word = 0;
    for (size_t index = 0; index < length; ++index) {
        if ((index & 3u) == 0) word = wasm_oj_next_u32();
        buffer[index] = (uint8_t)(word >> ((index & 3u) * 8u));
    }
    return 0;
}

#ifdef __cplusplus
}
#endif
`;
String.raw`
import os as _os
import runpy as _runpy
import sys as _sys

_random_state = None

def _random_seed():
    global _random_state
    if _random_state is None:
        _random_state = int(_os.environ["WASM_OJ_RANDOM_SEED"]) & 0xffffffff
    return _random_state

def _next_u32():
    global _random_state
    _random_seed()
    _random_state = (_random_state + 0x9e3779b9) & 0xffffffff
    value = _random_state
    value ^= value >> 16
    value = (value * 0x21f0aaad) & 0xffffffff
    value ^= value >> 15
    value = (value * 0x735a2d97) & 0xffffffff
    value ^= value >> 15
    return value & 0xffffffff

def _urandom(length):
    if not isinstance(length, int) or length < 0:
        raise ValueError("negative argument not allowed")
    output = bytearray(length)
    word = 0
    for index in range(length):
        if index % 4 == 0:
            word = _next_u32()
        output[index] = (word >> ((index % 4) * 8)) & 0xff
    return bytes(output)

_os.urandom = _urandom
if hasattr(_os, "getrandom"):
    _os.getrandom = lambda size, flags=0: _urandom(size)

_entry = _sys.argv[1]
_sys.argv = [_entry, *_sys.argv[2:]]
_sys.path[0] = _os.path.dirname(_entry)
_runpy.run_path(_entry, run_name="__main__")
`;
function quickJsDeterminismPrelude(config) {
	resolveDeterminism(config);
	return String.raw`
const __wasmOjDeterminism = (() => {
  const readSeed = globalThis.__wasm_oj_determinism_seed;
  const readEpochMs = globalThis.__wasm_oj_determinism_epoch_ms;
  const readStepNs = globalThis.__wasm_oj_determinism_step_ns;
  delete globalThis.__wasm_oj_determinism_seed;
  delete globalThis.__wasm_oj_determinism_epoch_ms;
  delete globalThis.__wasm_oj_determinism_step_ns;
  let parsedConfig;
  const config = () => parsedConfig ??= Object.freeze({
    seed: readSeed(),
    epochMs: readEpochMs(),
    stepNs: readStepNs(),
  });
  let randomState;
  const NativeDate = Date;
  const nextU32 = () => {
    if (randomState === undefined) randomState = config().seed >>> 0;
    randomState = (randomState + 0x9e3779b9) >>> 0;
    let value = randomState;
    value ^= value >>> 16;
    value = Math.imul(value, 0x21f0aaad);
    value ^= value >>> 15;
    value = Math.imul(value, 0x735a2d97);
    value ^= value >>> 15;
    return value >>> 0;
  };
  Math.random = () => nextU32() / 4294967296;
  Object.defineProperty(globalThis, "performance", {
    value: Object.freeze({ now: () => NativeDate.now() - config().epochMs, get timeOrigin() { return config().epochMs; } }),
    configurable: true,
  });
  const getRandomValues = (view) => {
    const tag = Object.prototype.toString.call(view);
    const integerTypedArrays = [
      "[object Int8Array]", "[object Uint8Array]", "[object Uint8ClampedArray]",
      "[object Int16Array]", "[object Uint16Array]", "[object Int32Array]", "[object Uint32Array]",
      "[object BigInt64Array]", "[object BigUint64Array]",
    ];
    if (!integerTypedArrays.includes(tag)) throw new TypeError("Expected an integer TypedArray");
    const bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
    let word = 0;
    for (let index = 0; index < bytes.length; index += 1) {
      if (index % 4 === 0) word = nextU32();
      bytes[index] = (word >>> ((index % 4) * 8)) & 0xff;
    }
    return view;
  };
  const randomUUID = () => {
    const bytes = getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0"));
    return hex.slice(0, 4).join("") + "-" + hex.slice(4, 6).join("") + "-" + hex.slice(6, 8).join("") + "-" + hex.slice(8, 10).join("") + "-" + hex.slice(10).join("");
  };
  Object.defineProperty(globalThis, "crypto", {
    value: Object.freeze({ getRandomValues, randomUUID }),
    configurable: true,
  });
  return Object.freeze({ get seed() { return config().seed; }, get epochMs() { return config().epochMs; }, get stepNs() { return config().stepNs; } });
})();
`;
}
new TextEncoder().encode("WOJFS002");
var PYTHON_RUNTIME_FILES_CACHE_KEY = `${WASM_OJ_STORAGE$1.runtimeFilesCache}:cpython-3.14.7-wasip1-stdlib-stored-zip`;
var PYTHON_RUNTIME_FILES_EXPORT_SCRIPT = String.raw`
import io
import os
import sys
import zipfile

source_root = "/usr/local/lib/python3.14"
guest_path = "/cpython/lib/python314.zip"
output = sys.stdout.buffer
output.write(b"WOJFS002")

archive_buffer = io.BytesIO()
with zipfile.ZipFile(archive_buffer, "w", compression=zipfile.ZIP_STORED) as archive:
    for root, directories, files in os.walk(source_root):
        directories[:] = sorted(
            name for name in directories
            if name != "__pycache__" and not os.path.islink(os.path.join(root, name))
        )
        for name in sorted(files):
            source_path = os.path.join(root, name)
            if os.path.islink(source_path) or name.endswith((".pyc", ".pyo")):
                continue
            archive_path = os.path.relpath(source_path, source_root).replace(os.sep, "/")
            info = zipfile.ZipInfo(archive_path, date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_STORED
            info.external_attr = 0o100644 << 16
            with open(source_path, "rb") as source:
                archive.writestr(info, source.read())

encoded_path = guest_path.encode("utf-8")
archive_data = archive_buffer.getvalue()
output.write(len(encoded_path).to_bytes(4, "little"))
output.write(len(archive_data).to_bytes(8, "little"))
output.write(encoded_path)
output.write(archive_data)

output.write((0).to_bytes(4, "little"))
output.write((0).to_bytes(8, "little"))
`;
//#endregion
//#region src/runner/artifact.ts
var encoder = new TextEncoder();
var RUN_INPUT_LIMITS = Object.freeze({
	files: 256,
	bytesPerFile: 67108864,
	totalBytes: 134217728,
	stdinBytes: 67108864
});
var PREPARED_MOUNT_LIMITS = Object.freeze({
	files: 32768,
	bytesPerFile: 268435456,
	totalBytes: 536870912
});
var RuntimeDriverRegistry = class {
	drivers = [];
	sealed = false;
	register(driver) {
		if (this.sealed) throw new Error("RuntimeDriverRegistry is sealed after its first artifact lookup.");
		if (!driver || typeof driver !== "object") throw new TypeError("Runtime drivers must be objects.");
		if (typeof driver.id !== "string" || !driver.id || driver.id !== driver.id.trim() || driver.id.length > 128) throw new Error("Runtime driver IDs must be non-empty, trimmed, and at most 128 characters.");
		if (typeof driver.supports !== "function" || typeof driver.prepare !== "function") throw new TypeError(`Runtime driver '${driver.id}' must implement supports() and prepare().`);
		if (this.drivers.some((registered) => registered.id === driver.id)) throw new Error(`Runtime driver '${driver.id}' is already registered.`);
		this.drivers.push(driver);
	}
	driver(artifact) {
		this.sealed = true;
		const matches = this.drivers.filter((driver) => {
			const supported = driver.supports(artifact);
			if (typeof supported !== "boolean") throw new TypeError(`Runtime driver '${driver.id}' supports() must return a boolean.`);
			return supported;
		});
		if (matches.length !== 1) throw new Error(matches.length === 0 ? `No runtime driver supports '${artifact.kind}:${artifact.name}'.` : `Artifact '${artifact.name}' has ambiguous runtime drivers: ${matches.map((driver) => driver.id).join(", ")}.`);
		return matches[0];
	}
};
function baseRequest(artifact, wasm, config, costBaselines) {
	const cost = resolveArtifactCostBudget(artifact, config.resources.instructionBudget, costBaselines);
	const stdin = encoder.encode(config.stdin);
	if (stdin.byteLength > RUN_INPUT_LIMITS.stdinBytes) throw new Error(`Run stdin exceeds ${RUN_INPUT_LIMITS.stdinBytes} bytes.`);
	return {
		wasm,
		args: [...config.args],
		env: deterministicEnvironment(config.env, config.determinism),
		stdin,
		files: validatedRunFiles(config.files ?? {}),
		outputPaths: validatedOutputPaths(config.outputPaths ?? []),
		...config.cwd === void 0 ? {} : { cwd: validatedGuestDirectory(config.cwd, "Run cwd") },
		startupEntropyBytes: artifact.language === "go" ? 32 : 0,
		cost,
		determinism: { ...config.determinism },
		resources: {
			instructionBudget: cost.rawInstructionBudget,
			logicalTimeLimitMs: config.resources.logicalTimeLimitMs,
			memoryLimitBytes: config.resources.memoryLimitBytes,
			outputLimitBytes: config.resources.outputLimitBytes,
			filesystemWriteLimitBytes: config.resources.filesystemWriteLimitBytes,
			filesystemEntryLimit: config.resources.filesystemEntryLimit
		}
	};
}
function absoluteProjectFiles(artifact) {
	const files = {};
	for (const [path, contents] of canonicalFileEntries(artifact.files)) files[`/project/${path}`] = typeof contents === "string" ? encoder.encode(contents) : contents;
	return files;
}
function quickJsBundle(artifact, stdin, config) {
	const modules = Object.fromEntries(canonicalFileEntries(artifact.files).filter(([path, value]) => /\.(?:js|cjs)$/.test(path) && typeof value === "string"));
	const packageManifests = Object.fromEntries(canonicalFileEntries(artifact.files).filter(([path, value]) => /(?:^|\/)package\.json$/.test(path) && typeof value === "string").map(([path, value]) => [path, JSON.parse(value)]));
	return String.raw`
"use strict";
${quickJsDeterminismPrelude(config.determinism)}
const __modules = ${JSON.stringify(modules)};
const __packageManifests = ${JSON.stringify(packageManifests)};
${QUICKJS_NODE_STDLIB}
const __node = __nodeStdio.createNodeStdio(${JSON.stringify(stdin)}, __wasm_oj_write_stdout, __wasm_oj_write_stderr, ${JSON.stringify(config.env)}, ${JSON.stringify([
		"qjs",
		"/project/" + artifact.entry,
		...config.args
	])});
const __cache = Object.create(null);
const __std = {
  in: { readAsString: __node.readAsString },
  out: { puts: (value) => __wasm_oj_write_stdout(String(value)) },
  err: { puts: (value) => __wasm_oj_write_stderr(String(value)) },
};
function __resolve(request, parent) {
  if (request === "std" || Object.hasOwn(__node.builtins, request)) return request;
  if (request.includes("\\")) throw new Error("Module paths must use canonical forward slashes.");
  let parts;
  let requestedParts;
  if (!request.startsWith(".")) {
    const requestParts = request.split("/");
    const packageName = request.startsWith("@") ? requestParts.splice(0, 2).join("/") : requestParts.shift();
    if (!packageName || packageName === "@" || requestParts.some((part) => !part || part === "." || part === "..")) {
      throw new Error("Module '" + request + "' is not a canonical package request.");
    }
    const packageRoot = "node_modules/" + packageName;
    parts = packageRoot.split("/");
    if (requestParts.length) requestedParts = requestParts;
    else {
      const manifest = __packageManifests[packageRoot + "/package.json"] || {};
      const entry = typeof manifest.main === "string" ? manifest.main : "index.js";
      if (entry.startsWith("/") || entry.includes("\\")) throw new Error("Package '" + packageName + "' has an invalid main entry.");
      requestedParts = entry.split("/");
    }
  } else {
    parts = parent.split("/");
    parts.pop();
    requestedParts = request.split("/");
  }
  for (const part of requestedParts) {
    if (!part || part === ".") continue;
    if (part === "..") {
      if (parts.length === 0) throw new Error("Module '" + request + "' escapes the project root.");
      parts.pop();
    } else parts.push(part);
  }
  let resolved = parts.join("/");
  if (!Object.prototype.hasOwnProperty.call(__modules, resolved) && Object.prototype.hasOwnProperty.call(__modules, resolved + ".js")) resolved += ".js";
  if (!Object.prototype.hasOwnProperty.call(__modules, resolved) && Object.prototype.hasOwnProperty.call(__modules, resolved + ".cjs")) resolved += ".cjs";
  if (!Object.prototype.hasOwnProperty.call(__modules, resolved) && Object.prototype.hasOwnProperty.call(__modules, resolved + "/index.js")) resolved += "/index.js";
  if (!Object.prototype.hasOwnProperty.call(__modules, resolved)) throw new Error("Module '" + request + "' was not found from '" + parent + "'.");
  return resolved;
}
function __load(id) {
  if (id === "std") return __std;
  if (Object.hasOwn(__node.builtins, id)) return __node.builtins[id];
  if (__cache[id]) return __cache[id].exports;
  const module = { exports: {} };
  __cache[id] = module;
  const factory = new Function("require", "module", "exports", __modules[id] + "\n//# sourceURL=/project/" + id);
  factory((request) => __load(__resolve(request, id)), module, module.exports);
  return module.exports;
}
globalThis.__wasm_oj_builtins = { ...__node.builtins, std: __std };
globalThis.__wasm_oj_resolve = __resolve;
globalThis.__wasm_oj_module_source = (id) => {
  if (Object.hasOwn(globalThis.__wasm_oj_builtins, id)) {
    const value = globalThis.__wasm_oj_builtins[id];
    const names = Object.keys(value).filter(name => name !== "default");
    return "const value=globalThis.__wasm_oj_builtins[" + JSON.stringify(id) + "];export default value;" + names.map((name, index) => "const e" + index + "=value[" + JSON.stringify(name) + "];export {e" + index + " as " + JSON.stringify(name) + "};").join("");
  }
  if (${JSON.stringify(artifact.language === "typescript")} || id.endsWith(".cjs") || (id.startsWith("node_modules/") && !Object.entries(__packageManifests).some(([path, manifest]) => id.startsWith(path.slice(0, -12)) && manifest.type === "module"))) {
    const value = __load(id);
    globalThis.__wasm_oj_builtins[id] = value;
    return globalThis.__wasm_oj_module_source(id);
  }
  if (!Object.hasOwn(__modules, id)) throw new Error("Module '" + id + "' was not found.");
  return __modules[id];
};
__wasm_oj_eval_module(${JSON.stringify(artifact.entry)});
`;
}
function createDefaultRuntimeDrivers(costBaselines = createDefaultCostBaselineRegistry()) {
	const registry = new RuntimeDriverRegistry();
	registry.register({
		id: "standalone-wasm",
		interactive: "streaming",
		supports: (artifact) => artifact.kind === "wasm",
		prepare: async (artifact, config) => {
			if (artifact.kind !== "wasm") throw new Error("Expected a standalone Wasm artifact.");
			return baseRequest(artifact, artifact.bytes, config, costBaselines);
		}
	});
	registry.register({
		id: "quickjs",
		supports: (artifact) => artifact.kind === "runtime-bundle" && artifact.command === "qjs",
		prepare: async (artifact, config, resolver) => {
			if (artifact.kind !== "runtime-bundle") throw new Error("Expected a QuickJS runtime bundle.");
			const request = baseRequest(artifact, await resolver.quickJs(), config, costBaselines);
			request.stdin = encoder.encode(quickJsBundle(artifact, config.stdin, config));
			return request;
		}
	});
	registry.register({
		id: "cpython",
		interactive: "streaming",
		supports: (artifact) => artifact.kind === "runtime-bundle" && artifact.runtimePackage === PYTHON_PACKAGE && artifact.command === "python",
		prepare: async (artifact, config, resolver) => {
			if (artifact.kind !== "runtime-bundle") throw new Error("Expected a CPython runtime bundle.");
			const request = baseRequest(artifact, await resolver.packageCommand(artifact.runtimePackage, artifact.command), config, costBaselines);
			request.args = [
				`/project/${PYTHON_RUNNER_PATH}`,
				`/project/${artifact.entry}`,
				...config.args
			];
			request.env = {
				...request.env,
				PYTHONHOME: "/cpython",
				PYTHONPATH: "/project/site-packages",
				PYTHONDONTWRITEBYTECODE: "1"
			};
			const runtimeFiles = await resolver.packageFileSystem({
				packageSpecifier: artifact.runtimePackage,
				command: artifact.command,
				args: ["-c", PYTHON_RUNTIME_FILES_EXPORT_SCRIPT],
				cacheKey: PYTHON_RUNTIME_FILES_CACHE_KEY,
				expectedSha256: PYTHON_RUNTIME_FILES_ARCHIVE_SHA256
			});
			request.files = mergeGuestFiles(request.files, {
				...runtimeFiles,
				"/cpython/lib/python3.14/.keep": /* @__PURE__ */ new Uint8Array(),
				"/cpython/lib/python3.14/lib-dynload/.keep": /* @__PURE__ */ new Uint8Array(),
				...absoluteProjectFiles(artifact)
			});
			request.cwd = "/project";
			return request;
		}
	});
	return registry;
}
function validatedGuestPath(path, label) {
	if (typeof path !== "string" || !path.startsWith("/") || path.includes("\\") || path.length > 4096 || path.includes("\0") || path.endsWith("/") || path.includes("//") || path.split("/").some((part) => part === "." || part === "..")) throw new Error(`${label} must be an absolute, normalized guest file path.`);
	return path;
}
function validatedGuestDirectory(path, label) {
	if (path === "/") return path;
	return validatedGuestPath(path, label);
}
function validatedRunFiles(files) {
	const entries = Object.entries(files);
	assertFileBudget(entries, RUN_INPUT_LIMITS, "Run input files");
	const result = {};
	for (const [path, contents] of entries.sort(([left], [right]) => left.localeCompare(right))) {
		validatedGuestPath(path, "Run input path");
		if (!(contents instanceof Uint8Array)) throw new TypeError(`Run input file '${path}' must be a Uint8Array.`);
		result[path] = contents.slice();
	}
	return result;
}
function validatedOutputPaths(paths) {
	if (!Array.isArray(paths) || paths.length > 256) throw new Error("Run output paths may contain at most 256 entries.");
	const result = paths.map((path) => validatedGuestPath(path, "Run output path")).sort();
	if (result.some((path, index) => index > 0 && result[index - 1] === path)) throw new Error("Run output paths must be unique.");
	return result;
}
function mergeGuestFiles(callerFiles, runtimeFiles) {
	const collision = Object.keys(callerFiles).find((path) => Object.hasOwn(runtimeFiles, path));
	if (collision) throw new Error(`Run input file '${collision}' collides with a protected runtime file.`);
	const merged = {
		...callerFiles,
		...runtimeFiles
	};
	assertFileBudget(Object.entries(merged), PREPARED_MOUNT_LIMITS, "Prepared runtime files");
	return merged;
}
function assertFileBudget(entries, limits, label) {
	if (entries.length > limits.files) throw new Error(`${label} may contain at most ${limits.files} entries.`);
	let totalBytes = 0;
	for (const [path, contents] of entries) {
		if (!(contents instanceof Uint8Array)) throw new TypeError(`${label} '${path}' must be a Uint8Array.`);
		if (contents.byteLength > limits.bytesPerFile) throw new Error(`${label} '${path}' exceeds ${limits.bytesPerFile} bytes.`);
		totalBytes += contents.byteLength;
		if (!Number.isSafeInteger(totalBytes) || totalBytes > limits.totalBytes) throw new Error(`${label} exceed ${limits.totalBytes} total bytes.`);
	}
}
async function prepareArtifactRun(artifact, config, resolver, registry = createDefaultRuntimeDrivers()) {
	assertValidBuildArtifact(artifact);
	return registry.driver(artifact).prepare(artifact, config, resolver);
}
async function prepareArtifactInteraction(artifact, config, resolver, registry = createDefaultRuntimeDrivers()) {
	assertValidBuildArtifact(artifact);
	const driver = registry.driver(artifact);
	if (driver.interactive !== "streaming") throw new Error(`Runtime driver '${driver.id}' does not support streaming interactive execution.`);
	return driver.prepare(artifact, config, resolver);
}
/** Prepare a statically admitted judge command without fabricating compiler artifact metadata. */
function prepareTrustedJudgeRun(program, config, costBaselines = createDefaultCostBaselineRegistry()) {
	if (!program || typeof program !== "object" || !(program.wasm instanceof Uint8Array)) throw new TypeError("Trusted judge program is invalid.");
	validateTrustedJudgeWasm(program.wasm, { memoryLimitBytes: config.resources.memoryLimitBytes });
	const [language, target, optimization] = program.runtimeProfile.split("-");
	const cost = resolveCostBudget(costProfileId(language, target, optimization), config.resources.instructionBudget, costBaselines);
	const stdin = encoder.encode(config.stdin);
	if (stdin.byteLength > RUN_INPUT_LIMITS.stdinBytes) throw new Error(`Run stdin exceeds ${RUN_INPUT_LIMITS.stdinBytes} bytes.`);
	return {
		wasm: program.wasm.slice(),
		args: [...config.args],
		env: deterministicEnvironment(config.env, config.determinism),
		stdin,
		files: validatedRunFiles(config.files ?? {}),
		outputPaths: validatedOutputPaths(config.outputPaths ?? []),
		...config.cwd === void 0 ? {} : { cwd: validatedGuestDirectory(config.cwd, "Run cwd") },
		startupEntropyBytes: language === "go" ? 32 : 0,
		cost,
		determinism: { ...config.determinism },
		resources: {
			instructionBudget: cost.rawInstructionBudget,
			logicalTimeLimitMs: config.resources.logicalTimeLimitMs,
			memoryLimitBytes: config.resources.memoryLimitBytes,
			outputLimitBytes: config.resources.outputLimitBytes,
			filesystemWriteLimitBytes: config.resources.filesystemWriteLimitBytes,
			filesystemEntryLimit: config.resources.filesystemEntryLimit
		}
	};
}
//#endregion
//#region src/judge/problem-model.ts
var PROBLEM_LOCALES = ["zh-TW", "en"];
//#endregion
//#region src/judge/problem-catalog-loader.ts
var BROWSER_COLLECTION_SCHEMA = "wasm-oj-browser-collection-v5";
var BROWSER_PROBLEM_SCHEMA = "wasm-oj-browser-problem-v4";
var PROBLEM_STARTER_LIMITS = Object.freeze({
	filesPerLanguage: 128,
	bytesPerFile: 262144,
	totalBytesPerLanguage: 1048576
});
Object.freeze({
	provider: "github",
	owner: "wasm-oj",
	repository: "problems",
	ref: "main",
	indexPath: "collection/index.json"
});
var BUNDLE_MAX_BYTES = 33554432;
var MAX_PROBLEMS = 1e3;
var LANGUAGES$1 = [
	"c",
	"cpp",
	"rust",
	"go",
	"python",
	"javascript",
	"typescript"
];
var POLICY_IDS$1 = [
	"baseline",
	"efficient",
	"optimal"
];
var CALIBRATION_METHOD$1 = "wasm-oj-v2/compiled-average-optimal-rounded/v1";
var SHA256_PATTERN = /^[0-9a-f]{64}$/;
var ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
var UTF8_ENCODER = new TextEncoder();
var ProblemCollectionError = class extends Error {
	kind;
	constructor(message, kind, options) {
		super(message, options);
		this.kind = kind;
		this.name = "ProblemCollectionError";
	}
};
function parseProblemCollectionIndex(value) {
	if (!isRecord$1(value) || !hasExactKeys(value, [
		"schema",
		"problemSchema",
		"revision",
		"localization",
		"problems"
	])) throw schemaError("The problem collection index has an invalid shape.");
	if (value.schema !== "wasm-oj-browser-collection-v5" || value.problemSchema !== "wasm-oj-browser-problem-v4") throw schemaError("The problem collection uses an unsupported schema.");
	if (typeof value.revision !== "string" || !SHA256_PATTERN.test(value.revision)) throw schemaError("The problem collection revision is invalid.");
	if (!isRecord$1(value.localization) || !hasExactKeys(value.localization, ["defaultLocale", "supportedLocales"]) || value.localization.defaultLocale !== "zh-TW" || !sameStringArray(value.localization.supportedLocales, PROBLEM_LOCALES)) throw schemaError("The problem collection localization contract is unsupported.");
	if (!Array.isArray(value.problems) || value.problems.length < 1 || value.problems.length > MAX_PROBLEMS) throw schemaError(`The problem collection must contain between 1 and ${MAX_PROBLEMS} problems.`);
	const ids = /* @__PURE__ */ new Set();
	const bundlePaths = /* @__PURE__ */ new Set();
	const bundleDigests = /* @__PURE__ */ new Set();
	const problems = value.problems.map((entry, index) => parseCollectionEntry(entry, index + 1, ids, bundlePaths, bundleDigests));
	return {
		schema: BROWSER_COLLECTION_SCHEMA,
		problemSchema: BROWSER_PROBLEM_SCHEMA,
		revision: value.revision,
		localization: {
			defaultLocale: "zh-TW",
			supportedLocales: PROBLEM_LOCALES
		},
		problems
	};
}
function parseProblemBundle(value, expected) {
	const problem = parseStandaloneProblemBundle(value);
	if (problem.id !== expected.id || problem.number !== expected.number || problem.difficulty !== expected.difficulty || problem.judgeCases.length !== expected.caseCount || !sameStringArray(problem.tags, expected.tags) || !sameLocalizedText(problem.title, expected.title) || problem.trackId !== expected.trackId || !sameLocalizedText(problem.track, expected.track)) throw schemaError(`Problem bundle '${expected.id}' disagrees with its collection index entry.`);
	return problem;
}
function parseStandaloneProblemBundle(value) {
	if (!isRecord$1(value) || !hasExactKeys(value, ["schema", "problem"]) || value.schema !== "wasm-oj-browser-problem-v4") throw schemaError("The problem bundle uses an unsupported schema.");
	return parseJudgeProblem(value.problem);
}
async function verifyProblemBundleBytes(bytes, entry) {
	if (bytes.byteLength !== entry.bundle.bytes) throw new ProblemCollectionError(`Problem '${entry.id}' byte length does not match its index.`, "integrity");
	if (await sha256Hex(bytes) !== entry.bundle.sha256) throw new ProblemCollectionError(`Problem '${entry.id}' failed SHA-256 verification.`, "integrity");
	return parseProblemBundle(parseUtf8Json(bytes, `problem '${entry.id}'`), entry);
}
function parseCollectionEntry(value, expectedNumber, ids, bundlePaths, bundleDigests) {
	if (!isRecord$1(value) || !hasExactKeys(value, [
		"id",
		"number",
		"title",
		"trackId",
		"track",
		"statementPaths",
		"difficulty",
		"tags",
		"caseCount",
		"bundle"
	])) throw schemaError(`Problem collection entry ${expectedNumber} has an invalid shape.`);
	if (value.number !== expectedNumber || typeof value.id !== "string" || !ID_PATTERN.test(value.id) || ids.has(value.id)) throw schemaError(`Problem collection entry ${expectedNumber} has an invalid identity.`);
	ids.add(value.id);
	const difficulty = parseDifficulty(value.difficulty, `problem '${value.id}'`);
	const tags = parseTags(value.tags, `problem '${value.id}'`);
	if (typeof value.trackId !== "string" || !ID_PATTERN.test(value.trackId)) throw schemaError(`Problem '${value.id}' has an invalid track ID.`);
	if (!Number.isSafeInteger(value.caseCount) || value.caseCount < 1 || value.caseCount > 1e4) throw schemaError(`Problem '${value.id}' has an invalid case count.`);
	if (!isRecord$1(value.bundle) || !hasExactKeys(value.bundle, [
		"path",
		"sha256",
		"bytes"
	])) throw schemaError(`Problem '${value.id}' has an invalid bundle descriptor.`);
	const bundlePath = normalizedRelativePath(value.bundle.path, `problem '${value.id}' bundle path`);
	if (!bundlePath.startsWith("problems/") || !bundlePath.endsWith(".json")) throw schemaError(`Problem '${value.id}' bundle path is outside the problems directory.`);
	if (typeof value.bundle.sha256 !== "string" || !SHA256_PATTERN.test(value.bundle.sha256)) throw schemaError(`Problem '${value.id}' has an invalid bundle digest.`);
	if (!bundlePath.endsWith(`.${value.bundle.sha256}.json`) || bundlePaths.has(bundlePath) || bundleDigests.has(value.bundle.sha256)) throw schemaError(`Problem '${value.id}' does not have a unique content-addressed bundle path.`);
	bundlePaths.add(bundlePath);
	bundleDigests.add(value.bundle.sha256);
	const rawStatementPaths = parseLocalizedText(value.statementPaths, `problem '${value.id}' statement paths`);
	const statementPaths = {
		"zh-TW": normalizedRelativePath(rawStatementPaths["zh-TW"], `problem '${value.id}' statement path for 'zh-TW'`),
		en: normalizedRelativePath(rawStatementPaths.en, `problem '${value.id}' statement path for 'en'`)
	};
	if (PROBLEM_LOCALES.some((locale) => !statementPaths[locale].endsWith(".md"))) throw schemaError(`Problem '${value.id}' has a statement path that is not Markdown.`);
	if (!Number.isSafeInteger(value.bundle.bytes) || value.bundle.bytes < 2 || value.bundle.bytes > BUNDLE_MAX_BYTES) throw schemaError(`Problem '${value.id}' has an invalid bundle byte length.`);
	return {
		id: value.id,
		number: expectedNumber,
		title: parseLocalizedText(value.title, `problem '${value.id}' title`),
		trackId: value.trackId,
		track: parseLocalizedText(value.track, `problem '${value.id}' track`),
		statementPaths,
		difficulty,
		tags,
		caseCount: value.caseCount,
		bundle: {
			path: bundlePath,
			sha256: value.bundle.sha256,
			bytes: value.bundle.bytes
		}
	};
}
function parseJudgeProblem(value) {
	if (!isRecord$1(value) || !hasExactKeys(value, [
		"id",
		"number",
		"title",
		"trackId",
		"track",
		"difficulty",
		"tags",
		"statement",
		"editorial",
		"starterTemplates",
		"judgeCases",
		"scoring",
		"complexities"
	])) throw schemaError("The judge problem has an invalid shape.");
	if (typeof value.id !== "string" || !ID_PATTERN.test(value.id) || !Number.isSafeInteger(value.number) || value.number < 1) throw schemaError("The judge problem has an invalid identity.");
	const id = value.id;
	const title = parseLocalizedText(value.title, `problem '${id}' title`);
	if (typeof value.trackId !== "string" || !ID_PATTERN.test(value.trackId)) throw schemaError(`Problem '${id}' has an invalid track ID.`);
	const track = parseLocalizedText(value.track, `problem '${id}' track`);
	const statement = parseLocalizedText(value.statement, `problem '${id}' statement`, false);
	const editorial = parseLocalizedText(value.editorial, `problem '${id}' editorial`, false);
	const starterTemplates = parseStarterTemplates(value.starterTemplates, id);
	const difficulty = parseDifficulty(value.difficulty, `problem '${id}'`);
	const tags = parseTags(value.tags, `problem '${id}'`);
	if (!Array.isArray(value.judgeCases) || value.judgeCases.length < 1 || value.judgeCases.length > 1e4) throw schemaError(`Problem '${value.id}' has an invalid case inventory.`);
	const caseIds = /* @__PURE__ */ new Set();
	const judgeCases = value.judgeCases.map((testCase, index) => {
		if (!isRecord$1(testCase) || !hasExactKeys(testCase, [
			"id",
			"kind",
			"input",
			"output"
		]) || typeof testCase.id !== "string" || !ID_PATTERN.test(testCase.id) || caseIds.has(testCase.id) || ![
			"sample",
			"adversarial",
			"regression"
		].includes(String(testCase.kind)) || typeof testCase.input !== "string" || typeof testCase.output !== "string") throw schemaError(`Problem '${value.id}' has an invalid case at position ${index + 1}.`);
		caseIds.add(testCase.id);
		return {
			id: testCase.id,
			kind: testCase.kind,
			input: testCase.input,
			output: testCase.output
		};
	});
	if (judgeCases.filter((testCase) => testCase.kind === "sample").length !== 3) throw schemaError(`Problem '${value.id}' must contain exactly three sample cases.`);
	const scoring = parseScoring(value.scoring, id);
	if (!Array.isArray(value.complexities) || value.complexities.length < 2 || value.complexities.length > 32) throw schemaError(`Problem '${value.id}' has an invalid complexity inventory.`);
	const complexities = value.complexities.map((complexity, index) => parseComplexity(complexity, id, index));
	if (!complexities.at(-1)?.accepted) throw schemaError(`Problem '${id}' must end with its accepted complexity.`);
	return {
		id,
		number: value.number,
		title,
		trackId: value.trackId,
		track,
		difficulty,
		tags,
		statement,
		editorial,
		starterTemplates,
		judgeCases,
		scoring,
		complexities
	};
}
function parseStarterTemplates(value, problemId) {
	if (!isRecord$1(value) || !hasExactKeys(value, LANGUAGES$1)) throw schemaError(`Problem '${problemId}' must provide starter templates for every built-in language.`);
	return Object.fromEntries(LANGUAGES$1.map((language) => [language, parseStarterTemplate(value[language], problemId, language)]));
}
function parseStarterTemplate(value, problemId, language) {
	if (!isRecord$1(value) || !hasExactKeys(value, ["entry", "files"]) || !isRecord$1(value.files)) throw schemaError(`Problem '${problemId}' has an invalid '${language}' starter template.`);
	const entry = parseStarterPath(value.entry, `problem '${problemId}' '${language}' starter entry`);
	const paths = Object.keys(value.files).sort();
	if (paths.length < 1 || paths.length > PROBLEM_STARTER_LIMITS.filesPerLanguage) throw schemaError(`Problem '${problemId}' '${language}' starter must contain between 1 and ${PROBLEM_STARTER_LIMITS.filesPerLanguage} files.`);
	let totalBytes = 0;
	const entries = [];
	for (const rawPath of paths) {
		const path = parseStarterPath(rawPath, `problem '${problemId}' '${language}' starter file`);
		const content = value.files[rawPath];
		if (typeof content !== "string" || hasUnpairedSurrogate(content)) throw schemaError(`Problem '${problemId}' '${language}' starter file '${path}' is not valid Unicode source text.`);
		const bytes = UTF8_ENCODER.encode(content).byteLength;
		if (bytes > PROBLEM_STARTER_LIMITS.bytesPerFile) throw schemaError(`Problem '${problemId}' '${language}' starter file '${path}' exceeds ${PROBLEM_STARTER_LIMITS.bytesPerFile} UTF-8 bytes.`);
		totalBytes += bytes;
		if (totalBytes > PROBLEM_STARTER_LIMITS.totalBytesPerLanguage) throw schemaError(`Problem '${problemId}' '${language}' starter files exceed ${PROBLEM_STARTER_LIMITS.totalBytesPerLanguage} UTF-8 bytes in total.`);
		entries.push([path, content]);
	}
	const files = Object.fromEntries(entries);
	if (!Object.hasOwn(files, entry) || UTF8_ENCODER.encode(files[entry]).byteLength === 0) throw schemaError(`Problem '${problemId}' '${language}' starter entry must name a non-empty file in its file map.`);
	return {
		entry,
		files
	};
}
function parseStarterPath(value, label) {
	if (typeof value !== "string" || !value || value !== value.trim() || value.length > 4096 || value.startsWith("/") || value.endsWith("/") || value.includes("\\") || value.includes("\0") || value.split("/").some((segment) => !segment || segment === "." || segment === "..")) throw schemaError(`The ${label} is not a normalized relative path.`);
	return value;
}
function hasUnpairedSurrogate(value) {
	for (let index = 0; index < value.length; index += 1) {
		const unit = value.charCodeAt(index);
		if (unit >= 55296 && unit <= 56319) {
			const next = value.charCodeAt(index + 1);
			if (!(next >= 56320 && next <= 57343)) return true;
			index += 1;
		} else if (unit >= 56320 && unit <= 57343) return true;
	}
	return false;
}
function parseScoring(value, problemId) {
	if (!isRecord$1(value) || !hasExactKeys(value, [
		"maximumPoints",
		"calibration",
		"policies",
		"safetyLimits"
	]) || value.maximumPoints !== 100) throw schemaError(`Problem '${problemId}' has invalid scoring metadata.`);
	const calibration = value.calibration;
	if (!isRecord$1(calibration) || !hasExactKeys(calibration, ["method", "profiles"]) || calibration.method !== CALIBRATION_METHOD$1) throw schemaError(`Problem '${problemId}' has invalid calibration metadata.`);
	const profiles = calibration.profiles;
	if (!isRecord$1(profiles) || !hasExactKeys(profiles, LANGUAGES$1) || LANGUAGES$1.some((language) => typeof profiles[language] !== "string" || !profiles[language] || profiles[language] !== profiles[language].trim())) throw schemaError(`Problem '${problemId}' has invalid calibration profiles.`);
	if (!Array.isArray(value.policies) || value.policies.length !== POLICY_IDS$1.length) throw schemaError(`Problem '${problemId}' has invalid scoring policies.`);
	const policies = value.policies.map((policy, index) => parsePolicy(policy, problemId, POLICY_IDS$1[index]));
	if (policies.reduce((total, policy) => total + policy.points, 0) !== 100) throw schemaError(`Problem '${problemId}' policy points must sum to 100.`);
	for (let index = 1; index < policies.length; index += 1) {
		const broad = policies[index - 1].limits;
		const strict = policies[index].limits;
		const logicalInvalid = broad.logicalTimeLimitMs !== void 0 && (strict.logicalTimeLimitMs === void 0 || strict.logicalTimeLimitMs > broad.logicalTimeLimitMs);
		const anyStricter = strict.instructionBudget < broad.instructionBudget || strict.memoryLimitBytes < broad.memoryLimitBytes || broad.logicalTimeLimitMs === void 0 && strict.logicalTimeLimitMs !== void 0 || broad.logicalTimeLimitMs !== void 0 && strict.logicalTimeLimitMs !== void 0 && strict.logicalTimeLimitMs < broad.logicalTimeLimitMs;
		if (strict.instructionBudget > broad.instructionBudget || strict.memoryLimitBytes > broad.memoryLimitBytes || logicalInvalid || !anyStricter) throw schemaError(`Problem '${problemId}' policies are not broad-to-strict.`);
	}
	if (!isRecord$1(value.safetyLimits) || !hasExactKeys(value.safetyLimits, ["wallTimeLimitMs"]) || !isPositiveSafeInteger(value.safetyLimits.wallTimeLimitMs) || value.safetyLimits.wallTimeLimitMs > 6e5) throw schemaError(`Problem '${problemId}' has invalid safety limits.`);
	return {
		maximumPoints: 100,
		calibration: {
			method: CALIBRATION_METHOD$1,
			profiles
		},
		policies,
		safetyLimits: { wallTimeLimitMs: value.safetyLimits.wallTimeLimitMs }
	};
}
function parsePolicy(value, problemId, expectedId) {
	if (!isRecord$1(value) || !hasExactKeys(value, [
		"id",
		"title",
		"points",
		"limits"
	]) || value.id !== expectedId || !isPositiveSafeInteger(value.points) || !isRecord$1(value.limits)) throw schemaError(`Problem '${problemId}' has an invalid '${expectedId}' policy.`);
	const keys = Object.keys(value.limits).sort();
	if (JSON.stringify(keys) !== JSON.stringify(keys.includes("logicalTimeLimitMs") ? [
		"instructionBudget",
		"logicalTimeLimitMs",
		"memoryLimitBytes"
	] : ["instructionBudget", "memoryLimitBytes"])) throw schemaError(`Problem '${problemId}' policy '${expectedId}' has invalid limits.`);
	if (!isPositiveSafeInteger(value.limits.instructionBudget) || !isPositiveSafeInteger(value.limits.memoryLimitBytes) || value.limits.memoryLimitBytes < 65536 || value.limits.memoryLimitBytes > 4294967296 || value.limits.memoryLimitBytes % 65536 !== 0 || value.limits.logicalTimeLimitMs !== void 0 && (!isPositiveSafeInteger(value.limits.logicalTimeLimitMs) || value.limits.logicalTimeLimitMs > MAX_LOGICAL_TIME_LIMIT_MS)) throw schemaError(`Problem '${problemId}' policy '${expectedId}' has invalid resource values.`);
	const limits = {
		instructionBudget: value.limits.instructionBudget,
		memoryLimitBytes: value.limits.memoryLimitBytes,
		...value.limits.logicalTimeLimitMs === void 0 ? {} : { logicalTimeLimitMs: value.limits.logicalTimeLimitMs }
	};
	return {
		id: expectedId,
		title: parseLocalizedText(value.title, `problem '${problemId}' policy '${expectedId}' title`),
		points: value.points,
		limits
	};
}
function parseComplexity(value, problemId, index) {
	if (!isRecord$1(value) || !hasExactKeys(value, [
		"name",
		"time",
		"space",
		"accepted"
	]) || typeof value.time !== "string" || !value.time || typeof value.space !== "string" || !value.space || typeof value.accepted !== "boolean") throw schemaError(`Problem '${problemId}' has an invalid complexity at position ${index + 1}.`);
	return {
		name: parseLocalizedText(value.name, `problem '${problemId}' complexity name`),
		time: value.time,
		space: value.space,
		accepted: value.accepted
	};
}
function parseLocalizedText(value, label, trimmed = true) {
	if (!isRecord$1(value) || !hasExactKeys(value, PROBLEM_LOCALES)) throw schemaError(`${label} is invalid.`);
	for (const locale of PROBLEM_LOCALES) if (typeof value[locale] !== "string" || !value[locale] || trimmed && value[locale] !== value[locale].trim()) throw schemaError(`${label}[${locale}] is invalid.`);
	return value;
}
function parseDifficulty(value, label) {
	if (value !== "easy" && value !== "medium" && value !== "hard") throw schemaError(`${label} has an invalid difficulty.`);
	return value;
}
function parseTags(value, label) {
	if (!Array.isArray(value) || value.length < 1 || value.length > 32 || value.some((tag) => typeof tag !== "string" || !tag || tag !== tag.trim()) || new Set(value).size !== value.length) throw schemaError(`${label} has invalid tags.`);
	return value;
}
function parseUtf8Json(bytes, label) {
	let text;
	try {
		text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
	} catch (error) {
		throw new ProblemCollectionError(`${label} is not valid UTF-8.`, "integrity", { cause: error });
	}
	try {
		return JSON.parse(text);
	} catch (error) {
		throw new ProblemCollectionError(`${label} is not valid JSON.`, "schema", { cause: error });
	}
}
async function sha256Hex(bytes) {
	const digest = await crypto.subtle.digest("SHA-256", bytes.slice().buffer);
	return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
async function problemCollectionRevision(index) {
	const revisionInput = index.problems.map((entry) => `${entry.number}\0${entry.bundle.sha256}\0${entry.statementPaths["zh-TW"]}\0${entry.statementPaths.en}\n`).join("");
	return sha256Hex(new TextEncoder().encode(revisionInput));
}
async function verifyProblemCollectionRevision(index) {
	if (await problemCollectionRevision(index) !== index.revision) throw new ProblemCollectionError("The problem collection revision does not match its ordered bundles.", "integrity");
}
function normalizedRelativePath(value, label) {
	if (typeof value !== "string" || !value || value.startsWith("/") || value.endsWith("/") || value.includes("\\") || value.includes("\0")) throw new ProblemCollectionError(`The ${label} is not a normalized relative path.`, "configuration");
	if (value.split("/").some((segment) => !segment || segment === "." || segment === "..")) throw new ProblemCollectionError(`The ${label} is not a normalized relative path.`, "configuration");
	return value;
}
function sameLocalizedText(left, right) {
	return PROBLEM_LOCALES.every((locale) => left[locale] === right[locale]);
}
function sameStringArray(value, expected) {
	return Array.isArray(value) && value.length === expected.length && value.every((item, index) => item === expected[index]);
}
function hasExactKeys(value, expected) {
	const actual = Object.keys(value).sort();
	const expectedKeys = [...expected].sort();
	return actual.length === expectedKeys.length && actual.every((key, index) => key === expectedKeys[index]);
}
function isRecord$1(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isPositiveSafeInteger(value) {
	return Number.isSafeInteger(value) && value > 0;
}
function schemaError(message) {
	return new ProblemCollectionError(message, "schema");
}
//#endregion
//#region src/judge/problem-scoring.ts
var PERFORMANCE_POLICY_IDS = [
	"baseline",
	"efficient",
	"optimal"
];
/**
* Collapse case-level judge details into the only policy data allowed to cross
* the container boundary. Resource failures are counted only after output
* acceptance, so an output error is never mislabeled as an efficiency error.
*/
function summarizeProblemPolicies(score) {
	const totals = PERFORMANCE_POLICY_IDS.map((id) => ({
		id,
		earnedCases: 0,
		costExceededCases: 0,
		memoryExceededCases: 0,
		logicalTimeExceededCases: 0
	}));
	let outputAcceptedCases = 0;
	for (const testCase of score.cases) {
		if (testCase.policyEvaluations.length !== PERFORMANCE_POLICY_IDS.length) throw new Error("Policy summary requires exactly three scoring policies.");
		if (testCase.outputAccepted) outputAcceptedCases += 1;
		for (let index = 0; index < PERFORMANCE_POLICY_IDS.length; index += 1) {
			const evaluation = testCase.policyEvaluations[index];
			const total = totals[index];
			if (evaluation?.id !== total?.id) throw new Error("Policy summary requires baseline, efficient, and optimal order.");
			if (evaluation.earned) total.earnedCases += 1;
			if (!testCase.outputAccepted) continue;
			if (!evaluation.costPassed) total.costExceededCases += 1;
			if (!evaluation.memoryPassed) total.memoryExceededCases += 1;
			if (evaluation.logicalTimePassed === false) total.logicalTimeExceededCases += 1;
		}
	}
	return {
		totalCases: score.cases.length,
		outputAcceptedCases,
		policies: totals
	};
}
function requireMetric(value, label) {
	if (value === null || !Number.isSafeInteger(value) || value < 0) throw new Error(`${label} must be a non-negative safe integer.`);
	return value;
}
function optionalMetric(value, label) {
	return value === null ? null : requireMetric(value, label);
}
function assertProblemCostProfile(problem, language, costProfile) {
	const expected = problem.scoring.calibration.profiles[language];
	if (!expected) throw new Error(`Problem '${problem.id}' has no calibrated profile for '${language}'.`);
	if (costProfile !== expected) throw new Error(`Problem '${problem.id}' was calibrated for a different '${language}' cost profile.`);
}
function assertJudgeDataCostProfile(data, language, costProfile) {
	const expected = data.scoring.calibration.profiles[language];
	if (!expected || costProfile !== expected) throw new Error(`Judge data was calibrated for a different '${language}' cost profile.`);
}
function observedMetrics(problem, language, result) {
	const metrics = result.run?.metrics ?? result.interaction?.contestant.metrics;
	if (!metrics) return null;
	assertProblemCostProfile(problem, language, metrics.costProfile);
	if (metrics.costModel !== "weighted") throw new Error(`Problem '${problem.id}' received an unsupported cost model.`);
	const observed = {
		cost: optionalMetric(metrics.cost, "cost"),
		rawCost: optionalMetric(metrics.rawCost, "rawCost"),
		baselineCost: requireMetric(metrics.baselineCost, "baselineCost"),
		memoryBytes: optionalMetric(metrics.memoryBytes, "memoryBytes"),
		logicalTimeNs: optionalMetric(metrics.logicalTimeNs, "logicalTimeNs")
	};
	if (observed.cost === null !== (observed.rawCost === null)) throw new Error(`Problem '${problem.id}' received incomplete normalized cost metrics.`);
	if (observed.cost !== null && observed.rawCost !== null && observed.cost !== Math.max(0, observed.rawCost - observed.baselineCost)) throw new Error(`Problem '${problem.id}' received inconsistent normalized cost metrics.`);
	return observed;
}
function evaluatePolicy(policy, metrics, outputAccepted) {
	const costPassed = metrics !== null && metrics.cost !== null && metrics.cost <= policy.limits.instructionBudget;
	const memoryPassed = metrics !== null && metrics.memoryBytes !== null && metrics.memoryBytes <= policy.limits.memoryLimitBytes;
	const logicalTimePassed = policy.limits.logicalTimeLimitMs === void 0 ? null : metrics !== null && metrics.logicalTimeNs !== null && metrics.logicalTimeNs <= policy.limits.logicalTimeLimitMs * 1e6;
	const resourcePassed = costPassed && memoryPassed && logicalTimePassed !== false;
	return {
		id: policy.id,
		points: policy.points,
		costPassed,
		memoryPassed,
		logicalTimePassed,
		resourcePassed,
		earned: outputAccepted && resourcePassed
	};
}
function scoreProblemResults(problem, language, results) {
	return scoreResults(problem.id, problem.judgeCases.map((testCase) => testCase.id), problem.scoring, (result) => observedMetrics(problem, language, result), results);
}
function scoreResults(label, expectedIds, scoring, metricsFor, results) {
	if (results.length !== expectedIds.length || results.some((result, index) => result.id !== expectedIds[index])) throw new Error(`${label} execution inventory is incomplete or reordered.`);
	const passedByPolicy = Object.fromEntries(scoring.policies.map((policy) => [policy.id, 0]));
	const cases = results.map((result) => {
		const contestantTermination = result.run?.termination ?? result.interaction?.contestant.termination;
		if (result.verdict === "accepted" && contestantTermination !== "exited") throw new Error(`${label} accepted a case without a successful execution.`);
		const metrics = metricsFor(result);
		const outputAccepted = result.verdict === "accepted" && contestantTermination === "exited";
		if (outputAccepted && (metrics === null || metrics.cost === null || metrics.rawCost === null || metrics.memoryBytes === null)) throw new Error(`${label} accepted a case without complete scoring metrics.`);
		const policyEvaluations = scoring.policies.map((policy) => evaluatePolicy(policy, metrics, outputAccepted));
		const passedPolicyIds = [];
		let points = 0;
		for (const evaluation of policyEvaluations) {
			if (!evaluation.earned) continue;
			passedPolicyIds.push(evaluation.id);
			passedByPolicy[evaluation.id] += 1;
			points += evaluation.points;
		}
		return {
			id: result.id,
			outputAccepted,
			metrics,
			policyEvaluations,
			passedPolicyIds,
			points
		};
	});
	const numerator = cases.reduce((total, testCase) => total + testCase.points, 0);
	const denominator = expectedIds.length;
	return {
		numerator,
		denominator,
		points: numerator / denominator,
		maximumPoints: scoring.maximumPoints,
		cases,
		passedByPolicy
	};
}
/** Score immutable execution-only judge data without reconstructing a public problem bundle. */
function scoreJudgeDataResults(data, language, results) {
	return scoreResults("Immutable judge data", data.cases.map((testCase) => testCase.id), data.scoring, (result) => observedJudgeDataMetrics(data, language, result), results);
}
function observedJudgeDataMetrics(data, language, result) {
	const metrics = result.run?.metrics ?? result.interaction?.contestant.metrics;
	if (!metrics) return null;
	assertJudgeDataCostProfile(data, language, metrics.costProfile);
	if (metrics.costModel !== "weighted") throw new Error("Immutable judge data received an unsupported cost model.");
	const observed = {
		cost: optionalMetric(metrics.cost, "cost"),
		rawCost: optionalMetric(metrics.rawCost, "rawCost"),
		baselineCost: requireMetric(metrics.baselineCost, "baselineCost"),
		memoryBytes: optionalMetric(metrics.memoryBytes, "memoryBytes"),
		logicalTimeNs: optionalMetric(metrics.logicalTimeNs, "logicalTimeNs")
	};
	if (observed.cost === null !== (observed.rawCost === null)) throw new Error("Immutable judge data received incomplete normalized cost metrics.");
	if (observed.cost !== null && observed.rawCost !== null && observed.cost !== Math.max(0, observed.rawCost - observed.baselineCost)) throw new Error("Immutable judge data received inconsistent normalized cost metrics.");
	return observed;
}
//#endregion
//#region src/online-judge/contest-public.ts
var CONTEST_PUBLIC_PROJECTION_SCHEMA = "wasm-oj-platform/contest-public-problem-projection/v1";
/**
* The repository practice bundle is safe to fetch for every practice visitor.
* Hidden cases and their expected answers exist only in the immutable judge
* package built from the authoring source.
*/
function derivePracticePublic(authored) {
	return {
		...structuredClone(authored),
		judgeCases: authored.judgeCases.filter((testCase) => testCase.kind === "sample").map((testCase) => structuredClone(testCase))
	};
}
/** The single deterministic hidden-data redaction used by author CI and platform validation. */
function deriveContestPublic(practice) {
	if (practice.judgeCases.some((testCase) => testCase.kind !== "sample")) throw new TypeError("Practice-public input contains non-sample judge data.");
	return {
		...structuredClone(practice),
		editorial: {
			"zh-TW": "",
			en: ""
		},
		judgeCases: practice.judgeCases.filter((testCase) => testCase.kind === "sample").map((testCase) => structuredClone(testCase))
	};
}
function createContestPublicProjection(practice) {
	return {
		schema: CONTEST_PUBLIC_PROJECTION_SCHEMA,
		problem: deriveContestPublic(practice)
	};
}
function contestPublicProjectionBytes(practice) {
	return canonicalJsonBytes(createContestPublicProjection(practice));
}
//#endregion
//#region src/online-judge/compile-profiles.ts
function record$3(value, label) {
	if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object.`);
	return value;
}
function parseJudgeAllowedProfiles(value, label = "allowedProfiles") {
	const profiles = record$3(value, label);
	const entries = Object.entries(profiles).sort(([left], [right]) => left.localeCompare(right));
	if (entries.length < 1) throw new TypeError(`${label} must contain at least one compile profile.`);
	const result = {};
	for (const [language, candidate] of entries) {
		if (!isBuiltinLanguage$1(language)) throw new TypeError(`${label} language '${language}' is unsupported.`);
		const profile = record$3(candidate, `${label}.${language}`);
		if (JSON.stringify(Object.keys(profile).sort()) !== JSON.stringify(["optimization", "target"])) throw new TypeError(`${label}.${language} has an invalid shape.`);
		if (profile.target !== "wasip1" && profile.target !== "wasix") throw new TypeError(`${label}.${language}.target is unsupported.`);
		if (profile.optimization !== "debug" && profile.optimization !== "release") throw new TypeError(`${label}.${language}.optimization is unsupported.`);
		result[language] = {
			target: profile.target,
			optimization: profile.optimization
		};
	}
	return result;
}
//#endregion
//#region src/online-judge/unicode-scalar.ts
/** Rust-compatible Unicode scalar strings: no isolated UTF-16 surrogate code units. */
function isUnicodeScalarString(value) {
	for (let index = 0; index < value.length; index += 1) {
		const codeUnit = value.charCodeAt(index);
		if (codeUnit >= 55296 && codeUnit <= 56319) {
			const trailing = value.charCodeAt(index + 1);
			if (!(trailing >= 56320 && trailing <= 57343)) return false;
			index += 1;
		} else if (codeUnit >= 56320 && codeUnit <= 57343) return false;
	}
	return true;
}
//#endregion
//#region src/online-judge/judge-data.ts
var WASM_OJ_JUDGE_DATA_SCHEMA = "wasm-oj-v2/judge-data";
var CASE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
var POLICY_IDS = [
	"baseline",
	"efficient",
	"optimal"
];
var CALIBRATION_METHOD = "wasm-oj-v2/compiled-average-optimal-rounded/v1";
function record$2(value, label) {
	if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object.`);
	return value;
}
function exact$2(value, keys, label) {
	if (JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...keys].sort())) throw new TypeError(`${label} has an invalid shape.`);
}
function positiveInteger$1(value, label, maximum = Number.MAX_SAFE_INTEGER) {
	if (!Number.isSafeInteger(value) || value < 1 || value > maximum) throw new TypeError(`${label} is outside its limit.`);
	return value;
}
function limits(value, policyId) {
	const input = record$2(value, `judge data policy '${policyId}' limits`);
	const keys = Object.keys(input).sort();
	const expected = keys.includes("logicalTimeLimitMs") ? [
		"instructionBudget",
		"logicalTimeLimitMs",
		"memoryLimitBytes"
	] : ["instructionBudget", "memoryLimitBytes"];
	if (JSON.stringify(keys) !== JSON.stringify(expected)) throw new TypeError(`Judge data policy '${policyId}' limits have an invalid shape.`);
	const memoryLimitBytes = positiveInteger$1(input.memoryLimitBytes, `judge data policy '${policyId}' memoryLimitBytes`, MAX_MEMORY_LIMIT_BYTES);
	if (memoryLimitBytes < 65536 || memoryLimitBytes % 65536 !== 0) throw new TypeError(`Judge data policy '${policyId}' memoryLimitBytes must be a positive number of Wasm pages.`);
	return {
		instructionBudget: positiveInteger$1(input.instructionBudget, `judge data policy '${policyId}' instructionBudget`),
		memoryLimitBytes,
		...input.logicalTimeLimitMs === void 0 ? {} : { logicalTimeLimitMs: positiveInteger$1(input.logicalTimeLimitMs, `judge data policy '${policyId}' logicalTimeLimitMs`, MAX_LOGICAL_TIME_LIMIT_MS) }
	};
}
function allowedLanguageSet(allowedLanguages) {
	const result = [...allowedLanguages].sort();
	if (result.length < 1 || new Set(result).size !== result.length || result.some((language) => !isBuiltinLanguage$1(language))) throw new TypeError("Judge data allowed languages are invalid.");
	return result;
}
/** Derive only execution-significant data; statement, editorial, titles, and slug never enter the package digest. */
function deriveJudgeData(practice, allowedLanguages) {
	const languages = allowedLanguageSet(allowedLanguages);
	return parseJudgeData({
		schema: WASM_OJ_JUDGE_DATA_SCHEMA,
		cases: practice.judgeCases.map((testCase) => ({
			id: testCase.id,
			input: testCase.input,
			output: testCase.output
		})),
		scoring: {
			maximumPoints: practice.scoring.maximumPoints,
			calibration: {
				method: practice.scoring.calibration.method,
				profiles: Object.fromEntries(languages.map((language) => [language, practice.scoring.calibration.profiles[language]]))
			},
			policies: practice.scoring.policies.map((policy) => ({
				id: policy.id,
				points: policy.points,
				limits: structuredClone(policy.limits)
			})),
			safetyLimits: structuredClone(practice.scoring.safetyLimits)
		}
	}, languages);
}
/**
* Bind an execution package to the public contract without requiring hidden
* data to appear in the public bundle. Scoring/resources must match exactly,
* and every published sample must be an exact case in the private package.
*/
function assertJudgeDataMatchesPracticePublic(judgeData, practice, allowedLanguages) {
	if (practice.judgeCases.some((testCase) => testCase.kind !== "sample")) throw new TypeError("Practice bundle contains hidden judge data.");
	const publicContract = deriveJudgeData(practice, allowedLanguages);
	if (JSON.stringify(judgeData.scoring) !== JSON.stringify(publicContract.scoring)) throw new TypeError("Judge package scoring/resources disagree with the practice-public contract.");
	const cases = new Map(judgeData.cases.map((testCase) => [testCase.id, testCase]));
	for (const sample of publicContract.cases) {
		const packaged = cases.get(sample.id);
		if (!packaged || packaged.input !== sample.input || packaged.output !== sample.output) throw new TypeError(`Judge package does not contain the exact public sample '${sample.id}'.`);
	}
}
function parseJudgeData(value, allowedLanguages) {
	const languages = allowedLanguageSet(allowedLanguages);
	const data = record$2(value, "judge data");
	exact$2(data, [
		"cases",
		"schema",
		"scoring"
	], "judge data");
	if (data.schema !== "wasm-oj-v2/judge-data") throw new TypeError(`Judge data schema must be '${WASM_OJ_JUDGE_DATA_SCHEMA}'.`);
	if (!Array.isArray(data.cases) || data.cases.length < 1 || data.cases.length > 1e4) throw new TypeError("Judge data must contain between 1 and 10000 cases.");
	const caseIds = /* @__PURE__ */ new Set();
	const cases = data.cases.map((candidate, index) => {
		const testCase = record$2(candidate, `judge data case ${index + 1}`);
		exact$2(testCase, [
			"id",
			"input",
			"output"
		], `judge data case ${index + 1}`);
		if (typeof testCase.id !== "string" || !CASE_ID.test(testCase.id) || caseIds.has(testCase.id)) throw new TypeError(`Judge data case ${index + 1} has an invalid or duplicate id.`);
		if (typeof testCase.input !== "string" || typeof testCase.output !== "string" || !isUnicodeScalarString(testCase.input) || !isUnicodeScalarString(testCase.output)) throw new TypeError(`Judge data case '${testCase.id}' input and output must be Unicode scalar strings.`);
		caseIds.add(testCase.id);
		return {
			id: testCase.id,
			input: testCase.input,
			output: testCase.output
		};
	});
	const scoring = record$2(data.scoring, "judge data scoring");
	exact$2(scoring, [
		"calibration",
		"maximumPoints",
		"policies",
		"safetyLimits"
	], "judge data scoring");
	if (scoring.maximumPoints !== 100) throw new TypeError("Judge data maximumPoints must be 100.");
	const calibration = record$2(scoring.calibration, "judge data calibration");
	exact$2(calibration, ["method", "profiles"], "judge data calibration");
	if (calibration.method !== CALIBRATION_METHOD) throw new TypeError("Judge data calibration method is unsupported.");
	const profilesInput = record$2(calibration.profiles, "judge data calibration profiles");
	if (JSON.stringify(Object.keys(profilesInput).sort()) !== JSON.stringify(languages)) throw new TypeError("Judge data calibration profiles must exactly match allowedProfiles.");
	const profiles = {};
	for (const language of languages) {
		const profile = profilesInput[language];
		if (typeof profile !== "string" || !profile || profile !== profile.trim() || profile.length > 4096 || !isUnicodeScalarString(profile)) throw new TypeError(`Judge data calibration profile '${language}' is invalid.`);
		profiles[language] = profile;
	}
	if (!Array.isArray(scoring.policies) || scoring.policies.length !== POLICY_IDS.length) throw new TypeError("Judge data scoring policies are invalid.");
	const policies = scoring.policies.map((candidate, index) => {
		const policy = record$2(candidate, `judge data policy ${index + 1}`);
		exact$2(policy, [
			"id",
			"limits",
			"points"
		], `judge data policy ${index + 1}`);
		const expectedId = POLICY_IDS[index];
		if (policy.id !== expectedId) throw new TypeError(`Judge data policy ${index + 1} must be '${expectedId}'.`);
		return {
			id: expectedId,
			points: positiveInteger$1(policy.points, `judge data policy '${expectedId}' points`, 100),
			limits: limits(policy.limits, expectedId)
		};
	});
	if (policies.reduce((total, policy) => total + policy.points, 0) !== 100) throw new TypeError("Judge data policy points must sum to 100.");
	for (let index = 1; index < policies.length; index += 1) {
		const broad = policies[index - 1].limits;
		const strict = policies[index].limits;
		const logicalInvalid = broad.logicalTimeLimitMs !== void 0 && (strict.logicalTimeLimitMs === void 0 || strict.logicalTimeLimitMs > broad.logicalTimeLimitMs);
		const anyStricter = strict.instructionBudget < broad.instructionBudget || strict.memoryLimitBytes < broad.memoryLimitBytes || broad.logicalTimeLimitMs === void 0 && strict.logicalTimeLimitMs !== void 0 || broad.logicalTimeLimitMs !== void 0 && strict.logicalTimeLimitMs !== void 0 && strict.logicalTimeLimitMs < broad.logicalTimeLimitMs;
		if (strict.instructionBudget > broad.instructionBudget || strict.memoryLimitBytes > broad.memoryLimitBytes || logicalInvalid || !anyStricter) throw new TypeError("Judge data policies must be ordered broad-to-strict.");
	}
	const safetyLimits = record$2(scoring.safetyLimits, "judge data safetyLimits");
	exact$2(safetyLimits, ["wallTimeLimitMs"], "judge data safetyLimits");
	return {
		schema: WASM_OJ_JUDGE_DATA_SCHEMA,
		cases,
		scoring: {
			maximumPoints: 100,
			calibration: {
				method: CALIBRATION_METHOD,
				profiles
			},
			policies,
			safetyLimits: { wallTimeLimitMs: positiveInteger$1(safetyLimits.wallTimeLimitMs, "judge data wallTimeLimitMs", MAX_WALL_TIME_LIMIT_MS) }
		}
	};
}
//#endregion
//#region src/online-judge/judge-package.ts
var WASM_OJ_JUDGE_PACKAGE_SCHEMA = "wasm-oj-v2/judge-package";
var WASM_OJ_JUDGE_PACKAGE_MAGIC = "WOJJDG02";
var WASM_OJ_JUDGE_PACKAGE_MAX_BYTES = 33554432;
var MAGIC = new TextEncoder().encode(WASM_OJ_JUDGE_PACKAGE_MAGIC);
var HEADER_BYTES = MAGIC.byteLength + 4 + 4;
var BLOB_HEADER_BYTES = 40;
var MAX_MANIFEST_BYTES = 262144;
var MAX_BLOBS = 258;
var MAX_ASSETS = 256;
var MAX_ASSET_BYTES$1 = 4194304;
var MAX_ASSET_TOTAL_BYTES$1 = 4194304;
var SHA256$2 = /^[0-9a-f]{64}$/;
function record$1(value, label) {
	if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object.`);
	return value;
}
function exact$1(value, keys, label) {
	const actual = Object.keys(value).sort();
	const expected = [...keys].sort();
	if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new TypeError(`${label} has an invalid shape.`);
}
function digest(value, label) {
	if (typeof value !== "string" || !SHA256$2.test(value)) throw new TypeError(`${label} must be a lowercase SHA-256 digest.`);
	return value;
}
function byteLength(value, label, maximum = WASM_OJ_JUDGE_PACKAGE_MAX_BYTES) {
	if (!Number.isSafeInteger(value) || value < 1 || value > maximum) throw new TypeError(`${label} is outside its byte limit.`);
	return value;
}
function blobReference(value, label, maximum) {
	const reference = record$1(value, label);
	exact$1(reference, ["bytes", "sha256"], label);
	return {
		bytes: byteLength(reference.bytes, `${label}.bytes`, maximum),
		sha256: digest(reference.sha256, `${label}.sha256`)
	};
}
function guestPath(value, label, namespace) {
	if (typeof value !== "string" || value.length > 512 || !isUnicodeScalarString(value) || !value.startsWith(namespace) || value.endsWith("/") || value.includes("//") || value.includes("\\") || value.includes("\0") || value.split("/").some((component) => component === "." || component === "..")) throw new TypeError(`${label} must be inside '${namespace}'.`);
	return value;
}
function args(value, label) {
	if (!Array.isArray(value) || value.length > 64 || value.some((item) => typeof item !== "string" || !isUnicodeScalarString(item) || item.includes("\0") || new TextEncoder().encode(item).byteLength > 4096)) throw new TypeError(`${label} must be a bounded string array.`);
	return [...value];
}
function judgeManifest(value) {
	const judge = record$1(value, "judge package judge");
	if (judge.kind === "text") {
		exact$1(judge, ["kind"], "judge package text judge");
		return { kind: "text" };
	}
	if (judge.kind !== "checker" && judge.kind !== "interactive") throw new TypeError("Judge package kind is unsupported.");
	exact$1(judge, judge.kind === "checker" ? [
		"args",
		"artifact",
		"assets",
		"kind",
		"runtimeProfile"
	] : [
		"args",
		"artifact",
		"assets",
		"inputPath",
		"kind",
		"runtimeProfile"
	], `judge package ${judge.kind}`);
	if (typeof judge.runtimeProfile !== "string" || !TRUSTED_JUDGE_RUNTIME_PROFILES.has(judge.runtimeProfile)) throw new TypeError(`Judge package ${judge.kind} runtimeProfile is unsupported.`);
	if (!Array.isArray(judge.assets) || judge.assets.length > MAX_ASSETS) throw new TypeError(`Judge package ${judge.kind} assets are invalid.`);
	const namespace = judge.kind === "checker" ? "/checker/assets/" : "/interactor/assets/";
	const assets = judge.assets.map((candidate, index) => {
		const asset = record$1(candidate, `judge package ${judge.kind} asset ${index}`);
		exact$1(asset, [
			"bytes",
			"guestPath",
			"sha256"
		], `judge package ${judge.kind} asset ${index}`);
		return {
			guestPath: guestPath(asset.guestPath, `judge package ${judge.kind} asset ${index}.guestPath`, namespace),
			...blobReference({
				bytes: asset.bytes,
				sha256: asset.sha256
			}, `judge package ${judge.kind} asset ${index}`, MAX_ASSET_BYTES$1)
		};
	});
	const paths = assets.map((asset) => asset.guestPath);
	const sortedPaths = [...paths].sort();
	if (new Set(paths).size !== paths.length || JSON.stringify(paths) !== JSON.stringify(sortedPaths)) throw new TypeError(`Judge package ${judge.kind} assets must be unique and sorted by guestPath.`);
	if (assets.reduce((total, asset) => total + asset.bytes, 0) > MAX_ASSET_TOTAL_BYTES$1) throw new TypeError(`Judge package ${judge.kind} assets exceed 4 MiB.`);
	const runtimeProfile = judge.runtimeProfile;
	const artifact = blobReference(judge.artifact, `judge package ${judge.kind} artifact`, TRUSTED_JUDGE_WASM_MAX_BYTES);
	const judgeArgs = args(judge.args, `judge package ${judge.kind} args`);
	if (judge.kind === "checker") return {
		kind: "checker",
		runtimeProfile,
		artifact,
		assets,
		args: judgeArgs
	};
	return {
		kind: "interactive",
		runtimeProfile,
		artifact,
		assets,
		args: judgeArgs,
		inputPath: guestPath(judge.inputPath, "judge package interactive inputPath", "/interactor/input/")
	};
}
function parseJudgePackageManifest(value) {
	const manifest = record$1(value, "judge package manifest");
	exact$1(manifest, [
		"allowedProfiles",
		"wasmOjContract",
		"judge",
		"judgeData",
		"schema"
	], "judge package manifest");
	if (manifest.schema !== "wasm-oj-v2/judge-package" || manifest.wasmOjContract !== WASM_OJ_CONTRACT_VERSION$1) throw new TypeError("Judge package manifest contract is unsupported.");
	return {
		schema: WASM_OJ_JUDGE_PACKAGE_SCHEMA,
		wasmOjContract: WASM_OJ_CONTRACT_VERSION$1,
		judgeData: blobReference(manifest.judgeData, "judge package judgeData"),
		allowedProfiles: parseJudgeAllowedProfiles(manifest.allowedProfiles, "judge package allowedProfiles"),
		judge: judgeManifest(manifest.judge)
	};
}
function manifestReferences(manifest) {
	return [manifest.judgeData, ...manifest.judge.kind === "text" ? [] : [manifest.judge.artifact, ...manifest.judge.assets]];
}
function equalBytes(left, right) {
	if (left.byteLength !== right.byteLength) return false;
	let difference = 0;
	for (let index = 0; index < left.byteLength; index += 1) difference |= left[index] ^ right[index];
	return difference === 0;
}
function hexBytes(value) {
	digest(value, "blob digest");
	return Uint8Array.from({ length: 32 }, (_, index) => Number.parseInt(value.slice(index * 2, index * 2 + 2), 16));
}
function bytesHex(value) {
	return Array.from(value, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
function safeTotal(left, right) {
	const result = left + right;
	if (!Number.isSafeInteger(result) || result > 33554432) throw new TypeError("Judge package exceeds 32 MiB.");
	return result;
}
async function reference(contents) {
	if (!(contents instanceof Uint8Array) || contents.byteLength < 1) throw new TypeError("Judge package blobs must be non-empty Uint8Array values.");
	return {
		bytes: contents.byteLength,
		sha256: await sha256Hex$1(contents)
	};
}
/** Author-side deterministic package builder. It never executes the trusted module. */
async function encodeJudgePackage(input) {
	const blobs = /* @__PURE__ */ new Map();
	const add = async (contents) => {
		const descriptor = await reference(contents);
		const existing = blobs.get(descriptor.sha256);
		if (existing && !equalBytes(existing, contents)) throw new TypeError("Judge package encountered a SHA-256 collision.");
		if (!existing) blobs.set(descriptor.sha256, contents.slice());
		return descriptor;
	};
	const languageKeys = Object.keys(input.allowedProfiles).sort();
	const judgeDataValue = parseJudgeData(input.judgeData, languageKeys);
	const judgeData = await add(canonicalJsonBytes(judgeDataValue));
	let judge;
	if (input.judge.kind === "text") judge = { kind: "text" };
	else {
		validateTrustedJudgeWasm(input.judge.artifact, { memoryLimitBytes: Math.max(...judgeDataValue.scoring.policies.map((policy) => policy.limits.memoryLimitBytes)) });
		const artifact = await add(input.judge.artifact);
		const assetInputs = [...input.judge.assets].sort((left, right) => left.guestPath.localeCompare(right.guestPath));
		const assets = await Promise.all(assetInputs.map(async (asset) => ({
			guestPath: asset.guestPath,
			...await add(asset.contents)
		})));
		judge = input.judge.kind === "checker" ? {
			kind: "checker",
			runtimeProfile: input.judge.runtimeProfile,
			artifact,
			assets,
			args: [...input.judge.args]
		} : {
			kind: "interactive",
			runtimeProfile: input.judge.runtimeProfile,
			artifact,
			assets,
			args: [...input.judge.args],
			inputPath: input.judge.inputPath
		};
	}
	const manifest = parseJudgePackageManifest({
		schema: WASM_OJ_JUDGE_PACKAGE_SCHEMA,
		wasmOjContract: WASM_OJ_CONTRACT_VERSION$1,
		judgeData,
		allowedProfiles: input.allowedProfiles,
		judge
	});
	const manifestBytes = canonicalJsonBytes(manifest);
	if (manifestBytes.byteLength > MAX_MANIFEST_BYTES) throw new TypeError("Judge package manifest exceeds 256 KiB.");
	const ordered = [[judgeData.sha256, blobs.get(judgeData.sha256)], ...[...blobs].filter(([sha256]) => sha256 !== judgeData.sha256).sort(([left], [right]) => left.localeCompare(right))];
	if (ordered.length > MAX_BLOBS) throw new TypeError("Judge package contains too many blobs.");
	let total = safeTotal(HEADER_BYTES, manifestBytes.byteLength);
	for (const [, contents] of ordered) total = safeTotal(total, BLOB_HEADER_BYTES + contents.byteLength);
	const encoded = new Uint8Array(total);
	encoded.set(MAGIC, 0);
	const view = new DataView(encoded.buffer);
	view.setUint32(MAGIC.byteLength, manifestBytes.byteLength, false);
	view.setUint32(MAGIC.byteLength + 4, ordered.length, false);
	let offset = HEADER_BYTES;
	encoded.set(manifestBytes, offset);
	offset += manifestBytes.byteLength;
	for (const [sha256, contents] of ordered) {
		encoded.set(hexBytes(sha256), offset);
		offset += 32;
		view.setBigUint64(offset, BigInt(contents.byteLength), false);
		offset += 8;
		encoded.set(contents, offset);
		offset += contents.byteLength;
	}
	return {
		bytes: encoded,
		manifest,
		executionSemanticSha256: await judgePackageSemanticDigest(encoded)
	};
}
function readHeader(bytes) {
	if (bytes.byteLength < HEADER_BYTES || !equalBytes(bytes.subarray(0, MAGIC.byteLength), MAGIC)) throw new TypeError("Judge package transport magic is invalid.");
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const manifestLength = view.getUint32(MAGIC.byteLength, false);
	const blobCount = view.getUint32(MAGIC.byteLength + 4, false);
	if (manifestLength < 1 || manifestLength > MAX_MANIFEST_BYTES || blobCount > MAX_BLOBS) throw new TypeError("Judge package transport header exceeds its limits.");
	return {
		manifestLength,
		blobCount
	};
}
/** Read only the bounded canonical manifest from complete package bytes. */
function readJudgePackageManifest(bytes) {
	if (!(bytes instanceof Uint8Array) || bytes.byteLength > 33554432) throw new TypeError("Judge package bytes exceed 32 MiB.");
	const { manifestLength } = readHeader(bytes);
	if (HEADER_BYTES + manifestLength > bytes.byteLength) throw new TypeError("Judge package manifest is truncated.");
	return parseJudgePackageManifest(parseCanonicalJsonBytes(bytes.subarray(HEADER_BYTES, HEADER_BYTES + manifestLength), "judge package manifest"));
}
async function* sourceChunks(source) {
	if (source instanceof Uint8Array) {
		yield source;
		return;
	}
	if (typeof source.getReader === "function") {
		const reader = source.getReader();
		try {
			while (true) {
				const result = await reader.read();
				if (result.done) return;
				yield result.value;
			}
		} finally {
			reader.releaseLock();
		}
	}
	for await (const chunk of source) yield chunk;
}
var PackageStreamReader = class {
	iterator;
	current = /* @__PURE__ */ new Uint8Array();
	currentOffset = 0;
	ended = false;
	received = 0;
	sha256 = new IncrementalSha256();
	constructor(source) {
		this.iterator = sourceChunks(source)[Symbol.asyncIterator]();
	}
	get byteLength() {
		return this.received;
	}
	async take(length) {
		if (!Number.isSafeInteger(length) || length < 0 || length > 33554432) throw new TypeError("Judge package read length is invalid.");
		const result = new Uint8Array(length);
		let written = 0;
		while (written < length) {
			if (this.currentOffset === this.current.byteLength) await this.pull();
			if (this.ended) throw new TypeError("Judge package transport is truncated.");
			const count = Math.min(length - written, this.current.byteLength - this.currentOffset);
			result.set(this.current.subarray(this.currentOffset, this.currentOffset + count), written);
			this.currentOffset += count;
			written += count;
		}
		return result;
	}
	async finish() {
		if (this.currentOffset !== this.current.byteLength) throw new TypeError("Judge package transport contains trailing bytes.");
		await this.pull();
		if (!this.ended) throw new TypeError("Judge package transport contains trailing bytes.");
		return {
			bytes: this.received,
			sha256: this.sha256.finishHex()
		};
	}
	async pull() {
		while (!this.ended) {
			const result = await this.iterator.next();
			if (result.done) {
				this.ended = true;
				this.current = /* @__PURE__ */ new Uint8Array();
				this.currentOffset = 0;
				return;
			}
			if (!(result.value instanceof Uint8Array)) throw new TypeError("Judge package stream chunks must be Uint8Array values.");
			if (result.value.byteLength === 0) continue;
			this.received = safeTotal(this.received, result.value.byteLength);
			this.sha256.update(result.value);
			this.current = result.value;
			this.currentOffset = 0;
			return;
		}
	}
};
/**
* Stream-validates one package while retaining at most the manifest and one
* bounded blob. This is the Worker-facing admission API used before R2 publish.
*/
async function validateJudgePackage(source, options = {}) {
	if (options.expectedBytes !== void 0 && (!Number.isSafeInteger(options.expectedBytes) || options.expectedBytes < 1 || options.expectedBytes > 33554432)) throw new TypeError("Expected judge package byte length is invalid.");
	if (options.expectedSha256 !== void 0) digest(options.expectedSha256, "expected judge package digest");
	const reader = new PackageStreamReader(source);
	const { manifestLength, blobCount } = readHeader(await reader.take(HEADER_BYTES));
	const manifest = parseJudgePackageManifest(parseCanonicalJsonBytes(await reader.take(manifestLength), "judge package manifest"));
	const references = /* @__PURE__ */ new Map();
	for (const referenceValue of manifestReferences(manifest)) {
		const existing = references.get(referenceValue.sha256);
		if (existing && existing.bytes !== referenceValue.bytes) throw new TypeError("Judge package repeats one digest with different lengths.");
		references.set(referenceValue.sha256, referenceValue);
	}
	const orderedDigests = [manifest.judgeData.sha256, ...[...references.keys()].filter((sha256) => sha256 !== manifest.judgeData.sha256).sort()];
	if (blobCount !== orderedDigests.length) throw new TypeError("Judge package blob count disagrees with its manifest.");
	let judgeData;
	for (const expectedDigest of orderedDigests) {
		const blobHeader = await reader.take(BLOB_HEADER_BYTES);
		const actualDigest = bytesHex(blobHeader.subarray(0, 32));
		const lengthValue = new DataView(blobHeader.buffer, blobHeader.byteOffset + 32, 8).getBigUint64(0, false);
		if (lengthValue > BigInt(Number.MAX_SAFE_INTEGER)) throw new TypeError("Judge package blob length exceeds the safe integer range.");
		const length = Number(lengthValue);
		const expected = references.get(expectedDigest);
		if (actualDigest !== expectedDigest || length !== expected.bytes) throw new TypeError("Judge package blob header disagrees with its manifest.");
		const contents = await reader.take(length);
		if (await sha256Hex$1(contents) !== expectedDigest) throw new TypeError(`Judge package blob '${expectedDigest}' failed integrity verification.`);
		if (expectedDigest === manifest.judgeData.sha256) judgeData = parseJudgeData(parseCanonicalJsonBytes(contents, "judge package judgeData"), Object.keys(manifest.allowedProfiles).sort());
		if (manifest.judge.kind !== "text" && expectedDigest === manifest.judge.artifact.sha256) {
			if (!judgeData) throw new TypeError("Judge package judgeData must precede its executable blobs.");
			const packageMemoryLimit = Math.max(...judgeData.scoring.policies.map((policy) => policy.limits.memoryLimitBytes));
			validateTrustedJudgeWasm(contents, { memoryLimitBytes: options.memoryLimitBytes === void 0 ? packageMemoryLimit : Math.min(packageMemoryLimit, options.memoryLimitBytes) });
		}
	}
	const completed = await reader.finish();
	if (options.expectedBytes !== void 0 && completed.bytes !== options.expectedBytes) throw new TypeError("Judge package byte length disagrees with its descriptor.");
	if (options.expectedSha256 !== void 0 && completed.sha256 !== options.expectedSha256) throw new TypeError("Judge package digest disagrees with its descriptor.");
	if (!judgeData) throw new TypeError("Judge package is missing its judgeData blob.");
	return {
		manifest,
		judgeData,
		bytes: completed.bytes,
		executionSemanticSha256: completed.sha256
	};
}
/** Decode a fully verified package into the exact trusted executable contract consumed by the container runtime. */
async function decodeJudgePackageForExecution(bytes) {
	const validated = await validateJudgePackage(bytes);
	const { manifestLength, blobCount } = readHeader(bytes);
	let offset = HEADER_BYTES + manifestLength;
	const blobs = /* @__PURE__ */ new Map();
	const executableDigests = validated.manifest.judge.kind === "text" ? /* @__PURE__ */ new Set() : /* @__PURE__ */ new Set([validated.manifest.judge.artifact.sha256, ...validated.manifest.judge.assets.map((asset) => asset.sha256)]);
	for (let index = 0; index < blobCount; index += 1) {
		const digestValue = bytesHex(bytes.subarray(offset, offset + 32));
		const lengthValue = new DataView(bytes.buffer, bytes.byteOffset + offset + 32, 8).getBigUint64(0, false);
		const length = Number(lengthValue);
		offset += BLOB_HEADER_BYTES;
		if (executableDigests.has(digestValue)) blobs.set(digestValue, bytes.slice(offset, offset + length));
		offset += length;
	}
	let judge;
	if (validated.manifest.judge.kind === "text") judge = { kind: "text" };
	else {
		const manifestJudge = validated.manifest.judge;
		const artifact = blobs.get(manifestJudge.artifact.sha256);
		if (!artifact) throw new TypeError("Verified judge package is missing its executable artifact.");
		const assets = manifestJudge.assets.map((asset) => {
			const assetBytes = blobs.get(asset.sha256);
			if (!assetBytes) throw new TypeError(`Verified judge package is missing asset '${asset.guestPath}'.`);
			return {
				guestPath: asset.guestPath,
				bytes: assetBytes.slice()
			};
		});
		const base = {
			kind: manifestJudge.kind,
			runtimeProfile: manifestJudge.runtimeProfile,
			artifact: artifact.slice(),
			assets,
			args: [...manifestJudge.args]
		};
		judge = manifestJudge.kind === "checker" ? {
			...base,
			kind: "checker"
		} : {
			...base,
			kind: "interactive",
			inputPath: manifestJudge.inputPath
		};
	}
	return {
		...validated,
		allowedProfiles: validated.manifest.allowedProfiles,
		judge
	};
}
/** Execution identity is the digest of the exact canonical WOJJDG02 bytes. */
function judgePackageSemanticDigest(bytes) {
	if (!(bytes instanceof Uint8Array) || bytes.byteLength < HEADER_BYTES || bytes.byteLength > 33554432) return Promise.reject(/* @__PURE__ */ new TypeError("Judge package bytes are outside the transport limit."));
	return sha256Hex$1(bytes);
}
var SHA256_INITIAL = new Uint32Array([
	1779033703,
	3144134277,
	1013904242,
	2773480762,
	1359893119,
	2600822924,
	528734635,
	1541459225
]);
var SHA256_CONSTANTS = new Uint32Array([
	1116352408,
	1899447441,
	3049323471,
	3921009573,
	961987163,
	1508970993,
	2453635748,
	2870763221,
	3624381080,
	310598401,
	607225278,
	1426881987,
	1925078388,
	2162078206,
	2614888103,
	3248222580,
	3835390401,
	4022224774,
	264347078,
	604807628,
	770255983,
	1249150122,
	1555081692,
	1996064986,
	2554220882,
	2821834349,
	2952996808,
	3210313671,
	3336571891,
	3584528711,
	113926993,
	338241895,
	666307205,
	773529912,
	1294757372,
	1396182291,
	1695183700,
	1986661051,
	2177026350,
	2456956037,
	2730485921,
	2820302411,
	3259730800,
	3345764771,
	3516065817,
	3600352804,
	4094571909,
	275423344,
	430227734,
	506948616,
	659060556,
	883997877,
	958139571,
	1322822218,
	1537002063,
	1747873779,
	1955562222,
	2024104815,
	2227730452,
	2361852424,
	2428436474,
	2756734187,
	3204031479,
	3329325298
]);
function rotateRight(value, bits) {
	return value >>> bits | value << 32 - bits;
}
var IncrementalSha256 = class {
	state = SHA256_INITIAL.slice();
	buffer = /* @__PURE__ */ new Uint8Array(64);
	bufferLength = 0;
	totalBytes = 0;
	finished = false;
	update(bytes) {
		if (this.finished) throw new TypeError("SHA-256 state is already finalized.");
		this.totalBytes += bytes.byteLength;
		let offset = 0;
		while (offset < bytes.byteLength) {
			const count = Math.min(64 - this.bufferLength, bytes.byteLength - offset);
			this.buffer.set(bytes.subarray(offset, offset + count), this.bufferLength);
			this.bufferLength += count;
			offset += count;
			if (this.bufferLength === 64) {
				this.compress(this.buffer);
				this.bufferLength = 0;
			}
		}
	}
	finishHex() {
		if (this.finished) throw new TypeError("SHA-256 state is already finalized.");
		this.finished = true;
		const bitLength = BigInt(this.totalBytes) * 8n;
		this.buffer[this.bufferLength++] = 128;
		if (this.bufferLength > 56) {
			this.buffer.fill(0, this.bufferLength);
			this.compress(this.buffer);
			this.bufferLength = 0;
		}
		this.buffer.fill(0, this.bufferLength, 56);
		new DataView(this.buffer.buffer).setBigUint64(56, bitLength, false);
		this.compress(this.buffer);
		const output = /* @__PURE__ */ new Uint8Array(32);
		const view = new DataView(output.buffer);
		for (let index = 0; index < this.state.length; index += 1) view.setUint32(index * 4, this.state[index], false);
		return bytesHex(output);
	}
	compress(block) {
		const words = /* @__PURE__ */ new Uint32Array(64);
		const view = new DataView(block.buffer, block.byteOffset, block.byteLength);
		for (let index = 0; index < 16; index += 1) words[index] = view.getUint32(index * 4, false);
		for (let index = 16; index < 64; index += 1) {
			const left = words[index - 15];
			const right = words[index - 2];
			const sigma0 = rotateRight(left, 7) ^ rotateRight(left, 18) ^ left >>> 3;
			const sigma1 = rotateRight(right, 17) ^ rotateRight(right, 19) ^ right >>> 10;
			words[index] = words[index - 16] + sigma0 + words[index - 7] + sigma1 >>> 0;
		}
		let [a, b, c, d, e, f, g, h] = this.state;
		for (let index = 0; index < 64; index += 1) {
			const sum1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
			const choice = e & f ^ ~e & g;
			const temporary1 = h + sum1 + choice + SHA256_CONSTANTS[index] + words[index] >>> 0;
			const temporary2 = (rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22)) + (a & b ^ a & c ^ b & c) >>> 0;
			h = g;
			g = f;
			f = e;
			e = d + temporary1 >>> 0;
			d = c;
			c = b;
			b = a;
			a = temporary1 + temporary2 >>> 0;
		}
		this.state[0] = this.state[0] + a >>> 0;
		this.state[1] = this.state[1] + b >>> 0;
		this.state[2] = this.state[2] + c >>> 0;
		this.state[3] = this.state[3] + d >>> 0;
		this.state[4] = this.state[4] + e >>> 0;
		this.state[5] = this.state[5] + f >>> 0;
		this.state[6] = this.state[6] + g >>> 0;
		this.state[7] = this.state[7] + h >>> 0;
	}
};
//#endregion
//#region src/online-judge/repository-authoring.ts
var REPOSITORY_AUTHORING_JUDGES_SCHEMA = "wasm-oj-platform/repository-authoring-judges/v1";
var SHA256$1 = /^[0-9a-f]{64}$/;
var SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
var PATH = /^(?!\/)(?!.*(?:^|\/)\.{1,2}(?:\/|$))(?!.*\/\/)(?!.*\\)(?!.*\/$)[^\u0000]+$/;
var GUEST_PATH = /^\/(?!.*(?:^|\/)\.{1,2}(?:\/|$))(?!.*\/\/)(?!.*\\)(?!.*\/$)[^\u0000]+$/;
var MAX_ASSET_BYTES = 4194304;
var MAX_ASSET_TOTAL_BYTES = 4194304;
function record(value, label) {
	if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object.`);
	return value;
}
function exact(value, keys, label) {
	if (Object.keys(value).sort().join("\0") !== [...keys].sort().join("\0")) throw new TypeError(`${label} has an invalid shape.`);
}
function sourceObject(value, label, maximum) {
	const object = record(value, label);
	exact(object, [
		"bytes",
		"path",
		"sha256"
	], label);
	if (typeof object.path !== "string" || object.path.length < 1 || object.path.length > 512 || !PATH.test(object.path)) throw new TypeError(`${label}.path must be a normalized repository-relative POSIX path.`);
	if (!Number.isSafeInteger(object.bytes) || object.bytes < 1 || object.bytes > maximum) throw new TypeError(`${label}.bytes is outside its limit.`);
	if (typeof object.sha256 !== "string" || !SHA256$1.test(object.sha256)) throw new TypeError(`${label}.sha256 is invalid.`);
	return {
		path: object.path,
		bytes: object.bytes,
		sha256: object.sha256
	};
}
function judge(value, slug) {
	const input = record(value, `repository authoring '${slug}' judge`);
	if (input.kind === "text") {
		exact(input, ["kind"], `repository authoring '${slug}' text judge`);
		return { kind: "text" };
	}
	if (input.kind !== "checker" && input.kind !== "interactive") throw new TypeError(`Repository authoring '${slug}' judge kind is unsupported.`);
	exact(input, input.kind === "checker" ? [
		"args",
		"artifact",
		"assets",
		"kind"
	] : [
		"args",
		"artifact",
		"assets",
		"inputPath",
		"kind"
	], `repository authoring '${slug}' ${input.kind}`);
	const artifactValue = record(input.artifact, `repository authoring '${slug}' ${input.kind} artifact`);
	exact(artifactValue, [
		"bytes",
		"path",
		"runtimeProfile",
		"sha256"
	], `repository authoring '${slug}' ${input.kind} artifact`);
	if (typeof artifactValue.runtimeProfile !== "string" || !TRUSTED_JUDGE_RUNTIME_PROFILES.has(artifactValue.runtimeProfile)) throw new TypeError(`Repository authoring '${slug}' ${input.kind} runtimeProfile is unsupported.`);
	const artifact = {
		...sourceObject({
			bytes: artifactValue.bytes,
			path: artifactValue.path,
			sha256: artifactValue.sha256
		}, `repository authoring '${slug}' ${input.kind} artifact`, TRUSTED_JUDGE_WASM_MAX_BYTES),
		runtimeProfile: artifactValue.runtimeProfile
	};
	if (!artifact.path.endsWith(".wasm")) throw new TypeError(`Repository authoring '${slug}' ${input.kind} artifact path must end in '.wasm'.`);
	if (!Array.isArray(input.assets) || input.assets.length > 256) throw new TypeError(`Repository authoring '${slug}' ${input.kind} assets are invalid.`);
	const namespace = input.kind === "checker" ? "/checker/assets/" : "/interactor/assets/";
	const assets = input.assets.map((candidate, index) => {
		const asset = record(candidate, `repository authoring '${slug}' ${input.kind} asset ${index}`);
		exact(asset, [
			"bytes",
			"guestPath",
			"path",
			"sha256"
		], `repository authoring '${slug}' ${input.kind} asset ${index}`);
		if (typeof asset.guestPath !== "string" || !GUEST_PATH.test(asset.guestPath) || !asset.guestPath.startsWith(namespace)) throw new TypeError(`Repository authoring '${slug}' ${input.kind} asset ${index} guestPath must be inside '${namespace}'.`);
		return {
			...sourceObject({
				bytes: asset.bytes,
				path: asset.path,
				sha256: asset.sha256
			}, `repository authoring '${slug}' ${input.kind} asset ${index}`, MAX_ASSET_BYTES),
			guestPath: asset.guestPath
		};
	});
	const guestPaths = assets.map((asset) => asset.guestPath);
	const repositoryPaths = [artifact.path, ...assets.map((asset) => asset.path)];
	if (new Set(guestPaths).size !== guestPaths.length || new Set(repositoryPaths).size !== repositoryPaths.length) throw new TypeError(`Repository authoring '${slug}' ${input.kind} repeats an asset or repository path.`);
	if (assets.reduce((total, asset) => total + asset.bytes, 0) > MAX_ASSET_TOTAL_BYTES) throw new TypeError(`Repository authoring '${slug}' ${input.kind} assets exceed 4 MiB.`);
	if (!Array.isArray(input.args) || input.args.length > 64 || input.args.some((argument) => typeof argument !== "string" || argument.includes("\0") || new TextEncoder().encode(argument).byteLength > 4096)) throw new TypeError(`Repository authoring '${slug}' ${input.kind} args are invalid.`);
	const args = [...input.args];
	if (input.kind === "checker") return {
		kind: "checker",
		artifact,
		assets,
		args
	};
	if (typeof input.inputPath !== "string" || !GUEST_PATH.test(input.inputPath) || !input.inputPath.startsWith("/interactor/input/")) throw new TypeError(`Repository authoring '${slug}' interactive inputPath must be inside '/interactor/input/'.`);
	return {
		kind: "interactive",
		artifact,
		assets,
		args,
		inputPath: input.inputPath
	};
}
/** Author-only input used by collection build; never accepted by the platform sync boundary. */
function parseRepositoryAuthoringJudges(value) {
	const source = record(value, "repository authoring judges");
	exact(source, ["problems", "schema"], "repository authoring judges");
	if (source.schema !== "wasm-oj-platform/repository-authoring-judges/v1") throw new TypeError(`Repository authoring judge schema must be '${REPOSITORY_AUTHORING_JUDGES_SCHEMA}'.`);
	if (!Array.isArray(source.problems) || source.problems.length < 1 || source.problems.length > 1e3) throw new TypeError("Repository authoring judges must contain between 1 and 1000 problems.");
	const slugs = /* @__PURE__ */ new Set();
	return {
		schema: REPOSITORY_AUTHORING_JUDGES_SCHEMA,
		problems: source.problems.map((candidate, index) => {
			const problem = record(candidate, `repository authoring judge problem ${index + 1}`);
			exact(problem, [
				"allowedProfiles",
				"judge",
				"slug"
			], `repository authoring judge problem ${index + 1}`);
			if (typeof problem.slug !== "string" || !SLUG.test(problem.slug) || slugs.has(problem.slug)) throw new TypeError(`Repository authoring judge problem ${index + 1} has an invalid or duplicate slug.`);
			slugs.add(problem.slug);
			return {
				slug: problem.slug,
				allowedProfiles: parseJudgeAllowedProfiles(problem.allowedProfiles, `repository authoring '${problem.slug}' allowedProfiles`),
				judge: judge(problem.judge, problem.slug)
			};
		})
	};
}
//#endregion
//#region src/online-judge/trusted-judge.ts
function resources(data, policy) {
	return {
		instructionBudget: policy.limits.instructionBudget,
		memoryLimitBytes: policy.limits.memoryLimitBytes,
		wallTimeLimitMs: data.scoring.safetyLimits.wallTimeLimitMs,
		...policy.limits.logicalTimeLimitMs === void 0 ? {} : { logicalTimeLimitMs: policy.limits.logicalTimeLimitMs }
	};
}
function program(executable) {
	return {
		runtimeProfile: executable.runtimeProfile,
		wasm: executable.artifact.slice()
	};
}
function assets(executable) {
	return Object.fromEntries(executable.assets.map((asset) => [asset.guestPath, asset.bytes.slice()]));
}
/** Build the runtime judge spec directly from verified WOJJDG02 execution data. */
function trustedJudgeSpec(data, executable) {
	const broadest = data.scoring.policies[0];
	if (!broadest) throw new TypeError("Judge package has no resource policy.");
	const executionResources = resources(data, broadest);
	if (executable.kind === "text") return {
		version: WASM_OJ_CONTRACT_VERSION$1,
		failFast: false,
		cases: data.cases.map((testCase) => ({
			kind: "batch",
			id: testCase.id,
			input: {
				kind: "inline",
				value: testCase.input
			},
			matcher: textMatcher(testCase.output, "lines"),
			args: [],
			env: {},
			resources: executionResources
		}))
	};
	const trustedProgram = program(executable);
	const trustedAssets = assets(executable);
	if (executable.kind === "checker") return {
		version: WASM_OJ_CONTRACT_VERSION$1,
		failFast: false,
		cases: data.cases.map((testCase) => ({
			kind: "batch",
			id: testCase.id,
			input: {
				kind: "inline",
				value: testCase.input
			},
			matcher: wasmCheckerMatcher(trustedProgram, testCase.output, executable.args, trustedAssets),
			args: [],
			env: {},
			resources: executionResources
		}))
	};
	const files = Object.fromEntries(Object.entries(trustedAssets).map(([path, bytes]) => [path, {
		kind: "inline-bytes",
		value: bytes
	}]));
	return {
		version: WASM_OJ_CONTRACT_VERSION$1,
		failFast: false,
		cases: data.cases.map((testCase) => ({
			kind: "interactive",
			id: testCase.id,
			input: {
				kind: "inline",
				value: testCase.input
			},
			files,
			contestant: {
				args: [],
				env: {},
				resources: executionResources
			},
			interactor: {
				program: trustedProgram,
				args: [...executable.args],
				env: {},
				resources: executionResources,
				inputPath: executable.inputPath
			}
		}))
	};
}
//#endregion
//#region src/dependencies/limits.ts
var issuedDownloadBudgets = /* @__PURE__ */ new WeakSet();
function createDependencyDownloadBudget(limitBytes = DEPENDENCY_RESOLUTION_LIMITS.totalDownloadBytes) {
	if (!Number.isSafeInteger(limitBytes) || limitBytes < 1 || limitBytes > DEPENDENCY_RESOLUTION_LIMITS.totalDownloadBytes) throw new RangeError(`Dependency download budget must be 1-${DEPENDENCY_RESOLUTION_LIMITS.totalDownloadBytes} bytes.`);
	let usedBytes = 0;
	const add = (bytes) => {
		if (!Number.isSafeInteger(bytes) || bytes < 0) throw new TypeError("Dependency download byte reservation is invalid.");
		if (usedBytes + bytes > limitBytes) throw new RangeError(`Dependency downloads exceed the ${limitBytes}-byte aggregate limit.`);
		usedBytes += bytes;
	};
	const budget = Object.freeze({
		get limitBytes() {
			return limitBytes;
		},
		get usedBytes() {
			return usedBytes;
		},
		reserve(bytes) {
			add(bytes);
		},
		consume(bytes) {
			add(bytes);
		},
		release(bytes) {
			if (!Number.isSafeInteger(bytes) || bytes < 0 || bytes > usedBytes) throw new TypeError("Dependency download byte release is invalid.");
			usedBytes -= bytes;
		}
	});
	issuedDownloadBudgets.add(budget);
	return budget;
}
/** Rejects caller-forged budgets whose methods could silently bypass the hard aggregate cap. */
function assertDependencyDownloadBudget(value) {
	if (!value || typeof value !== "object" || !issuedDownloadBudgets.has(value)) throw new TypeError("Dependency download budget must be issued by WASM-OJ.");
	const budget = value;
	if (!Number.isSafeInteger(budget.limitBytes) || budget.limitBytes < 1 || budget.limitBytes > DEPENDENCY_RESOLUTION_LIMITS.totalDownloadBytes || !Number.isSafeInteger(budget.usedBytes) || budget.usedBytes < 0 || budget.usedBytes > budget.limitBytes) throw new TypeError("Dependency download budget state is invalid.");
}
//#endregion
//#region src/dependencies/url-policy.ts
var IP_V4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;
var PRIVATE_SUFFIXES = [
	"home.arpa",
	"internal",
	"intranet",
	"lan",
	"local",
	"localhost"
];
/** Parses a dependency URL and rejects credentials, local names, and every IP literal. */
function publicDependencyUrl(value) {
	let url;
	try {
		url = new URL(value);
	} catch {
		throw new Error(`Dependency URL '${value}' is invalid.`);
	}
	if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) throw new Error(`Dependency URL '${value}' must be credential-free HTTPS without a query or fragment.`);
	dependencyPublicHostname(url.hostname);
	return url;
}
/** Returns the canonical public DNS hostname used by consent records. */
function dependencyPublicHostname(value) {
	const hostname = value.toLowerCase().replace(/\.$/, "");
	if (!hostname || hostname !== value.toLowerCase().replace(/\.$/, "")) throw new Error(`Dependency hostname '${value}' is invalid.`);
	if (isIpLiteral(hostname)) throw new Error(`Dependency hostname '${value}' must not be an IP literal.`);
	if (PRIVATE_SUFFIXES.some((suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`))) throw new Error(`Dependency hostname '${value}' is a local or private-network endpoint.`);
	let canonical;
	try {
		canonical = new URL(`https://${hostname}/`);
	} catch {
		throw new Error(`Dependency hostname '${value}' is invalid.`);
	}
	const normalized = canonical.hostname.toLowerCase().replace(/\.$/, "");
	if (normalized !== hostname || canonical.port || canonical.username || canonical.password) throw new Error(`Dependency hostname '${value}' must be a canonical DNS hostname.`);
	return normalized;
}
function isIpLiteral(hostname) {
	const unwrapped = hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;
	return IP_V4.test(unwrapped) || unwrapped.includes(":");
}
//#endregion
//#region src/dependencies/network-consent.ts
var STORAGE_PREFIX = "wasm-oj:dependency-network-consent:v2:";
var DIGEST = /^[0-9a-f]{64}$/;
/**
* Browser consent authorizer isolated by repository source, immutable bundle,
* and the complete requested host set. A newly introduced host always prompts.
*/
var BrowserDependencyNetworkConsent = class {
	#storage;
	#prompt;
	#now;
	constructor(storage, prompt, now = () => /* @__PURE__ */ new Date()) {
		this.#storage = storage;
		this.#prompt = prompt;
		this.#now = now;
	}
	async authorize(rawAccess) {
		const access = normalizeDependencyNetworkAccess(rawAccess);
		const key = await consentStorageKey(access.sourceKey, access.bundleDigest);
		const existing = this.#read(key, access);
		if (existing && isSubset(access.hosts, existing.hosts)) return;
		const hosts = normalizedHosts([...existing?.hosts ?? [], ...access.hosts]);
		const request = Object.freeze({
			...access,
			hosts
		});
		if (!await this.#prompt(request)) throw new Error("Dependency network access was not approved for the complete host set.");
		const approvedHosts = normalizedHosts([...this.#read(key, access)?.hosts ?? [], ...hosts]);
		this.#storage.setItem(key, JSON.stringify({
			schema: 1,
			sourceKey: access.sourceKey,
			bundleDigest: access.bundleDigest,
			hosts: approvedHosts,
			grantedAt: this.#now().toISOString()
		}));
	}
	async revoke(sourceKey, bundleDigest) {
		const scope = normalizeDependencyNetworkScope({
			sourceKey,
			bundleDigest
		});
		this.#storage.removeItem(await consentStorageKey(scope.sourceKey, scope.bundleDigest));
	}
	#read(key, expected) {
		const raw = this.#storage.getItem(key);
		if (raw === null) return void 0;
		try {
			const parsed = JSON.parse(raw);
			if (!isStoredConsent(parsed) || parsed.sourceKey !== expected.sourceKey || parsed.bundleDigest !== expected.bundleDigest) throw new Error("mismatch");
			return {
				...parsed,
				hosts: normalizedHosts(parsed.hosts)
			};
		} catch {
			this.#storage.removeItem(key);
			return;
		}
	}
};
function normalizeDependencyNetworkAccess(access) {
	if (!access || typeof access !== "object") throw new TypeError("Dependency network access is required.");
	const scope = normalizeDependencyNetworkScope(access);
	if (!Array.isArray(access.hosts) || access.hosts.length === 0) throw new TypeError("Dependency network access must declare the complete non-empty host set.");
	assertBoundedCount(access.hosts.length, DEPENDENCY_RESOLUTION_LIMITS.hosts, "Dependency network hosts");
	return Object.freeze({
		sourceKey: scope.sourceKey,
		bundleDigest: scope.bundleDigest,
		hosts: normalizedHosts(access.hosts)
	});
}
function normalizeDependencyNetworkScope(scope) {
	if (!scope || typeof scope !== "object") throw new TypeError("Dependency network scope is required.");
	const { sourceKey, bundleDigest } = scope;
	if (typeof sourceKey !== "string" || !sourceKey || sourceKey.length > 2048 || sourceKey !== sourceKey.trim() || sourceKey.includes("\0")) throw new TypeError("Dependency network source key is invalid.");
	if (typeof bundleDigest !== "string" || !DIGEST.test(bundleDigest)) throw new TypeError("Dependency network bundle digest must be lowercase SHA-256 hexadecimal.");
	return Object.freeze({
		sourceKey,
		bundleDigest
	});
}
async function consentStorageKey(sourceKey, bundleDigest) {
	return `${STORAGE_PREFIX}${await sha256Hex$1(new TextEncoder().encode(`${sourceKey}\0${bundleDigest}`))}`;
}
function normalizedHosts(values) {
	const hosts = [...new Set(values.map((host) => {
		if (typeof host !== "string") throw new TypeError("Dependency network hosts must be strings.");
		return dependencyPublicHostname(host);
	}))].sort();
	assertBoundedCount(hosts.length, DEPENDENCY_RESOLUTION_LIMITS.hosts, "Dependency network hosts");
	return hosts;
}
function isSubset(required, approved) {
	const allowed = new Set(approved);
	return required.every((host) => allowed.has(host));
}
function isStoredConsent(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return false;
	const record = value;
	return Object.keys(value).sort().join(",") === "bundleDigest,grantedAt,hosts,schema,sourceKey" && record.schema === 1 && typeof record.sourceKey === "string" && typeof record.bundleDigest === "string" && Array.isArray(record.hosts) && record.hosts.length <= DEPENDENCY_RESOLUTION_LIMITS.hosts && record.hosts.every((host) => typeof host === "string") && typeof record.grantedAt === "string" && !Number.isNaN(Date.parse(record.grantedAt));
}
//#endregion
//#region src/dependencies/resolvers.ts
var SHA256 = /^[0-9a-f]{64}$/;
var DEFAULT_MAX_METADATA_BYTES = DEPENDENCY_RESOLUTION_LIMITS.metadataBytes;
var DEFAULT_MAX_PACKAGE_BYTES = DEPENDENCY_RESOLUTION_LIMITS.packageBytes;
var DEFAULT_MAX_UNPACKED_BYTES = DEPENDENCY_RESOLUTION_LIMITS.unpackedBytes;
/** A transport failure before an HTTP response exists; the only cache-fallback trigger. */
var DependencyNetworkError = class extends Error {
	constructor(hostname, options) {
		super(`Dependency network request to '${hostname}' failed before an HTTP response.`, options);
		this.name = "DependencyNetworkError";
	}
};
/**
* Creates WASM-OJ's native-lockfile adapters. They consume exact versions and
* ecosystem integrity data; they deliberately do not act as a second package solver.
*/
function createDefaultDependencyResolvers(options = {}) {
	const resolved = resolveOptions(options);
	return [
		new CargoLockDependencyResolver(resolved),
		new NpmLockDependencyResolver(resolved),
		new PyPiLockDependencyResolver(resolved),
		new GoLockDependencyResolver(resolved),
		new CppLockDependencyResolver(resolved)
	];
}
var CargoLockDependencyResolver = class {
	ecosystem = "cargo";
	options;
	constructor(options = {}) {
		this.options = isResolvedOptions(options) ? options : resolveOptions(options);
	}
	async resolve(manifest, context) {
		const parsed = parseCargoLock(requireSource(manifest, "cargo", "lockfile", "Cargo.lock").contents);
		assertBoundedCount(parsed.length, DEPENDENCY_RESOLUTION_LIMITS.packages, "Cargo.lock packages");
		const external = parsed.filter((item) => item.source !== void 0);
		const byName = groupBy(external, (item) => item.name);
		const roots = manifest.requirements.map((requirement) => {
			const version = exactVersion(requirement, true);
			const matches = (byName.get(requirement.name) ?? []).filter((item) => item.version === version);
			if (matches.length !== 1) throw new Error(`Cargo.lock must contain exactly one '${requirement.name} ${version}' package.`);
			return packageId("cargo", matches[0].name, matches[0].version);
		});
		const packageIds = new Map(external.map((item) => [cargoIdentity(item.name, item.version, item.source), packageId("cargo", item.name, item.version)]));
		const network = await authorizeDependencyNetwork(this.options, context);
		const downloadBudget = resolutionDownloadBudget(context);
		return graph(roots, await mapLimited(external, this.options.concurrency, async (item) => {
			if (!isCratesIoSource(item.source)) throw new Error(`Cargo package '${item.name} ${item.version}' uses unsupported source '${item.source}'.`);
			if (!item.checksum || !SHA256.test(item.checksum)) throw new Error(`Cargo package '${item.name} ${item.version}' is missing a SHA-256 checksum.`);
			const url = new URL(`${encodeURIComponent(item.name)}/${encodeURIComponent(item.name)}-${encodeURIComponent(item.version)}.crate`, this.options.cargoCrateBaseUrl).href;
			const payload = await fetchBytes(this.options, network, url, this.options.maxPackageBytes, downloadBudget);
			const digest = await sha256Hex$1(payload);
			if (digest !== item.checksum) throw integrityError("Cargo", item.name, item.version);
			const dependencies = item.dependencies.map((reference) => {
				const target = resolveCargoDependency(reference, external);
				const id = packageIds.get(cargoIdentity(target.name, target.version, target.source));
				if (!id) throw new Error(`Cargo dependency '${reference}' is not an external locked package.`);
				return id;
			});
			return {
				record: {
					id: packageId("cargo", item.name, item.version),
					ecosystem: "cargo",
					name: item.name,
					version: item.version,
					source: item.source,
					integritySha256: digest,
					dependencies: sortedUnique(dependencies),
					...featuresForRoot(manifest.requirements, item.name, item.version)
				},
				payload
			};
		}));
	}
};
var NpmLockDependencyResolver = class {
	ecosystem = "npm";
	options;
	constructor(options = {}) {
		this.options = isResolvedOptions(options) ? options : resolveOptions(options);
	}
	async resolve(manifest, context) {
		const lock = parseJson(requireSource(manifest, "npm", "lockfile", "package-lock.json").contents, "package-lock.json");
		if (lock.lockfileVersion !== 2 && lock.lockfileVersion !== 3) throw new Error("npm adapter requires package-lock.json lockfileVersion 2 or 3.");
		if (!isRecord(lock.packages) || !isRecord(lock.packages[""])) throw new Error("package-lock.json must contain its root packages entry.");
		const lockPackages = lock.packages;
		const packageEntryPaths = Object.keys(lockPackages).filter((path) => path !== "");
		assertBoundedCount(packageEntryPaths.length, DEPENDENCY_RESOLUTION_LIMITS.packages, "package-lock.json packages");
		const entries = packageEntryPaths.map((path) => [path, lockPackages[path]]).map(([path, value]) => parseNpmEntry(path, value));
		const entryByPath = new Map(entries.map((entry) => [entry.path, entry]));
		const rootEntry = lockPackages[""];
		const roots = manifest.requirements.map((requirement) => {
			const rootSpec = npmRootSpec(rootEntry, requirement.name);
			if (rootSpec !== void 0 && rootSpec !== requirement.requirement) throw new Error(`package-lock.json root requirement for '${requirement.name}' does not match '${requirement.requirement}'.`);
			const entry = entryByPath.get(`node_modules/${requirement.name}`);
			if (!entry) throw new Error(`package-lock.json does not contain root package '${requirement.name}'.`);
			return packageId("npm", entry.name, entry.version);
		});
		const network = await authorizeDependencyNetwork(this.options, context);
		const downloadBudget = resolutionDownloadBudget(context);
		return graph(roots, deduplicatePackages(await mapLimited(entries, this.options.concurrency, async (entry) => {
			const payload = await fetchBytes(this.options, network, entry.resolved, this.options.maxPackageBytes, downloadBudget);
			await verifySri(payload, entry.integrity, `npm package '${entry.name}@${entry.version}'`);
			const dependencies = Object.keys(entry.dependencies).map((name) => {
				const target = resolveNpmDependency(entry.path, name, entryByPath);
				return packageId("npm", target.name, target.version);
			});
			const digest = await sha256Hex$1(payload);
			return {
				record: {
					id: packageId("npm", entry.name, entry.version),
					ecosystem: "npm",
					name: entry.name,
					version: entry.version,
					source: entry.resolved,
					integritySha256: digest,
					dependencies: sortedUnique(dependencies)
				},
				payload
			};
		})));
	}
};
var PyPiLockDependencyResolver = class {
	ecosystem = "pypi";
	options;
	constructor(options = {}) {
		this.options = isResolvedOptions(options) ? options : resolveOptions(options);
	}
	async resolve(manifest, context) {
		const locked = parsePythonRequirements(requireSource(manifest, "pypi", "lockfile", "requirements.txt").contents);
		assertBoundedCount(locked.length, DEPENDENCY_RESOLUTION_LIMITS.packages, "requirements.txt packages");
		const byName = new Map(locked.map((item) => [item.name, item]));
		const roots = manifest.requirements.map((requirement) => {
			const name = normalizePythonName(requirement.name);
			const version = exactPythonVersion(requirement);
			const item = byName.get(name);
			if (!item || item.version !== version) throw new Error(`requirements.txt must lock '${requirement.name}==${version}' with SHA-256.`);
			return packageId("pypi", name, version);
		});
		const network = await authorizeDependencyNetwork(this.options, context);
		const downloadBudget = resolutionDownloadBudget(context);
		return graph(roots, await mapLimited(locked, this.options.concurrency, async (item) => {
			const metadataUrl = new URL(`${encodeURIComponent(item.name)}/${encodeURIComponent(item.version)}/json`, this.options.pypiApiUrl).href;
			const file = selectPyPiFile(parseJson(new TextDecoder().decode(await fetchBytes(this.options, network, metadataUrl, this.options.maxMetadataBytes, downloadBudget)), `PyPI metadata for ${item.name}`), item.hashes, item.name, item.version);
			const payload = await fetchBytes(this.options, network, file.url, this.options.maxPackageBytes, downloadBudget);
			const digest = await sha256Hex$1(payload);
			if (!item.hashes.has(digest)) throw integrityError("PyPI", item.name, item.version);
			return {
				record: {
					id: packageId("pypi", item.name, item.version),
					ecosystem: "pypi",
					name: item.name,
					version: item.version,
					source: file.url,
					integritySha256: digest,
					dependencies: []
				},
				payload
			};
		}));
	}
};
var GoLockDependencyResolver = class {
	ecosystem = "go";
	options;
	constructor(options = {}) {
		this.options = isResolvedOptions(options) ? options : resolveOptions(options);
	}
	async resolve(manifest, context) {
		const goMod = requireSource(manifest, "go", "manifest", "go.mod");
		const goSum = requireSource(manifest, "go", "lockfile", "go.sum");
		const required = parseGoMod(goMod.contents);
		assertBoundedCount(required.length, DEPENDENCY_RESOLUTION_LIMITS.packages, "go.mod packages");
		const sums = parseGoSum(goSum.contents);
		const byPath = new Map(required.map((item) => [item.name, item]));
		const roots = manifest.requirements.map((requirement) => {
			const version = exactVersion(requirement, false);
			const item = byPath.get(requirement.name);
			if (!item || item.version !== version) throw new Error(`go.mod must require '${requirement.name} ${version}'.`);
			return packageId("go", item.name, item.version);
		});
		const network = await authorizeDependencyNetwork(this.options, context);
		const downloadBudget = resolutionDownloadBudget(context);
		return graph(roots, await mapLimited(required, this.options.concurrency, async (item) => {
			const expected = sums.get(`${item.name} ${item.version}`);
			if (!expected) throw new Error(`go.sum is missing '${item.name} ${item.version}' module content hash.`);
			const url = new URL(`${escapeGoPath(item.name)}/@v/${escapeGoPath(item.version)}.zip`, this.options.goProxyUrl).href;
			const payload = await fetchBytes(this.options, network, url, this.options.maxPackageBytes, downloadBudget);
			if (await goModuleZipHash(payload, this.options.maxUnpackedBytes) !== expected) throw integrityError("Go", item.name, item.version);
			return {
				record: {
					id: packageId("go", item.name, item.version),
					ecosystem: "go",
					name: item.name,
					version: item.version,
					source: url,
					integritySha256: await sha256Hex$1(payload),
					dependencies: []
				},
				payload
			};
		}));
	}
};
var CppLockDependencyResolver = class {
	ecosystem = "cpp";
	options;
	constructor(options = {}) {
		this.options = isResolvedOptions(options) ? options : resolveOptions(options);
	}
	async resolve(manifest, context) {
		const lock = parseCppLock(parseJson(requireSource(manifest, "cpp", "lockfile", "wasm-oj-cpp.lock.json").contents, "wasm-oj-cpp.lock.json"));
		const records = new Map(lock.packages.map((item) => [`${item.name}@${item.version}`, item]));
		for (const requirement of manifest.requirements) {
			const version = exactVersion(requirement, false);
			if (!records.has(`${requirement.name}@${version}`)) throw new Error(`wasm-oj-cpp.lock.json must contain '${requirement.name}@${version}'.`);
		}
		const requiredRoots = sortedUnique(manifest.requirements.map((item) => `${item.name}@${exactVersion(item, false)}`));
		if (JSON.stringify(requiredRoots) !== JSON.stringify(lock.roots)) throw new Error("wasm-oj-cpp.lock.json roots do not exactly match the C/C++ dependency manifest.");
		const network = await authorizeDependencyNetwork(this.options, context);
		const downloadBudget = resolutionDownloadBudget(context);
		const packages = await mapLimited(lock.packages, this.options.concurrency, async (item) => {
			const payload = await fetchBytes(this.options, network, item.url, this.options.maxPackageBytes, downloadBudget);
			const digest = await sha256Hex$1(payload);
			if (digest !== item.sha256) throw integrityError("C/C++", item.name, item.version);
			return {
				record: {
					id: packageId("cpp", item.name, item.version),
					ecosystem: "cpp",
					name: item.name,
					version: item.version,
					source: item.url,
					integritySha256: digest,
					dependencies: item.dependencies.map((dependency) => {
						if (!records.has(dependency)) throw new Error(`C/C++ package '${item.name}' refers to missing '${dependency}'.`);
						const split = splitNameVersion(dependency);
						return packageId("cpp", split.name, split.version);
					})
				},
				payload
			};
		});
		return graph(lock.roots.map((root) => {
			const split = splitNameVersion(root);
			return packageId("cpp", split.name, split.version);
		}), packages);
	}
};
/** Implements Go's official `dirhash.HashZip` h1 checksum over module ZIP entries. */
async function goModuleZipHash(payload, maxUnpackedBytes = DEFAULT_MAX_UNPACKED_BYTES, maxFiles = DEPENDENCY_RESOLUTION_LIMITS.archiveFiles) {
	boundedPositiveInteger(maxUnpackedBytes, DEPENDENCY_RESOLUTION_LIMITS.unpackedBytes, "Go module unpacked byte limit");
	boundedPositiveInteger(maxFiles, DEPENDENCY_RESOLUTION_LIMITS.archiveFiles, "Go module file limit");
	let files;
	let rejected;
	let headerBytes = 0;
	let headerFiles = 0;
	const namesSeen = /* @__PURE__ */ new Set();
	try {
		files = unzipSync(payload, { filter(file) {
			try {
				validateZipPath(file.name);
				if (namesSeen.has(file.name)) throw new Error(`Go module ZIP contains duplicate path '${file.name}'.`);
				namesSeen.add(file.name);
				headerFiles += 1;
				if (headerFiles > maxFiles) throw new RangeError(`Go module ZIP exceeds the ${maxFiles}-file limit.`);
				if (!Number.isSafeInteger(file.originalSize) || file.originalSize < 0) throw new Error("Go module ZIP has invalid uncompressed size metadata.");
				headerBytes += file.originalSize;
				if (!Number.isSafeInteger(headerBytes) || headerBytes > maxUnpackedBytes) throw new RangeError("Go module ZIP exceeds the unpacked byte limit.");
				return true;
			} catch (error) {
				rejected = error instanceof Error ? error : /* @__PURE__ */ new Error("Go module ZIP preflight failed.");
				throw rejected;
			}
		} });
	} catch (error) {
		if (rejected) throw rejected;
		throw new Error("Go module payload is not a valid ZIP archive.", { cause: error });
	}
	const names = Object.keys(files).sort();
	if (!names.length) throw new Error("Go module ZIP is empty.");
	if (names.length !== headerFiles) throw new Error("Go module ZIP entry inventory changed during extraction.");
	let unpacked = 0;
	let summary = "";
	for (const name of names) {
		validateZipPath(name);
		const bytes = files[name];
		unpacked += bytes.byteLength;
		if (unpacked > maxUnpackedBytes) throw new Error("Go module ZIP exceeds the unpacked byte limit.");
		summary += `${await sha256Hex$1(bytes)}  ${name}\n`;
	}
	return `h1:${bytesToBase64(await digestBytes("SHA-256", new TextEncoder().encode(summary)))}`;
}
function resolveOptions(options) {
	const fetcher = options.fetch ?? globalThis.fetch;
	if (typeof fetcher !== "function") throw new Error("Dependency adapters require a Fetch-compatible implementation.");
	return {
		fetch: fetcher.bind(globalThis),
		classifyPlatformFetchRejections: options.fetch === void 0,
		...options.networkAuthorizer === void 0 ? {} : { networkAuthorizer: options.networkAuthorizer },
		maxMetadataBytes: boundedPositiveInteger(options.maxMetadataBytes ?? DEFAULT_MAX_METADATA_BYTES, DEPENDENCY_RESOLUTION_LIMITS.metadataBytes, "metadata byte limit"),
		maxPackageBytes: boundedPositiveInteger(options.maxPackageBytes ?? DEFAULT_MAX_PACKAGE_BYTES, DEPENDENCY_RESOLUTION_LIMITS.packageBytes, "package byte limit"),
		maxUnpackedBytes: boundedPositiveInteger(options.maxUnpackedBytes ?? DEFAULT_MAX_UNPACKED_BYTES, DEPENDENCY_RESOLUTION_LIMITS.unpackedBytes, "unpacked byte limit"),
		concurrency: boundedPositiveInteger(options.concurrency ?? 6, DEPENDENCY_RESOLUTION_LIMITS.concurrency, "dependency concurrency"),
		cargoCrateBaseUrl: baseUrl(options.cargoCrateBaseUrl ?? "https://static.crates.io/crates/"),
		pypiApiUrl: baseUrl(options.pypiApiUrl ?? "https://pypi.org/pypi/"),
		goProxyUrl: baseUrl(options.goProxyUrl ?? "https://proxy.golang.org/")
	};
}
async function authorizeDependencyNetwork(options, context) {
	if (!options.networkAuthorizer) throw new Error("Dependency network access requires an explicit authorizer.");
	const access = normalizeDependencyNetworkAccess(context.networkAccess);
	await options.networkAuthorizer.authorize(access);
	return new Set(access.hosts);
}
function isResolvedOptions(value) {
	return "maxMetadataBytes" in value && "maxPackageBytes" in value && "fetch" in value && "classifyPlatformFetchRejections" in value && "cargoCrateBaseUrl" in value && "goProxyUrl" in value;
}
function dependencyTransportFailure(options, hostname, cause) {
	if (cause instanceof DependencyNetworkError) throw cause;
	if (options.classifyPlatformFetchRejections && cause instanceof TypeError) throw new DependencyNetworkError(hostname, { cause });
	throw cause;
}
async function fetchBytes(options, authorizedHosts, rawUrl, maximum, budget) {
	if (!budget) throw new Error("Dependency download budget is required.");
	const parsed = publicDependencyUrl(rawUrl);
	if (!authorizedHosts.has(parsed.hostname)) throw new Error(`Dependency host '${parsed.hostname}' is outside the explicitly authorized host set.`);
	const url = parsed.href;
	let response;
	try {
		response = await options.fetch(url, {
			method: "GET",
			cache: "no-store",
			credentials: "omit",
			redirect: "manual"
		});
	} catch (cause) {
		dependencyTransportFailure(options, parsed.hostname, cause);
	}
	if (response.type === "opaqueredirect" || response.redirected || response.status >= 300 && response.status < 400) throw new Error(`Dependency fetch redirected unexpectedly for '${url}'.`);
	if (!response.ok) throw new Error(`Dependency fetch failed with HTTP ${response.status} for '${url}'.`);
	const declared = response.headers.get("content-length");
	const declaredBytes = declared === null ? void 0 : Number(declared);
	if (declared !== null && (!/^\d+$/.test(declared) || !Number.isSafeInteger(declaredBytes) || declaredBytes > maximum)) throw new Error(`Dependency response for '${url}' exceeds the ${maximum}-byte limit.`);
	let reserved = 0;
	let length = 0;
	if (declaredBytes !== void 0) {
		try {
			budget.reserve(declaredBytes);
		} catch (error) {
			try {
				await response.body?.cancel("Dependency response exceeded its aggregate byte limit.");
			} catch {}
			throw error;
		}
		reserved = declaredBytes;
	}
	try {
		if (!response.body) {
			let bytes;
			try {
				bytes = new Uint8Array(await response.arrayBuffer());
			} catch (cause) {
				dependencyTransportFailure(options, parsed.hostname, cause);
			}
			if (bytes.byteLength > maximum) throw new Error(`Dependency response for '${url}' exceeds the ${maximum}-byte limit.`);
			if (bytes.byteLength > reserved) {
				budget.consume(bytes.byteLength - reserved);
				reserved = bytes.byteLength;
			}
			length = bytes.byteLength;
			return bytes;
		}
		const reader = response.body.getReader();
		const chunks = [];
		try {
			while (true) {
				let chunk;
				try {
					chunk = await reader.read();
				} catch (cause) {
					dependencyTransportFailure(options, parsed.hostname, cause);
				}
				const { done, value } = chunk;
				if (done) break;
				const next = length + value.byteLength;
				if (!Number.isSafeInteger(next) || next > maximum) {
					await reader.cancel("Dependency response exceeded its byte limit.");
					throw new Error(`Dependency response for '${url}' exceeds the ${maximum}-byte limit.`);
				}
				if (next > reserved) try {
					budget.consume(next - reserved);
					reserved = next;
				} catch (error) {
					await reader.cancel("Dependency response exceeded its aggregate byte limit.");
					throw error;
				}
				length = next;
				chunks.push(value);
			}
		} finally {
			reader.releaseLock();
		}
		const result = new Uint8Array(length);
		let offset = 0;
		for (const chunk of chunks) {
			result.set(chunk, offset);
			offset += chunk.byteLength;
		}
		return result;
	} finally {
		if (reserved > length) budget.release(reserved - length);
	}
}
function requireSource(manifest, ecosystem, role, basename) {
	const matches = (manifest.sourceFiles ?? []).filter((file) => file.ecosystem === ecosystem && file.role === role && file.path.split("/").at(-1) === basename);
	if (matches.length !== 1) throw new Error(`${ecosystem} adapter requires exactly one ${basename} ${role}.`);
	return matches[0];
}
function parseCargoLock(contents) {
	const version = contents.match(/^version\s*=\s*(\d+)\s*$/m)?.[1];
	if (version !== "3" && version !== "4") throw new Error("Cargo adapter requires Cargo.lock format version 3 or 4.");
	const blocks = contents.split(/^\[\[package\]\]\s*$/m).slice(1);
	if (!blocks.length) throw new Error("Cargo.lock does not contain packages.");
	assertBoundedCount(blocks.length, DEPENDENCY_RESOLUTION_LIMITS.packages, "Cargo.lock packages");
	return blocks.map((block) => {
		return {
			name: cargoString(block, "name", true),
			version: cargoString(block, "version", true),
			source: cargoString(block, "source", false),
			checksum: cargoString(block, "checksum", false),
			dependencies: cargoStringArray(block, "dependencies")
		};
	});
}
function cargoString(block, key, required) {
	const match = block.match(new RegExp(`^${key}\\s*=\\s*("(?:[^"\\\\]|\\\\.)*")\\s*$`, "m"));
	if (!match) {
		if (required) throw new Error(`Cargo.lock package is missing '${key}'.`);
		return;
	}
	return parseJson(match[1], `Cargo.lock ${key}`);
}
function cargoStringArray(block, key) {
	const start = block.match(new RegExp(`^${key}\\s*=\\s*\\[`, "m"));
	if (!start || start.index === void 0) return [];
	const bracket = block.indexOf("[", start.index);
	const end = block.indexOf("]", bracket + 1);
	if (end < 0) throw new Error(`Cargo.lock package has an unterminated '${key}' array.`);
	const parsed = parseJson(block.slice(bracket, end + 1).replace(/,\s*]/, "]"), `Cargo.lock ${key}`);
	if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) throw new Error(`Cargo.lock '${key}' must be a string array.`);
	assertBoundedCount(parsed.length, DEPENDENCY_RESOLUTION_LIMITS.referencesPerPackage, `Cargo.lock '${key}' references`);
	return parsed;
}
function resolveCargoDependency(reference, packages) {
	const match = reference.match(/^(\S+)(?:\s+(\S+))?(?:\s+\((.+)\))?$/);
	if (!match) throw new Error(`Invalid Cargo.lock dependency reference '${reference}'.`);
	const candidates = packages.filter((item) => item.name === match[1] && (match[2] === void 0 || item.version === match[2]) && (match[3] === void 0 || item.source === match[3]));
	if (candidates.length !== 1) throw new Error(`Cargo.lock dependency '${reference}' is ambiguous or missing.`);
	return candidates[0];
}
function cargoIdentity(name, version, source) {
	return `${name}\0${version}\0${source}`;
}
function isCratesIoSource(source) {
	return source === "registry+https://github.com/rust-lang/crates.io-index" || source === "sparse+https://index.crates.io/";
}
function parseNpmEntry(path, value) {
	if (!isRecord(value)) throw new Error(`package-lock.json entry '${path}' must be an object.`);
	if (value.link === true) throw new Error(`package-lock.json link entry '${path}' is not portable.`);
	return {
		path,
		name: typeof value.name === "string" ? value.name : npmNameFromPath(path),
		version: requireText(value.version, `npm version for '${path}'`),
		resolved: requireHttpsUrl(requireText(value.resolved, `npm resolved URL for '${path}'`)),
		integrity: requireText(value.integrity, `npm integrity for '${path}'`),
		dependencies: value.dependencies === void 0 ? {} : stringRecord(value.dependencies, `npm dependencies for '${path}'`)
	};
}
function npmNameFromPath(path) {
	const index = path.lastIndexOf("node_modules/");
	if (index < 0) throw new Error(`Cannot derive an npm package name from '${path}'.`);
	const parts = path.slice(index + 13).split("/");
	return parts[0].startsWith("@") ? `${parts[0]}/${parts[1] ?? ""}` : parts[0];
}
function npmRootSpec(root, name) {
	for (const field of [
		"dependencies",
		"devDependencies",
		"optionalDependencies"
	]) if (isRecord(root[field]) && typeof root[field][name] === "string") return root[field][name];
}
function resolveNpmDependency(path, name, entries) {
	let parent = path;
	while (true) {
		const candidate = entries.get(parent ? `${parent}/node_modules/${name}` : `node_modules/${name}`);
		if (candidate) return candidate;
		const marker = parent.lastIndexOf("/node_modules/");
		if (marker < 0) parent = "";
		else parent = parent.slice(0, marker);
		if (!parent) {
			const root = entries.get(`node_modules/${name}`);
			if (root) return root;
			break;
		}
	}
	throw new Error(`package-lock.json cannot resolve '${name}' from '${path}'.`);
}
async function verifySri(payload, integrity, label) {
	const candidates = integrity.split(/\s+/).map((item) => item.split("?", 1)[0]).map((item) => {
		const separator = item.indexOf("-");
		return separator < 0 ? void 0 : {
			algorithm: item.slice(0, separator),
			digest: item.slice(separator + 1)
		};
	}).filter((item) => item !== void 0).filter((item) => [
		"sha256",
		"sha384",
		"sha512"
	].includes(item.algorithm));
	if (!candidates.length) throw new Error(`${label} has no supported SRI digest.`);
	for (const candidate of candidates) if (constantTimeEqual(bytesToBase64(await digestBytes(candidate.algorithm.toUpperCase().replace("SHA", "SHA-"), payload)), candidate.digest)) return;
	throw new Error(`${label} failed SRI verification.`);
}
function parsePythonRequirements(contents) {
	const logical = contents.replace(/\\\r?\n/g, " ").split(/\r?\n/);
	const result = [];
	const names = /* @__PURE__ */ new Set();
	for (const raw of logical) {
		const line = raw.replace(/\s+#.*$/, "").trim();
		if (!line) continue;
		const match = line.match(/^([A-Za-z0-9._-]+)==([^\s;]+)((?:\s+--hash=sha256:[0-9a-fA-F]{64})+)$/);
		if (!match) throw new Error(`requirements.txt entry must be exact and hash-locked: '${line}'.`);
		const name = normalizePythonName(match[1]);
		if (names.has(name)) throw new Error(`requirements.txt contains duplicate package '${name}'.`);
		names.add(name);
		const hashes = /* @__PURE__ */ new Set();
		for (const item of match[3].matchAll(/--hash=sha256:([0-9a-fA-F]{64})/g)) {
			hashes.add(item[1].toLowerCase());
			assertBoundedCount(hashes.size, DEPENDENCY_RESOLUTION_LIMITS.referencesPerPackage, `requirements.txt hashes for '${name}'`);
		}
		result.push({
			name,
			version: match[2],
			hashes
		});
		assertBoundedCount(result.length, DEPENDENCY_RESOLUTION_LIMITS.packages, "requirements.txt packages");
	}
	if (!result.length) throw new Error("requirements.txt does not contain hash-locked packages.");
	return result.sort((left, right) => left.name.localeCompare(right.name));
}
function normalizePythonName(name) {
	return name.toLowerCase().replace(/[-_.]+/g, "-");
}
function exactPythonVersion(requirement) {
	const match = requirement.requirement.match(/^==([^\s;]+)$/);
	if (!match) throw new Error(`PyPI requirement '${requirement.name}' must use an exact == version.`);
	return match[1];
}
function selectPyPiFile(metadata, hashes, name, version) {
	if (!isRecord(metadata) || !Array.isArray(metadata.urls)) throw new Error(`PyPI metadata for '${name}' has no release files.`);
	assertBoundedCount(metadata.urls.length, DEPENDENCY_RESOLUTION_LIMITS.referencesPerPackage, `PyPI release files for '${name}'`);
	const candidates = metadata.urls.flatMap((value) => {
		if (!isRecord(value) || value.yanked === true || !isRecord(value.digests) || typeof value.digests.sha256 !== "string" || !hashes.has(value.digests.sha256.toLowerCase()) || typeof value.url !== "string" || typeof value.filename !== "string") return [];
		const portableWheel = /-(?:py3|py2\.py3)-none-any\.whl$/i.test(value.filename);
		const sdist = value.packagetype === "sdist" && /\.(?:tar\.gz|zip)$/i.test(value.filename);
		if (!portableWheel && !sdist) return [];
		return [{
			url: requireHttpsUrl(value.url),
			filename: value.filename,
			rank: portableWheel ? 0 : 1
		}];
	});
	candidates.sort((left, right) => left.rank - right.rank || left.filename.localeCompare(right.filename));
	if (!candidates[0]) throw new Error(`PyPI package '${name}==${version}' has no hash-approved portable wheel or sdist.`);
	return { url: candidates[0].url };
}
function parseGoMod(contents) {
	if (/^\s*replace\s/m.test(contents)) throw new Error("Go replace directives are not portable and are not accepted by the deterministic adapter.");
	const result = [];
	let inRequire = false;
	for (const raw of contents.split(/\r?\n/)) {
		const line = raw.replace(/\/\/.*$/, "").trim();
		if (!line) continue;
		if (line === "require (") {
			inRequire = true;
			continue;
		}
		if (inRequire && line === ")") {
			inRequire = false;
			continue;
		}
		const value = inRequire ? line : line.startsWith("require ") ? line.slice(8).trim() : void 0;
		if (value === void 0) continue;
		const parts = value.split(/\s+/);
		if (parts.length !== 2) throw new Error(`Unsupported go.mod require entry '${value}'.`);
		result.push({
			name: parts[0],
			version: parts[1]
		});
		assertBoundedCount(result.length, DEPENDENCY_RESOLUTION_LIMITS.packages, "go.mod packages");
	}
	if (inRequire) throw new Error("go.mod has an unterminated require block.");
	const keys = result.map((item) => item.name);
	if (new Set(keys).size !== keys.length) throw new Error("go.mod contains duplicate module requirements.");
	return result.sort((left, right) => left.name.localeCompare(right.name));
}
function parseGoSum(contents) {
	const result = /* @__PURE__ */ new Map();
	for (const raw of contents.split(/\r?\n/)) {
		const line = raw.trim();
		if (!line) continue;
		const parts = line.split(/\s+/);
		if (parts.length !== 3 || !parts[2].startsWith("h1:")) throw new Error(`Invalid go.sum entry '${line}'.`);
		if (parts[1].endsWith("/go.mod")) continue;
		const key = `${parts[0]} ${parts[1]}`;
		if (result.has(key)) throw new Error(`go.sum contains duplicate module hash '${key}'.`);
		result.set(key, parts[2]);
		assertBoundedCount(result.size, DEPENDENCY_RESOLUTION_LIMITS.packages, "go.sum module hashes");
	}
	return result;
}
function escapeGoPath(value) {
	if (!value || value.includes("\\") || value.includes("..")) throw new Error(`Invalid Go module path or version '${value}'.`);
	return value.replace(/[A-Z]/g, (character) => `!${character.toLowerCase()}`);
}
function parseCppLock(value) {
	if (!isRecord(value) || value.schema !== WASM_OJ_SCHEMAS$1.cppDependencyLock || !Array.isArray(value.roots) || !Array.isArray(value.packages)) throw new Error("wasm-oj-cpp.lock.json does not use the active WASM-OJ C/C++ dependency schema.");
	assertBoundedCount(value.roots.length, DEPENDENCY_RESOLUTION_LIMITS.roots, "C/C++ dependency roots");
	assertBoundedCount(value.packages.length, DEPENDENCY_RESOLUTION_LIMITS.packages, "C/C++ locked packages");
	const roots = sortedUnique(value.roots.map((item) => requireText(item, "C/C++ dependency root")));
	const packages = value.packages.map((raw) => {
		if (!isRecord(raw)) throw new Error("C/C++ locked package must be an object.");
		const name = requireText(raw.name, "C/C++ package name");
		const version = requireText(raw.version, "C/C++ package version");
		const url = requireHttpsUrl(requireText(raw.url, "C/C++ package URL"));
		const sha256 = requireText(raw.sha256, "C/C++ package SHA-256").toLowerCase();
		if (!SHA256.test(sha256)) throw new Error(`C/C++ package '${name}' has an invalid SHA-256.`);
		if (Array.isArray(raw.dependencies)) assertBoundedCount(raw.dependencies.length, DEPENDENCY_RESOLUTION_LIMITS.referencesPerPackage, "C/C++ package dependencies");
		return {
			name,
			version,
			url,
			sha256,
			dependencies: raw.dependencies === void 0 ? [] : sortedUnique(stringArray(raw.dependencies, "C/C++ dependencies"))
		};
	}).sort((left, right) => `${left.name}@${left.version}`.localeCompare(`${right.name}@${right.version}`));
	const ids = packages.map((item) => `${item.name}@${item.version}`);
	if (new Set(ids).size !== ids.length) throw new Error("wasm-oj-cpp.lock.json contains duplicate packages.");
	if (roots.some((root) => !ids.includes(root))) throw new Error("wasm-oj-cpp.lock.json contains an unknown root package.");
	return {
		schema: WASM_OJ_SCHEMAS$1.cppDependencyLock,
		roots,
		packages
	};
}
function graph(roots, packages) {
	const payloads = {};
	for (const item of packages) payloads[item.record.id] = item.payload;
	return {
		roots: sortedUnique(roots),
		packages: packages.map((item) => item.record).sort((left, right) => left.id.localeCompare(right.id)),
		payloads
	};
}
function deduplicatePackages(items) {
	const result = /* @__PURE__ */ new Map();
	for (const item of items) {
		const existing = result.get(item.record.id);
		if (existing) {
			if (JSON.stringify(existing.record) !== JSON.stringify(item.record) || !constantTimeEqualBytes(existing.payload, item.payload)) throw new Error(`Multiple npm install locations disagree for '${item.record.id}'.`);
		} else result.set(item.record.id, item);
	}
	return [...result.values()];
}
function featuresForRoot(requirements, name, version) {
	const requirement = requirements.find((item) => item.name === name && exactVersion(item, true) === version);
	return requirement?.features?.length ? { features: sortedUnique(requirement.features) } : {};
}
function exactVersion(requirement, allowEquals) {
	const pattern = allowEquals ? /^=?([^\s<>=~^*,]+)$/ : /^([^\s<>=~^*,]+)$/;
	const match = requirement.requirement.match(pattern);
	if (!match) throw new Error(`${requirement.ecosystem} requirement '${requirement.name}' must use an exact version.`);
	return match[1];
}
function splitNameVersion(value) {
	const index = value.lastIndexOf("@");
	if (index <= 0 || index === value.length - 1) throw new Error(`Invalid locked package reference '${value}'.`);
	return {
		name: value.slice(0, index),
		version: value.slice(index + 1)
	};
}
function packageId(ecosystem, name, version) {
	return `${ecosystem}:${name}@${version}`;
}
function requireHttpsUrl(value) {
	return publicDependencyUrl(value).href;
}
function baseUrl(value) {
	const url = requireHttpsUrl(value);
	return url.endsWith("/") ? url : `${url}/`;
}
function parseJson(value, label) {
	try {
		return JSON.parse(value);
	} catch (error) {
		throw new Error(`${label} is not valid JSON.`, { cause: error });
	}
}
function requireText(value, label, maximum = 4096) {
	if (typeof value !== "string" || !value || value !== value.trim() || value.length > maximum || value.includes("\0")) throw new Error(`${label} must be a non-empty, trimmed, NUL-free string of at most ${maximum} characters.`);
	return value;
}
function stringArray(value, label) {
	if (!Array.isArray(value)) throw new Error(`${label} must be an array.`);
	return value.map((item) => requireText(item, label));
}
function stringRecord(value, label) {
	if (!isRecord(value)) throw new Error(`${label} must be an object.`);
	assertBoundedCount(Object.keys(value).length, DEPENDENCY_RESOLUTION_LIMITS.referencesPerPackage, label);
	return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, requireText(item, label)]));
}
function sortedUnique(values) {
	return [...new Set(values)].sort();
}
function groupBy(items, key) {
	const result = /* @__PURE__ */ new Map();
	for (const item of items) {
		const value = key(item);
		const group = result.get(value) ?? [];
		group.push(item);
		result.set(value, group);
	}
	return result;
}
async function mapLimited(items, concurrency, operation) {
	const result = new Array(items.length);
	let cursor = 0;
	await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
		while (cursor < items.length) {
			const index = cursor;
			cursor += 1;
			result[index] = await operation(items[index]);
		}
	}));
	return result;
}
async function digestBytes(algorithm, value) {
	const copy = value.slice();
	return new Uint8Array(await crypto.subtle.digest(algorithm, copy));
}
function bytesToBase64(bytes) {
	let value = "";
	for (let index = 0; index < bytes.length; index += 32768) value += String.fromCharCode(...bytes.subarray(index, index + 32768));
	return btoa(value);
}
function constantTimeEqual(left, right) {
	const maximum = Math.max(left.length, right.length);
	let different = left.length ^ right.length;
	for (let index = 0; index < maximum; index += 1) different |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
	return different === 0;
}
function constantTimeEqualBytes(left, right) {
	const maximum = Math.max(left.length, right.length);
	let different = left.length ^ right.length;
	for (let index = 0; index < maximum; index += 1) different |= (left[index] ?? 0) ^ (right[index] ?? 0);
	return different === 0;
}
function validateZipPath(path) {
	if (!path || path.length > 4096 || path.startsWith("/") || path.includes("\\") || path.split("/").includes("..") || path.includes("\0")) throw new Error(`Go module ZIP contains unsafe path '${path}'.`);
}
function resolutionDownloadBudget(context) {
	const budget = context.downloadBudget ?? createDependencyDownloadBudget();
	assertDependencyDownloadBudget(budget);
	return budget;
}
function positiveInteger(value, label) {
	if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${label} must be a positive safe integer.`);
	return value;
}
function boundedPositiveInteger(value, maximum, label) {
	positiveInteger(value, label);
	if (value > maximum) throw new RangeError(`${label} exceeds the ${maximum} hard limit.`);
	return value;
}
function integrityError(ecosystem, name, version) {
	return /* @__PURE__ */ new Error(`${ecosystem} package '${name}@${version}' failed integrity verification.`);
}
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
//#endregion
//#region src/dependencies/manager.ts
var MemoryDependencyCache = class {
	payloads = /* @__PURE__ */ new Map();
	async load(integritySha256) {
		return this.payloads.get(integritySha256)?.slice();
	}
	async save(integritySha256, payload) {
		requireSha256(integritySha256);
		if (await sha256Hex$1(payload) !== integritySha256) throw new Error("Dependency cache payload digest mismatch.");
		this.payloads.set(integritySha256, payload.slice());
	}
	async delete(integritySha256) {
		requireSha256(integritySha256);
		this.payloads.delete(integritySha256);
	}
	async clear() {
		this.payloads.clear();
	}
};
/** Host-neutral dependency resolution, locking, cache, and offline transport. */
var DependencyManager = class {
	cache;
	resolvers = /* @__PURE__ */ new Map();
	constructor(cache, resolvers = []) {
		this.cache = cache;
		for (const resolver of resolvers) this.registerResolver(resolver);
	}
	registerResolver(resolver) {
		if (!resolver || typeof resolver !== "object" || typeof resolver.resolve !== "function") throw new TypeError("Dependency resolvers must be objects implementing resolve().");
		if (this.resolvers.has(resolver.ecosystem)) throw new Error(`A dependency resolver is already registered for '${resolver.ecosystem}'.`);
		this.resolvers.set(resolver.ecosystem, resolver);
	}
	async resolve(manifest, options = {}) {
		assertValidDependencyManifest(manifest);
		if (options.previousLock) assertValidDependencyLock(options.previousLock);
		const manifestSha256 = await dependencyManifestSha256(manifest);
		if (options.offline) {
			if (!options.previousLock) throw new Error("Offline dependency resolution requires a previous lock.");
			if (options.previousLock.manifestSha256 !== manifestSha256) throw new Error("Offline dependency lock does not match the requested manifest.");
			await this.verifyCached(options.previousLock);
			return structuredClone(options.previousLock);
		}
		try {
			return await this.resolveOnline(manifest, manifestSha256, options);
		} catch (error) {
			if (!(error instanceof DependencyNetworkError) || !options.previousLock || !options.previousLockNetworkScope || !options.networkAccess || options.previousLock.manifestSha256 !== manifestSha256) throw error;
			const previousScope = normalizeDependencyNetworkScope(options.previousLockNetworkScope);
			const currentScope = normalizeDependencyNetworkAccess(options.networkAccess);
			if (previousScope.sourceKey !== currentScope.sourceKey || previousScope.bundleDigest !== currentScope.bundleDigest) throw error;
			await this.verifyCached(options.previousLock);
			return structuredClone(options.previousLock);
		}
	}
	async resolveOnline(manifest, manifestSha256, options) {
		const downloadBudget = createDependencyDownloadBudget();
		const groups = /* @__PURE__ */ new Map();
		for (const requirement of manifest.requirements) {
			const group = groups.get(requirement.ecosystem) ?? [];
			group.push(requirement);
			groups.set(requirement.ecosystem, group);
		}
		const roots = [];
		const packages = /* @__PURE__ */ new Map();
		let payloadBytes = 0;
		for (const [ecosystem, requirements] of groups) {
			const resolver = this.resolvers.get(ecosystem);
			if (!resolver) throw new Error(`No dependency resolver is registered for '${ecosystem}'.`);
			const graph = await resolver.resolve({
				requirements,
				sourceFiles: manifest.sourceFiles?.filter((file) => file.ecosystem === ecosystem)
			}, {
				previousLock: options.previousLock,
				...options.networkAccess === void 0 ? {} : { networkAccess: options.networkAccess },
				downloadBudget
			});
			if (!Array.isArray(graph.roots) || !Array.isArray(graph.packages) || !graph.payloads || typeof graph.payloads !== "object" || Array.isArray(graph.payloads)) throw new TypeError(`Resolver '${ecosystem}' returned an invalid graph.`);
			assertBoundedCount(graph.roots.length, DEPENDENCY_RESOLUTION_LIMITS.roots, `Resolver '${ecosystem}' roots`);
			assertBoundedCount(graph.packages.length, DEPENDENCY_RESOLUTION_LIMITS.packages, `Resolver '${ecosystem}' packages`);
			assertBoundedCount(roots.length + graph.roots.length, DEPENDENCY_RESOLUTION_LIMITS.roots, "Resolved dependency roots");
			const graphIds = new Set(graph.packages.map((item) => item.id));
			if (graphIds.size !== graph.packages.length) throw new Error(`Resolver '${ecosystem}' returned duplicate dependency packages.`);
			const newPackageIds = [...graphIds].filter((id) => !packages.has(id));
			assertBoundedCount(packages.size + newPackageIds.length, DEPENDENCY_RESOLUTION_LIMITS.packages, "Resolved dependency packages");
			const unexpected = boundedOwnKeys(graph.payloads, DEPENDENCY_RESOLUTION_LIMITS.packages, "Resolved dependency payloads").filter((id) => !graphIds.has(id));
			if (unexpected.length) throw new Error(`Resolver returned payloads for unknown packages: ${unexpected.sort().join(", ")}.`);
			for (const item of graph.packages) {
				const payload = graph.payloads[item.id];
				if (!(payload instanceof Uint8Array)) throw new Error(`Resolver omitted payload for dependency '${item.id}'.`);
				payloadBytes = admitPayloadBytes(payloadBytes, payload, `Resolved dependency '${item.id}'`);
			}
			for (const root of graph.roots) roots.push(root);
			for (const item of graph.packages) {
				const existing = packages.get(item.id);
				if (existing && JSON.stringify(existing) !== JSON.stringify(item)) throw new Error(`Resolvers returned conflicting records for dependency '${item.id}'.`);
				packages.set(item.id, item);
				const payload = graph.payloads[item.id];
				if (!(payload instanceof Uint8Array)) throw new Error(`Resolver omitted payload for dependency '${item.id}'.`);
				if (await sha256Hex$1(payload) !== item.integritySha256) throw new Error(`Resolver returned corrupt payload for dependency '${item.id}'.`);
				await this.cache.save(item.integritySha256, payload);
			}
		}
		return createDependencyLock(manifestSha256, roots.sort(), [...packages.values()]);
	}
	async verifyCached(lock) {
		assertValidDependencyLock(lock);
		let payloadBytes = 0;
		for (const item of lock.packages) {
			const payload = await this.cache.load(item.integritySha256);
			if (!payload) throw new Error(`Dependency '${item.id}' is absent from the content cache.`);
			payloadBytes = admitPayloadBytes(payloadBytes, payload, `Cached dependency '${item.id}'`);
			if (await sha256Hex$1(payload) !== item.integritySha256) {
				await this.cache.delete(item.integritySha256);
				throw new Error(`Cached dependency '${item.id}' failed integrity verification.`);
			}
		}
	}
	clearCache() {
		return this.cache.clear();
	}
	/** Returns package-ID keyed payloads after re-verifying the content-addressed cache. */
	async materialize(lock) {
		assertValidDependencyLock(lock);
		const payloads = /* @__PURE__ */ new Map();
		let payloadBytes = 0;
		for (const item of lock.packages) {
			const payload = await this.cache.load(item.integritySha256);
			if (!payload) throw new Error(`Dependency '${item.id}' is absent from the content cache.`);
			payloadBytes = admitPayloadBytes(payloadBytes, payload, `Cached dependency '${item.id}'`);
			if (await sha256Hex$1(payload) !== item.integritySha256) {
				await this.cache.delete(item.integritySha256);
				throw new Error(`Cached dependency '${item.id}' failed integrity verification.`);
			}
			payloads.set(item.id, payload);
		}
		return payloads;
	}
	/** Resolve cached archives into the verified, compiler-facing file-tree contract. */
	async prepareBuild(lock, adapters = createDefaultDependencyBuildAdapters()) {
		return createDependencyBuildBundle(lock, await this.materialize(lock), adapters);
	}
	async exportOffline(lock) {
		assertValidDependencyLock(lock);
		const payloads = {};
		let payloadBytes = 0;
		for (const item of lock.packages) {
			const payload = await this.cache.load(item.integritySha256);
			if (!payload) throw new Error(`Dependency '${item.id}' is absent from the content cache.`);
			payloadBytes = admitPayloadBytes(payloadBytes, payload, `Cached dependency '${item.id}'`);
			if (await sha256Hex$1(payload) !== item.integritySha256) {
				await this.cache.delete(item.integritySha256);
				throw new Error(`Cached dependency '${item.id}' failed integrity verification.`);
			}
			payloads[item.integritySha256] = payload;
		}
		return {
			schema: WASM_OJ_SCHEMAS$1.dependencyOfflineBundle,
			wasmOjContract: WASM_OJ_CONTRACT_VERSION$1,
			lock: structuredClone(lock),
			payloads
		};
	}
	async importOffline(bundle) {
		if (!bundle || typeof bundle !== "object" || bundle.schema !== WASM_OJ_SCHEMAS$1.dependencyOfflineBundle || bundle.wasmOjContract !== WASM_OJ_CONTRACT_VERSION$1) throw new Error("Offline dependency bundle does not use the active WASM-OJ contract.");
		assertValidDependencyLock(bundle.lock);
		if (!bundle.payloads || typeof bundle.payloads !== "object" || Array.isArray(bundle.payloads)) throw new TypeError("Offline dependency bundle payloads must be a digest-keyed object.");
		const expected = new Set(bundle.lock.packages.map((item) => item.integritySha256));
		const actual = boundedOwnKeys(bundle.payloads, DEPENDENCY_RESOLUTION_LIMITS.packages, "Offline dependency payloads").sort();
		if (actual.length !== expected.size || actual.some((digest) => !expected.has(digest))) throw new Error("Offline dependency bundle payload set does not match its lock.");
		const verified = [];
		let payloadBytes = 0;
		for (const [digest, payload] of Object.entries(bundle.payloads)) {
			requireSha256(digest);
			if (!(payload instanceof Uint8Array)) throw new Error(`Offline dependency payload '${digest}' is invalid.`);
			payloadBytes = admitPayloadBytes(payloadBytes, payload, `Offline dependency '${digest}'`);
			if (await sha256Hex$1(payload) !== digest) throw new Error(`Offline dependency payload '${digest}' failed integrity verification.`);
			verified.push([digest, payload]);
		}
		for (const [digest, payload] of verified) await this.cache.save(digest, payload);
		return structuredClone(bundle.lock);
	}
};
function createDefaultDependencyManager(cache, options = {}) {
	return new DependencyManager(cache, createDefaultDependencyResolvers(options));
}
function admitPayloadBytes(current, payload, label) {
	if (payload.byteLength > DEPENDENCY_RESOLUTION_LIMITS.packageBytes) throw new RangeError(`${label} exceeds the ${DEPENDENCY_RESOLUTION_LIMITS.packageBytes}-byte package limit.`);
	const next = current + payload.byteLength;
	if (!Number.isSafeInteger(next) || next > DEPENDENCY_RESOLUTION_LIMITS.totalDownloadBytes) throw new RangeError(`Dependency payloads exceed the ${DEPENDENCY_RESOLUTION_LIMITS.totalDownloadBytes}-byte aggregate limit.`);
	return next;
}
function boundedOwnKeys(value, maximum, label) {
	const keys = [];
	for (const key in value) {
		if (!Object.hasOwn(value, key)) continue;
		keys.push(key);
		if (keys.length > maximum) throw new RangeError(`${label} exceeds the ${maximum}-item limit.`);
	}
	return keys;
}
function requireSha256(value) {
	if (!/^[0-9a-f]{64}$/.test(value)) throw new Error("Dependency integrity must be lowercase SHA-256 hexadecimal.");
}
//#endregion
//#region src/conformance/stdio-cases.ts
var programs = [
	{
		language: "c",
		entry: "main.c",
		source: "#include <stdio.h>\nint main(){int c;while((c=getchar())!=EOF)printf(\"%02x\",(unsigned)c);puts(\"\");return 0;}"
	},
	{
		language: "cpp",
		entry: "main.cpp",
		source: "#include <iostream>\n#include <cstdio>\nint main(){char c;while(std::cin.get(c))printf(\"%02x\",(unsigned char)c);puts(\"\");}"
	},
	{
		language: "python",
		entry: "main.py",
		source: "import sys\nprint(sys.stdin.buffer.read().hex())\n"
	},
	{
		language: "rust",
		entry: "main.rs",
		source: "use std::io::{self,Read};fn main(){let mut b=Vec::new();io::stdin().read_to_end(&mut b).unwrap();for x in b{print!(\"{:02x}\",x);}println!();}"
	},
	{
		language: "go",
		entry: "main.go",
		source: "package main\nimport(\"fmt\";\"io\";\"os\")\nfunc main(){b,_:=io.ReadAll(os.Stdin);fmt.Printf(\"%x\\n\",b)}"
	},
	{
		language: "java",
		entry: "Main.java",
		source: "import java.io.*;public class Main{public static void main(String[]args)throws Exception{BufferedReader r=new BufferedReader(new InputStreamReader(System.in));String s;while((s=r.readLine())!=null)System.out.println(\"[\"+s+\"]\");System.out.println(\"EOF\");}}"
	},
	{
		language: "javascript",
		entry: "main.js",
		source: "import * as std from \"std\";const s=std.in.readAsString();console.log(Array.from(unescape(encodeURIComponent(s)),c=>c.charCodeAt(0).toString(16).padStart(2,\"0\")).join(\"\"));if(std.in.readAsString()!==\"\")throw Error(\"Repeated stdin\");"
	},
	{
		language: "typescript",
		entry: "main.ts",
		source: "import * as std from \"std\";const s=std.in.readAsString();console.log(Array.from(unescape(encodeURIComponent(s)),c=>c.charCodeAt(0).toString(16).padStart(2,\"0\")).join(\"\"));if(std.in.readAsString()!==\"\")throw Error(\"Repeated stdin\");"
	}
];
var inputs = [
	{
		id: "empty",
		stdin: ""
	},
	{
		id: "lf",
		stdin: "\n"
	},
	{
		id: "one-byte",
		stdin: "x"
	},
	{
		id: "no-final-lf",
		stdin: "abc"
	},
	{
		id: "final-lf",
		stdin: "abc\n"
	},
	{
		id: "multiple-lf",
		stdin: "abc\n\n"
	},
	{
		id: "crlf",
		stdin: "abc\r\nx\r\n"
	},
	{
		id: "bare-cr",
		stdin: "abc\rx"
	},
	{
		id: "spaces",
		stdin: "  abc 	\n x  "
	},
	{
		id: "unicode",
		stdin: "中文🙂\n終"
	},
	{
		id: "bom",
		stdin: "﻿abc\n"
	},
	{
		id: "nul",
		stdin: "a\0b\n"
	},
	{
		id: "long-line",
		stdin: "x".repeat(8193)
	},
	{
		id: "last-line",
		stdin: "first\nlast"
	}
];
var STDIO_CONFORMANCE_CASES = programs.flatMap((program) => inputs.map(({ id, stdin }) => {
	const lines = stdin === "" ? [] : stdin.split(/\r\n|\r|\n/);
	if (/[\r\n]$/.test(stdin)) lines.pop();
	return {
		id: `${program.language}-wasip1-stdio-${id}`,
		label: `${program.language} / wasip1 / stdin ${id}`,
		input: {
			language: program.language,
			target: "wasip1",
			entry: program.entry,
			files: { [program.entry]: program.source }
		},
		run: { stdin },
		expect: {
			code: 0,
			stdout: program.language === "java" ? `${lines.map((line) => `[${line}]\n`).join("")}EOF\n` : `${Array.from(new TextEncoder().encode(stdin), (byte) => byte.toString(16).padStart(2, "0")).join("")}\n`,
			stderr: "",
			termination: "exited"
		}
	};
}));
//#endregion
//#region src/conformance/cases.ts
var DEFAULT_CONFORMANCE_CASES = deepFreeze([
	...["c", "cpp"].flatMap((language) => [7, 9].map((mebibytes) => ({
		id: language + "-wasip1-stack-" + mebibytes + "mib",
		label: language + " / wasip1 / " + mebibytes + " MiB local arrays",
		input: {
			language,
			stackSizeBytes: 8388608,
			target: "wasip1",
			entry: language === "c" ? "main.c" : "main.cpp",
			files: { [language === "c" ? "main.c" : "main.cpp"]: [
				"#include <stdio.h>",
				"int main(void) {",
				"  char first[" + mebibytes * 1024 * 512 + "];",
				"  char second[" + mebibytes * 1024 * 512 + "];",
				"  if (scanf(\"%3s %3s\", first, second) != 2) return 2;",
				"  printf(\"%s %s\\n\", first, second);",
				"  return 0;",
				"}"
			].join("\n") }
		},
		run: {
			stdin: "abc def\n",
			resources: { memoryLimitBytes: 16777216 }
		},
		expect: mebibytes === 7 ? {
			code: 0,
			stdout: "abc def\n",
			stderr: "",
			termination: "exited"
		} : {
			code: 1,
			stdout: "",
			termination: "trap",
			trapMessageIncludes: "out of bounds"
		}
	}))),
	{
		id: "c-wasip1",
		label: "C / wasip1",
		input: {
			language: "c",
			target: "wasip1",
			entry: "src/main.c",
			files: { "src/main.c": "#include <stdio.h>\nint main(void){ long long a,b; if(scanf(\"%lld%lld\",&a,&b)!=2)return 2; printf(\"%lld\\n\",a+b); }\n" }
		},
		run: { stdin: "7 35\n" },
		expect: {
			code: 0,
			stdout: "42\n",
			stderr: "",
			termination: "exited"
		}
	},
	{
		id: "c-wasip1-filesystem-metadata",
		label: "C / wasip1 / filesystem metadata",
		input: {
			language: "c",
			target: "wasip1",
			entry: "src/main.c",
			files: { "src/main.c": [
				"#include <stdint.h>",
				"#include <stdio.h>",
				"#include <string.h>",
				"__attribute__((import_module(\"wasi_snapshot_preview1\"), import_name(\"path_filestat_get\")))",
				"extern int wasi_path_filestat_get(int, int, const char *, unsigned, void *);",
				"int main(void){",
				"  FILE *file=fopen(\"/wasm-oj-meta\",\"wb\"); if(!file)return 2;",
				"  if(fputs(\"x\",file)<0 || fclose(file))return 3;",
				"  unsigned char stat[64]={0};",
				"  if(wasi_path_filestat_get(3,0,\"wasm-oj-meta\",12,stat))return 4;",
				"  uint64_t atime,mtime,ctime;",
				"  memcpy(&atime,stat+40,8); memcpy(&mtime,stat+48,8); memcpy(&ctime,stat+56,8);",
				"  printf(\"%llu %llu %llu\\n\",(unsigned long long)atime,(unsigned long long)mtime,(unsigned long long)ctime);",
				"  return 0;",
				"}",
				""
			].join("\n") }
		},
		expect: {
			code: 0,
			stdout: "946684800000000000 946684800000000000 946684800000000000\n",
			stderr: "",
			termination: "exited"
		}
	},
	{
		id: "c-wasip1-file-io",
		label: "C / wasip1 / multi-file IO",
		input: {
			language: "c",
			target: "wasip1",
			entry: "src/main.c",
			files: { "src/main.c": [
				"#include <stdio.h>",
				"int main(void){",
				"  FILE *left=fopen(\"/input/left.txt\",\"r\");",
				"  FILE *right=fopen(\"/input/right.txt\",\"r\");",
				"  if(!left||!right)return 2;",
				"  long long a,b; if(fscanf(left,\"%lld\",&a)!=1||fscanf(right,\"%lld\",&b)!=1)return 3;",
				"  fclose(left); fclose(right);",
				"  FILE *output=fopen(\"/output/answer.txt\",\"w\"); if(!output)return 4;",
				"  if(fprintf(output,\"%lld\\n\",a+b)<0||fclose(output))return 5;",
				"  return 0;",
				"}",
				""
			].join("\n") }
		},
		run: {
			files: {
				"/input/left.txt": "19\n",
				"/input/right.txt": "23\n"
			},
			outputPaths: ["/output/answer.txt"]
		},
		expect: {
			code: 0,
			stdout: "",
			stderr: "",
			files: { "/output/answer.txt": "42\n" },
			termination: "exited"
		}
	},
	{
		id: "c-wasip1-filesystem-limit",
		label: "C / wasip1 / filesystem write limit",
		input: {
			language: "c",
			target: "wasip1",
			entry: "src/main.c",
			files: { "src/main.c": [
				"#include <stdio.h>",
				"int main(void){",
				"  const unsigned char bytes[8]={1,2,3,4,5,6,7,8};",
				"  FILE *file=fopen(\"/output/exhausted.bin\",\"wb\"); if(!file)return 2;",
				"  (void)fwrite(bytes,1,sizeof(bytes),file);",
				"  (void)fclose(file);",
				"  return 0;",
				"}",
				""
			].join("\n") }
		},
		run: {
			outputPaths: ["/output/exhausted.bin"],
			resources: {
				filesystemWriteLimitBytes: 4,
				filesystemEntryLimit: 1
			}
		},
		expect: {
			code: 137,
			stdout: "",
			stderr: "",
			files: { "/output/exhausted.bin": "" },
			termination: "filesystem-limit"
		}
	},
	{
		id: "c-wasix",
		label: "C / WASIX",
		input: {
			language: "c",
			target: "wasix",
			entry: "src/main.c",
			files: { "src/main.c": "#include <stdio.h>\nint main(void){ puts(\"c-wasix\"); }\n" }
		},
		expect: {
			code: 0,
			stdout: "c-wasix\n",
			stderr: "",
			termination: "exited"
		}
	},
	{
		id: "c-wasix-denied-thread-spawn",
		label: "C / WASIX / denied thread_spawn",
		input: {
			language: "c",
			target: "wasix",
			entry: "src/main.c",
			files: { "src/main.c": [
				"__attribute__((import_module(\"wasix_32v1\"), import_name(\"thread_spawn\")))",
				"extern int thread_spawn(int start_ptr, int user_data);",
				"int main(void){ return thread_spawn(0, 0); }",
				""
			].join("\n") }
		},
		expect: {
			code: 1,
			stdout: "",
			stderr: "",
			termination: "trap",
			trapMessageIncludes: "WASM-OJ denied nondeterministic capability wasix_32v1.thread_spawn"
		}
	},
	{
		id: "cpp-wasip1",
		label: "C++ / wasip1",
		input: {
			language: "cpp",
			target: "wasip1",
			entry: "src/main.cpp",
			files: { "src/main.cpp": "extern \"C\" int puts(const char*);\ntemplate<unsigned N> constexpr int sum(const int (&v)[N]){ int s=0; for(unsigned i=0;i<N;++i)s+=v[i]; return s; }\nconstexpr int values[]{10,20,12};\nstatic_assert(sum(values)==42);\nint main(){ return puts(\"42\") < 0; }\n" }
		},
		expect: {
			code: 0,
			stdout: "42\n",
			stderr: "",
			termination: "exited"
		}
	},
	{
		id: "cpp-wasix",
		label: "C++ / WASIX",
		input: {
			language: "cpp",
			target: "wasix",
			entry: "src/main.cpp",
			files: { "src/main.cpp": "extern \"C\" int puts(const char*);\ntemplate<unsigned N> constexpr int sum(const int (&v)[N]){ int s=0; for(unsigned i=0;i<N;++i)s+=v[i]; return s; }\nconstexpr int values[]{10,20,12};\nstatic_assert(sum(values)==42);\nint main(){ return puts(\"42\") < 0; }\n" }
		},
		expect: {
			code: 0,
			stdout: "42\n",
			stderr: "",
			termination: "exited"
		}
	},
	{
		id: "rust-wasip1",
		label: "Rust / wasip1",
		input: {
			language: "rust",
			target: "wasip1",
			entry: "src/main.rs",
			files: { "src/main.rs": "fn main(){ let values=vec![10,20,12]; println!(\"{}\", values.iter().sum::<i32>()); }\n" }
		},
		expect: {
			code: 0,
			stdout: "42\n",
			stderr: "",
			termination: "exited"
		}
	},
	{
		id: "python-wasip1",
		label: "Python / wasip1",
		input: {
			language: "python",
			target: "wasip1",
			entry: "src/main.py",
			files: { "src/main.py": "values = [10, 20, 12]\nprint(sum(values))\n" }
		},
		expect: {
			code: 0,
			stdout: "42\n",
			stderr: "",
			termination: "exited"
		}
	},
	{
		id: "python-wasip1-stdin-eof",
		label: "Python / wasip1 / redirected input at EOF",
		input: {
			language: "python",
			target: "wasip1",
			entry: "src/main.py",
			files: { "src/main.py": [
				"import os, sys",
				"assert not any(os.isatty(fd) for fd in range(3))",
				"assert not any(stream.isatty() for stream in (sys.stdin, sys.stdout, sys.stderr))",
				"assert input() == 'abc\\r'",
				"assert input() == 'x'",
				"assert input() == '終'",
				"try:",
				"    input()",
				"except EOFError:",
				"    print('OK')",
				"else:",
				"    raise AssertionError('Expected EOFError')",
				""
			].join("\n") }
		},
		run: { stdin: "abc\r\nx\n終" },
		expect: {
			code: 0,
			stdout: "OK\n",
			stderr: "",
			termination: "exited"
		}
	},
	{
		id: "python-wasip1-stdin-bytes",
		label: "Python / wasip1 / exact input bytes",
		input: {
			language: "python",
			target: "wasip1",
			entry: "src/main.py",
			files: { "src/main.py": "import sys\nassert sys.stdin.buffer.read() == b'abc\\r\\nx'\nprint('OK')\n" }
		},
		run: { stdin: "abc\r\nx" },
		expect: {
			code: 0,
			stdout: "OK\n",
			stderr: "",
			termination: "exited"
		}
	},
	{
		id: "javascript-wasip1",
		label: "JavaScript / wasip1",
		input: {
			language: "javascript",
			target: "wasip1",
			entry: "src/main.js",
			files: { "src/main.js": "import * as std from 'std';\nstd.out.puts(String([10,20,12].reduce((a,b)=>a+b,0))+'\\n');\n" }
		},
		expect: {
			code: 0,
			stdout: "42\n",
			stderr: "",
			termination: "exited"
		}
	},
	{
		id: "typescript-wasip1",
		label: "TypeScript / wasip1",
		input: {
			language: "typescript",
			target: "wasip1",
			entry: "src/main.ts",
			files: { "src/main.ts": "import * as std from 'std';\nconst values: number[]=[10,20,12];\nstd.out.puts(String(values.reduce((a,b)=>a+b,0))+'\\n');\n" }
		},
		expect: {
			code: 0,
			stdout: "42\n",
			stderr: "",
			termination: "exited"
		}
	},
	{
		id: "go-wasip1",
		label: "Go / wasip1",
		input: {
			language: "go",
			target: "wasip1",
			entry: "src/main.go",
			files: { "src/main.go": "package main\nimport \"fmt\"\nfunc main(){ values:=[]int{10,20,12}; total:=0; for _,v:=range values { total+=v }; fmt.Println(total) }\n" }
		},
		expect: {
			code: 0,
			stdout: "42\n",
			stderr: "",
			termination: "exited"
		}
	},
	{
		id: "java-wasip1",
		label: "Java / wasip1",
		input: {
			language: "java",
			target: "wasip1",
			entry: "Main.java",
			files: { "Main.java": [
				"import java.io.BufferedReader;",
				"import java.io.InputStreamReader;",
				"import java.util.StringTokenizer;",
				"public final class Main {",
				"  public static void main(String[] args) throws Exception {",
				"    StringTokenizer tokens = new StringTokenizer(new BufferedReader(new InputStreamReader(System.in)).readLine());",
				"    System.out.println(Integer.parseInt(tokens.nextToken()) + Integer.parseInt(tokens.nextToken()));",
				"  }",
				"}",
				""
			].join("\n") }
		},
		run: { stdin: "7 35\n" },
		expect: {
			code: 0,
			stdout: "42\n",
			stderr: "",
			termination: "exited"
		}
	},
	{
		id: "java-wasip1-exceptions",
		label: "Java / wasip1 / exceptions",
		input: {
			language: "java",
			target: "wasip1",
			entry: "Main.java",
			files: { "Main.java": [
				"public final class Main {",
				"  public static void main(String[] args) {",
				"    try {",
				"      throw new IllegalArgumentException(\"expected\");",
				"    } catch (IllegalArgumentException error) {",
				"      System.out.println(\"caught\");",
				"    }",
				"  }",
				"}",
				""
			].join("\n") }
		},
		expect: {
			code: 0,
			stdout: "caught\n",
			stderr: "",
			termination: "exited"
		}
	},
	{
		id: "java-wasip1-empty-release",
		label: "Java / wasip1 / empty release",
		input: {
			language: "java",
			target: "wasip1",
			optimization: "release",
			entry: "Main.java",
			files: { "Main.java": "public final class Main { public static void main(String[] args) {} }\n" }
		},
		expect: {
			code: 0,
			stdout: "",
			stderr: "",
			termination: "exited"
		}
	},
	{
		id: "java-wasip1-empty-debug",
		label: "Java / wasip1 / empty debug",
		input: {
			language: "java",
			target: "wasip1",
			optimization: "debug",
			entry: "Main.java",
			files: { "Main.java": "public final class Main { public static void main(String[] args) {} }\n" }
		},
		expect: {
			code: 0,
			stdout: "",
			stderr: "",
			termination: "exited"
		}
	},
	{
		id: "c-wasip1-virtual-clock",
		label: "C / wasip1 / virtual clock",
		input: {
			language: "c",
			target: "wasip1",
			entry: "src/main.c",
			files: { "src/main.c": [
				"#include <stdint.h>",
				"#include <stdio.h>",
				"#include <string.h>",
				"__attribute__((import_module(\"wasi_snapshot_preview1\"), import_name(\"clock_time_get\")))",
				"extern unsigned wasi_clock_time_get(unsigned, uint64_t, uint64_t *);",
				"__attribute__((import_module(\"wasi_snapshot_preview1\"), import_name(\"poll_oneoff\")))",
				"extern unsigned wasi_poll_oneoff(const void *, void *, unsigned, unsigned *);",
				"static void put32(unsigned char *p,uint32_t v){ memcpy(p,&v,4); }",
				"static void put64(unsigned char *p,uint64_t v){ memcpy(p,&v,8); }",
				"int main(void){",
				"  unsigned char subscriptions[96]={0},events[64]={0}; unsigned count=0; uint64_t before,after,realtime;",
				"  if(wasi_clock_time_get(1,0,&before))return 2;",
				"  put64(subscriptions,7); subscriptions[8]=0; put32(subscriptions+16,1);",
				"  put64(subscriptions+24,5000000000ULL); put64(subscriptions+32,1);",
				"  if(wasi_poll_oneoff(subscriptions,events,1,&count)||count!=1)return 3;",
				"  if(wasi_clock_time_get(1,0,&after))return 4;",
				"  memset(subscriptions,0,sizeof(subscriptions)); memset(events,0,sizeof(events));",
				"  put64(subscriptions,8); subscriptions[8]=0; put32(subscriptions+16,0);",
				"  put64(subscriptions+24,946684810000000000ULL); put64(subscriptions+32,1); put32(subscriptions+40,1);",
				"  if(wasi_poll_oneoff(subscriptions,events,1,&count)||count!=1)return 5;",
				"  if(wasi_clock_time_get(0,0,&realtime))return 6;",
				"  memset(subscriptions,0,sizeof(subscriptions)); memset(events,0,sizeof(events));",
				"  put64(subscriptions,9); subscriptions[8]=2; put32(subscriptions+16,1);",
				"  put64(subscriptions+48,10); subscriptions[56]=0; put32(subscriptions+64,1);",
				"  put64(subscriptions+72,5000000000ULL); put64(subscriptions+80,1);",
				"  if(wasi_poll_oneoff(subscriptions,events,2,&count)||count<1)return 7;",
				"  printf(\"%llu %llu %llu\\n\",(unsigned long long)before,(unsigned long long)after,(unsigned long long)realtime);",
				"  return 0;",
				"}",
				""
			].join("\n") }
		},
		expect: {
			code: 0,
			stdout: "0 5001000000 946684810000000000\n",
			stderr: "",
			termination: "exited",
			logicalTimeNs: 10001e6
		}
	},
	{
		id: "c-wasip1-logical-time-limit",
		label: "C / wasip1 / logical time limit",
		input: {
			language: "c",
			target: "wasip1",
			entry: "src/main.c",
			files: { "src/main.c": [
				"#include <stdint.h>",
				"#include <string.h>",
				"__attribute__((import_module(\"wasi_snapshot_preview1\"), import_name(\"poll_oneoff\")))",
				"extern unsigned wasi_poll_oneoff(const void *, void *, unsigned, unsigned *);",
				"int main(void){",
				"  unsigned char subscription[48]={0},event[32]={0}; unsigned count=0;",
				"  uint64_t userdata=1,timeout=11000000,precision=1; uint32_t clock=1;",
				"  memcpy(subscription,&userdata,8); subscription[8]=0; memcpy(subscription+16,&clock,4);",
				"  memcpy(subscription+24,&timeout,8); memcpy(subscription+32,&precision,8);",
				"  return (int)wasi_poll_oneoff(subscription,event,1,&count);",
				"}",
				""
			].join("\n") }
		},
		run: { resources: { logicalTimeLimitMs: 10 } },
		expect: {
			code: 137,
			stdout: "",
			stderr: "",
			termination: "logical-time-limit",
			logicalTimeNs: 1e7
		}
	},
	{
		id: "cpp-wasip1-virtual-sleep",
		label: "C++ / wasip1 / virtual sleep",
		input: {
			language: "cpp",
			target: "wasip1",
			entry: "src/main.cpp",
			files: { "src/main.cpp": [
				"#include <cstdio>",
				"#include <ctime>",
				"static unsigned long long ns(const timespec& value){ return (unsigned long long)value.tv_sec*1000000000ULL+(unsigned long long)value.tv_nsec; }",
				"int main(){ timespec before{},after{},delay{5,0}; if(clock_gettime(CLOCK_MONOTONIC,&before))return 2; if(nanosleep(&delay,nullptr))return 3; if(clock_gettime(CLOCK_MONOTONIC,&after))return 4; std::printf(\"%llu\\n\",ns(after)-ns(before)); }",
				""
			].join("\n") }
		},
		expect: {
			code: 0,
			stdout: "5001000000\n",
			stderr: "",
			termination: "exited",
			logicalTimeNs: 5002e6
		}
	},
	{
		id: "rust-wasip1-virtual-sleep",
		label: "Rust / wasip1 / virtual sleep",
		input: {
			language: "rust",
			target: "wasip1",
			entry: "src/main.rs",
			files: { "src/main.rs": "use std::time::{Duration,Instant};\nfn main(){ let before=Instant::now(); std::thread::sleep(Duration::from_secs(5)); println!(\"{}\",before.elapsed().as_nanos()); }\n" }
		},
		expect: {
			code: 0,
			stdout: "5001000000\n",
			stderr: "",
			termination: "exited",
			logicalTimeNs: 5002e6
		}
	},
	{
		id: "python-wasip1-virtual-sleep",
		label: "Python / wasip1 / virtual sleep",
		input: {
			language: "python",
			target: "wasip1",
			entry: "src/main.py",
			files: { "src/main.py": "import time\nbefore = time.monotonic_ns()\ntime.sleep(5)\nprint(time.monotonic_ns() - before)\n" }
		},
		expect: {
			code: 0,
			stdout: "5001000000\n",
			stderr: "",
			termination: "exited",
			logicalTimeNs: 5008e6
		}
	},
	{
		id: "javascript-wasip1-virtual-clock",
		label: "JavaScript / wasip1 / virtual clock",
		input: {
			language: "javascript",
			target: "wasip1",
			entry: "src/main.js",
			files: { "src/main.js": "import * as std from 'std';\nconst before=Date.now(); while(Date.now()<before+5000){} std.out.puts(String(Date.now()-before)+'\\n');\n" }
		},
		expect: {
			code: 0,
			stdout: "5001\n",
			stderr: "",
			termination: "exited",
			logicalTimeNs: 5004e6
		}
	},
	{
		id: "typescript-wasip1-virtual-clock",
		label: "TypeScript / wasip1 / virtual clock",
		input: {
			language: "typescript",
			target: "wasip1",
			entry: "src/main.ts",
			files: { "src/main.ts": "import * as std from 'std';\nconst before: number=Date.now(); while(Date.now()<before+5000){} std.out.puts(String(Date.now()-before)+'\\n');\n" }
		},
		expect: {
			code: 0,
			stdout: "5001\n",
			stderr: "",
			termination: "exited",
			logicalTimeNs: 5004e6
		}
	},
	{
		id: "go-wasip1-virtual-sleep",
		label: "Go / wasip1 / virtual sleep",
		input: {
			language: "go",
			target: "wasip1",
			entry: "src/main.go",
			files: { "src/main.go": "package main\nimport (\"fmt\"; \"time\")\nfunc main(){ before:=time.Now(); time.Sleep(5*time.Second); fmt.Println(time.Since(before).Nanoseconds()) }\n" }
		},
		expect: {
			code: 0,
			stdout: "5004000000\n",
			stderr: "",
			termination: "exited",
			logicalTimeNs: 5016e6
		}
	}
]);
/**
* Slower header-heavy case that verifies the bundled libc++ headers and libraries.
* It is opt-in because parsing libc++ inside the WebAssembly Clang frontend is a
* materially different efficiency benchmark from basic language conformance.
*/
var CPP_STDLIB_CONFORMANCE_CASE = deepFreeze({
	id: "cpp-stdlib-wasip1",
	label: "C++ stdlib / wasip1",
	input: {
		language: "cpp",
		target: "wasip1",
		entry: "src/main.cpp",
		files: {
			"src/wasm-oj.pch.hpp": WASM_OJ_LIBCXX_PCH_HEADER,
			"src/main.cpp": "int main(){ constexpr std::array<int,3> v{10,20,12}; int s=0; for(int x:v)s+=x; std::printf(\"%d\\n\",s); }\n"
		}
	},
	expect: {
		code: 0,
		stdout: "42\n",
		stderr: "",
		termination: "exited"
	}
});
var FULL_CONFORMANCE_CASES = deepFreeze([
	...DEFAULT_CONFORMANCE_CASES,
	...STDIO_CONFORMANCE_CASES,
	CPP_STDLIB_CONFORMANCE_CASE
]);
function deepFreeze(value) {
	if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
	for (const child of Object.values(value)) deepFreeze(child);
	return Object.freeze(value);
}
//#endregion
export { BROWSER_COLLECTION_SCHEMA, BROWSER_PROBLEM_SCHEMA, BrowserDependencyNetworkConsent, CONTEST_PUBLIC_PROJECTION_SCHEMA, CPP_STDLIB_CONFORMANCE_CASE, CargoLockDependencyResolver, CompilerRegistry, CostBaselineRegistry, CppLockDependencyResolver, DEFAULT_CONFORMANCE_CASES, DEFAULT_DETERMINISM, DEFAULT_RESOURCE_POLICY, DEPENDENCY_BUILD_LIMITS, DependencyManager, DependencyNetworkError, Engine, FULL_CONFORMANCE_CASES, GoLockDependencyResolver, JudgeEngine, LANGUAGES, MemoryDependencyCache, NpmLockDependencyResolver, PROBLEM_STARTER_LIMITS, PROJECT_SOURCE_LIMITS, PyPiLockDependencyResolver, REPOSITORY_AUTHORING_JUDGES_SCHEMA, RuntimeDriverRegistry, TRUSTED_JUDGE_RUNTIME_PROFILES, TRUSTED_JUDGE_WASIP1_IMPORTS, TRUSTED_JUDGE_WASM_MAX_BYTES, WASM_OJ_CONTRACT_ID, WASM_OJ_CONTRACT_VERSION, WASM_OJ_ERROR_CODES, WASM_OJ_ERROR_STAGES, WASM_OJ_JUDGE_DATA_SCHEMA, WASM_OJ_JUDGE_PACKAGE_MAGIC, WASM_OJ_JUDGE_PACKAGE_MAX_BYTES, WASM_OJ_JUDGE_PACKAGE_SCHEMA, WASM_OJ_LIBCXX_PCH_HEADER, WASM_OJ_RUNTIME_COMPONENTS, WASM_OJ_RUNTIME_IDENTITY_SHA256, WASM_OJ_SCHEMAS, WASM_OJ_STORAGE, WEIGHTED_METER_MODEL, WasmOjError, asWasmOjError, assertCompilerCacheKey, assertJudgeDataCostProfile, assertJudgeDataMatchesPracticePublic, assertJudgeGuestFilePath, assertLanguageIdentifier, assertProblemCostProfile, assertValidBuildArtifact, assertValidDependencyBuildBundle, assertValidDependencyLock, assertValidProject, assertValidReplayBundle, browserToolchainAssetBaseUrl, browserToolchainAssetPaths, browserToolchainAssetUrl, canonicalJsonBytes, compareConformanceSnapshots, contestPublicProjectionBytes, costProfileId, createContestPublicProjection, createDefaultCostBaselineRegistry, createDefaultDependencyBuildAdapters, createDefaultDependencyManager, createDefaultDependencyResolvers, createDefaultRuntimeDrivers, createDependencyBuildBundle, createDependencyLock, createEngine, createExtendedCostBaselineRegistry, createJudgeExecutor, createReplayBundle, createRuntimeBundleManifest, createSdkProject, decodeJudgePackageForExecution, decodeLibcxxPchManifest, decodeReplayBundle, dependencyFileTreeSha256, dependencyLockSha256, dependencyManifestSha256, deriveContestPublic, deriveJudgeData, derivePracticePublic, deterministicTranscript, encodeJudgePackage, encodeReplayBundle, fileMatcher, floatMatcher, goModuleZipHash, isBuiltinLanguage, isCostProfileFor, isToolchainLibcxxPchHeader, judgePackageSemanticDigest, judgeTranscript, normalizeDependencyNetworkAccess, normalizeDependencyNetworkScope, normalizeExecutionMetrics, normalizeOutput, parseCanonicalJsonBytes, parseJudgeAllowedProfiles, parseJudgeData, parseJudgePackageManifest, parseProblemBundle, parseProblemCollectionIndex, parseRepositoryAuthoringJudges, parseStandaloneProblemBundle, prepareArtifactInteraction, prepareArtifactRun, prepareTrustedJudgeRun, problemCollectionRevision, readJudgePackageManifest, replayBundle, replayBundleSha256, resolveArtifactCostBudget, resolveCostBudget, resolveDeterminism, resolveResourcePolicy, runConformanceHost, runConformanceMatrix, runtimeIdentityBytes, scoreJudgeDataResults, scoreProblemResults, setMatcher, sha256Matcher, snapshotBrowserToolchainSources, summarizeProblemPolicies, textMatcher, tokenMatcher, toolchainAssetSource, toolchainCacheIdentity, toolchainProfileSource, trustedJudgeSpec, unavailableExecutionMetrics, validateBrowserToolchainSources, validateJudgePackage, validateJudgeSpec, validateServerToolchainSources, validateToolchainDescriptors, validateTrustedJudgeWasm, verifyDependencyBuildBundle, verifyProblemBundleBytes, verifyProblemCollectionRevision, verifyRuntimeIdentity, wasmCheckerMatcher };
