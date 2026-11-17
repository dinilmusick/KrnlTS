import type { IncomingMessage, ServerResponse } from 'node:http';
import { dispatchNodeRequest } from './nodeRequestAdapter.js';
import { fetchHandler } from '../backend/adapters/httpsAdapter.js';

export const config = { api: { bodyParser: false } };

export default function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  return dispatchNodeRequest(request, response, fetchHandler, process.env);
}
