/**
 * @file K_LIB_Krnl_Frontend_Bridge_Bundle.ts
 * @description Browser-compatible KrnlBridge class for frontend subapps to communicate with KrnlTS backend.
 */

export class KrnlBridge {
  wsUrl: string;
  httpUrl: string;
  ws: WebSocket | null = null;
  listeners: Map<string, Set<Function>> = new Map();
  renderId: string | null = null;
  role: string = 'frontend';
  reconnectAttempts: number = 0;
  maxReconnectAttempts: number = 10;
  reconnectTimeout: any = null;

  constructor(wsUrl: string, httpUrl: string) {
    // Ensure correct protocols and URLs
    this.wsUrl = wsUrl;
    this.httpUrl = httpUrl;
  }

  static async createFromConfig(basePath: string = ''): Promise<KrnlBridge> {
    const normalized = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    const res = await fetch(`${normalized}/__krnl/config`);
    if (!res.ok) {
      throw new Error(`Failed to load __krnl/config: ${res.statusText}`);
    }
    const config = await res.json();
    return new KrnlBridge(config.wsUrl, config.httpUrl);
  }

  connect(renderId: string, role: 'frontend' | 'backend' = 'frontend'): Promise<void> {
    this.renderId = renderId;
    this.role = role;

    return new Promise((resolve, reject) => {
      if (this.ws) {
        this.ws.close();
      }

      console.log(`[KrnlBridge] Connecting WebSocket to ${this.wsUrl}...`);
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log(`[KrnlBridge] WebSocket connected. Subscribing to renderId: ${renderId} as ${role}`);
        this.reconnectAttempts = 0;
        this.send({ type: 'subscribe', renderId, role });
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const handlers = this.listeners.get(msg.type);
          if (handlers) {
            handlers.forEach((fn) => fn(msg));
          }
        } catch (e: any) {
          console.error('[KrnlBridge] Error parsing WS message:', e.message);
        }
      };

      this.ws.onclose = () => {
        console.log('[KrnlBridge] WebSocket closed.');
        this._handleReconnect();
      };

      this.ws.onerror = (err) => {
        console.error('[KrnlBridge] WebSocket error:', err);
        reject(err);
      };
    });
  }

  _handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[KrnlBridge] Max WS reconnect attempts reached.');
      return;
    }

    clearTimeout(this.reconnectTimeout);
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    console.log(`[KrnlBridge] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    this.reconnectTimeout = setTimeout(() => {
      if (this.renderId) {
        this.connect(this.renderId, this.role as any).catch(() => {});
      }
    }, delay);
  }

  send(message: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[KrnlBridge] Cannot send message: WebSocket is not open.');
      return;
    }
    this.ws.send(JSON.stringify(message));
  }

  disconnect() {
    clearTimeout(this.reconnectTimeout);
    this.renderId = null;
    if (this.ws) {
      this.ws.onclose = null; // prevent reconnect on explicit close
      this.ws.close();
      this.ws = null;
    }
  }

  async call(fid: string, data: any = {}): Promise<any> {
    const res = await fetch(`${this.httpUrl}/call/${fid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.status === 'error') {
      throw new Error(json.message);
    }
    return json;
  }

  on(event: string, fn: (msg: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(fn);

    return () => {
      const handlers = this.listeners.get(event);
      if (handlers) {
        handlers.delete(fn);
      }
    };
  }

  stream(fid: string, fn: (data: any) => void): () => void {
    console.log(`[KrnlBridge] Opening EventSource stream to /sse/${fid}...`);
    const es = new EventSource(`${this.httpUrl}/sse/${fid}`);

    es.onmessage = (event) => {
      if (event.data === ': keepalive') return;
      try {
        const data = JSON.parse(event.data);
        fn(data);
      } catch (e) {
        // Just raw data or keep-alive check
      }
    };

    es.onerror = (err) => {
      console.error(`[KrnlBridge] EventSource stream error on ${fid}:`, err);
    };

    return () => {
      console.log(`[KrnlBridge] Closing EventSource stream to /sse/${fid}`);
      es.close();
    };
  }
}

if (typeof window !== 'undefined') {
  (window as any).KrnlBridge = KrnlBridge;
}
