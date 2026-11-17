# Third-party notices

This file covers third-party software distributed by the WASM-OJ code and
toolchain packages, including the content-addressed compiler and runtime assets
mirrored under `public/toolchains`. The WASM-OJ source code is licensed under the MIT License in
`LICENSE`; that license does not replace the terms of any component listed
below.

The canonical machine-readable component, distribution, source-revision, and
license-file inventory is `licenses/components.json`. Its verifier binds every
listed file to a SHA-256 digest and rejects unlisted toolchain or license files.

## JavaScript runtime dependency

### N-API keyring

- Component: `@napi-rs/keyring` 1.3.0
- Source revision: `Brooooooklyn/keyring-node@e46be75c3ba8d5fde6b88a17c6153b87ffe4b946`
- Source: <https://github.com/Brooooooklyn/keyring-node/tree/e46be75c3ba8d5fde6b88a17c6153b87ffe4b946>
- License: MIT
- License material: `licenses/napi-rs-keyring-MIT.txt`

The `woj` CLI stores remote access tokens in the operating system credential
store through this native binding. It does not provide a plaintext fallback.

### es-module-lexer

- Component: `es-module-lexer` 2.3.1
- npm integrity: `sha512-shc1dbU90Yl/xq1QrC7QRtfcwURZuVRfPhZbDoldJ1cn1gzDvBaBWlv0eFolj5+0znnPJz5TXLxsN77X/12KTA==`
- Source revision: `guybedford/es-module-lexer@2b2e6209bac5c06c6ba457f9730014613e1128fb`
- Source: <https://github.com/guybedford/es-module-lexer/tree/2b2e6209bac5c06c6ba457f9730014613e1128fb>
- License: MIT
- License material: `licenses/es-module-lexer-MIT.txt`

WASM-OJ uses es-module-lexer inside the browser runner Worker to reject every
static or dynamic transitive import before loading a content-pinned runtime
driver plug-in.

### fflate

- Component: `fflate` 0.8.3
- Source revision: `101arrowz/fflate@v0.8.3`
- Source: <https://github.com/101arrowz/fflate/tree/v0.8.3>
- License: MIT
- License material: `licenses/fflate-MIT.txt`

WASM-OJ uses fflate for bounded dependency archive extraction and to verify the
canonical Go module `h1:` hash over module ZIP entries.

### Wasmer JavaScript SDK

- Component: `@wasmer/sdk` 0.10.0
- npm integrity: `sha512-YQ+s5tGag6P/I8kp9BTH+XhjoS9UFvWiZJvnWEEovClHffhYToKhprWr4UJG7wLP7c/2HQpGkF7ZrjoUvKjdmA==`
- Source revision: `wasmerio/wasmer-js@93b8b738ebd3ee57e118da0f0eb795b97d5b999e`
- Locked Rust graph: `Cargo.lock` SHA-256
  `d352926f3f05e3d4308c4e261711d07db568e5c2b4387067180f920da074791f`
- Source: <https://github.com/wasmerio/wasmer-js/tree/93b8b738ebd3ee57e118da0f0eb795b97d5b999e>
- License: MIT
- License material: `licenses/wasmer-sdk-MIT.txt`,
  `licenses/wasmer-sdk-dependencies.html`, and
  `licenses/wasmer-sdk-dependencies.json`

WASM-OJ consumes the official npm artifact without patching the installed
package. The generated dependency report covers every package in the pinned
normal Cargo dependency graph selected for `wasm32-unknown-unknown`; its compact
inventory binds all 332 package identities and the exact HTML report digest.

### QuickJS guest Node standard I/O libraries

The generated guest prelude in `src/runtime/quickjs/stdlib.generated.ts` bundles
the following exact npm releases. `scripts/build-quickjs-stdlib.mjs` builds this
prelude from the locked packages and the WASM-OJ standard I/O adapters.

| Component | Source release | License |
| --- | --- | --- |
| buffer 6.0.3 | <https://github.com/feross/buffer/tree/v6.0.3> | MIT |
| readable-stream 4.7.0 | <https://github.com/nodejs/readable-stream/tree/v4.7.0> | MIT |
| events 3.3.0 | <https://github.com/Gozala/events/tree/v3.3.0> | MIT |
| abort-controller 3.0.0 | <https://github.com/mysticatea/abort-controller/tree/v3.0.0> | MIT |
| event-target-shim 5.0.1 | <https://github.com/mysticatea/event-target-shim/tree/v5.0.1> | MIT |
| base64-js 1.5.1 | <https://github.com/beatgammit/base64-js/tree/v1.5.1> | MIT |
| ieee754 1.2.1 | <https://github.com/feross/ieee754/tree/v1.2.1> | BSD-3-Clause |
| string_decoder 1.3.0 | <https://github.com/nodejs/string_decoder/tree/v1.3.0> | MIT |
| safe-buffer 5.2.1 | <https://github.com/feross/safe-buffer/tree/v5.2.1> | MIT |

