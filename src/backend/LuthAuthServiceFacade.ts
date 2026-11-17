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
  async execute<TInput = unknown, TOutput = unknown>(operation: string, input?: TInput): Promise<TOutput> {
    const request = (input as { request?: Request } | undefined)?.request;
    if (!(request instanceof Request)) {
      throw new Error(`Luth auth operation '${operation}' requires input.request to be a Web Request.`);
    }
    let result: unknown;
    switch (operation) {
      case 'getSession':
        result = await getLuthSession(request);
        break;
      case 'getCurrentUser':
        result = (await getLuthSession(request))?.user ?? null;
        break;
      case 'proxyRequest':
        result = await proxyLuthAuthRequest(request);
        break;
      default:
        throw new Error(`Unsupported Luth auth operation: ${operation}`);
    }
    return result as TOutput;
  },
};

export default LuthAuthServiceFacade;
