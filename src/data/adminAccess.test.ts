import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRIMARY_ADMIN_EMAIL,
  extractBearerToken,
  isAdminEmail,
  normalizeAdminEmail,
  parseExtraAdminEmails
} from './adminAccess.ts';

test('PRIMARY_ADMIN_EMAIL is bardazon@gmail.com and normalizes case/whitespace', () => {
  assert.equal(PRIMARY_ADMIN_EMAIL, 'bardazon@gmail.com');
  assert.equal(normalizeAdminEmail('  Bardazon@gmail.com '), 'bardazon@gmail.com');
});

test('isAdminEmail grants admin ONLY to verified bardazon@gmail.com (case-insensitive)', () => {
  assert.equal(isAdminEmail('bardazon@gmail.com', true), true);
  assert.equal(isAdminEmail('Bardazon@gmail.com', true), true);
  assert.equal(isAdminEmail(' BARDAZON@GMAIL.COM ', true), true);

  // Unverified or missing verification must NEVER pass
  assert.equal(isAdminEmail('bardazon@gmail.com', false), false);
  assert.equal(isAdminEmail('bardazon@gmail.com', undefined), false);
  assert.equal(isAdminEmail('bardazon@gmail.com', null), false);

  // Other emails or lookalikes must NEVER pass
  assert.equal(isAdminEmail('other@gmail.com', true), false);
  assert.equal(isAdminEmail('bardazon@gmail.com.attacker.test', true), false);
  assert.equal(isAdminEmail('notbardazon@gmail.com', true), false);
  assert.equal(isAdminEmail('', true), false);
  assert.equal(isAdminEmail(null, true), false);
});

test('isAdminEmail supports optional extra configured admin emails when verified', () => {
  const extras = parseExtraAdminEmails('ops@example.com,  Second@Example.com ');
  assert.equal(isAdminEmail('ops@example.com', true, extras), true);
  assert.equal(isAdminEmail('second@example.com', true, extras), true);
  assert.equal(isAdminEmail('ops@example.com', false, extras), false);
});

test('extractBearerToken parses valid Bearer JWTs and rejects malformed headers', () => {
  const sampleJwt = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1MSJ9.c2lnbmF0dXJl';
  assert.equal(extractBearerToken(`Bearer ${sampleJwt}`), sampleJwt);
  assert.equal(extractBearerToken(`bearer   ${sampleJwt}  `), sampleJwt);
  assert.equal(extractBearerToken(['Bearer ' + sampleJwt]), sampleJwt);

  assert.equal(extractBearerToken(undefined), null);
  assert.equal(extractBearerToken(''), null);
  assert.equal(extractBearerToken('Basic dXNlcjpwYXNz'), null);
  assert.equal(extractBearerToken('Bearer not-a-jwt'), null);
  assert.equal(extractBearerToken('Bearer a.b'), null);
});
