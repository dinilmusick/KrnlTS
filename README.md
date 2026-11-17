# GutTS

Gut stands for Global Utilities. Gut is the aggregate library for the very basic functions and operations needed by KrnlTS services, FrnlTS components, Skipo applications, and other code assets. Its purpose is to prevent multiple libraries from solving the same foundational problems.

## Structure

Each category is a directory with a stable facade. GutTS contains both deterministic utilities and narrowly scoped model-backed libraries.

Current categories: JSON, strings, arrays, objects, numbers, URLs, API definitions, and model libraries.

## Model libraries

Every model is a named library with its own metadata, semantic API definitions, and runtime lifecycle.

Models include SmolLM2-135M-Instruct for general text generation, Needle 3 for tool selection and extraction, Whistle for speech-to-text, Ettin Reranker for candidate ranking, and MiniLM for semantic similarity.

Model weights are not bundled into the GutTS npm package. A model runtime acquires them when an operation needs the model and may cache the artifact on disk. ModelResidency keeps the model in RAM only while operations are active, shares one loaded instance for concurrent calls in the same process, and unloads it when the final operation completes.

GutTS does not contain a resolver, intelligence specification, or application-level routing system. Model metadata describes when a model is appropriate; selecting among models remains the responsibility of higher-level application logic.

## Runtime entrypoints

- `@dinilmusick/gutts`: universal ESM utilities and API definitions.
- `@dinilmusick/gutts/browser`: browser-facing utilities and Luth client.
- `@dinilmusick/gutts/worker`: Worker-focused Web-standard utilities without model, API-registry, or provider adapters.
- `@dinilmusick/gutts/server`: Node-specific auth/model adapters; storage is deliberately excluded.
- `@dinilmusick/gutts/storage/s3`: AWS S3 adapter (optional `@aws-sdk/client-s3` peer).
- `@dinilmusick/gutts/storage/google-drive`: lazy Google Drive adapter (optional `googleapis` peer).
- `@dinilmusick/gutts/server/models`: Node Cactus runtime adapters to inject into model classes.

The package is ESM-only. CommonJS consumers should use dynamic `import()`; CommonJS compatibility is not claimed.

The default and browser entrypoints do not statically load Node-only adapters. Worker consumers should use `/worker`, not the model-bearing package root. Node consumers inject the server runtime adapter:

```ts
import { Needle3 } from "@dinilmusick/gutts/models";
import { nodeCactusNeedle3Runtime } from "@dinilmusick/gutts/server/models";

const needle = new Needle3(nodeCactusNeedle3Runtime);
```

For server-side Luth configuration, resolve `APP_URL` through `resolveServerRuntimeAppUrl()` from `./server/auth` and pass the result as the client's explicit `origin`. The portable auth client itself reads the Web `location` API and never accesses `process.env`.

## Storage adapters

Use provider-specific entrypoints in new code. Each provider entrypoint is an independent public package boundary; consumers should install only the optional SDK peer required by the adapter they import.

### AWS S3

`@dinilmusick/gutts/storage/s3` resolves to the dedicated emitted `dist/storage/s3.js` entrypoint and its `dist/storage/s3.d.ts` declaration. It re-exports the S3 client and commands from the optional `@aws-sdk/client-s3` peer. It does not import the storage aggregate, Google Drive adapter, or `googleapis`.

Install the adapter's peer in the consuming application:

```sh
npm install @dinilmusick/gutts @aws-sdk/client-s3
```

Import it directly:

```ts
import { S3Client, PutObjectCommand } from "@dinilmusick/gutts/storage/s3";
```

The S3-only consumer does not need `googleapis`. This is an import-graph guarantee: the S3 entrypoint and its local transitive modules must not reference Google SDK packages. The AWS SDK remains a legitimate provider dependency and may itself use Node-specific capabilities in Node deployments.

### Google Drive and legacy aggregates

`@dinilmusick/gutts/storage/google-drive` loads Google APIs only when `loadGoogleApis()` or `createGoogleDriveClient()` is called. Install `googleapis` when using that provider.

The legacy `@dinilmusick/gutts/storage` and `@dinilmusick/gutts/server/storage` aggregate entrypoints preserve the historical `S3Client`, `google`, and `drive_v3` exports. Because the aggregate deliberately exposes both providers, importing it may load both provider modules and requires the corresponding optional peers. New consumers should prefer the provider-specific subpaths. Neither aggregate is re-exported by the universal root or `server` entrypoint.

## Library policy

GutTS is an aggregation layer, not a collection of reimplemented utility algorithms.

- Prefer mature, widely adopted, well-maintained libraries when they provide the required primitive.
- Keep wrappers small and stable.
- Keep application/domain-specific behavior out of GutTS.
- Model runtimes are adapters: model artifacts and execution engines remain replaceable without changing the named model API.

## Design rules

- Prefer small, composable functions.
- Keep category facades stable.
- Keep shared types beside the category that owns them.
- Add regression tests for every public utility family and model lifecycle guarantee.

<!-- storage-provider-ci-validation -->
