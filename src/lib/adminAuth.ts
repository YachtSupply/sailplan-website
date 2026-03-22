/**
 * Simple admin authentication for internal API endpoints.
 * Requires ADMIN_API_KEY environment variable to be set.
 */

export function verifyAdminAuth(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const apiKey = process.env.ADMIN_API_KEY;

  if (!apiKey) {
    console.warn('[admin] ADMIN_API_KEY not set — admin endpoints disabled');
    return false;
  }

  if (!authHeader) return false;

  const token = authHeader.replace(/^Bearer\s+/i, '');
  return token === apiKey;
}

export function unauthorizedResponse() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
