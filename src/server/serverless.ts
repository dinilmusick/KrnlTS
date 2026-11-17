import { Request, Response } from 'express';

let cachedApp: any = null;

export default async function handler(req: Request, res: Response) {
  try {
    if (!cachedApp) {
      const { createApp } = await import('./AppFactory');
      cachedApp = await createApp();
    }
    return cachedApp(req, res);
  } catch (err: unknown) {
    console.error('Serverless Handler Error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    if (!res.headersSent) {
      res.status(500).json({ error: `Serverless Initialization Error: ${msg}` });
    }
  }
}
