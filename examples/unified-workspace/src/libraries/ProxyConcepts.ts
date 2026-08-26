/**
 * @file ProxyConcepts.ts
 * @role component
 * @description Layer 0 Pure Mer Provider Proxy payload transformation library.
 */
export class ProxyConcepts {
  static sanitizePayload(payload: any): any {
    if (typeof payload === 'object' && payload !== null) {
      const copy = { ...payload };
      delete copy.apiKey;
      delete copy.secretToken;
      copy._proxyProcessedAt = Date.now();
      return copy;
    }
    return payload;
  }
}
