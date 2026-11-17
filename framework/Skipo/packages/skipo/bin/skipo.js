#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { argv, exit } from "node:process";

const here = dirname(fileURLToPath(import.meta.url));
const engine = join(here, "..", "dist", "engine");
const python = process.env.SKIPO_PYTHON || (process.platform === "win32" ? "python" : "python3");

try {
  execFileSync(python, [join(engine, "scripts", "skipo_cli.py"), ...argv.slice(2)], {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  });
} catch (error) {
  exit(typeof error?.status === "number" ? error.status : 1);
}
