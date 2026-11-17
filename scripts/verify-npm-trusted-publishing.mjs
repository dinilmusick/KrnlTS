import fs from "node:fs";

const workflow = fs.readFileSync(".github/workflows/npm-release.yml", "utf8");
const required = [
  "id-token: write",
  "registry-url: https://registry.npmjs.org/",
  "npm install --global npm@latest",
  "npm publish --provenance --access public",
  "workflow_run:",
];
for (const value of required) {
  if (!workflow.includes(value)) throw new Error("Missing Trusted Publishing requirement: " + value);
}
for (const forbidden of ["NPM_TOKEN", "NODE_AUTH_TOKEN", "_authToken", "secrets.NPM"]) {
  if (workflow.includes(forbidden)) throw new Error("Long-lived npm token reference found: " + forbidden);
}
console.log("npm Trusted Publishing workflow contract verified.");