The complete upstream license texts, including the Node-derived stream and
decoder notices, are reproduced in `licenses/quickjs-node-stdlib-LICENSES.txt`
(SHA-256 `38e42dcb48e476e4e836552c814c911eb5464d80b56b970d87aa07b88c7b28f8`).
`licenses/components.json` binds each release to the generated bundle digest;
`pnpm-lock.yaml` pins all package integrity values. The Buffer declarations are
also copied from the same buffer 6.0.3 release. These guest libraries implement
the supported byte buffers and standard streams; they do not include Node.js.

## Distributed toolchain assets

### TypeScript-Go

- Distributed asset: `typescript-7.0.2.wasm.gz.bin`
- Compressed SHA-256: `29c6ee0e46151e2644049ae96162b1b1d46dcb13310e2a928114bb9030c3ea92`
- Expanded Wasm SHA-256: `01cea8c18841b73e0601d31859be1dcd323e61d83e7cfb15523dd051fc78c8da`
- Source revision: `microsoft/typescript-go@2bd066d87f5bafd315be9f40889d0a60b9e58e0b`
- Source: <https://github.com/microsoft/typescript-go/tree/2bd066d87f5bafd315be9f40889d0a60b9e58e0b>
- Build runtime: Go 1.26.3 standard library (`GOOS=wasip1`, `GOARCH=wasm`)
- Licenses: TypeScript-Go Apache-2.0; Go standard library BSD-3-Clause
- License and attribution material: `licenses/Apache-2.0.txt`,
  `licenses/typescript-go-NOTICE.txt`, and
  `licenses/go-BSD-3-Clause.txt`

The TypeScript-Go notice is carried from the exact pinned source revision
(normalized from CRLF to LF without changing its text). The Go license is from
the exact `go1.26.3` source tag used by the reproducible build script.

### Go compiler toolchain

- Distributed assets: `go-1.26.5-wasip1.webc.gz.bin`,
  `go-1.26.5-wasip1.stdlib.gz.bin`, and
  `go-1.26.5-wasip1.manifest.json`
- Source: <https://go.dev/dl/go1.26.5.src.tar.gz>
- Source archive SHA-256:
  `495be4bc87176ac567392e5b4116abd98466d33d7b49d41e764ccc6976b2dc42`
- License: BSD-3-Clause
- License material: `licenses/go-BSD-3-Clause.txt`

WASM-OJ packages the standard Go `compile` and `link` commands plus the matching
349-package `GOOS=wasip1 GOARCH=wasm` standard library. The stored license is
byte-identical to `go/LICENSE` in the exact Go 1.26.5 source distribution.

### Java compiler toolchain

- Distributed assets: `java-teavm-0.13.1.compiler.wasm`,
  `java-teavm-0.13.1.compile-classlib.bin`, and
  `java-teavm-0.13.1.runtime-classlib.bin`
- TeaVM Java compiler source: <https://github.com/konsoletyper/teavm-javac/tree/7e4a44cf521694a4e326e33850dd8aec165eb5c9>
- TeaVM core source: `konsoletyper/teavm@b3a245b7d9034ff35cdfab2def057a3d4f256efb`
  with source patches and build provenance in `tools/java-client/`
- Compiler SHA-256: `8c37bce1c6fceeaffeffe93e10834309b67c8b6fb58c6f8a24547afe8be67f5d`
- Android Scanner and Spliterators source: `platform/libcore@de876a01b29230b877c9f408348c38a90ee724a5`
- Licenses: TeaVM Apache-2.0; OpenJDK and Android class libraries GPL-2.0
  with Classpath exception
- License material: `licenses/Apache-2.0.txt`,
  `licenses/openjdk-21-GPL-2.0-with-Classpath-exception.txt`, and
  `licenses/android-libcore-GPL-2.0-with-Classpath-exception.txt`

The WasmGC compiler uses statically packaged JavaScript bindings and emits
standalone `wasip1` student modules. TeaVM links reachable class-library code
into those modules; the full class-library archives are compiler inputs.

### QuickJS-ng

