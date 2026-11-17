const inFlightRequestsByKey = new Map<string, number>();

export function acquireConcurrencySlot(key: string, maxSlots = 20): boolean {
  const current = inFlightRequestsByKey.get(key) || 0;
  if (current >= maxSlots) return false;
  inFlightRequestsByKey.set(key, current + 1);
  return true;
}

export function releaseConcurrencySlot(key: string): void {
  const current = inFlightRequestsByKey.get(key) || 0;
  if (current <= 1) inFlightRequestsByKey.delete(key);
  else inFlightRequestsByKey.set(key, current - 1);
}

export async function executeWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs = 10000,
  label = 'Operation'
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let completed = false;

    const timer = setTimeout(() => {
      if (!completed) {
        completed = true;
        reject(new Error(`EXECUTION_TIMEOUT: ${label} exceeded execution budget of ${timeoutMs}ms`));
      }
    }, timeoutMs);

    fn()
      .then((val) => {
        if (!completed) {
          completed = true;
          clearTimeout(timer);
          resolve(val);
        }
      })
      .catch((err) => {
        if (!completed) {
          completed = true;
          clearTimeout(timer);
          reject(err);
        }
      });
  });
}
