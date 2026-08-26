import { AikoConcepts } from '../../../../../../libraries/AikoConcepts.js';

export function matchProvider(model: string, latency: number) {
  return AikoConcepts.scoreProvider(model, latency);
}
