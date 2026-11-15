# Firestore Security Specification — The Truth: Thermodynamic Audit

## 1. Data Invariants
1. **Identity & Authentication Integrity**: Write mutations (`create`, `update`, `delete`) require a signed-in Firebase user with `request.auth.token.email_verified == true`. On `create`, `originalAuthorUid` and `archivedByUid` MUST equal `request.auth.uid`. On `update`, `originalAuthorUid` and `createdAt` are immutable, and `archivedByUid` MUST equal `request.auth.uid`.
2. **Strict Schema & Bounds**: Every document in `/archived_audits/{tickerId}` MUST match `isValidId(tickerId)` (`^[A-Z0-9_\\-]{1,16}$`), contain exact required keys and zero unapproved shadow fields (`keys().hasAll(...) && keys().hasOnly(...)`), keep `invariants.size() == 6`, cap `queryAliases.size() <= 20`, enforce bounded `.size()` limits on every string field, and bound `totalScore` between `0.0` and `6.0`.
3. **Temporal & Revision Integrity**: `createdAt == request.time` on `create`; `updatedAt == request.time` and `createdAt == existing().createdAt` on `update`; `archiveRevision == existing().archiveRevision + 1` on `update`.
4. **No PII Exposure & No Open Writes**: Zero PII fields (`email`, `phone`, `address`) exist in `ArchivedAudit`. Public `get`/`list` reads strictly evaluate `resource.data.isArchived == true && resource.data.ticker is string && resource.data.invariants.size() == 6`—never `allow read: if true;` or `allow write: if true;`.
5. **Admin Override & Delete Restraint**: Only `originalAuthorUid == request.auth.uid` or the bootstrapped verified admin (`request.auth.token.email_verified == true && request.auth.token.email == 'Bardazon@gmail.com'`) can `delete` an archived audit document.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Create**: Unauthenticated client attempts `setDoc('/archived_audits/NEWCOIN', validPayload)`.
2. **Unverified Email Spoof**: Signed-in user with `email_verified: false` (even with spoofed admin email) attempts `create` or `update`.
3. **Author UID Spoofing**: Verified user `userA` attempts `create` with `originalAuthorUid: 'userB'` or `archivedByUid: 'userB'`.
4. **Shadow Field Injection ("Ghost Field")**: Verified user sends a valid audit payload plus `{ "isVerifiedOfficial": true }` or `{ "role": "admin" }`.
5. **Path ID Poisoning**: Verified user attempts `create` at `/archived_audits/INVALID_lowercase_or_huge_id...` or mismatching `incoming().ticker != tickerId`.
6. **Client-Forged Timestamp**: Verified user sends a hardcoded `createdAt` or `updatedAt` instead of `request.time`.
7. **Immutable Field Tampering**: Verified user updates `/archived_audits/TON` attempting to alter `originalAuthorUid`, `createdAt`, or `ticker`.
8. **Score Physics Boundary Violation**: Verified user writes `totalScore: 999` or `totalScore: -1` or `grade: 'S++'`.
9. **Array / DoS Resource Bloat**: Verified user sends `invariants` with 2 items instead of 6, `queryAliases` with 50 items (`> 20`), or a 50KB `conclusion` string (`> 4000`).
10. **Non-Monotonic Revision Downgrade**: Verified user sends `archiveRevision: 1` when `existing().archiveRevision == 2`.
11. **Type Confusion Attack**: Verified user sends `totalScore: "6.0"` (string instead of number) or `isArchived: "true"`.
12. **Unauthorized Delete**: Verified non-author, non-admin user `userB` attempts `deleteDoc('/archived_audits/TON')` originally created by `userA`.

## 3. GainsCohortSnapshot (`/gains_cohorts/{cohortId}`) Security Invariants
1. **Strict ID & Key Envelope**: `cohortId` MUST match `^[a-z0-9_\\-]{1,32}$` and equal `data.cohortId`. Document MUST satisfy `hasAll` & `hasOnly` for the exact 13 schema keys with zero ghost fields.
2. **Array & String Bounds**: `passed` and `failed` lists MUST contain `>= 1` and `<= 60` map entries; `sourceLabel.size() <= 80`; `updatedAtLabel.size() <= 64`.
3. **Verified Identity, Monotonic Revision & Server Time**: Writes require `isVerifiedUser()`, `originalAuthorUid == request.auth.uid` on create (immutable on update), `updatedByUid == request.auth.uid`, `createdAt == request.time` on create (immutable on update), `updatedAt == request.time`, `revision == 1` on create, and `revision == existing().revision + 1` on update. Public `get`/`list` strictly require `existing().isPublished == true && existing().passed is list && existing().failed is list`.
4. **Delete Restraint**: Only `existing().originalAuthorUid == request.auth.uid || isAdmin()` may delete a cohort document.
