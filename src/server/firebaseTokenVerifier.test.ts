import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { verifyFirebaseIdTokenSignature } from './firebaseTokenVerifier.ts';

function toBase64Url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048
});
const publicPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
const PROJECT_ID = 'gen-lang-client-0582140506';
const KID = 'test-key-1';

function signTestJwt(
  payload: Record<string, unknown>,
  headerOverrides: Record<string, unknown> = {}
): string {
  const header = { alg: 'RS256', kid: KID, typ: 'JWT', ...headerOverrides };
  const h = toBase64Url(JSON.stringify(header));
  const p = toBase64Url(JSON.stringify(payload));
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(`${h}.${p}`);
  signer.end();
  const sig = signer.sign(privateKey);
  return `${h}.${p}.${toBase64Url(sig)}`;
}

test('verifyFirebaseIdTokenSignature grants isAdmin=true ONLY to verified bardazon@gmail.com', () => {
  const now = 1_760_000_000;
  const adminToken = signTestJwt({
    aud: PROJECT_ID,
    iss: `https://securetoken.google.com/${PROJECT_ID}`,
    sub: 'uid-admin-123',
    iat: now - 10,
    auth_time: now - 10,
    exp: now + 3600,
    email: 'Bardazon@gmail.com',
    email_verified: true
  });

  const res = verifyFirebaseIdTokenSignature(adminToken, PROJECT_ID, { [KID]: publicPem }, now);
  assert.deepEqual(res, {
    uid: 'uid-admin-123',
    email: 'Bardazon@gmail.com',
    emailVerified: true,
    isAdmin: true
  });
});

test('verifyFirebaseIdTokenSignature denies admin to non-admin or unverified email', () => {
  const now = 1_760_000_000;
  const unverifiedAdminToken = signTestJwt({
    aud: PROJECT_ID,
    iss: `https://securetoken.google.com/${PROJECT_ID}`,
    sub: 'uid-spoof',
    iat: now - 10,
    exp: now + 3600,
    email: 'bardazon@gmail.com',
    email_verified: false
  });
  const unverifiedRes = verifyFirebaseIdTokenSignature(
    unverifiedAdminToken,
    PROJECT_ID,
    { [KID]: publicPem },
    now
  );
  assert.equal(unverifiedRes?.isAdmin, false);

  const regularUserToken = signTestJwt({
    aud: PROJECT_ID,
    iss: `https://securetoken.google.com/${PROJECT_ID}`,
    sub: 'uid-regular',
    iat: now - 10,
    exp: now + 3600,
    email: 'someone@gmail.com',
    email_verified: true
  });
  const regularRes = verifyFirebaseIdTokenSignature(
    regularUserToken,
    PROJECT_ID,
    { [KID]: publicPem },
    now
  );
  assert.equal(regularRes?.uid, 'uid-regular');
  assert.equal(regularRes?.isAdmin, false);
});

test('verifyFirebaseIdTokenSignature rejects expired, wrong-aud, wrong-iss, and tampered tokens', () => {
  const now = 1_760_000_000;
  const expired = signTestJwt({
    aud: PROJECT_ID,
    iss: `https://securetoken.google.com/${PROJECT_ID}`,
    sub: 'uid-1',
    iat: now - 4000,
    exp: now - 1,
    email: 'bardazon@gmail.com',
    email_verified: true
  });
  assert.equal(verifyFirebaseIdTokenSignature(expired, PROJECT_ID, { [KID]: publicPem }, now), null);

  const wrongAud = signTestJwt({
    aud: 'other-project',
    iss: `https://securetoken.google.com/${PROJECT_ID}`,
    sub: 'uid-1',
    iat: now - 10,
    exp: now + 3600,
    email: 'bardazon@gmail.com',
    email_verified: true
  });
  assert.equal(verifyFirebaseIdTokenSignature(wrongAud, PROJECT_ID, { [KID]: publicPem }, now), null);

  const valid = signTestJwt({
    aud: PROJECT_ID,
    iss: `https://securetoken.google.com/${PROJECT_ID}`,
    sub: 'uid-1',
    iat: now - 10,
    exp: now + 3600,
    email: 'bardazon@gmail.com',
    email_verified: true
  });
  const parts = valid.split('.');
  const tamperedPayload = toBase64Url(
    JSON.stringify({
      aud: PROJECT_ID,
      iss: `https://securetoken.google.com/${PROJECT_ID}`,
      sub: 'uid-attacker',
      iat: now - 10,
      exp: now + 3600,
      email: 'bardazon@gmail.com',
      email_verified: true
    })
  );
  assert.equal(
    verifyFirebaseIdTokenSignature(
      `${parts[0]}.${tamperedPayload}.${parts[2]}`,
      PROJECT_ID,
      { [KID]: publicPem },
      now
    ),
    null
  );
});
