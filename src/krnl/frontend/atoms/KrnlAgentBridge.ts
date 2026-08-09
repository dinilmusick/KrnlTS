/**
 * @file KrnlAgentBridge.ts
 * @description In-browser UI Agent Bridge and WebSocket relay for KrnlTS applications.
 */

export interface KrnlComponentState {
  fid: string;
  formData: Record<string, any>;
  response: any;
  loading: boolean;
  error: string | null;
  lastUpdated: number;
}

export interface KrnlComponentRegistration {
  trigger: (overrideInput?: Record<string, any>, ticketId?: string) => Promise<any>;
}

export class KrnlAgentBridgeManager {
  private states = new Map<string, KrnlComponentState>();
  private registrations = new Map<string, KrnlComponentRegistration>();
  private listeners = new Set<(snapshot: Record<string, KrnlComponentState>) => void>();
  private ws: WebSocket | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      (window as any).__krnlBridge = this;
      this.initWebSocket();
    }
  }

  private initWebSocket() {
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/agent/ws`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.sendFullSnapshot();
        this.sendReadySignal();
      };

      this.ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.action === 'trigger' && msg.fid) {
            await this.trigger(msg.fid, msg.input, msg.ticketId);
          } else if (msg.action === 'query') {
            this.sendFullSnapshot();
            this.sendReadySignal();
          }
        } catch (e) {
          console.error('[KrnlAgentBridge] Error handling WS message:', e);
        }
      };

      this.ws.onclose = () => {
        this.ws = null;
        setTimeout(() => this.initWebSocket(), 2000);
      };

      this.ws.onerror = () => {
        if (this.ws) {
          this.ws.close();
        }
      };
    } catch (e) {
      console.warn('[KrnlAgentBridge] WebSocket connection error:', e);
    }
  }

  public register(fid: string, reg: KrnlComponentRegistration) {
    this.registrations.set(fid, reg);
    this.sendComponentReady(fid);
  }

  public unregister(fid: string) {
    this.registrations.delete(fid);
    this.sendComponentUnready(fid);
  }

  public setState(fid: string, state: KrnlComponentState) {
    this.states.set(fid, state);
    this.notifyListeners();
    this.sendFullSnapshot();
  }

  public getState(fid?: string): Record<string, KrnlComponentState> | KrnlComponentState | null {
    if (fid) {
      return this.states.get(fid) || null;
    }
    return Object.fromEntries(this.states.entries());
  }

  public async trigger(fid: string, overrideInput?: Record<string, any>, ticketId?: string): Promise<any> {
    const reg = this.registrations.get(fid);
    if (!reg) {
      if (ticketId) {
        this.sendJobComplete(ticketId, fid, null, `[KrnlAgentBridge] Component '${fid}' is not mounted.`);
      }
      throw new Error(`[KrnlAgentBridge] Endpoint component '${fid}' is not mounted in the UI.`);
    }
    return await reg.trigger(overrideInput, ticketId);
  }

  public sendJobComplete(ticketId: string, fid: string, result?: any, error?: string) {
    const payload = {
      type: 'job_complete',
      ticketId,
      fid,
      result: result !== undefined ? result : null,
      error: error || null
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
      return;
    }

    if (typeof window !== 'undefined') {
      const sendHttpAck = (attempt = 0) => {
        fetch('/agent/job_complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketId,
            fid,
            result: result !== undefined ? result : null,
            error: error || null
          })
        }).catch((err) => {
          console.error('[KrnlAgentBridge] Failed to post job_complete ACK (attempt ' + (attempt + 1) + '):', err);
          if (attempt < 2) {
            setTimeout(() => sendHttpAck(attempt + 1), 500);
          }
        });
      };
      sendHttpAck();
    }
  }

  public subscribe(listener: (snapshot: Record<string, KrnlComponentState>) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    const snapshot = Object.fromEntries(this.states.entries());
    this.listeners.forEach((fn) => {
      try {
        fn(snapshot);
      } catch (e) {}
    });
  }

  private sendComponentReady(fid: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'component_ready', fid }));
    }
  }

  private sendComponentUnready(fid: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'component_unready', fid }));
    }
  }

  private sendReadySignal() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const fids = Array.from(this.registrations.keys());
      this.ws.send(JSON.stringify({ type: 'component_ready_all', fids }));
    }
  }

  private sendFullSnapshot() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const snapshot = Object.fromEntries(this.states.entries());
      this.ws.send(JSON.stringify({ type: 'state', snapshot }));
    }
  }
}

export const KrnlAgentBridge = new KrnlAgentBridgeManager();