- Distributed asset: `quickjs-0.15.1.wasm.gz.bin`
- Compressed SHA-256: `dc6e02e8610269e61b341331661515616451cec929fd534fa96d1c4f47fbcc9a`
- Expanded Wasm SHA-256: `a098db08592626781f6ad6e63f1b8a36da6d03b85b530dc94c441a348426b20b`
- Source revision: `quickjs-ng/quickjs@fd0a0210b7be00957751871e7e01b8291268fc29`
- Source: <https://github.com/quickjs-ng/quickjs/tree/fd0a0210b7be00957751871e7e01b8291268fc29>
- Build SDK: [WASI SDK 24.0 release archive for arm64 macOS](https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-24/wasi-sdk-24.0-arm64-macos.tar.gz),
  SHA-256 `aeae999396d5f5caa5ce419f52e83c35869d5fd21d40af80acba2c80f51b0b3a`
- WASI SDK source revision: `WebAssembly/wasi-sdk@d2bea01edcc46f731156a817f710cdd9fc9c1c19`
- LLVM and compiler-rt source revision: `llvm/llvm-project@26a1d6601d727a96f4301d0d8647b5a42760ae0c`
- WASI libc source revision: `WebAssembly/wasi-libc@b9ef79d7dbd47c6c5bafdae760823467c2f60b70`
- Sources: <https://github.com/WebAssembly/wasi-sdk/tree/d2bea01edcc46f731156a817f710cdd9fc9c1c19>,
  <https://github.com/llvm/llvm-project/tree/26a1d6601d727a96f4301d0d8647b5a42760ae0c>, and
  <https://github.com/WebAssembly/wasi-libc/tree/b9ef79d7dbd47c6c5bafdae760823467c2f60b70>
- Licenses: QuickJS-ng and the WASM-OJ adapter MIT; LLVM compiler-rt
  Apache-2.0 WITH LLVM-exception plus the third-party terms collected in its
  license; WASI libc Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT, with
  separately licensed dlmalloc, cloudlibc-derived, and musl-derived portions
- License and attribution material: `licenses/quickjs-ng-MIT.txt`,
  `licenses/wasi-sdk-24.0-Apache-2.0-LLVM-exception.txt`,
  `licenses/wasi-sdk-24.0-compiler-rt-LICENSE.txt`,
  `licenses/wasi-libc-b9ef79d-LICENSE.txt`,
  `licenses/wasi-libc-b9ef79d-Apache-2.0.txt`,
  `licenses/wasi-libc-b9ef79d-MIT.txt`,
  `licenses/wasi-libc-b9ef79d-cloudlibc-BSD-2-Clause.txt`,
  `licenses/wasi-libc-b9ef79d-dlmalloc-CC0-NOTICE.txt`, and
  `licenses/wasi-libc-b9ef79d-emmalloc-NOTICE.txt`, and
  `licenses/wasi-libc-b9ef79d-musl-MIT.txt`

The reproducible build links `crt1-command.o`, `libm.a`,
`libwasi-emulated-signal.a`, `libc.a`, and
`libclang_rt.builtins-wasm32.a` from that one digest-verified SDK archive.
Linker tracing confirms that the selected allocator is dlmalloc, not emmalloc.
WASM-OJ distributes the resulting stripped Wasm runtime, not the host Clang, LLD,
or strip executables. The build script nevertheless verifies those executables
and every linked archive by SHA-256 before compiling.

### Rust compiler and standard libraries

- Distributed assets: `rust-1.91.1-dev.webc.gz.bin` and
  `rust-1.91.1-dev.manifest.json`
- Build source: `olimpiadi-informatica/wasm-compilers@ae62cab6adf0665377d19ffa39daeaf758290431`
- Build artifact: GitHub Actions run `26545267884`, `rust.tar.br` SHA-256
  `ba0096d05275954d852a3fb3a9c4c9438dad501f8e428b867c0b88cfa7301c14`
- Linker payload: `@yowasp/clang@22.0.0-git20542-10`, npm archive SHA-256
  `6230ea1afa9691fa065935cf68c01642ff9b31c183fe8ac64cdfda025df06009`;
  its exact source revisions and license closure are recorded in the following
  “Clang, LLD, libc++, and WASI libc” section
- Rust source submodule: `rust-lang/rust@ed61e7d7e242494fb7057f2657300d9e77bb4fcb`
- LLVM source submodule: `llvm/llvm-project@87f0227cb60147a26a1eeb4fb06e3b505e9c7261`
- GCC source submodule: `gcc-mirror/gcc@ae91b5dd14920ff9671db8ff80c0d763d25f977f`
- Source: <https://github.com/olimpiadi-informatica/wasm-compilers/tree/ae62cab6adf0665377d19ffa39daeaf758290431>
- Build repository license: Apache-2.0
- Rust license: MIT OR Apache-2.0; LLVM license: Apache-2.0 WITH LLVM-exception
- `libloading` 0.8.8: ISC; Cargo.lock checksum
  `07033963ba89ebaf1584d767badaa2e8fcec21aedea6b8c0346d487d49c28667`
