import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const exportTargets = new Set();

function collectTargets(value, exportName) {
  if (typeof value === "string") {
    if (value.startsWith("./")) exportTargets.add(value.slice(2));
    else if (!value.startsWith("node:")) {
      throw new Error(`Unsupported non-relative export target for ${exportName}: ${value}`);
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectTargets(item, exportName);
    return;
  }
  if (value && typeof value === "object") {
    for (const [condition, nested] of Object.entries(value)) {
      collectTargets(nested, `${exportName} [${condition}]`);
    }
  }
}

for (const [name, target] of Object.entries(manifest.exports ?? {})) {
  collectTargets(target, name);
}

const missingOnDisk = [...exportTargets].filter((target) => {
  const resolved = path.resolve(root, target);
  return !resolved.startsWith(root + path.sep) || !fs.existsSync(resolved);
});
if (missingOnDisk.length) {
  throw new Error(`Package exports point to missing build files:\n${missingOnDisk.join("\n")}`);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "kloks-package-export-check-"));
try {
  const packOut = execFileSync(
    "npm",
    ["pack", "--ignore-scripts", "--pack-destination", tempDir],
    { cwd: root, encoding: "utf8" }
  );
  const tarballName = packOut.trim().split("\n").map((line) => line.trim()).filter(Boolean).pop();
  const tarballPath = path.join(tempDir, tarballName);
  const tarOutput = execFileSync("tar", ["-tzf", tarballPath], { encoding: "utf8" });
  const packedFiles = new Set(
    tarOutput
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => (line.startsWith("package/") ? line.slice("package/".length) : line))
  );

  const missingFromTarball = [...exportTargets].filter((target) => !packedFiles.has(target));
  if (missingFromTarball.length) {
    throw new Error(`Package exports are absent from the npm tarball:\n${missingFromTarball.join("\n")}`);
  }
  console.log(`Verified ${exportTargets.size} export targets in ${tarballName}.`);
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
