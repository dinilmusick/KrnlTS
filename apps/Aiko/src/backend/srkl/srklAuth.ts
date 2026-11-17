export type LuthPrincipal = { id?: unknown } | null | undefined;
export type LuthPrincipalResolver = (token: string) => Promise<LuthPrincipal>;

/** Resolve an application identity exclusively from a canonical Bearer session. */
export async function resolveLuthUserId(
  authorizationHeader: unknown,
  resolvePrincipal: LuthPrincipalResolver,
): Promise<string> {
  const authorization = typeof authorizationHeader === 'string' ? authorizationHeader.trim() : '';
  const match = /^Bearer\s+([^\s]+)$/i.exec(authorization);
  if (!match) return '';

  const principal = await resolvePrincipal(match[1]);
  return typeof principal?.id === 'string' && principal.id.trim() ? principal.id.trim() : '';
}
