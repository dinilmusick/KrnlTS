import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const temp = fs.mkdtempSync(path.join(root, ".consumer-browser-boundary-"));
const packDir = path.join(temp, "pack");
const consumerDir = path.join(temp, "consumer");
const nodeModules = path.join(consumerDir, "node_modules");
const packedPackage = path.join(nodeModules, ...packageJson.name.split("/"));
const entries = [
  ["ui", packageJson.name + "/ui"],
  ["canvas-ui", packageJson.name + "/canvas-ui"],
  ["contracts", packageJson.name + "/contracts"],
];
const platforms = ["browser", "neutral"];
const failures = [];
const forbiddenPackages = [
  "@ultrst-armada/kloks", "@ultrst-armada/kloks/*",
  "@ultrst-armada/krnl", "@ultrst-armada/krnl/*",
  "@kloks/*", "@krnl/*",
  "@dinilmusick/gutts/server", "@dinilmusick/gutts/node",
  "@ultrst-armada/frnlts/server", "@ultrst-armada/frnlts/node",
  "@aws-sdk/*", "googleapis", "@google-cloud/*",
  "@cloudflare/*", "@vercel/*",
];
const forbiddenBuiltins = [
  "assert", "buffer", "child_process", "cluster", "crypto", "dgram",
  "diagnostics_channel", "dns", "domain", "events", "fs", "http", "https",
  "module", "net", "os", "path", "perf_hooks", "process", "punycode",
  "querystring", "readline", "repl", "stream", "string_decoder", "sys",
  "timers", "tls", "tty", "url", "util", "v8", "vm", "wasi", "worker_threads",
  "zlib",
];
const forbiddenImport = new RegExp(
  String.raw`(?:from\s*|import\s*(?:\(\s*)?|require\s*\()\s*["'](node:[^"']+|${forbiddenBuiltins.join("|")})(?:/[^"']*)?["']`,
);
const forbiddenPackageImport = new RegExp(
  String.raw`(?:from\s*|import\s*(?:\(\s*)?|require\s*\()\s*["'](?:${forbiddenPackages
    .map((name) => name.replaceAll("*", "[^/]+"))
    .join("|")})(?:/[^"']*)?["']`,
);

function run(command, args, cwd = root) {
  execFileSync(command, args, {cwd, stdio: "inherit", env: process.env});
}

function walk(dir) {
  const result = [];
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(file));
    else if (file.endsWith(".js") || file.endsWith(".mjs") || file.endsWith(".cjs")) result.push(file);
  }
  return result;
}

try {
  fs.mkdirSync(packDir, {recursive: true});
  fs.mkdirSync(nodeModules, {recursive: true});
  run("npm", ["pack", "--ignore-scripts", "--pack-destination", packDir]);
  const tarball = fs.readdirSync(packDir).find((name) => name.endsWith(".tgz"));
  if (!tarball) throw new Error("npm pack did not produce a tarball");
  fs.mkdirSync(packedPackage, {recursive: true});
  run("tar", ["-xzf", path.join(packDir, tarball), "-C", packedPackage, "--strip-components=1"]);

  // Resolve internal workspace packages exactly as they are represented in the packed artifact.
  const floksScope = path.join(nodeModules, "@floks");
  fs.mkdirSync(floksScope, {recursive: true});
  for (const name of ["ui", "canvas-ui", "contracts"]) {
    const target = path.join(packedPackage, "packages", name);
    if (!fs.existsSync(target)) throw new Error("Packed artifact is missing packages/" + name);
    fs.symlinkSync(target, path.join(floksScope, name), "dir");
  }

  const declarationFiles = walk(packedPackage).filter((file) => file.endsWith(".d.ts"));
  for (const file of declarationFiles) {
    const declarations = fs.readFileSync(file, "utf8");
    if (forbiddenImport.test(declarations)) failures.push(path.relative(root, file) + " contains a Node builtin type import");
    if (forbiddenPackageImport.test(declarations)) failures.push(path.relative(root, file) + " contains a backend package type import");
  }

  for (const [entryName, specifier] of entries) {
    const entry = path.join(consumerDir, entryName + ".mjs");
    fs.writeFileSync(entry, [
      'import * as publicApi from "' + specifier + '";',
      'const exportedNames = Object.keys(publicApi);',
      'if (exportedNames.length === 0) throw new Error("No public exports resolved for ' + specifier + '");',
      'console.log("' + specifier + ':", exportedNames.length, "exports");',
      "",
    ].join("\n"));

    for (const platform of platforms) {
      const outDir = path.join(temp, "builds", platform, entryName);
      const external = [
        "react", "react-dom", "lucide-react", "monaco-editor",
        "@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities",
        ...forbiddenPackages,
        "node:*", ...forbiddenBuiltins,
      ];
      const configPath = path.join(temp, "tsup-" + platform + "-" + entryName + ".config.mjs");
      const configSource = `
export default {
  entry: [${JSON.stringify(entry)}],
  format: ["esm"],
  platform: ${JSON.stringify(platform)},
  target: "es2022",
  outDir: ${JSON.stringify(outDir)},
  external: ${JSON.stringify(external)},
  esbuildOptions(options) {
    options.alias = {
      ...options.alias,
      "@ultrst-armada/floks/ui": ${JSON.stringify(path.join(packedPackage, "packages/ui/dist/index.js"))},
      "@ultrst-armada/floks/contracts": ${JSON.stringify(path.join(packedPackage, "packages/contracts/dist/index.js"))},
      "@ultrst-armada/floks/canvas-ui": ${JSON.stringify(path.join(packedPackage, "packages/canvas-ui/dist/index.js"))},
    };
  },
};
`;
      fs.writeFileSync(configPath, configSource);
      run("pnpm", ["exec", "tsup", "--config", configPath]);
      const outputFiles = walk(outDir);
      if (outputFiles.length === 0) throw new Error("No " + platform + " bundle emitted for " + specifier);
      for (const file of outputFiles) {
        const code = fs.readFileSync(file, "utf8");
        if (forbiddenImport.test(code)) failures.push(path.relative(root, file) + " contains a Node builtin import");
        if (forbiddenPackageImport.test(code)) failures.push(path.relative(root, file) + " contains a backend package import");
      }
    }
  }

  if (failures.length) {
    console.error("PUBLISHED CONSUMER BROWSER BOUNDARY FAILED");
    for (const failure of failures) console.error("- " + failure);
    process.exitCode = 1;
  } else {
    console.log("PUBLISHED CONSUMER BROWSER BOUNDARY PASSED: UI, canvas-ui, contracts (browser + neutral)");
  }
} finally {
  fs.rmSync(temp, {recursive: true, force: true});
}
