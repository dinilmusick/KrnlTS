import { SkipoBase } from '@kloks/functions/base';
import { RouteConfig } from './types.js';

export abstract class BaseApiRoute extends SkipoBase {
  protected config: RouteConfig;

  constructor(config: RouteConfig = {}) {
    super({ name: 'BaseApiRoute' });
    this.config = config;
  }

  abstract handle(req: Request): Promise<Response>;

  protected success<T>(data: T, status = 200): Response {
    return new Response(JSON.stringify({ data, status }), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  protected error(message: string, status = 400): Response {
    return new Response(JSON.stringify({ error: message, status }), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
