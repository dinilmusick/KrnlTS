/**
 * @file auth.ts
 * @description Compatibility proxy to the canonical Luth authentication authority.
 * SRKL MUST NOT verify credentials, create users, mint tokens, or issue sessions.
 */
import express, { Request, Response } from 'express';
import { DEFAULT_LUTH_URL } from '@ultrst-armada/kloks/auth';

const router = express.Router();

router.all('*', async (req: Request, res: Response): Promise<void> => {
  try {
    const headers: Record<string, string> = { 'x-app-id': 'srkl' };
    for (const name of ['authorization', 'cookie', 'content-type', 'origin', 'user-agent']) {
      const value = req.headers[name];
      if (typeof value === 'string') headers[name] = value;
    }

    const init: RequestInit = { method: req.method, headers, redirect: 'manual' };
    if (!['GET', 'HEAD'].includes(req.method)) init.body = JSON.stringify(req.body ?? {});
    const upstream = await fetch(`${DEFAULT_LUTH_URL}${req.originalUrl}`, init);

    for (const name of ['content-type', 'location', 'set-auth-token', 'cache-control']) {
      const value = upstream.headers.get(name);
      if (value) res.setHeader(name, value);
    }
    const cookies = (upstream.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.();
    if (cookies?.length) res.setHeader('set-cookie', cookies);
    else {
      const cookie = upstream.headers.get('set-cookie');
      if (cookie) res.setHeader('set-cookie', cookie);
    }
    res.status(upstream.status).send(Buffer.from(await upstream.arrayBuffer()));
  } catch (error) {
    console.warn('[SRKL] Luth auth proxy failed:', error);
    res.status(503).json({ error: 'Canonical Luth authentication service unavailable.' });
  }
});

export default router;
