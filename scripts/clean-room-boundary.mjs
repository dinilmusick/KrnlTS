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

  const importProbe = path.join(consumer, "probe.mjs");
  fs.writeFileSync(importProbe, "await import(" + JSON.stringify(pkg.name) + ");\n");
  execFileSync(process.execPath, [importProbe], {cwd: consumer, stdio: "pipe"});

  const resolveProbe = path.join(consumer, "resolve.mjs");
  const publicKeys = Object.keys(exportsMap).filter((key) => key !== "./gutts.manifest.json");
  const specs = publicKeys.map((key) => key === "." ? pkg.name : pkg.name + key.slice(1));
  fs.writeFileSync(resolveProbe, specs.map((spec) => "console.log(import.meta.resolve(" + JSON.stringify(spec) + "));").join("\n") + "\n");
  execFileSync(process.execPath, [resolveProbe], {cwd: consumer, stdio: "pipe"});

  const packageDir = path.join(consumer, "node_modules", ...pkg.name.split("/"));
  const packageJson = JSON.parse(fs.readFileSync(path.join(packageDir, "package.json"), "utf8"));
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
