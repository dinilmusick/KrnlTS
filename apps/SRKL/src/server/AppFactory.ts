/**
 * @file AppFactory.ts
 * @description Express Application Factory. Mounts all API routers, CORS, and Vite integration.
 * File size < 200 lines strictly.
 */

import express, { Request, Response, NextFunction } from 'express';
import { bootstrapDatabase } from './db';
import { query } from './db';
import { getTrustedOrigins } from './trustedOrigins';
import adminRouter from './routes/admin';
import authRouter from './routes/auth';
import backblazeRouter from './routes/backblaze';
import userProfileRouter from './routes/userProfile';
import servicesRouter from './routes/services';
import executionRouter from './routes/execution';
import groupsAndTabsRouter from './routes/groupsAndTabs';
import activityRouter from './routes/activity';
import telemetryRouter from './routes/telemetry';
import settingsRouter from './routes/settings';
import discoveryRouter from './routes/discovery';
import googleAiStudioRouter from './routes/googleAiStudio';
import googleDriveRouter from './routes/googleDrive';
import serviceHealthResourcesRouter from './routes/serviceHealthResources';
import workspacesRouter from './routes/workspaces';
import ecosystemRouter from './routes/ecosystem';
import { isIpBlocked, applySecurityHeaders } from './governance';
import { verifyLuthSession, setVerifiedPrincipal } from './luthSession';

export async function createApp(): Promise<express.Express> {
  await bootstrapDatabase();
  const deploymentUrl = process.env.APP_URL;
  if (deploymentUrl) {
    try {
      const { registerSrklDeployment } = await import('../backend/registry/SrklDeploymentRegistry');
      await registerSrklDeployment({}, deploymentUrl);
    } catch (err: any) {
      console.warn('[SRKL] Deployment registration note:', err?.message || err);
    }
  }
  const trustedOrigins = await getTrustedOrigins();
  const app = express();

  app.use((req: Request, res: Response, next: NextFunction) => {
    const clientIp = (req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1') as string;
    const ipCheck = isIpBlocked(clientIp);
    if (ipCheck.blocked) {
      res.setHeader('Retry-After', String(ipCheck.retryAfterSeconds || 900));
      res.status(403).json({ success: false, error: `Access temporarily blocked due to automated abuse detection: ${ipCheck.reason || 'IP_BLOCKED'}` });
      return;
    }
    applySecurityHeaders(res, (req.headers['x-request-id'] as string) || 'req-gateway');
    next();
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    const protocol = String(req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
    const requestOrigin = req.headers.host ? `${protocol}://${req.headers.host}` : '';
    if (origin && (trustedOrigins.includes(origin) || origin === requestOrigin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Expose-Headers', 'set-auth-token');
      res.header('Vary', 'Origin');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie, X-App-Id, X-Account-Id, X-Service-Id, X-Workspace-Id, X-Goog-Api-Key');
    if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
    next();
  });

  // Canonical Luth session bridge: consumer apps never authenticate locally.
  // The browser sends a Luth bearer session token; SRKL validates it against Luth
  // and materializes only the app-local profile required by SRKL's workspace APIs.
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    const isAuthProxy = req.path === '/api/auth' || req.path.startsWith('/api/auth/');
    const isSignedGoogleDriveCallback = req.path === '/api/workspaces/storage/google/callback';
    if (req.method === 'OPTIONS' || !req.path.startsWith('/api/') || isAuthProxy || isSignedGoogleDriveCallback) return next();
    const authorization = req.headers.authorization;
    if (!authorization) return res.status(401).json({ error: 'A verified Luth bearer session is required.' });
    try {
      const session = await verifyLuthSession(authorization);
      if (!session) return res.status(401).json({ error: 'Luth session is invalid or expired.' });

      // Identity and authorization travel only through the server-side verified principal.
      const profileResult = await query(
        `INSERT INTO "srkl_application_profiles" (id, email, username, name, role, app_profiles, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'user', '{}'::jsonb, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, updated_at = NOW()
         RETURNING role`,
        [session.user.id, session.user.email, session.user.email.split('@')[0], session.user.name],
      );
      // SRKL's app-local role is authorization metadata, not an identity claim.
      // It is loaded only from the existing server-side profile row.
      const role = profileResult.rows[0]?.role === 'admin' ? 'admin' : 'user';
      setVerifiedPrincipal(req, { ...session.user, role });
      next();
    } catch (error) {
      console.warn('[SRKL] Luth session bridge failed:', error);
      res.status(503).json({ error: 'Canonical Luth authentication service unavailable.' });
    }
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Canonical Luth compatibility proxy; SRKL owns no credential/session logic.
  app.use('/api/auth', authRouter);

  app.use('/health', serviceHealthResourcesRouter);
  app.use('/resources', serviceHealthResourcesRouter);
  app.use('/api/health', serviceHealthResourcesRouter);
  app.use('/api/resources', serviceHealthResourcesRouter);
  app.use('/api/google-ai-studio', serviceHealthResourcesRouter);

  app.use('/api/admin', adminRouter);
  app.use('/api/user', userProfileRouter);
  app.use('/api/backblaze', backblazeRouter);
  app.use('/api/google-ai-studio', googleAiStudioRouter);
  app.use('/api/workspaces/storage/google', googleDriveRouter);
  app.use('/api/services', serviceHealthResourcesRouter);
  app.use('/api/services', servicesRouter);
  app.use('/api/services', executionRouter);
  app.use('/api/services', groupsAndTabsRouter);
  app.use('/api/activity', activityRouter);
  app.use('/api/telemetry', telemetryRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/discovery', discoveryRouter);
  app.use('/api/spec', discoveryRouter);
  app.use('/api/workspaces', workspacesRouter);
  app.use('/api/ecosystem', ecosystemRouter);
  return app;
}
