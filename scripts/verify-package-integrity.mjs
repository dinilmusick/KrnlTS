import { mkdtemp, readFile, rm, access, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const manifest = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
if (!manifest.name || manifest.private) {
  console.log("Package is private or unnamed; tarball verification is not applicable.");
  process.exit(0);
}
const temp = await mkdtemp(path.join(tmpdir(), "package-integrity-"));
const run = (command, args, cwd = root) => {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", stdio: "pipe" });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed:\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout;
};
const exists = async (file) => access(file).then(() => true, () => false);
const collectTargets = (value, output = []) => {
  if (typeof value === "string" && value.startsWith("./")) output.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectTargets(item, output));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => collectTargets(item, output));
  return output;
};
try {
  const packOutput = run("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", temp]);
  const jsonStart = packOutput.lastIndexOf("\n[");
  const packed = JSON.parse(packOutput.slice(jsonStart >= 0 ? jsonStart + 1 : 0));
  if (!packed[0]?.filename) throw new Error("npm pack did not produce a tarball.");
  const tarball = path.join(temp, packed[0].filename);
  const extracted = path.join(temp, "unpacked");
  await import("node:fs/promises").then(({ mkdir }) => mkdir(extracted));
  run("tar", ["-xzf", tarball, "-C", extracted]);
  const packageRoot = path.join(extracted, "package");
  const packedManifest = JSON.parse(await readFile(path.join(packageRoot, "package.json"), "utf8"));
  if (packedManifest.name !== manifest.name || packedManifest.version !== manifest.version) {
    throw new Error("Tarball identity/version differs from the repository manifest.");
  }
  const targets = [
    packedManifest.main,
    packedManifest.module,
    packedManifest.types,
    packedManifest.typings,
    ...collectTargets(packedManifest.exports),
    ...Object.values(packedManifest.bin || {}),
  ].filter(Boolean);
  for (const target of new Set(targets)) {
    if (target.includes("*")) {
      const prefix = target.slice(0, target.indexOf("*"));
      if (prefix && !(await exists(path.join(packageRoot, prefix)))) {
        throw new Error(`Export wildcard has no packaged directory: ${target}`);
      }
      continue;
    }
    if (!(await exists(path.join(packageRoot, target.replace(/^\.\//, ""))))) {
      throw new Error(`Manifest target missing from tarball: ${target}`);
    }
  }
  const consumer = path.join(temp, "consumer");
  await import("node:fs/promises").then(({ mkdir }) => mkdir(consumer));
  await writeFile(path.join(consumer, "package.json"), JSON.stringify({ private: true, type: "module" }, null, 2));
  run("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", "--no-save", tarball], consumer);
  const rootImport = `import(${JSON.stringify(packedManifest.name)}).then(() => console.log("root import ok"))`;
  run("node", ["--input-type=module", "-e", rootImport], consumer);
  if (packedManifest.exports) {
    const packageJsonResolution = `import.meta.resolve(${JSON.stringify(packedManifest.name + "/package.json")})`;
    const result = spawnSync("node", ["--input-type=module", "-e", packageJsonResolution], { cwd: consumer, encoding: "utf8" });
    if (result.status === 0) throw new Error("Package unexpectedly exposes package.json through its public export map.");
  }
  console.log(`Verified ${packedManifest.name}@${packedManifest.version}: tarball files, export targets, declarations, clean install, root import, and private package metadata.`);
} finally {
  await rm(temp, { recursive: true, force: true });
}
