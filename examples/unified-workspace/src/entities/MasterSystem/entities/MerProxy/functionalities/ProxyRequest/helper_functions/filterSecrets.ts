import { ProxyConcepts } from '../../../../../../../libraries/ProxyConcepts.js';

export function filterSecrets(payload: any): any {
  return ProxyConcepts.sanitizePayload(payload);
}
