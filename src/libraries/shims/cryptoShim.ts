/**
 * Browser-safe crypto shim for Vite frontend bundle.
 */
export const randomUUID = (): string => {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const getRandomValues = <T extends ArrayBufferView | null>(array: T): T => {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues && array) {
    return globalThis.crypto.getRandomValues(array);
  }
  return array;
};

export default {
  randomUUID,
  getRandomValues,
};
