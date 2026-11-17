import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { RouteConfig, SecureRequestContext, SecureSession, UserRole } from './types';
import { isIpBlocked, recordAuthFailure } from './abuseDetector';
import { verifyLuthSession, setVerifiedPrincipal } from '../luthSession';
import { getAccountTrustState, isTrustLevelSufficient, getTrustRateMultiplier } from './progressiveTrust';
import { checkRateLimit } from './rateLimiter';
import { acquireConcurrencySlot, releaseConcurrencySlot, executeWithTimeout } from './resourceBudget';
import { applySecurityHeaders } from './securityHeaders';
import { handleSecureApiError } from './errorHandler';
import { query } from '../db';

export function createSecureRoute<TBody = any>(config: RouteConfig<TBody>) {
  return async (req: Request, res: Response, _next?: NextFunction): Promise<void> => {
    const requestId = (req.headers['x-request-id'] as string) || `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const clientIp = (req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1') as string;
    const userAgent = (req.headers['user-agent'] as string) || 'unknown';

    applySecurityHeaders(res, requestId);

    // Gate 0: IP Blocklist & Abuse Anomaly Check
    const ipCheck = isIpBlocked(clientIp);
    if (ipCheck.blocked) {
      res.setHeader('Retry-After', String(ipCheck.retryAfterSeconds || 900));
      res.status(403).json({
        success: false,
        error: `Access temporarily blocked due to automated abuse detection: ${ipCheck.reason || 'IP_BLOCKED'}`,
        requestId,
      });
      return;
    }

    // Gate 1: Request Validation (Method, Content-Type, Body Size)
    if (config.method && req.method.toUpperCase() !== config.method.toUpperCase()) {
      res.setHeader('Allow', config.method);
      res.status(405).json({ success: false, error: `Method ${req.method} not allowed. Expected ${config.method}`, requestId });
      return;
    }

    const isMutation = ['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase());
    if (isMutation && req.headers['content-type'] && !req.is('application/json') && !req.is('multipart/form-data')) {
      res.status(415).json({ success: false, error: 'Unsupported Media Type: expected application/json', requestId });
      return;
    }

    const maxBodyBytes = config.limits?.maxBodySize || 10 * 1024 * 1024;
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > maxBodyBytes) {
      res.status(413).json({ success: false, error: `Payload too large. Exceeds limit of ${maxBodyBytes} bytes.`, requestId });
      return;
    }

    // Gate 2: Authentication & Session Status
    let session: SecureSession | null = null;
    const isPublic = Boolean(config.public);

    if (!isPublic) {
      const authorization = req.headers.authorization;
      const verified = authorization ? await verifyLuthSession(authorization) : null;
      if (!verified) {
        recordAuthFailure(clientIp);
        res.status(401).json({ success: false, error: 'Missing, invalid, or expired Luth session', requestId });
        return;
      }

      // Identity comes only from Luth; application roles come only from SRKL policy data.
      let role: UserRole = 'user';
      try {
        const profile = await query('SELECT role FROM "srkl_application_profiles" WHERE id = $1 LIMIT 1', [verified.user.id]);
        if (profile.rows[0]?.role === 'admin') role = 'admin';
        else if (profile.rows[0]?.role === 'system') role = 'system';
      } catch {}
      setVerifiedPrincipal(req, { ...verified.user, role });
      const trustState = getAccountTrustState(verified.user.id);
      if (trustState.suspended) {
        res.status(403).json({ success: false, error: 'Account suspended due to policy violations', requestId });
        return;
      }
      session = {
        userId: verified.user.id,
        accountId: verified.user.id,
        role,
        trustLevel: verified.user.emailVerified && trustState.trustLevel === 'T0_UNVERIFIED' ? 'T1_EMAIL_VERIFIED' : trustState.trustLevel,
        emailVerified: verified.user.emailVerified === true,
        status: 'ACTIVE',
      };
    }

    // Gate 3: Role Authorization, Progressive Trust & Email Verification
    if (session && config.auth && typeof config.auth === 'object' && config.auth.role) {
      if (session.role !== config.auth.role && session.role !== 'admin') {
        res.status(403).json({ success: false, error: `Forbidden: requires role '${config.auth.role}'`, requestId });
        return;
      }
    }

    if (session && config.minimumTrustLevel) {
      if (!isTrustLevelSufficient(session.trustLevel || 'T0_UNVERIFIED', config.minimumTrustLevel)) {
        res.status(403).json({
          success: false,
          error: `Action requires minimum trust level ${config.minimumTrustLevel} (current: ${session.trustLevel || 'T0_UNVERIFIED'})`,
          requestId,
        });
        return;
      }
    }

    if (session && config.emailVerificationRequired && !session.emailVerified) {
      res.status(403).json({ success: false, error: 'Email verification required before accessing this resource', requestId });
      return;
    }

    // Gate 4: Rate Limiting
    const rateLimitKey = session ? `user:${session.userId}:${config.id}` : `ip:${clientIp}:${config.id}`;
    const multiplier = session ? getTrustRateMultiplier(session.trustLevel || 'T0_UNVERIFIED', session.accountId) : 1.0;
    const rateCheck = checkRateLimit(rateLimitKey, config.rateLimit, multiplier);

    res.setHeader('X-RateLimit-Limit', String(rateCheck.limit));
    res.setHeader('X-RateLimit-Remaining', String(rateCheck.remaining));
    res.setHeader('X-RateLimit-Reset', String(rateCheck.resetTimeMs));

    if (!rateCheck.allowed) {
      res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
      res.status(429).json({ success: false, error: `Rate limit exceeded. Retry in ${rateCheck.retryAfterSeconds}s`, requestId });
      return;
    }

    // Gate 5: Concurrency Limits & Execution Timeout
    const concurrencyKey = session ? `user:${session.userId}` : `ip:${clientIp}`;
    const maxConcurrency = config.limits?.maxConcurrency || 25;
    if (!acquireConcurrencySlot(concurrencyKey, maxConcurrency)) {
      res.setHeader('Retry-After', '2');
      res.status(429).json({ success: false, error: 'Concurrency slot exhausted. Please slow down requests.', requestId });
      return;
    }

    const timeoutMs = config.limits?.maxExecutionMs || 15000;
    const ctx: SecureRequestContext<TBody> = {
      session,
      requestId,
      ip: clientIp,
      userAgent,
      body: req.body,
      query: req.query as Record<string, any>,
      params: req.params as Record<string, any>,
      isPublic,
    };

    try {
      // Gate 6: Application Logic
      await executeWithTimeout(async () => {
        await config.handler(req, ctx, res);
      }, timeoutMs, config.id);
    } catch (err) {
      // Gate 7: Sanitized Error Handling
      handleSecureApiError(err, res, config.id, requestId);
    } finally {
      releaseConcurrencySlot(concurrencyKey);
    }
  };
}
