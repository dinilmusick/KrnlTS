import { Response } from 'express';

export function handleSecureApiError(err: unknown, res: Response, routeId: string, requestId: string): void {
  const isErr = err instanceof Error;
  const rawMessage = isErr ? err.message : String(err);
  console.error(`[API INTERNAL ERROR] [${new Date().toISOString()}] [ReqID: ${requestId}] [Route: ${routeId}]\n`, err);

  let statusCode = 500;
  let publicMessage = 'An internal server error occurred.';

  if (rawMessage.includes('INVALID_REFRESH_TOKEN') || rawMessage.includes('REFRESH_TOKEN_EXPIRED')) {
    statusCode = 401;
    publicMessage = rawMessage;
  } else if (rawMessage.includes('SECURITY_ALERT_REFRESH_TOKEN_REUSE')) {
    statusCode = 401;
    publicMessage = 'Access denied: Token theft detected. Session revoked.';
  } else if (rawMessage.includes('RESEND_RATE_LIMIT_EXCEEDED')) {
    statusCode = 429;
    publicMessage = rawMessage;
  } else if (rawMessage.includes('INVALID_TOKEN') || rawMessage.includes('TOKEN_EXPIRED') || rawMessage.includes('TOKEN_ALREADY_USED')) {
    statusCode = 400;
    publicMessage = rawMessage;
  } else if (rawMessage.includes('EXECUTION_TIMEOUT')) {
    statusCode = 504;
    publicMessage = 'Operation timed out.';
  }

  if (!res.headersSent) {
    res.status(statusCode).json({
      success: false,
      error: publicMessage,
      requestId,
    });
  }
}
