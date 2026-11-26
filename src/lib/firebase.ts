import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  getDocFromServer,
  serverTimestamp,
  type Firestore
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type Auth,
  type User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import type { AuditData, InvariantLogEntry } from '../data/rubricSpec.ts';
import { isAdminEmail } from '../data/adminAccess.ts';
import {
  formatCohortTimestampLabel,
  sanitizeGainsCohortRecord,
  type GainsCohortRecord
} from '../data/gainsCohortData.ts';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: Array<{
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }>;
  };
}

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;
let firebaseAuth: Auth | null = null;
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

try {
  firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  firestoreDb = getFirestore(
    firebaseApp,
    firebaseConfig.firestoreDatabaseId || '(default)'
  );
  firebaseAuth = getAuth(firebaseApp);
} catch (err) {
  console.error('Firebase initialization failed:', err);
}

export { firebaseApp, firestoreDb, firebaseAuth, collection, doc };

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const errMessage = error instanceof Error ? error.message : String(error);
  const currentUser = firebaseAuth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    operationType,
    path,
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo:
        currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
    }
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  return errInfo;
}

export async function testFirestoreConnection(): Promise<boolean> {
  if (!firestoreDb) return false;
  try {
    await getDocFromServer(doc(firestoreDb, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration: client is offline.');
      return false;
    }
    // Permission error or missing test doc still confirms network reachability to Firestore
    return true;
  }
}

export async function signInWithGoogleArchive(): Promise<User | null> {
  if (!firebaseAuth) return null;
  const result = await signInWithPopup(firebaseAuth, googleProvider);
  return result.user;
}

export async function signOutArchive(): Promise<void> {
  if (!firebaseAuth) return;
  await signOut(firebaseAuth);
}

export async function getFirebaseIdToken(forceRefresh = false): Promise<string | null> {
  if (!firebaseAuth?.currentUser) return null;
  try {
    return await firebaseAuth.currentUser.getIdToken(forceRefresh);
  } catch {
    return null;
  }
}

export function isVerifiedAdminUser(user: User | null | undefined): boolean {
  if (!user) return false;
  return isAdminEmail(user.email, user.emailVerified);
}

export function sanitizeForArchive<T>(val: T): T {
  if (val === undefined) return null as unknown as T;
  if (val === null || typeof val !== 'object') return val;
  if (Array.isArray(val)) {
    return val
      .filter((item) => item !== undefined)
      .map((item) =>
        Array.isArray(item) ? JSON.stringify(item) : sanitizeForArchive(item)
      ) as unknown as T;
  }
  const cleaned: Record<string, unknown> = {};
  Object.entries(val as Record<string, unknown>).forEach(([k, v]) => {
    if (v !== undefined && typeof v !== 'function') {
      cleaned[k] = sanitizeForArchive(v);
    }
  });
  return cleaned as T;
}

export async function persistAuditDocumentToFirestore(
  auditToSave: AuditData,
  archivedInvLogs: Record<string, InvariantLogEntry[]>,
  mergedAliases: string[]
): Promise<boolean> {
  if (!firestoreDb || !firebaseAuth?.currentUser) return false;
  const user = firebaseAuth.currentUser;
  if (!user.emailVerified) return false;

  const tk = String(auditToSave.ticker || '')
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 16);
  if (!tk) return false;

  const docPath = `archived_audits/${tk}`;
  const docRef = doc(firestoreDb, 'archived_audits', tk);

  try {
    const existingSnap = await getDoc(docRef);
    const baseFields = sanitizeForArchive({
      ticker: tk,
      name: String(auditToSave.name || tk).slice(0, 120),
      consensusFamily: auditToSave.consensusFamily,
      architecture: String(auditToSave.architecture || 'Audited Protocol').slice(0, 400),
      grade: auditToSave.grade,
      totalScore: Number(auditToSave.totalScore) || 0,
      certainty: String(auditToSave.certainty || 'HIGH CERTAINTY').slice(0, 64),
      conclusion: String(auditToSave.conclusion || 'Evaluated via thermodynamic invariants.').slice(
        0,
        4000
      ),
      invariants: (auditToSave.invariants || []).slice(0, 6),
      queryAliases: (mergedAliases.length > 0 ? mergedAliases : [tk]).slice(0, 20),
      archivedInvLogs,
      sources: (auditToSave.freshSources || auditToSave.sources || []).slice(0, 12),
      ...(Array.isArray(auditToSave.historicalSnapshots) && auditToSave.historicalSnapshots.length > 0
        ? { historicalSnapshots: auditToSave.historicalSnapshots.slice(0, 16) }
        : {}),
      ...(typeof auditToSave.auditedAtTimelineYear === 'string' &&
      auditToSave.auditedAtTimelineYear.trim().length > 0
        ? { auditedAtTimelineYear: auditToSave.auditedAtTimelineYear.trim().slice(0, 16) }
        : {}),
      isArchived: true as const,
      archivedAtMs: Date.now(),
      archivedAtLabel: new Date()
        .toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
        .slice(0, 64)
    });

    if (!existingSnap.exists()) {
      await setDoc(docRef, {
        ...baseFields,
        archiveRevision: 1,
        originalAuthorUid: user.uid,
        archivedByUid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      const existingData = existingSnap.data();
      const prevRevision = Number(existingData?.archiveRevision) || 1;
      await setDoc(docRef, {
        ...baseFields,
        archiveRevision: prevRevision + 1,
        originalAuthorUid: String(existingData?.originalAuthorUid || user.uid),
        archivedByUid: user.uid,
        createdAt: existingData?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
    return false;
  }
}

export async function deleteAuditDocumentFromFirestore(ticker: string): Promise<boolean> {
  if (!firestoreDb || !firebaseAuth?.currentUser) return false;
  const user = firebaseAuth.currentUser;
  if (!user.emailVerified) return false;

  const tk = String(ticker || '')
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 16);
  if (!tk) return false;

  const docPath = `archived_audits/${tk}`;
  const docRef = doc(firestoreDb, 'archived_audits', tk);

  try {
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, docPath);
    return false;
  }
}

export async function persistGainsCohortToFirestore(
  record: GainsCohortRecord
): Promise<boolean> {
  if (!firestoreDb || !firebaseAuth?.currentUser) return false;
  const user = firebaseAuth.currentUser;
  if (!user.emailVerified) return false;

  const cohortId = String(record.cohortId || 'default')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 32) || 'default';

  const docPath = `gains_cohorts/${cohortId}`;
  const docRef = doc(firestoreDb, 'gains_cohorts', cohortId);
  const sanitized = sanitizeGainsCohortRecord(record);
  const now = Date.now();

  try {
    const existingSnap = await getDoc(docRef);
    const payloadBase = sanitizeForArchive({
      cohortId,
      isPublished: true as const,
      isCustomized: Boolean(sanitized.isCustomized),
      sourceLabel: String(sanitized.sourceLabel || 'Synced Cohort Vault').slice(0, 80),
      passed: sanitized.passed.slice(0, 60),
      failed: sanitized.failed.slice(0, 60),
      updatedAtMs: now,
      updatedAtLabel: formatCohortTimestampLabel(now),
      updatedByUid: user.uid
    });

    if (!existingSnap.exists()) {
      await setDoc(docRef, {
        ...payloadBase,
        revision: 1,
        originalAuthorUid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      const existingData = existingSnap.data();
      const prevRevision = Number(existingData?.revision) || 1;
      await setDoc(docRef, {
        ...payloadBase,
        revision: prevRevision + 1,
        originalAuthorUid: String(existingData?.originalAuthorUid || user.uid),
        createdAt: existingData?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
    return false;
  }
}

export function subscribeGainsCohortFromFirestore(
  cohortId: string,
  onUpdate: (record: GainsCohortRecord) => void
): () => void {
  if (!firestoreDb) return () => {};
  const cleanId =
    String(cohortId || 'default')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .slice(0, 32) || 'default';
  const colPath = 'gains_cohorts';
  const q = query(collection(firestoreDb, colPath), where('isPublished', '==', true));

  return onSnapshot(
    q,
    (snapshot) => {
      const match = snapshot.docs.find((d) => d.id === cleanId) || snapshot.docs[0];
      if (!match) return;
      const data = match.data() as Record<string, unknown>;
      if (!data || data.isPublished !== true) return;
      if (!Array.isArray(data.passed) || !Array.isArray(data.failed)) return;
      onUpdate(
        sanitizeGainsCohortRecord({
          cohortId: match.id || cleanId,
          passed: data.passed as GainsCohortRecord['passed'],
          failed: data.failed as GainsCohortRecord['failed'],
          updatedAtMs: Number(data.updatedAtMs) || Date.now(),
          updatedAtLabel: String(data.updatedAtLabel || ''),
          revision: Number(data.revision) || 1,
          isCustomized: Boolean(data.isCustomized),
          sourceLabel: String(data.sourceLabel || 'Firestore Cloud Vault')
        })
      );
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, colPath);
    }
  );
}
