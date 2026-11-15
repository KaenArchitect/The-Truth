export const PRIMARY_ADMIN_EMAIL = 'bardazon@gmail.com';

export function normalizeAdminEmail(email: string | null | undefined): string {
  return String(email || '').trim().toLowerCase();
}

export function isAdminEmail(
  email: string | null | undefined,
  emailVerified: boolean | null | undefined,
  extraAdminEmails: readonly string[] = []
): boolean {
  if (emailVerified !== true) return false;
  const normalized = normalizeAdminEmail(email);
  if (!normalized) return false;
  if (normalized === PRIMARY_ADMIN_EMAIL) return true;
  for (const extra of extraAdminEmails) {
    const cleanExtra = normalizeAdminEmail(extra);
    if (cleanExtra && normalized === cleanExtra) {
      return true;
    }
  }
  return false;
}

export function parseExtraAdminEmails(rawEnv: string | null | undefined): string[] {
  return String(rawEnv || '')
    .split(',')
    .map((entry) => normalizeAdminEmail(entry))
    .filter(Boolean);
}

export function extractBearerToken(authorizationHeader: string | string[] | null | undefined): string | null {
  const raw = Array.isArray(authorizationHeader)
    ? authorizationHeader[0]
    : authorizationHeader;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  const match = /^Bearer\s+([A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+)$/i.exec(trimmed);
  return match ? match[1] : null;
}
