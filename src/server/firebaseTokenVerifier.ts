import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  extractBearerToken,
  isAdminEmail,
  parseExtraAdminEmails
} from '../data/adminAccess.ts';

export interface VerifiedFirebaseUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  isAdmin: boolean;
}

const GOOGLE_SECURETOKEN_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

interface CertCacheState {
  certs: Record<string, string>;
  expiresAtMs: number;
}

let certCache: CertCacheState = {
  certs: {},
  expiresAtMs: 0
};

let cachedProjectConfig: { projectId: string; apiKey: string } | null = null;

export function getFirebaseProjectConfigFromDisk(): { projectId: string; apiKey: string } {
  if (cachedProjectConfig) return cachedProjectConfig;
  try {
    const cfgPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(cfgPath)) {
      const parsed = JSON.parse(fs.readFileSync(cfgPath, 'utf8')) as {
        projectId?: string;
        apiKey?: string;
      };
      cachedProjectConfig = {
        projectId: String(parsed.projectId || '').trim(),
        apiKey: String(parsed.apiKey || '').trim()
      };
      return cachedProjectConfig;
    }
  } catch {
    // Fallback to empty config below
  }
  return { projectId: '', apiKey: '' };
}

function decodeBase64UrlToBuffer(segment: string): Buffer | null {
  if (!segment || !/^[A-Za-z0-9\-_]+$/.test(segment)) return null;
  const padLen = (4 - (segment.length % 4)) % 4;
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padLen);
  try {
    return Buffer.from(padded, 'base64');
  } catch {
    return null;
  }
}

function decodeBase64UrlJson<T>(segment: string): T | null {
  const buf = decodeBase64UrlToBuffer(segment);
  if (!buf) return null;
  try {
    const parsed = JSON.parse(buf.toString('utf8')) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as T) : null;
  } catch {
    return null;
  }
}

export function verifyFirebaseIdTokenSignature(
  token: string,
  expectedProjectId: string,
  publicKeysByKid: Record<string, string>,
  nowSec = Math.floor(Date.now() / 1000),
  extraAdminEmails: readonly string[] = []
): VerifiedFirebaseUser | null {
  if (!token || !expectedProjectId) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, sigB64] = parts;
  const header = decodeBase64UrlJson<{ alg?: unknown; kid?: unknown }>(headerB64);
  const payload = decodeBase64UrlJson<{
    aud?: unknown;
    iss?: unknown;
    sub?: unknown;
    exp?: unknown;
    iat?: unknown;
    auth_time?: unknown;
    email?: unknown;
    email_verified?: unknown;
  }>(payloadB64);

  if (!header || !payload) return null;
  if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid) {
    return null;
  }

  const keyPem = publicKeysByKid[header.kid];
  if (!keyPem || typeof keyPem !== 'string') {
    return null;
  }

  const expectedIssuer = `https://securetoken.google.com/${expectedProjectId}`;
  if (payload.aud !== expectedProjectId || payload.iss !== expectedIssuer) {
    return null;
  }

  if (typeof payload.sub !== 'string' || !payload.sub.trim() || payload.sub.length > 128) {
    return null;
  }

  const exp = Number(payload.exp);
  const iat = Number(payload.iat);
  const authTime = payload.auth_time !== undefined ? Number(payload.auth_time) : iat;

  if (!Number.isFinite(exp) || exp <= nowSec) return null;
  if (!Number.isFinite(iat) || iat > nowSec + 300) return null;
  if (!Number.isFinite(authTime) || authTime > nowSec + 300) return null;

  const sigBuf = decodeBase64UrlToBuffer(sigB64);
  if (!sigBuf) return null;

  try {
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${headerB64}.${payloadB64}`);
    verifier.end();
    if (!verifier.verify(keyPem, sigBuf)) {
      return null;
    }
  } catch {
    return null;
  }

  const email = typeof payload.email === 'string' && payload.email.trim() ? payload.email.trim() : null;
  const emailVerified = payload.email_verified === true;
  const isAdmin = isAdminEmail(email, emailVerified, extraAdminEmails);

  return {
    uid: payload.sub.trim(),
    email,
    emailVerified,
    isAdmin
  };
}

function parseMaxAgeSeconds(cacheControl: string | null): number {
  if (!cacheControl) return 300;
  const match = /max-age=(\d+)/i.exec(cacheControl);
  const sec = match ? Number(match[1]) : 300;
  return Number.isFinite(sec) && sec > 0 ? Math.min(sec, 21600) : 300;
}

async function fetchGoogleSecureTokenCerts(forceRefresh = false): Promise<Record<string, string>> {
  const now = Date.now();
  if (!forceRefresh && now < certCache.expiresAtMs && Object.keys(certCache.certs).length > 0) {
    return certCache.certs;
  }

  const response = await fetch(GOOGLE_SECURETOKEN_CERTS_URL, {
    signal: AbortSignal.timeout(5000)
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch Google public certs (HTTP ${response.status})`);
  }

  const certs = (await response.json()) as Record<string, string>;
  const maxAgeSec = parseMaxAgeSeconds(response.headers.get('cache-control'));
  certCache = {
    certs: certs && typeof certs === 'object' ? certs : {},
    expiresAtMs: Date.now() + maxAgeSec * 1000
  };
  return certCache.certs;
}

async function lookupViaIdentityToolkit(
  idToken: string,
  apiKey: string,
  extraAdminEmails: readonly string[]
): Promise<VerifiedFirebaseUser | null> {
  if (!apiKey) return null;
  try {
    const resp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
        signal: AbortSignal.timeout(5000)
      }
    );
    if (!resp.ok) return null;
    const data = (await resp.json()) as {
      users?: Array<{
        localId?: string;
        email?: string;
        emailVerified?: boolean;
      }>;
    };
    const u = data?.users?.[0];
    if (!u || typeof u.localId !== 'string' || !u.localId) return null;
    const email = typeof u.email === 'string' && u.email.trim() ? u.email.trim() : null;
    const emailVerified = u.emailVerified === true;
    return {
      uid: u.localId,
      email,
      emailVerified,
      isAdmin: isAdminEmail(email, emailVerified, extraAdminEmails)
    };
  } catch {
    return null;
  }
}

export async function verifyFirebaseBearerToken(
  authorizationHeader: string | string[] | null | undefined,
  overrideProjectId?: string
): Promise<VerifiedFirebaseUser | null> {
  const token = extractBearerToken(authorizationHeader);
  if (!token) return null;

  const cfg = getFirebaseProjectConfigFromDisk();
  const projectId = (overrideProjectId || cfg.projectId || '').trim();
  if (!projectId) return null;

  const extraAdmins = parseExtraAdminEmails(process.env.ADMIN_EMAILS);

  try {
    let certs = await fetchGoogleSecureTokenCerts(false);
    const parts = token.split('.');
    const header = parts.length === 3 ? decodeBase64UrlJson<{ kid?: unknown }>(parts[0]) : null;
    if (header && typeof header.kid === 'string' && !certs[header.kid]) {
      certs = await fetchGoogleSecureTokenCerts(true);
    }
    const verified = verifyFirebaseIdTokenSignature(
      token,
      projectId,
      certs,
      Math.floor(Date.now() / 1000),
      extraAdmins
    );
    if (verified) return verified;
    return null;
  } catch {
    return lookupViaIdentityToolkit(token, cfg.apiKey, extraAdmins);
  }
}
