#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdirSync, existsSync, cpSync, readdirSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
function run(bin, args) {
  const result = spawnSync(bin, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
function has(name) { return existsSync(resolve(root, name)); }

console.log("[skipo] Building the single Fetch application and provider packages");
if (has("next.config.js") || has("next.config.mjs") || has("next.config.ts")) {
  run("npx", ["next", "build"]);
  mkdirSync(resolve(root, "dist/client/_next"), { recursive: true });
  if (has(".next/static")) cpSync(resolve(root, ".next/static"), resolve(root, "dist/client/_next/static"), { recursive: true });
  if (has("public")) cpSync(resolve(root, "public"), resolve(root, "dist/client"), { recursive: true });
  const appOutput = resolve(root, ".next/server/app");
  if (existsSync(appOutput)) {
    function copyHtmlPages(source, destination) {
      for (const entry of readdirSync(source, { withFileTypes: true })) {
        const from = resolve(source, entry.name);
        const to = resolve(destination, entry.name);
        if (entry.isDirectory()) copyHtmlPages(from, to);
        else if (entry.isFile() && entry.name.endsWith(".html")) {
          mkdirSync(resolve(to, ".."), { recursive: true });
          copyFileSync(from, to);
        }
      }
    }
    copyHtmlPages(appOutput, resolve(root, "dist/client"));
  }
} else if (has("vite.config.ts") || has("vite.config.js") || has("index.html")) {
  run("npx", ["vite", "build", "--outDir", "dist/client"]);
}
for (const path of [
  "dist/client",
  "dist/providers/cloudflare",
  "dist/providers/vercel",
  "dist/providers/node",
  "api",
]) mkdirSync(resolve(root, path), { recursive: true });

run("npx", [
  "esbuild", "src/providers/cloudflare.ts", "--bundle", "--format=esm",
  "--platform=browser", "--target=es2022",
  "--outfile=dist/providers/cloudflare/worker.js",
]);
run("npx", [
  "esbuild", "src/providers/vercel.ts", "--bundle", "--format=esm",
  "--platform=node", "--target=node22", "--packages=external",
  "--outfile=api/[...path].js",
]);
run("npx", [
  "esbuild", "src/providers/vercel.ts", "--bundle", "--format=esm",
  "--platform=node", "--target=node22", "--packages=external",
  "--outfile=api/mcp.js",
]);
run("npx", [
  "esbuild", "src/providers/node.ts", "--bundle", "--format=esm",
  "--platform=node", "--target=node22", "--packages=external",
  "--outfile=dist/providers/node/server.js",
]);
console.log("[skipo] Provider packaging complete: Cloudflare, Vercel Node, Node/Cloud Run");
