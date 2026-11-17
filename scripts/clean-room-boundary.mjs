import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {execFileSync} from "node:child_process";

const root = process.cwd();
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const exportsMap = pkg.exports;
if (!exportsMap || typeof exportsMap !== "object") {
  console.log("CLEAN-ROOM BOUNDARY: no public exports; application package skipped.");
  process.exit(0);
}

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "architecture-boundary-"));
const packDir = path.join(temp, "pack");
const consumer = path.join(temp, "consumer");
fs.mkdirSync(packDir);
fs.mkdirSync(consumer);

try {
  execFileSync("npm", ["pack", "--ignore-scripts", "--pack-destination", packDir], {cwd: root, stdio: "pipe"});
  const tarball = fs.readdirSync(packDir).find((name) => name.endsWith(".tgz"));
  if (!tarball) throw new Error("npm pack produced no tarball");
  execFileSync("npm", ["init", "-y"], {cwd: consumer, stdio: "ignore"});
  execFileSync("npm", ["install", path.join(packDir, tarball)], {cwd: consumer, stdio: "pipe"});

  // First prove the portable backend and base subpath work with only declared package dependencies.
  const portableProbe = path.join(consumer, "portable-probe.mjs");
  fs.writeFileSync(portableProbe, [
    "const backend = await import(" + JSON.stringify(pkg.name + "/backend") + ");",
    "if (!backend.BaseApiRoute) throw new Error('Portable backend API entrypoint is missing BaseApiRoute');",
    "const base = await import(" + JSON.stringify(pkg.name + "/functions/base") + ");",
    "if (!base.SkipoBase) throw new Error('Portable functions base subpath is missing SkipoBase');",
    "const portableFunctions = await import(" + JSON.stringify(pkg.name + "/functions/portable") + ");",
    "if (!portableFunctions.LRUCache || !portableFunctions.SkipoBase) throw new Error('Portable functions subpath is incomplete');",
    "const nodeFunctions = await import(" + JSON.stringify(pkg.name + "/functions/node") + ");",
    "if (typeof nodeFunctions.readFile !== 'function' || typeof nodeFunctions.execCmd !== 'function' || typeof nodeFunctions.loadEnv !== 'function' || !nodeFunctions.FileCache) throw new Error('Node functions subpath is incomplete or requires an unrelated peer');",
    "const nodeStorage = await import(" + JSON.stringify(pkg.name + "/backend/storage/node") + ");",
    "if (!nodeStorage.StorageAdapterFactory) throw new Error('Node storage adapter is missing its factory');",
  ].join("\n") + "\n");
  execFileSync(process.execPath, [portableProbe], {cwd: consumer, stdio: "pipe"});

  const workerEntry = path.join(consumer, "worker.mjs");
  fs.writeFileSync(workerEntry, [
    "import { BaseApiRoute } from " + JSON.stringify(pkg.name + "/backend") + ";",
    "class ProbeRoute extends BaseApiRoute { async handle(request) { return new Response('portable'); } }",
    "export default { async fetch(request) { return new ProbeRoute().handle(request); } };",
  ].join("\n") + "\n");
  fs.writeFileSync(path.join(consumer, "wrangler.toml"), [
    'name = "kloks-portability-consumer"',
    'main = "worker.mjs"',
    'compatibility_date = "2026-11-12"',
  ].join("\n") + "\n");
  execFileSync("npx", ["--yes", "wrangler@4.160.0", "deploy", "--dry-run", "--outdir", "worker-dist"], {cwd: consumer, stdio: "pipe"});
  const workerBundle = path.join(consumer, "worker-dist", "worker.js");
  if (!fs.existsSync(workerBundle)) throw new Error("Wrangler did not emit the expected Worker bundle.");
  const bundleSource = fs.readFileSync(workerBundle, "utf8");
  if (/(?:from|import\s*\(|require\s*\()\s*["'](?:node:)?(?:fs|fs\/promises|child_process|path|os)["']/.test(bundleSource)) {
    throw new Error("Portable Worker bundle contains a Node built-in import.");
  }
  if (/AudioContext|MIDIInput|MIDIOutput|AudioMidiOrchestratorDefinition|AudioInputManager/.test(bundleSource)) {
    throw new Error("Portable Worker bundle contains browser audio/MIDI implementation code.");
  }
  console.log("CLOUDFLARE CONSUMER BUILD PASSED: " + Buffer.byteLength(bundleSource) + " bytes; no Node filesystem or audio/MIDI modules.");

  // Verify the actual installed registry artifact. Never patch or overlay it.
  const guttsPackageDir = path.join(consumer, 'node_modules', '@dinilmusick', 'gutts');
  const guttsPackageJsonPath = path.join(guttsPackageDir, 'package.json');
  if (!fs.existsSync(guttsPackageJsonPath)) throw new Error('Installed GutTS package was not found.');
  const guttsPackageJson = JSON.parse(fs.readFileSync(guttsPackageJsonPath, 'utf8'));
  if (!/^2\.1\./.test(guttsPackageJson.version)) throw new Error('Expected published GutTS ^2.1.0; found ' + guttsPackageJson.version);
  const s3Export = guttsPackageJson.exports?.['./storage/s3'];
  const s3ExportPath = typeof s3Export === 'string' ? s3Export : s3Export?.import || s3Export?.default;
  if (!s3ExportPath || !fs.existsSync(path.join(guttsPackageDir, s3ExportPath))) {
    throw new Error('Installed GutTS registry artifact does not expose ./storage/s3 and its emitted runtime file.');
  }
  const s3TypesPath = typeof s3Export === 'object' ? s3Export.types : undefined;
  if (!s3TypesPath || !fs.existsSync(path.join(guttsPackageDir, s3TypesPath))) {
    throw new Error('Installed GutTS registry artifact does not expose the S3 declaration file.');
  }
  const s3 = await import('@dinilmusick/gutts/storage/s3');
  if (typeof s3.S3Client !== 'function' || typeof s3.ListObjectsV2Command !== 'function') {
    throw new Error('Published GutTS S3 runtime exports are incomplete.');
  }
  console.log('GUTTS NPM ARTIFACT CHECK PASSED: published ' + guttsPackageJson.version + ' S3 JavaScript, declarations, and runtime exports.');

  const optionalPeers = Object.entries(pkg.peerDependenciesMeta || {})
    .filter(([name, meta]) => meta?.optional && pkg.peerDependencies?.[name])
    .map(([name]) => `${name}@${pkg.peerDependencies[name]}`);
  if (optionalPeers.length) execFileSync("npm", ["install", ...optionalPeers], {cwd: consumer, stdio: "pipe"});

  const typesProbe = path.join(consumer, "types-probe.mts");
  fs.writeFileSync(typesProbe, [
    "import { BaseApiRoute } from " + JSON.stringify(pkg.name + "/backend") + ";",
    "import { LocalFSAdapter } from " + JSON.stringify(pkg.name + "/backend/storage/node") + ";",
    "import { SkipoBase } from " + JSON.stringify(pkg.name + "/functions/base") + ";",
    "import { readFile, FileCache, loadEnv } from " + JSON.stringify(pkg.name + "/functions/node") + ";",
    "import { LRUCache } from " + JSON.stringify(pkg.name + "/functions/portable") + ";",
    "declare const route: BaseApiRoute;",
    "declare const nodeAdapter: LocalFSAdapter;",
    "declare const portableBase: SkipoBase;",
    "declare const fileCache: FileCache<string>;",
    "declare const portableCache: LRUCache<string, number>;",
    "void route; void nodeAdapter; void portableBase; void readFile; void fileCache; void portableCache; void loadEnv;",
  ].join("\n") + "\n");
  execFileSync(path.join(root, "node_modules", ".bin", "tsc"), [
    "--noEmit", "--target", "ES2022", "--module", "NodeNext", "--moduleResolution", "NodeNext",
    typesProbe,
  ], {cwd: consumer, stdio: "pipe"});

  const importProbe = path.join(consumer, "probe.mjs");
  fs.writeFileSync(importProbe, "await import(" + JSON.stringify(pkg.name) + ");\n");
  execFileSync(process.execPath, [importProbe], {cwd: consumer, stdio: "pipe"});

  const platformProbe = path.join(consumer, "platform-probe.mjs");
  fs.writeFileSync(platformProbe, [
    "const functions = await import(" + JSON.stringify(pkg.name + "/functions") + ");",
    "if (functions.readFile || functions.execCmd || functions.FileCache || functions.loadEnv) throw new Error('Portable functions entrypoint exposed Node-only utilities');",
    "if (!functions.FunctionsServiceFacade) throw new Error('KrnlTS service facade is missing from the compatibility entrypoint');",
    "await import(" + JSON.stringify(pkg.name + "/backend/node") + ");",
  ].join("\n") + "\n");
  execFileSync(process.execPath, [platformProbe], {cwd: consumer, stdio: "pipe"});

  const resolveProbe = path.join(consumer, "resolve.mjs");
  const publicKeys = Object.keys(exportsMap).filter((key) => key !== "./gutts.manifest.json" && !key.endsWith("/*"));
  const specs = publicKeys.map((key) => key === "." ? pkg.name : pkg.name + key.slice(1));
  fs.writeFileSync(resolveProbe, specs.map((spec) => "console.log(import.meta.resolve(" + JSON.stringify(spec) + "));").join("\n") + "\n");
  execFileSync(process.execPath, [resolveProbe], {cwd: consumer, stdio: "pipe"});

  const packageDir = path.join(consumer, "node_modules", ...pkg.name.split("/"));
  const packageJson = JSON.parse(fs.readFileSync(path.join(packageDir, "package.json"), "utf8"));
  const backendRuntimeFiles = [];
  const collectBackendRuntimeFiles = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) collectBackendRuntimeFiles(file);
      else if (/\.(?:js|mjs|cjs|d\.ts)$/.test(entry.name)) backendRuntimeFiles.push(file);
    }
  };
  collectBackendRuntimeFiles(path.join(packageDir, "packages", "backend", "dist"));
  const backendRuntimeSource = backendRuntimeFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n");
  if (/(?:from\s*|import\s*\(|require\s*\()\s*["']googleapis["']/.test(backendRuntimeSource)) {
    throw new Error("Packed backend runtime contains a direct Google Node SDK import.");
  }
  if (/(?:from\s*|import\s*\(|require\s*\()\s*["']@dinilmusick\/gutts\/storage["']/.test(backendRuntimeSource)) {
    throw new Error("Packed backend runtime imports the aggregate GutTS storage entrypoint instead of a provider-specific subpath.");
  }
  const backendRuntimeJavaScript = backendRuntimeFiles
    .filter((file) => /\.(?:js|mjs|cjs)$/.test(file))
    .map((file) => fs.readFileSync(file, "utf8"))
    .join("\n");
  if (!/(?:from\s*|import\s*\()\s*["']@dinilmusick\/gutts\/storage\/s3["']/.test(backendRuntimeJavaScript)) {
    throw new Error("Packed backend JavaScript does not retain the isolated GutTS S3 import.");
  }
  console.log("PACKED BACKEND DEPENDENCY BOUNDARY PASSED: no direct googleapis or aggregate GutTS storage imports.");
  if (packageJson.name !== pkg.name || packageJson.version !== pkg.version) throw new Error("Installed tarball metadata does not match source package metadata.");

  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file); else files.push(path.relative(packageDir, file).replaceAll(path.sep, "/"));
    }
  };
  walk(packageDir);
  for (const file of files) {
    if (file.startsWith(".git/") || file.startsWith("node_modules/") || /(^|\/)(?:\.env|\.env\.|credentials|secrets)(?:$|\.)/i.test(file)) throw new Error("Published package contains forbidden artifact: " + file);
  }
  console.log("CLEAN-ROOM BOUNDARY PASSED: " + pkg.name + "@" + pkg.version);
} finally {
  fs.rmSync(temp, {recursive: true, force: true});
}
