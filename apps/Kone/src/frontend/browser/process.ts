export const env: Record<string, string | undefined> = {
  NODE_ENV: 'development',
};

const processShim = {
  env,
  browser: true,
  nextTick(callback: (...args: unknown[]) => void, ...args: unknown[]) {
    queueMicrotask(() => callback(...args));
  },
};

export default processShim;
