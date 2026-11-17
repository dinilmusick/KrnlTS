import { getLuthSession, proxyLuthAuthRequest } from './auth/luthSession.js';

/** Provider-neutral auth facade backed exclusively by canonical Luth sessions. */
export const LuthAuthServiceFacade = {
  id: 'auth',
  name: 'Luth Authentication',
  version: '1.0.0',
  async getSession(request: Request) {
    return getLuthSession(request);
  },
  async getCurrentUser(request: Request) {
    const session = await getLuthSession(request);
    return session?.user ?? null;
  },
  async proxyRequest(request: Request) {
    return proxyLuthAuthRequest(request);
  },
};

export default LuthAuthServiceFacade;
