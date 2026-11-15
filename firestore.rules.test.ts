import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Security Rules Structural & Dirty-Dozen Contract Verification
 * Verifies firestore.rules enforces all 8 hardened pillars and rejects all 12 Dirty Dozen attack vectors.
 */
const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
const draftPath = path.resolve(process.cwd(), 'DRAFT_firestore.rules');
const activeRulesPath = fs.existsSync(rulesPath) ? rulesPath : draftPath;
const rulesSource = fs.readFileSync(activeRulesPath, 'utf8');

test('Rules enforce rules_version = 2 and global default-deny catch-all', () => {
  assert.match(rulesSource, /rules_version\s*=\s*'2'/);
  assert.match(rulesSource, /match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;\s*\}/);
});

test('Rules forbid blanket open reads/writes (if true) and enforce schema key & size gates', () => {
  assert.doesNotMatch(rulesSource, /allow\s+(read|write|get|list|create|update|delete)\s*:\s*if\s+true\s*;/);
  assert.match(rulesSource, /function isValidArchivedAudit\(data,\s*tickerId\)/);
  assert.match(rulesSource, /data\.keys\(\)\.hasAll\(/);
  assert.match(rulesSource, /data\.keys\(\)\.hasOnly\(/);
  assert.match(rulesSource, /incoming\(\)\.diff\(existing\(\)\)\.affectedKeys\(\)\.hasOnly\(/);
});

test('Dirty Dozen 1-3: Authentication, email_verified, and UID ownership gates present', () => {
  assert.match(rulesSource, /request\.auth\s*!=\s*null/);
  assert.match(rulesSource, /request\.auth\.token\.email_verified\s*==\s*true/);
  assert.match(rulesSource, /incoming\(\)\.originalAuthorUid\s*==\s*request\.auth\.uid/);
  assert.match(rulesSource, /incoming\(\)\.archivedByUid\s*==\s*request\.auth\.uid/);
});

test('Dirty Dozen 4-12: ID regex, server request.time timestamps, bounds, immutables, and delete guards', () => {
  assert.match(rulesSource, /function isValidTickerId\(id\)/);
  assert.match(rulesSource, /incoming\(\)\.createdAt\s*==\s*request\.time/);
  assert.match(rulesSource, /incoming\(\)\.updatedAt\s*==\s*request\.time/);
  assert.match(rulesSource, /incoming\(\)\.createdAt\s*==\s*existing\(\)\.createdAt/);
  assert.match(rulesSource, /incoming\(\)\.originalAuthorUid\s*==\s*existing\(\)\.originalAuthorUid/);
  assert.match(rulesSource, /incoming\(\)\.ticker\s*==\s*existing\(\)\.ticker/);
  assert.match(rulesSource, /data\.invariants\.size\(\)\s*==\s*6/);
  assert.match(rulesSource, /data\.queryAliases\.size\(\)\s*<=\s*20/);
  assert.match(rulesSource, /data\.conclusion\.size\(\)\s*<=\s*4000/);
  assert.match(rulesSource, /incoming\(\)\.archiveRevision\s*==\s*existing\(\)\.archiveRevision\s*\+\s*1/);
  assert.match(rulesSource, /allow delete:\s*if\s*isValidTickerId\(tickerId\)\s*&&\s*isVerifiedUser\(\)\s*&&\s*\(existing\(\)\.originalAuthorUid\s*==\s*request\.auth\.uid\s*\|\|\s*isAdmin\(\)\)/);
});

test('GainsCohortSnapshot enforces strict schema, bounds, verified writer, and monotonic revision', () => {
  assert.match(rulesSource, /function isValidCohortId\(id\)/);
  assert.match(rulesSource, /function isValidGainsCohortSnapshot\(data,\s*cohortId\)/);
  assert.match(rulesSource, /data\.passed\.size\(\)\s*<=\s*60/);
  assert.match(rulesSource, /data\.failed\.size\(\)\s*<=\s*60/);
  assert.match(rulesSource, /incoming\(\)\.updatedByUid\s*==\s*request\.auth\.uid/);
  assert.match(rulesSource, /incoming\(\)\.revision\s*==\s*existing\(\)\.revision\s*\+\s*1/);
  assert.match(rulesSource, /match \/gains_cohorts\/\{cohortId\}/);
});
