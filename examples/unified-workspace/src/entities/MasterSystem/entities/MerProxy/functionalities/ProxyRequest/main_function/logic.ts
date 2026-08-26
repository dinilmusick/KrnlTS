import { ProxyRequestInput, ProxyRequestOutput } from '../ProxyRequestAtom.js';
import { filterSecrets } from '../helper_functions/filterSecrets.js';

export const main = async (input: ProxyRequestInput): Promise<ProxyRequestOutput> => {
  const sanitized = filterSecrets(input.payload || { data: 'test_payload' });

  return {
    proxied: true,
    targetSubApp: input.targetSubApp || 'OrderSubApp',
    sanitizedPayload: sanitized,
    timestamp: Date.now()
  };
};
