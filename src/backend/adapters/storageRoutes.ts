import { StorageServiceFacade } from '@ultrst-armada/kloks/backend/krnl-services';
import { jsonRes, parseBody } from './httpResponse.js';

export async function handleStorageRoutes(request: Request, storageRoute: string, userId: string, envForServices: Record<string, unknown>): Promise<Response | undefined> {
  const { method } = request;
  const storageOperations: Record<string, string> = {
    '/api/storage/providers': 'getProviderCapabilities',
    '/api/storage/connections': 'getConnections',
  };
  if ((method === 'GET') && storageOperations[storageRoute]) {
    try {
      const operation = storageOperations[storageRoute];
      const result = await StorageServiceFacade.execute(operation, {
        ...(operation === 'getConnections' ? { userId } : {}),
        env: envForServices,
      });
      return jsonRes(request, operation === 'getConnections'
        ? { success: true, connections: result }
        : { success: true, providers: result });
    } catch (error) {
      return jsonRes(request, {
        success: false,
        error: error instanceof Error ? error.message : 'Storage service unavailable.',
      }, 503);
    }
  }

  if (storageRoute === '/api/storage/connections/backblaze/test' && method === 'POST') {
    const body = await parseBody(request) as any;
    try {
      const result = await StorageServiceFacade.execute('testBackblazeCredentials', {
        keyId: body.keyId,
        applicationKey: body.applicationKey,
        env: envForServices,
      });
      return jsonRes(request, result, (result as any)?.success ? 200 : 400);
    } catch (error) {
      return jsonRes(request, {
        success: false,
        buckets: [],
        error: error instanceof Error ? error.message : 'Backblaze credential validation failed.',
      }, 400);
    }
  }

  if (storageRoute === '/api/storage/connections/backblaze' && method === 'POST') {
    const body = await parseBody(request) as any;
    try {
      const connection = await StorageServiceFacade.execute('createBackblazeConnection', {
        userId,
        label: body.label,
        keyId: body.keyId,
        applicationKey: body.applicationKey,
        bucketName: body.bucketName,
        region: body.region,
        endpoint: body.endpoint,
        env: envForServices,
      });
      return jsonRes(request, { success: true, connection }, 201);
    } catch (error) {
      return jsonRes(request, {
        success: false,
        error: error instanceof Error ? error.message : 'Unable to create Backblaze storage connection.',
      }, 400);
    }
  }

  if (storageRoute === '/api/storage/connections/backblaze/buckets' && method === 'POST') {
    const body = await parseBody(request) as any;
    try {
      const buckets = await StorageServiceFacade.execute('listBackblazeConnectionBuckets', {
        userId,
        connectionId: body.connectionId,
        env: envForServices,
      });
      return jsonRes(request, { success: true, buckets });
    } catch (error) {
      return jsonRes(request, {
        success: false,
        buckets: [],
        error: error instanceof Error ? error.message : 'Unable to list Backblaze buckets.',
      }, 400);
    }
  }
}
