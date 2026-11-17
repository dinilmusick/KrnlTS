import { Request, Response } from 'express';

export type UserRole = 'admin' | 'user' | 'system';

export type TrustLevel =
  | 'T0_UNVERIFIED'
  | 'T1_EMAIL_VERIFIED'
  | 'T2_ESTABLISHED'
  | 'T3_TRUSTED'
  | 'T4_PRIVILEGED';

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DISABLED' | 'DELETED';


export type RateLimitTier =
  | 'CHEAP_READ'
  | 'NORMAL_MUTATION'
  | 'EXPENSIVE_OPERATION'
  | 'AUTHENTICATION';

export type RateLimitKeyStrategy = 'user' | 'ip' | 'user+route' | 'ip+route';

export interface RateLimitConfig {
  requests?: number;
  windowMs?: number;
  key?: RateLimitKeyStrategy;
  tier?: RateLimitTier;
}

export interface ResourceLimitsConfig {
  maxBodySize?: number;
  maxQuerySize?: number;
  maxParameterSize?: number;
  maxExecutionMs?: number;
  maxConcurrency?: number;
}

export interface SecureSession {
  userId: string;
  role: UserRole;
  accountId?: string;
  trustLevel?: TrustLevel;
  emailVerified?: boolean;
  status?: AccountStatus;
}

export interface SecureRequestContext<TBody = any> {
  session: SecureSession | null;
  requestId: string;
  ip: string;
  userAgent: string;
  body: TBody;
  query: Record<string, any>;
  params: Record<string, any>;
  isPublic: boolean;
}

export interface RouteConfig<TBody = any> {
  id: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  public?: boolean;
  auth?: boolean | { required?: boolean; role?: UserRole };
  minimumTrustLevel?: TrustLevel;
  emailVerificationRequired?: boolean;
  rateLimit?: RateLimitConfig;
  limits?: ResourceLimitsConfig;
  handler: (req: Request, ctx: SecureRequestContext<TBody>, res: Response) => Promise<any> | any;
}

export type AbuseAnomalyType =
  | '401_SPIKE'
  | '403_SPIKE'
  | '429_SPIKE'
  | 'REQUEST_RATE_SPIKE'
  | 'CONCURRENCY_SPIKE'
  | 'ERROR_SPIKE';

export type SecurityEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'RATE_LIMIT_EXCEEDED'
  | 'TRUST_CHANGED'
  | 'FEATURE_BLOCKED'
  | 'ACCOUNT_SUSPENDED'
  | 'IP_BLOCKED';
