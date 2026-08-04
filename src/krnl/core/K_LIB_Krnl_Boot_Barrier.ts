export class KrnlBootBarrier {
  private _phase1Complete = false;
  private _resolve!: () => void;
  readonly promise: Promise<void> = new Promise((r) => (this._resolve = r));

  /**
   * Signals that Phase 1 (developer boot / addLocal registration) has completed.
   */
  signalPhase1Complete(): void {
    if (!this._phase1Complete) {
      this._phase1Complete = true;
      this._resolve();
    }
  }

  /**
   * Awaited by the magnetic loader before scanning and generating components.
   */
  waitForPhase1(): Promise<void> {
    return this.promise;
  }
}
