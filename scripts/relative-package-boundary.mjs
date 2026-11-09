import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceRoots = ["src", "packages"].map((p) => path.join(root, p)).filter(fs.existsSync);
const extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
const importPattern = /(?:from\s*|import\s*\(|export\s+(?:\*\s+from|\{[^}]*\}\s+from)\s*)["']([^"']+)["']/g;

function walk(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(file));
    else if (extensions.includes(path.extname(entry.name))) result.push(file);
  }
  return result;
}

function packageRoot(file) {
  let current = path.dirname(file);
  while (current.startsWith(root)) {
    if (fs.existsSync(path.join(current, "package.json"))) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return root;
}

const failures = [];
for (const sourceRoot of sourceRoots) {
  for (const file of walk(sourceRoot)) {
    const source = fs.readFileSync(file, "utf8");
    for (const match of source.matchAll(importPattern)) {
      const specifier = match[1];
      if (!specifier?.startsWith(".")) continue;
      const candidate = path.resolve(path.dirname(file), specifier);
      const owner = packageRoot(file);
      const normalizedOwner = path.resolve(owner) + path.sep;
      if (!path.resolve(candidate).startsWith(normalizedOwner) && path.resolve(candidate) !== path.resolve(owner)) {
        failures.push(path.relative(root, file) + " imports outside package boundary: " + specifier);
      }
    }
  }
}

fs.writeFileSync(path.join(root,'.relative-boundary-report.json'),JSON.stringify({failures},null,2));

if (failures.length) {
  console.error("RELATIVE PACKAGE BOUNDARY FAILED (" + failures.length + ")");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}
console.log("RELATIVE PACKAGE BOUNDARY PASSED");
