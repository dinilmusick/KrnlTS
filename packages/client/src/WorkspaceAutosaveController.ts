export interface WorkspaceAutosaveOptions {
  intervalMs?: number;
  enabled?: boolean;
  save: () => Promise<void>;
}

export class WorkspaceAutosaveController {
  private readonly intervalMs: number;
  private readonly save: () => Promise<void>;
  private timer?: ReturnType<typeof setInterval>;
  private saving = false;
  private enabled: boolean;

  constructor(options: WorkspaceAutosaveOptions) {
    this.intervalMs = Math.max(options.intervalMs ?? 60_000, 5_000);
    this.save = options.save;
    this.enabled = options.enabled ?? true;
  }

  start(): void {
    this.stop();
    if (!this.enabled || typeof window === 'undefined') return;
    this.timer = setInterval(() => { void this.saveOnce(); }, this.intervalMs);
    window.addEventListener('visibilitychange', this.handleLifecycle);
    window.addEventListener('pagehide', this.handleLifecycle);
    window.addEventListener('blur', this.handleLifecycle);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    if (typeof window !== 'undefined') {
      window.removeEventListener('visibilitychange', this.handleLifecycle);
      window.removeEventListener('pagehide', this.handleLifecycle);
      window.removeEventListener('blur', this.handleLifecycle);
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (enabled) this.start(); else this.stop();
  }

  async saveNow(): Promise<void> {
    if (!this.enabled) return;
    await this.saveOnce();
  }

  private handleLifecycle = (): void => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') return;
    void this.saveOnce();
  };

  private async saveOnce(): Promise<void> {
    if (!this.enabled || this.saving) return;
    this.saving = true;
    try {
      await this.save();
    } finally {
      this.saving = false;
    }
  }
}
