import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const failures = [];
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "floks-server-consumer-"));
const packDir = path.join(temporary, "pack");
const consumer = path.join(temporary, "consumer");
const packageName = pkg.name;
const universalEntries = [packageName + "/contracts", packageName + "/universal"];
const browserOnlyPeers = [
  "@xyflow/react",
  "d3-force",
  "zustand",
  "react",
  "react-dom",
  "lucide-react",
];

function run(command, args, cwd = root) {
  execFileSync(command, args, {cwd, stdio: "pipe", env: process.env});
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

try {
  for (const name of browserOnlyPeers) {
    assert(pkg.peerDependencies?.[name], "Missing browser-facing peer dependency declaration: " + name);
    assert(pkg.peerDependenciesMeta?.[name]?.optional === true, "Browser-facing peer must be optional for server consumers: " + name);
    assert(!Object.hasOwn(pkg.dependencies || {}, name), "Browser-facing dependency is still mandatory: " + name);
  }

  fs.mkdirSync(packDir, {recursive: true});
  fs.mkdirSync(consumer, {recursive: true});
  run("npm", ["pack", "--ignore-scripts", "--pack-destination", packDir]);
  const tarball = fs.readdirSync(packDir).find((file) => file.endsWith(".tgz"));
  if (!tarball) throw new Error("npm pack did not produce a tarball");
  run("npm", ["init", "-y"], consumer);
  run("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", path.join(packDir, tarball)], consumer);

  const installedPackage = path.join(consumer, "node_modules", ...packageName.split("/"));
  const installedManifest = JSON.parse(fs.readFileSync(path.join(installedPackage, "package.json"), "utf8"));
  assert(installedManifest.version === pkg.version, "Packed package version does not match source package.json");

  // Verify every public server-safe entry is resolvable and executable in a clean Node consumer.
  for (const specifier of universalEntries) {
    run(process.execPath, ["--input-type=module", "-e", "const api = await import(" + JSON.stringify(specifier) + "); if (!Object.keys(api).length) throw new Error('Empty public API');"], consumer);
  }

  // The package manifest declares these as optional peers; transitive foundations may still
  // install some of them. The actual Node/Worker bundle checks below enforce the import boundary.

  // All declared CSS entrypoints must exist in the packed artifact.
  for (const [key, target] of Object.entries(pkg.exports || {})) {
    if (!key.endsWith(".css") || typeof target !== "string") continue;
    assert(fs.existsSync(path.join(installedPackage, target)), "Published CSS export is missing: " + key + " -> " + target);
  }

  // Build the universal entry through Worker and Node bundler conditions. This detects accidental
  // CSS, DOM-renderer, Node-builtin, and browser-only package edges in the server-safe graph.
  const probe = path.join(consumer, "universal-consumer.mjs");
  fs.writeFileSync(probe, "import * as api from " + JSON.stringify(universalEntries[1]) + ";\nconsole.log(Object.keys(api).length);\n");
  const forbidden = /(?:node:|from\s*["'](?:react|react-dom|@xyflow\/react|d3-force|zustand|lucide-react|@ultrst-armada\/frnlts|@dinilmusick\/gutts)|\.css(?:["']|\?))/;
  for (const platform of ["browser", "node"]) {
    const outDir = path.join(temporary, platform + "-bundle");
    const configPath = path.join(temporary, "tsup-" + platform + ".config.mjs");
    const config = `export default {
      entry: [${JSON.stringify(probe)}],
      format: ["esm"],
      platform: ${JSON.stringify(platform)},
      target: "es2022",
      outDir: ${JSON.stringify(outDir)},
      clean: true,
      splitting: false,
      esbuildOptions(options) {
        options.conditions = ["worker", "browser", "import"];
      },
    };\n`;
    fs.writeFileSync(configPath, config);
    run("pnpm", ["exec", "tsup", "--config", configPath], root);
    const bundles = [];
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(file);
        else if (file.endsWith(".js") || file.endsWith(".mjs")) bundles.push(fs.readFileSync(file, "utf8"));
      }
    };
    walk(outDir);
    assert(bundles.length > 0, platform + " universal bundle was not emitted");
    for (const bundle of bundles) assert(!forbidden.test(bundle), platform + " universal bundle contains a forbidden browser/CSS/Node dependency edge");
  }

  if (failures.length) {
    console.error("FLOKS SERVER CONSUMER BOUNDARY FAILED (" + failures.length + ")");
    for (const failure of failures) console.error("- " + failure);
    process.exitCode = 1;
  } else {
    console.log("FLOKS SERVER CONSUMER BOUNDARY PASSED: packed Node import, Worker/Node bundles, optional browser peers, CSS artifacts");
  }
} finally {
  fs.rmSync(temporary, {recursive: true, force: true});
}