- GCC libstdc++ runtime components: GPL-3.0 with GCC Runtime Library
  Exception 3.1
- License and attribution texts: `licenses/rust-MIT.txt`,
  `licenses/Apache-2.0.txt`, `licenses/LLVM-exception.txt`,
  `licenses/rust-COPYRIGHT.txt`, `licenses/rust-COPYRIGHT.html`,
  `licenses/rust-COPYRIGHT-library.html`, `licenses/libloading-ISC.txt`,
  `licenses/GPL-3.0.txt`, and
  `licenses/GCC-Runtime-Library-Exception-3.1.txt`

The pinned build repository contains its complete Rust/LLVM source revisions,
the applied `rust.patch`, and the GitHub workflow used for the pinned artifact.
That workflow builds libstdc++ from the pinned GCC submodule before building
LLVM and rustc. The custom `rust.tar.br` omits Rust's generated binary-release
notices, so WASM-OJ carries the complete `COPYRIGHT.html` and
`COPYRIGHT-library.html` from the official Rust 1.91.1 release for the exact
`ed61e7d7e` source revision. The official release archive used to source those
notices is `rustc-1.91.1-x86_64-unknown-linux-gnu.tar.xz`, SHA-256
`4b4c596fc5268435c310a79c2e231a5a3567572c930ac0740ef9e147e83baf4e`.

WASM-OJ copies the matching `wasm32-wasip1-threads` sysroot, replaces rustc's
WASI `random_get` and `clock_time_get` imports with deterministic internal
implementations, and packages the transformed atom and sysroot together with
the verified YoWASP LLVM linker atom and resources into one WebC. The provenance
manifest records source-rustc, transformed-rustc, linker archive, linker core,
and linker-resource SHA-256 digests. These transformations and the generated
WebC do not relicense Rust or any third-party component identified by the exact
Rust COPYRIGHT reports and YoWASP source closure carried here.

### Clang, LLD, libc++, PCH, and WASI libc

- Distributed assets: `clang-22.0.0-git20542-10.webc.gz.bin`, the matching
  debug/release libc++ PCH payloads, and their admission manifest
- Clang source artifact: `@yowasp/clang@22.0.0-git20542-10`, npm archive
  SHA-256 `6230ea1afa9691fa065935cf68c01642ff9b31c183fe8ac64cdfda025df06009`
- YoWASP source revision: `YoWASP/clang@944dd7c774954180e621cc8e12984023a7f8bcbe`
- LLVM source revision: `YoWASP/llvm-project@97196c8eeb1d495fa43bb8af2fb26af5ef5b89fb`
- WASI libc source revision: `WebAssembly/wasi-libc@ac020b86fd44bafe60aa4fa12f407d16e3731329`
- Sources: <https://github.com/YoWASP/clang/tree/944dd7c774954180e621cc8e12984023a7f8bcbe>
  and <https://github.com/YoWASP/llvm-project/tree/97196c8eeb1d495fa43bb8af2fb26af5ef5b89fb>
- LLVM license: Apache-2.0 WITH LLVM-exception
- WASI libc license: Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT,
  with separately licensed portions identified by the upstream notice
- License and attribution texts: `licenses/LLVM-exception.txt`,
  `licenses/Apache-2.0.txt`, `licenses/wasi-libc-ac020b86-LICENSE.txt`,
  `licenses/wasi-libc-ac020b86-musl-fts-BSD-3-Clause.txt`,
  `licenses/wasi-sdk-24.0-Apache-2.0-LLVM-exception.txt`,
  `licenses/wasi-libc-b9ef79d-Apache-2.0.txt`,
  `licenses/wasi-libc-b9ef79d-MIT.txt`,
  `licenses/wasi-libc-b9ef79d-cloudlibc-BSD-2-Clause.txt`,
  `licenses/wasi-libc-b9ef79d-dlmalloc-CC0-NOTICE.txt`,
  `licenses/wasi-libc-b9ef79d-emmalloc-NOTICE.txt`, and
  `licenses/wasi-libc-b9ef79d-musl-MIT.txt`

