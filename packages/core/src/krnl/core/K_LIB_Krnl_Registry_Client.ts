import { Logger } from "./K_LIB_Krnl_Base_Concepts.js";

export interface KrnlRegistryApp {
  name: string;
  port: number;
  pid: number;
  registeredAt: string;
}

export class KrnlRegistryClient {
  constructor(public registryPort: number = 10099) {}

  private getUrl(action: string): string {
    return `http://127.0.0.1:${this.registryPort}/call/${action}`;
  }

  async isRegistryAlive(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 800);
      const res = await fetch(this.getUrl("heartbeat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        signal: controller.signal,
      });
      clearTimeout(id);
      return res.ok;
    } catch (_) {
      return false;
    }
  }

  async register(name: string, port: number, pid: number): Promise<boolean> {
    try {
      const res = await fetch(this.getUrl("registerApp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, port, pid }),
      });
      if (res.ok) {
        const body = await res.json() as any;
        return body?.status === "success" || body?.success === true;
      }
      return false;
    } catch (err: any) {
      Logger.error(`[KrnlRegistryClient] Register error:`, err.message);
      return false;
    }
  }

  async deregister(name: string): Promise<boolean> {
    try {
      const res = await fetch(this.getUrl("deregisterApp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const body = await res.json() as any;
        return body?.status === "success" || body?.success === true;
      }
      return false;
    } catch (err: any) {
      Logger.error(`[KrnlRegistryClient] Deregister error:`, err.message);
      return false;
    }
  }

  async heartbeat(name: string): Promise<boolean> {
    try {
      const res = await fetch(this.getUrl("heartbeatApp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const body = await res.json() as any;
        return body?.status === "success" || body?.success === true;
      }
      return false;
    } catch (err: any) {
      Logger.error(`[KrnlRegistryClient] Heartbeat error:`, err.message);
      return false;
    }
  }

  async lookup(name: string): Promise<KrnlRegistryApp | null> {
    try {
      const res = await fetch(this.getUrl("lookupApp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const body = await res.json() as any;
        const payload = body?.payload || body?.data || body;
        if (payload && payload.port) {
          return payload as KrnlRegistryApp;
        }
      }
      return null;
    } catch (_) {
      return null;
    }
  }
}
