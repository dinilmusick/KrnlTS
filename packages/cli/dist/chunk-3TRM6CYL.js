import {
  KrnlHTTP
} from "./chunk-XIRFOO3H.js";

// ../core/dist/chunk-GADIRLRS.js
import { exec, spawn } from "child_process";
import path3 from "path";
import fs3 from "fs";
var KrnlShell = class {
  /**
   * Promisified command execution.
   */
  static exec(cmd, opts = {}) {
    const timeout = opts.timeout || 3e4;
    return new Promise((resolve, reject) => {
      exec(cmd, { ...opts, timeout }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`[KrnlShellError] Command failed: ${cmd}
Exit Code: ${error.code}
Stderr: ${String(stderr)}`));
        } else {
          resolve({ stdout: String(stdout), stderr: String(stderr) });
        }
      });
    });
  }
  /**
   * Streaming command execution.
   */
  static spawn(cmd, args, opts = {}) {
    const child = spawn(cmd, args, opts);
    const promise = new Promise((resolve, reject) => {
      child.on("close", (code, signal) => {
        resolve({ code, signal });
      });
      child.on("error", (err) => {
        reject(err);
      });
    });
    return {
      pid: child.pid,
      kill: (signal) => child.kill(signal),
      promise
    };
  }
  /**
   * Defines posix vs win32 specific commands.
   */
  static platform(routing) {
    return process.platform === "win32" ? routing.win32 : routing.posix;
  }
  /**
   * Resolves the full path of a binary.
   */
  static which(cmd) {
    const envPath = process.env.PATH || "";
    const paths = envPath.split(path3.delimiter);
    const extensions = process.platform === "win32" ? [".exe", ".cmd", ".bat", ""] : [""];
    for (const p of paths) {
      for (const ext of extensions) {
        const fullPath = path3.join(p, `${cmd}${ext}`);
        try {
          if (fs3.existsSync(fullPath) && fs3.statSync(fullPath).isFile()) {
            return fullPath;
          }
        } catch (e) {
        }
      }
    }
    return null;
  }
};
var KrnlAikoClient = class _KrnlAikoClient {
  baseUrl;
  lastUsedModelId = null;
  constructor(aikoPort, aikoHost = "localhost") {
    this.baseUrl = `http://${aikoHost}:${aikoPort}`;
  }
  static discover(system) {
    const aikoPeer = system.peers?.get("Aiko");
    if (aikoPeer && aikoPeer.address) {
      let addr = aikoPeer.address;
      if (!addr.startsWith("http")) {
        addr = `http://${addr}`;
      }
      try {
        const url = new URL(addr);
        return new _KrnlAikoClient(Number(url.port || 10095), url.hostname);
      } catch (e) {
        console.error("[KrnlAikoClient] Failed to parse discovered Aiko address:", addr, e);
      }
    }
    return null;
  }
  async infer(intelligenceSpec, systemPrompt, userPrompt) {
    const client = KrnlHTTP.createClient(this.baseUrl);
    const result = await client.post("/call/infer", {
      intelligenceSpec,
      systemPrompt,
      userPrompt
    });
    if (result && result.status === "success" && result.data && result.data.status === "success" && result.data.payload && result.data.payload.status === "success" && result.data.payload.response) {
      this.lastUsedModelId = result.data.payload.modelId || null;
      return result.data.payload.response;
    }
    const errMsg = result.status === "success" ? result.data?.payload?.message || result.data?.message : result.message;
    throw new Error(errMsg || "Invalid or empty response from Aiko infer endpoint");
  }
  async downrankModel(modelId) {
    try {
      const client = KrnlHTTP.createClient(this.baseUrl);
      await client.post("/call/downrankModel", { modelId });
    } catch (e) {
      console.error("[KrnlAikoClient] Failed to send downrank request to Aiko:", e.message);
    }
  }
  async fetchCatalog() {
    const client = KrnlHTTP.createClient(this.baseUrl);
    const result = await client.post("/call/SessionManager/AgentProfileManager", {
      action: "list"
    });
    if (result && result.status === "success" && result.data && result.data.status === "success" && result.data.profiles) {
      return result.data.profiles;
    }
    return {
      "endpoint-grade-1": { description: "Nano \u2014 simple CRUD" },
      "endpoint-grade-2": { description: "Mini \u2014 standard ops" },
      "endpoint-grade-3": { description: "Standard \u2014 moderate logic" },
      "endpoint-grade-4": { description: "Large \u2014 complex reasoning" },
      "endpoint-grade-5": { description: "Expert \u2014 escalation handler" },
      "orchestrator-standard": { description: "Standard routing" },
      "orchestrator-pro": { description: "Complex routing + escalation" }
    };
  }
  async isAlive() {
    try {
      const client = KrnlHTTP.createClient(this.baseUrl);
      const result = await client.post("/call/heartbeat", {});
      return result && result.status === "success";
    } catch (e) {
      return false;
    }
  }
  static getNotRunningMessage() {
    return "Aiko is not running. Please start it with: cd ~/Projects/Javascript/Aiko && node src/Aiko.js";
  }
};

export {
  KrnlShell,
  KrnlAikoClient
};