The published npm manifest incorrectly says `ISC` and omits a license file.
The exact source revision's root `LICENSE.txt` and npm README both explicitly
license the package under Apache-2.0. WASM-OJ does not redistribute the npm
JavaScript wrapper: the packaging script digest-verifies and extracts only the
LLVM core and LLVM/WASI resource payload, whose complete upstream license terms
are carried above. The common Apache, MIT, cloudlibc, dlmalloc, emmalloc, and
musl terms are byte-identical between the pinned `ac020b86` and `b9ef79d7`
source trees, so the inventory reuses the exact digest-bound `b9ef79d7` copies;
the revision-specific root and musl-fts notices remain separate. The generated
WebC and pinned command manifests do not relicense those payloads.

### CPython 3.14.7 for WASI P1

- Distributed assets: `python-3.14.7-wasip1.webc.gz.bin` and its provenance
  manifest `python-3.14.7-wasip1.manifest.json`
- Official source archive: <https://www.python.org/ftp/python/3.14.7/Python-3.14.7.tar.xz>,
  SHA-256 `3b48dac8fb59f62eaa67ac83c1eb12bda1b7a08406dd286e252c11a66be27f81`
- Official SPDX document: <https://www.python.org/ftp/python/3.14.7/Python-3.14.7.tar.xz.spdx.json>,
  SHA-256 `87f55ca6c59fe159fa8c47ba2d7d8bec39cc649b1d3f47c667f34025a2ca9a68`
- Expanded WebC SHA-256:
  `a42c98f5f00582638c8e445440c506bbf94d5e55b3415d1f8d82d11c56cd4b56`
- Distributed gzip SHA-256:
  `10027f0e32c77dfa0ce1c413b6cb27307d6744fe5e18e6da8cea738bd020260c`
- Provenance manifest SHA-256:
  `53a24b258363a8494af164121111a34b49c85fa0e054627fe131feba6f359cd5`
- Deterministically exported `WOJFS002` runtime archive SHA-256:
  `c1acac884af1c86833db5b65f8cc0a2304fce74dea0a05d9b40bde0a4e3e7c0e`
- CPython license: Python Software Foundation License Version 2 and the
  historical notices reproduced with it
- License text: `licenses/cpython-3.14.7-PSF-2.0.txt`
- Bundled third-party source: Expat 2.8.1 (MIT), HACL* revision
  `8ba599b2f6c9701b3dc961db895b0856a2210f76` (MIT), and libmpdec 2.5.1
  (BSD-2-Clause); their exact notices are
  `licenses/cpython-expat-2.8.1-MIT.txt`,
  `licenses/cpython-hacl-star-8ba599b-MIT.txt`, and
  `licenses/cpython-libmpdec-2.5.1-BSD-2-Clause.txt`.
- Build toolchain: WASI SDK 24.0 revision
  `d2bea01edcc46f731156a817f710cdd9fc9c1c19`, LLVM revision
  `26a1d6601d727a96f4301d0d8647b5a42760ae0c`, and wasi-libc revision
  `b9ef79d7dbd47c6c5bafdae760823467c2f60b70`.

WASM-OJ compiles this package from the pinned official sources with a 4 MiB C
stack and 16 MiB initial linear memory, retaining `--stack-first`, disables
`_socket`, removes test/development-only standard-library roots, canonicalizes
build-only sysconfig paths, and packages the complete source SPDX document and
applicable CPython, third-party, compiler-rt, WASI SDK, and wasi-libc notices
inside the WebC. The build does not consume or redistribute the retired Wasmer
Registry CPython/WASIX package, and WASM-OJ's MIT license does not apply to these
third-party contents.

## WASM-OJ runtime-core dependency closure

The browser runner embeds `wasm-oj-runtime-core` and its locked normal
dependency graph for the `wasm32-unknown-unknown` target with the `web` feature.
The complete generated license report, including the selected license text for
every dependency, is `licenses/runtime-core-dependencies.html`. Its compact,
machine-verifiable package inventory and report digest are recorded in
`licenses/runtime-core-dependencies.json`. Both files are generated with pinned
`cargo-about` 0.9.1 and are verified against `crates/runtime-core/Cargo.lock`.

## Vendored Rust crates

WASM-OJ's source tree also contains patched source copies used to build the
runtime and packaging tools:

- `vendor/shared-buffer`: MIT OR Apache-2.0; see
  `vendor/shared-buffer/LICENSE_MIT.md` and
  `vendor/shared-buffer/LICENSE_APACHE.md`.
- `vendor/virtual-fs`: MIT; see `vendor/virtual-fs/LICENSE`.

These vendored sources are build inputs and are not included in the npm package
allowlist.
